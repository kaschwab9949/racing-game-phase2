import type { CacheStats } from '../layers/LayerCache';

export type PerfLayerStats = {
  track?: CacheStats;
  environment?: CacheStats;
  cars?: CacheStats;
  effects?: CacheStats;
};

export type PerfFrame = {
  frameTimeMs: number;
  fps: number;
  layerStats: PerfLayerStats;
};

export class PerfMonitor {
  private lastTs = performance.now();
  private samples: number[] = [];
  private maxSamples = 120;
  private fps = 60;
  private frameTime = 16;

  begin(): number {
    return performance.now();
  }

  end(start: number, layerStats: PerfLayerStats = {}): PerfFrame {
    const now = performance.now();
    const dt = now - start;
    this.samples.push(dt);
    if (this.samples.length > this.maxSamples) this.samples.shift();
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.frameTime = avg;
    this.fps = 1000 / avg;
    return {
      frameTimeMs: dt,
      fps: this.fps,
      layerStats,
    };
  }

  getStats(): { fps: number; frameTime: number } {
    return { fps: this.fps, frameTime: this.frameTime };
  }
}
