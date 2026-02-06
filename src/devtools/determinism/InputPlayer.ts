import type { ProcessedInput } from '../../game/input/types';
import type { InputTape } from './types';

export class InputPlayer {
  private tape: InputTape;
  private index = 0;

  constructor(tape: InputTape) {
    this.tape = tape;
  }

  reset(): void {
    this.index = 0;
  }

  setTape(tape: InputTape): void {
    this.tape = tape;
    this.reset();
  }

  getInput(): ProcessedInput | null {
    if (this.index >= this.tape.frames.length) return null;
    const frame = this.tape.frames[this.index];
    this.index += 1;
    return frame.input;
  }

  peek(): ProcessedInput | null {
    if (this.index >= this.tape.frames.length) return null;
    return this.tape.frames[this.index].input;
  }

  getProgress(): { index: number; total: number } {
    return { index: this.index, total: this.tape.frames.length };
  }
}
