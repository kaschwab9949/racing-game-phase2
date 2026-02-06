import type { CarInput, CarState } from '../carPhysics';
import { clamp } from '../math';
import type { CarSpec } from '../cars/specs/types';
import type { TrackModel } from '../track/TrackModel';
import type {
  AiControlOutput,
  AiDebugDrawCommand,
  AiDebugState,
  AiGlobalSettings,
  AiOpponentSnapshot,
  AiRuntimeContext,
  AiSkillProfile,
  RacingLineSolution,
  SpeedProfile,
} from './types';
import { AiDecisionModel } from './behavior/AiDecisionModel';
import { RacingLineCache } from './line/RacingLineCache';
import { AiSettingsStore } from './AiSettingsStore';

const DEBUG_COLORS = ['#31f6ff', '#ff7ab5', '#8fff5c', '#ffdf5c', '#6b8bff', '#ff9e4a'];

type ControllerOptions = {
  id: number;
  slotLabel: string;
  track: TrackModel;
  spec: CarSpec;
  cache: RacingLineCache;
  settings: AiSettingsStore;
  skill?: AiSkillProfile;
};

type UpdateResult = {
  input: CarInput;
  debug: AiDebugState;
};

export class AiDriverController {
  public readonly id: number;
  private readonly carLabel: string;
  private readonly skill: AiSkillProfile;
  private readonly decision = new AiDecisionModel();
  private readonly cache: RacingLineCache;
  private readonly track: TrackModel;
  private readonly line: RacingLineSolution;
  private readonly speedProfile: SpeedProfile;
  private readonly settings: AiSettingsStore;
  private readonly lineCommand: AiDebugDrawCommand;
  private readonly color: string;

  constructor(options: ControllerOptions) {
    this.id = options.id;
    this.carLabel = options.slotLabel;
    this.skill = options.skill ?? options.settings.createDriverSkill(options.id);
    this.cache = options.cache;
    this.track = options.track;
    this.settings = options.settings;
    const lineSolution = this.cache.getLine();
    this.line = lineSolution;
    this.speedProfile = this.cache.getSpeedProfile(options.spec);
    this.color = DEBUG_COLORS[this.id % DEBUG_COLORS.length];
    this.lineCommand = {
      type: 'line',
      color: `${this.color}90`,
      points: lineSolution.samples.filter((_, idx) => idx % 6 === 0).map(s => s.pos),
    };
  }

  update(car: CarState, opponents: AiOpponentSnapshot[], dt: number): UpdateResult {
    const context: AiRuntimeContext = {
      track: this.track,
      line: this.line,
      speedProfile: this.speedProfile,
      skill: this.skill,
      global: this.settings.getGlobal(),
    };
    const control = this.decision.update(car, context, opponents, dt);
    const input = this.toCarInput(control, context.global);
    return {
      input,
      debug: this.buildDebugState(control, car, context.global),
    };
  }

  private toCarInput(output: AiControlOutput, global: AiGlobalSettings): CarInput {
    const aggression = (global.aggression + this.skill.aggression) * 0.5;
    const discipline = this.skill.discipline;
    const bravery = this.skill.bravery;
    const difficulty = global.difficulty;
    const throttle = clamp(output.throttle * (0.75 + aggression * 0.4 + difficulty * 0.2), 0, 1);
    const brake = clamp(output.brake * (0.55 + (1 - discipline) * 0.3 + (1 - difficulty) * 0.2), 0, 1);
    const steer = clamp(output.steer * (0.85 + bravery * 0.25), -1, 1);
    return { throttle, brake, steer, abs: true, tcs: true };
  }

  private buildDebugState(output: AiControlOutput, car: CarState, global: AiGlobalSettings): AiDebugState {
    const commands: AiDebugDrawCommand[] = [];
    if (global.debugEnabled) {
      commands.push(this.lineCommand);
      commands.push({ type: 'point', pos: output.lookahead, color: this.color, label: `${this.carLabel} LA` });
      commands.push({
        type: 'text',
        pos: { x: car.pos.x + 1.5, y: car.pos.y + 1.5 },
        text: `${Math.round(output.targetSpeed * 3.6)} km/h`,
        color: this.color,
      });
    }
    return {
      carId: this.id,
      carLabel: this.carLabel,
      skill: this.skill,
      commands,
      intent: output.intent,
      targetSpeed: output.targetSpeed,
    };
  }
}
