import type { CarState } from '../../carPhysics';
import type { AiIntent, AiMistakeEvent, AiRuntimeContext } from '../types';
import type { Vec2 } from '../../math';
import { add, scale, perp } from '../../math';
import { randBool, randRange } from '../../../devtools/determinism/Random';
import { GameClock } from '../../../devtools/determinism/GameClock';

export class MistakeModel {
  private activeEvent: AiMistakeEvent | null = null;

  apply(intent: AiIntent, car: CarState, skill: AiRuntimeContext['skill'], dt: number): AiIntent {
    if (!this.activeEvent) {
      const risk = (1 - skill.discipline) * 0.2;
      if (randBool(risk * dt)) {
        this.activeEvent = this.spawnEvent(skill);
      }
    } else {
      this.activeEvent.duration -= dt;
      if (this.activeEvent.duration <= 0) {
        this.activeEvent = null;
      }
    }

    if (!this.activeEvent) return intent;

    const heading = { x: Math.cos(car.heading), y: Math.sin(car.heading) };
    const baseTarget = this.getBaseTarget(intent);
    if (this.activeEvent.type === 'brake_lockup') {
      const overshoot = scale(heading, 5 * this.activeEvent.intensity);
      return { type: 'error_brake_lockup', target: add(baseTarget, overshoot) };
    }

    const lateral = perp(heading);
    const dir = randBool(0.5) ? 1 : -1;
    const miss = scale(lateral, dir * this.activeEvent.intensity * 3);
    return { type: 'error_late_apex', target: add(baseTarget, miss) };
  }

  private spawnEvent(skill: AiRuntimeContext['skill']): AiMistakeEvent {
    const type = randBool(0.5) ? 'brake_lockup' : 'late_apex';
    return {
      type,
      duration: 0.5 + randRange(0, 0.7),
      intensity: 0.4 + randRange(0, 0.4),
      startedAt: GameClock.nowSec(),
    };
  }

  getActiveEvent(): AiMistakeEvent | null {
    return this.activeEvent;
  }

  private getBaseTarget(intent: AiIntent): Vec2 {
    return intent.type === 'follow_line' ? intent.lookahead : intent.target;
  }
}
