export interface TimeSource {
  nowMs(): number;
  nowSec(): number;
  advance?(dt: number): void; // dt in seconds
  reset?(timeMs?: number): void;
}

export class RealTimeSource implements TimeSource {
  nowMs(): number {
    return performance.now();
  }

  nowSec(): number {
    return this.nowMs() / 1000;
  }
}

export class FixedStepTimeSource implements TimeSource {
  private timeMs = 0;

  nowMs(): number {
    return this.timeMs;
  }

  nowSec(): number {
    return this.timeMs / 1000;
  }

  advance(dt: number): void {
    this.timeMs += dt * 1000;
  }

  reset(timeMs = 0): void {
    this.timeMs = timeMs;
  }
}

export class GameClock {
  private static active: TimeSource = new RealTimeSource();

  static useRealTime(): void {
    this.active = new RealTimeSource();
  }

  static useFixedStep(clock?: FixedStepTimeSource): FixedStepTimeSource {
    const source = clock ?? new FixedStepTimeSource();
    this.active = source;
    return source;
  }

  static setSource(source: TimeSource): void {
    this.active = source;
  }

  static advance(dt: number): void {
    this.active.advance?.(dt);
  }

  static reset(timeMs = 0): void {
    this.active.reset?.(timeMs);
  }

  static nowMs(): number {
    return this.active.nowMs();
  }

  static nowSec(): number {
    return this.active.nowSec();
  }
}
