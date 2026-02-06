import { OffscreenSurface } from './OffscreenSurface';

export type CacheStats = {
  hits: number;
  misses: number;
};

export class LayerCache {
  private surface: OffscreenSurface | null = null;
  private stats: CacheStats = { hits: 0, misses: 0 };

  constructor(private width: number, private height: number) {}

  getSurface(scale: number): OffscreenSurface {
    if (!this.surface) {
      this.surface = new OffscreenSurface(this.width, this.height, scale, 'static');
      this.stats.misses++;
      return this.surface;
    }
    if (this.surface.resize(this.width, this.height, scale)) {
      this.stats.misses++;
      return this.surface;
    }
    this.stats.hits++;
    return this.surface;
  }

  markDirty(): void {
    if (this.surface) this.surface.dirty = true;
  }

  consumeStats(): CacheStats {
    const s = { ...this.stats };
    this.stats = { hits: 0, misses: 0 };
    return s;
  }
}
