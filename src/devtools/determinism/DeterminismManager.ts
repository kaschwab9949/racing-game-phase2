import type { ProcessedInput } from '../../game/input/types';
import { GameClock, FixedStepTimeSource } from './GameClock';
import { RandomContext } from './Random';
import { InputRecorder } from './InputRecorder';
import { InputPlayer } from './InputPlayer';
import type { DeterminismSettings, InputTape } from './types';

export class DeterminismManager {
  private settings: DeterminismSettings;
  private fixedClock: FixedStepTimeSource | null = null;
  private recorder: InputRecorder | null = null;
  private player: InputPlayer | null = null;

  constructor(initial: DeterminismSettings) {
    this.settings = { ...initial };
    if (initial.enabled) {
      this.enable();
    }
  }

  configure(next: Partial<DeterminismSettings>): DeterminismSettings {
    this.settings = { ...this.settings, ...next };
    if (this.settings.enabled) {
      this.enable();
    } else {
      this.disable();
    }
    return { ...this.settings };
  }

  getSettings(): DeterminismSettings {
    return { ...this.settings };
  }

  enable(): void {
    RandomContext.setSeed(this.settings.seed);
    if (this.settings.fixedStep.enabled) {
      if (!this.fixedClock) {
        this.fixedClock = new FixedStepTimeSource();
      }
      GameClock.useFixedStep(this.fixedClock);
    } else {
      GameClock.useRealTime();
    }
  }

  disable(): void {
    RandomContext.useMathRandom();
    GameClock.useRealTime();
  }

  advance(dt: number): void {
    if (this.settings.enabled && this.settings.fixedStep.enabled) {
      GameClock.advance(dt);
    }
  }

  resetTime(): void {
    if (this.fixedClock) {
      this.fixedClock.reset(0);
    }
  }

  startRecording(meta: { seed: number; frameDt: number; notes?: string }): void {
    this.settings.mode = 'record';
    this.recorder = new InputRecorder({
      id: `tape_${Date.now()}`,
      createdAt: Date.now(),
      seed: meta.seed,
      frameDt: meta.frameDt,
      notes: meta.notes,
    });
  }

  stopRecording(): InputTape | null {
    if (!this.recorder) return null;
    const tape = this.recorder.buildTape();
    this.recorder = null;
    this.settings.mode = 'off';
    return tape;
  }

  startPlayback(tape: InputTape): void {
    this.player = new InputPlayer(tape);
    this.settings.mode = 'playback';
    this.settings.tapeId = tape.id;
  }

  stopPlayback(): void {
    this.player = null;
    this.settings.mode = 'off';
    this.settings.tapeId = undefined;
  }

  getPlaybackProgress(): { index: number; total: number } | null {
    return this.player ? this.player.getProgress() : null;
  }

  consumePlaybackInput(): ProcessedInput | null {
    if (!this.player) return null;
    return this.player.getInput();
  }

  recordInput(dt: number, input: ProcessedInput): void {
    if (!this.recorder) return;
    this.recorder.record(dt, input);
  }

  hasPlayback(): boolean {
    return !!this.player;
  }

  hasRecorder(): boolean {
    return !!this.recorder;
  }
}
