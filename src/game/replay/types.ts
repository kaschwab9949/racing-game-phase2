import type { Vec2 } from '../math';

export type ReplayVersion = 1;

export type ReplayCameraMode = 'follow_player' | 'follow_car' | 'overhead' | 'free_pan';

export type ReplayCarMeta = {
  carId: string;
  label: string;
  isPlayer: boolean;
};

export type ReplaySessionMeta = {
  id: string;
  createdAt: number;
  duration: number;
  frames: number;
  frameDt: number;
  trackId: string;
  modeLabel: string;
};

export type EncodedSeries = {
  scale: number;
  data: string; // base64-encoded delta int32
};

export type ReplayCarData = {
  posX: EncodedSeries;
  posY: EncodedSeries;
  heading: EncodedSeries;
  velX: EncodedSeries;
  velY: EncodedSeries;
  throttle: EncodedSeries;
  brake: EncodedSeries;
  steer: EncodedSeries;
};

export type ReplaySession = {
  version: ReplayVersion;
  meta: ReplaySessionMeta;
  cars: ReplayCarMeta[];
  data: Record<string, ReplayCarData>; // key = carId
};

export type ReplayCarSnapshot = {
  carId: string;
  isPlayer: boolean;
  pos: Vec2;
  vel: Vec2;
  heading: number;
  throttle: number;
  brake: number;
  steer: number;
};

export type ReplayFrameSnapshot = {
  time: number;
  cars: ReplayCarSnapshot[];
};

export type ReplayPlaybackState = {
  time: number;
  duration: number;
  speed: number;
  paused: boolean;
  cameraMode: ReplayCameraMode;
  targetCarId: string | null;
  freePan: Vec2;
};
