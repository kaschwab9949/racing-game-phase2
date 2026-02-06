import { LayerCache } from './LayerCache';
import type { GraphicsSettings } from '../../settings/graphicsTypes';

export class StaticEnvironmentLayer {
  private cache: LayerCache;
  constructor(private worldBounds: { width: number; height: number }) {
    this.cache = new LayerCache(worldBounds.width, worldBounds.height);
  }

  render(settings: GraphicsSettings) {
    const surf = this.cache.getSurface(1);
    if (!surf.dirty) {
      return { surface: surf.canvas, stats: this.cache.consumeStats() };
    }
    surf.clear('#103010');
    const ctx = surf.ctx;
    const w = surf.canvas.width;
    const h = surf.canvas.height;

    // Simple procedural grass pattern
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0d1e0d');
    grad.addColorStop(1, '#0a140a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    for (let y = 0; y < h; y += 18) {
      for (let x = 0; x < w; x += 18) {
        const jitter = (Math.sin(x * 0.1 + y * 0.07) + 1) * 0.5;
        ctx.fillRect(x + jitter * 4, y + jitter * 4, 2, 2);
      }
    }
    ctx.restore();

    surf.dirty = false;
    return { surface: surf.canvas, stats: this.cache.consumeStats() };
  }
}
