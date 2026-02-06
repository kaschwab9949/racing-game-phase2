import type { ProcessedInput } from '../../game/input/types';
import type { InputFrame, InputTape, InputTapeMeta } from './types';

export class InputRecorder {
  private frames: InputFrame[] = [];
  private frame = 0;
  private time = 0;
  private meta: InputTapeMeta;

  constructor(meta: InputTapeMeta) {
    this.meta = { ...meta };
  }

  reset(meta?: Partial<InputTapeMeta>): void {
    this.frames = [];
    this.frame = 0;
    this.time = 0;
    if (meta) {
      this.meta = { ...this.meta, ...meta };
    }
  }

  record(dt: number, input: ProcessedInput): void {
    this.time += dt;
    this.frames.push({
      frame: this.frame,
      time: this.time,
      input: { ...input },
    });
    this.frame += 1;
  }

  buildTape(): InputTape {
    return {
      ...this.meta,
      frames: [...this.frames],
    };
  }
}
