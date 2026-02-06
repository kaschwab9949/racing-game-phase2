import type { ProcessedInput } from '../../game/input/types';

export type DeterminismMode = 'off' | 'record' | 'playback';

export type FixedStepConfig = {
  enabled: boolean;
  dt: number; // seconds
  maxFrameDt: number; // clamp
};

export type DeterminismSettings = {
  enabled: boolean;
  seed: number;
  fixedStep: FixedStepConfig;
  mode: DeterminismMode;
  tapeId?: string;
};

export type InputFrame = {
  frame: number;
  time: number; // seconds
  input: ProcessedInput;
};

export type InputTapeMeta = {
  id: string;
  createdAt: number;
  seed: number;
  frameDt: number;
  notes?: string;
};

export type InputTape = InputTapeMeta & {
  frames: InputFrame[];
};

export type InputTapeSummary = Omit<InputTape, 'frames'> & { frameCount: number };
