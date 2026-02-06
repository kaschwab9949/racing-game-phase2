import type { CarState } from '../../carPhysics';
import type {
  AiControlOutput,
  AiIntent,
  AiOpponentSnapshot,
  AiRuntimeContext,
  RacingLineSample,
  SpeedProfile,
} from '../types';
import { clamp, sub, len, dot, normalize } from '../../math';
import { OvertakePlanner } from './OvertakePlanner';
import { DefensePlanner } from './DefensePlanner';
import { MistakeModel } from './MistakeModel';
import { randRange } from '../../../devtools/determinism/Random';

export class AiDecisionModel {
  private overtake: OvertakePlanner;
  private defense: DefensePlanner;
  private mistakes: MistakeModel;

  constructor() {
    this.overtake = new OvertakePlanner();
    this.defense = new DefensePlanner();
    this.mistakes = new MistakeModel();
  }

  public update(
    car: CarState,
    context: AiRuntimeContext,
    opponents: AiOpponentSnapshot[],
    dt: number,
  ): AiControlOutput {
    const line = context.line.samples;
    const speedProfile = context.speedProfile;
    const lookaheadSample = this.sampleLookahead(car, line);
    let intent: AiIntent = { type: 'follow_line', lookahead: lookaheadSample.pos };

    const overtakeIntent = this.overtake.plan(car, context, opponents, lookaheadSample);
    const defenseIntent = this.defense.plan(car, context, opponents, lookaheadSample);

    if (overtakeIntent) {
      intent = overtakeIntent;
    } else if (defenseIntent) {
      intent = defenseIntent;
    }

    intent = this.mistakes.apply(intent, car, context.skill, dt);
    const mistake = this.mistakes.getActiveEvent();

    const targetSpeed = this.lookupTargetSpeed(speedProfile, lookaheadSample.s);
    const speedError = targetSpeed - len(car.vel);
    let throttle = clamp(speedError * 0.05, 0, 1);
    let brake = clamp(-speedError * 0.1, 0, 1);
    let steer = this.computeSteer(car, intent);

    if (mistake?.type === 'brake_lockup') {
      brake = clamp(brake + mistake.intensity * 0.6, 0, 1);
      throttle *= 0.5;
    } else if (mistake?.type === 'late_apex') {
      steer = clamp(steer + randRange(-0.5, 0.5) * mistake.intensity * 0.5, -1, 1);
    }

    return {
      throttle,
      brake,
      steer,
      targetSpeed,
      lookahead: lookaheadSample.pos,
      intent,
    };
  }

  private computeSteer(car: CarState, intent: AiIntent): number {
    const target = intent.type === 'follow_line' ? intent.lookahead : intent.target;
    const toTarget = normalize(sub(target, car.pos));
    const heading = { x: Math.cos(car.heading), y: Math.sin(car.heading) };
    const cross = heading.x * toTarget.y - heading.y * toTarget.x;
    const steer = clamp(cross * 3, -1, 1);
    return steer;
  }

  private sampleLookahead(car: CarState, line: RacingLineSample[]): RacingLineSample {
    const lookaheadDistance = 15 + len(car.vel) * 0.7;
    const currentIndex = this.findClosestIndex(car, line);
    let dist = 0;
    for (let i = 0; i < line.length; i++) {
      const idx = (currentIndex + i) % line.length;
      const nextIdx = (idx + 1) % line.length;
      const segLen = len(sub(line[nextIdx].pos, line[idx].pos));
      dist += segLen;
      if (dist >= lookaheadDistance) {
        return line[nextIdx];
      }
    }
    return line[currentIndex];
  }

  private findClosestIndex(car: CarState, line: RacingLineSample[]): number {
    let bestIdx = 0;
    let bestDist = Number.MAX_VALUE;
    for (let i = 0; i < line.length; i += 3) {
      const d = len(sub(line[i].pos, car.pos));
      if (d < bestDist) {
        bestIdx = i;
        bestDist = d;
      }
    }
    return bestIdx;
  }

  private lookupTargetSpeed(profile: SpeedProfile, s: number): number {
    const samples = profile.samples;
    if (!samples.length) return 20;
    let lo = 0;
    let hi = samples.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (samples[mid].s < s) lo = mid + 1;
      else hi = mid - 1;
    }
    const idxB = lo % samples.length;
    const idxA = (idxB - 1 + samples.length) % samples.length;
    const a = samples[idxA];
    const b = samples[idxB];
    const t = (s - a.s) / Math.max(0.001, b.s - a.s);
    return a.maxSpeed + (b.maxSpeed - a.maxSpeed) * clamp(t, 0, 1);
  }
}
