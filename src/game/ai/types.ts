import type { Vec2 } from '../math';
import type { CarSpec } from '../cars/specs/types';
import type { TrackModel } from '../track/TrackModel';

export type RacingLineSample = {
  s: number;
  pos: Vec2;
  tangent: Vec2;
  normal: Vec2;
  curvature: number;
  widthLeft: number;
  widthRight: number;
  apexBias: number;
};

export type SpeedProfilePoint = {
  s: number;
  maxSpeed: number;
  desiredAccel: number;
};

export type RacingLineSolution = {
  track: TrackModel;
  samples: RacingLineSample[];
  totalLength: number;
};

export type SpeedProfile = {
  specId: CarSpec['id'];
  samples: SpeedProfilePoint[];
  trackLength: number;
};

export type AiSkillProfile = {
  name: string;
  aggression: number; // 0..1
  awareness: number; // 0..1
  discipline: number; // 0..1 (higher = fewer mistakes)
  bravery: number; // willingness to take outside lines
};

export type AiPerCarSettings = {
  carId: string;
  skill: AiSkillProfile;
};

export type AiGlobalSettings = {
  difficulty: number;
  aggression: number;
  awareness: number;
  debugEnabled: boolean;
};

export type AiIntent =
  | { type: 'follow_line'; lookahead: Vec2 }
  | { type: 'overtake_inside'; target: Vec2; opponentId: number }
  | { type: 'overtake_outside'; target: Vec2; opponentId: number }
  | { type: 'defend_line'; target: Vec2; opponentId: number }
  | { type: 'error_brake_lockup'; target: Vec2 }
  | { type: 'error_late_apex'; target: Vec2 };

export type AiControlOutput = {
  throttle: number;
  brake: number;
  steer: number;
  targetSpeed: number;
  lookahead: Vec2;
  intent: AiIntent;
};

export type AiOpponentSnapshot = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  s: number;
  isPlayer: boolean;
  spec: CarSpec;
};

export type AiRuntimeContext = {
  track: TrackModel;
  line: RacingLineSolution;
  speedProfile: SpeedProfile;
  skill: AiSkillProfile;
  global: AiGlobalSettings;
};

export type AiMistakeEvent = {
  type: 'brake_lockup' | 'late_apex';
  duration: number;
  intensity: number;
  startedAt: number;
};

export type AiDebugDrawCommand =
  | { type: 'line'; points: Vec2[]; color: string }
  | { type: 'point'; pos: Vec2; color: string; label?: string }
  | { type: 'text'; pos: Vec2; text: string; color: string }
  | { type: 'arc'; center: Vec2; radius: number; color: string; startAngle: number; endAngle: number };

export type AiDebugState = {
  carId: number;
  carLabel: string;
  skill: AiSkillProfile;
  commands: AiDebugDrawCommand[];
  intent: AiIntent;
  targetSpeed: number;
};
