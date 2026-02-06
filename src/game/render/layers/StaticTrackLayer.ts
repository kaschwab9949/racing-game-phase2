import type { TrackModel } from '../../track/TrackModel';
import type { GraphicsSettings } from '../../settings/graphicsTypes';
import type { Vec2 } from '../../math';
import { LayerCache } from './LayerCache';

export class StaticTrackLayer {
  private cache: LayerCache;
  private lastTrackVersion = 0;
  private lastWorldOffset: Vec2 | null = null;

  constructor(private worldBounds: { width: number; height: number }) {
    this.cache = new LayerCache(worldBounds.width, worldBounds.height);
  }

  render(track: TrackModel, settings: GraphicsSettings, worldOffset: Vec2) {
    const surf = this.cache.getSurface(1);
    const offsetChanged =
      !this.lastWorldOffset ||
      this.lastWorldOffset.x !== worldOffset.x ||
      this.lastWorldOffset.y !== worldOffset.y;
    if (offsetChanged) {
      surf.dirty = true;
    }
    if (!surf.dirty && this.lastTrackVersion === track.samples.length) {
      return { surface: surf.canvas, stats: this.cache.consumeStats() };
    }
    surf.clear('transparent');
    const ctx = surf.ctx;
    ctx.save();
    ctx.translate(worldOffset.x, worldOffset.y);

    // Track surface fill
    ctx.fillStyle = '#2d2d2d';
    ctx.beginPath();
    const samples = track.samples;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const x = s.pos.x;
      const y = s.pos.y;
      ctx.lineTo(x - s.normal.x * s.widthLeft, y - s.normal.y * s.widthLeft);
    }
    for (let i = samples.length - 1; i >= 0; i--) {
      const s = samples[i];
      const x = s.pos.x;
      const y = s.pos.y;
      ctx.lineTo(x + s.normal.x * s.widthRight, y + s.normal.y * s.widthRight);
    }
    ctx.closePath();
    ctx.fill();

    // Edge lines
    ctx.strokeStyle = '#f8f8f8';
    ctx.lineWidth = 0.35;

    ctx.beginPath();
    for (let i = 0; i <= samples.length; i++) {
      const p = samples[i % samples.length];
      const x = p.pos.x - p.normal.x * p.widthLeft;
      const y = p.pos.y - p.normal.y * p.widthLeft;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i <= samples.length; i++) {
      const p = samples[i % samples.length];
      const x = p.pos.x + p.normal.x * p.widthRight;
      const y = p.pos.y + p.normal.y * p.widthRight;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Start line
    const start = samples[0];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    const sx = start.pos.x;
    const sy = start.pos.y;
    ctx.moveTo(sx - start.normal.x * start.widthLeft, sy - start.normal.y * start.widthLeft);
    ctx.lineTo(sx + start.normal.x * start.widthRight, sy + start.normal.y * start.widthRight);
    ctx.stroke();

    ctx.restore();
    surf.dirty = false;
    this.lastTrackVersion = track.samples.length;
    this.lastWorldOffset = { ...worldOffset };
    return { surface: surf.canvas, stats: this.cache.consumeStats() };
  }
}
