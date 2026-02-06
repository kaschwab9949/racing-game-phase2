import type { Vec2 } from './math';

export interface GhostFrame {
  time: number;
  pos: Vec2;
  heading: number;
}

export interface GhostLap {
  frames: GhostFrame[];
  lapTime: number;
}

export class GhostRecorder {
  private frames: GhostFrame[] = [];

  record(time: number, pos: Vec2, heading: number, s: number): void {
    this.frames.push({ time, pos: { ...pos }, heading });
  }

  finish(lapTime: number): GhostLap {
    return { frames: [...this.frames], lapTime };
  }

  reset(): void {
    this.frames = [];
  }
}

export function sampleGhostAtTime(ghost: GhostLap, time: number): { pos: Vec2; heading: number } | null {
  if (ghost.frames.length === 0) return null;
  
  const frames = ghost.frames;
  
  // Find surrounding frames
  let i = 0;
  while (i < frames.length - 1 && frames[i + 1].time < time) {
    i++;
  }
  
  if (i >= frames.length - 1) {
    const last = frames[frames.length - 1];
    return { pos: last.pos, heading: last.heading };
  }
  
  const f0 = frames[i];
  const f1 = frames[i + 1];
  const t = (time - f0.time) / (f1.time - f0.time);
  
  return {
    pos: {
      x: f0.pos.x + (f1.pos.x - f0.pos.x) * t,
      y: f0.pos.y + (f1.pos.y - f0.pos.y) * t,
    },
    heading: f0.heading + (f1.heading - f0.heading) * t,
  };
}
