import type { PerfSample, PerfStats } from './types';

export function computePerfStats(samples: PerfSample[]): PerfStats {
  if (!samples.length) {
    return {
      frameCount: 0,
      avgFps: 0,
      minFps: 0,
      maxFps: 0,
      avgFrameMs: 0,
      p95FrameMs: 0,
      p99FrameMs: 0,
      worstFrameMs: 0,
      budget60Pct: 0,
    };
  }

  const frameTimes = samples.map((s) => s.frameTimeMs).sort((a, b) => a - b);
  const fps = samples.map((s) => s.fps);
  const sumFps = fps.reduce((a, b) => a + b, 0);
  const sumFrame = frameTimes.reduce((a, b) => a + b, 0);
  const avgFps = sumFps / samples.length;
  const avgFrameMs = sumFrame / samples.length;

  const minFps = Math.min(...fps);
  const maxFps = Math.max(...fps);
  const worstFrameMs = Math.max(...frameTimes);

  const p95FrameMs = percentile(frameTimes, 0.95);
  const p99FrameMs = percentile(frameTimes, 0.99);
  const budget60 = frameTimes.filter((t) => t <= 16.67).length;
  const budget60Pct = (budget60 / samples.length) * 100;

  return {
    frameCount: samples.length,
    avgFps,
    minFps,
    maxFps,
    avgFrameMs,
    p95FrameMs,
    p99FrameMs,
    worstFrameMs,
    budget60Pct,
  };
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}
