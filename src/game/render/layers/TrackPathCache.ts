import type { TrackModel } from '../../track/TrackModel';

export type TrackPathCacheStats = {
  hits: number;
  misses: number;
};

export class TrackPathCache {
  private fill: Path2D | null = null;
  private leftEdge: Path2D | null = null;
  private rightEdge: Path2D | null = null;
  private startLine: Path2D | null = null;

  private lastTrackRef: TrackModel | null = null;
  private lastTrackVersion = 0;
  private stats: TrackPathCacheStats = { hits: 0, misses: 0 };

  private ensure(track: TrackModel): void {
    const version = track.samples.length;
    if (this.lastTrackRef === track && this.lastTrackVersion === version && this.fill) {
      this.stats.hits++;
      return;
    }

    this.stats.misses++;
    this.lastTrackRef = track;
    this.lastTrackVersion = version;

    const samples = track.samples;
    if (samples.length < 2) {
      this.fill = new Path2D();
      this.leftEdge = new Path2D();
      this.rightEdge = new Path2D();
      this.startLine = new Path2D();
      return;
    }

    const leftBoundary = samples.map((s) => ({
      x: s.pos.x - s.normal.x * s.widthLeft,
      y: s.pos.y - s.normal.y * s.widthLeft,
    }));
    const rightBoundary = samples.map((s) => ({
      x: s.pos.x + s.normal.x * s.widthRight,
      y: s.pos.y + s.normal.y * s.widthRight,
    }));

    const fill = new Path2D();
    fill.moveTo(leftBoundary[0].x, leftBoundary[0].y);
    for (let i = 1; i < leftBoundary.length; i++) {
      fill.lineTo(leftBoundary[i].x, leftBoundary[i].y);
    }
    for (let i = rightBoundary.length - 1; i >= 0; i--) {
      fill.lineTo(rightBoundary[i].x, rightBoundary[i].y);
    }
    fill.closePath();

    const leftEdge = new Path2D();
    leftEdge.moveTo(leftBoundary[0].x, leftBoundary[0].y);
    for (let i = 1; i < leftBoundary.length; i++) {
      leftEdge.lineTo(leftBoundary[i].x, leftBoundary[i].y);
    }

    const rightEdge = new Path2D();
    rightEdge.moveTo(rightBoundary[0].x, rightBoundary[0].y);
    for (let i = 1; i < rightBoundary.length; i++) {
      rightEdge.lineTo(rightBoundary[i].x, rightBoundary[i].y);
    }

    const start = samples[0];
    const sx = start.pos.x;
    const sy = start.pos.y;
    const startLine = new Path2D();
    startLine.moveTo(sx - start.normal.x * start.widthLeft, sy - start.normal.y * start.widthLeft);
    startLine.lineTo(sx + start.normal.x * start.widthRight, sy + start.normal.y * start.widthRight);

    this.fill = fill;
    this.leftEdge = leftEdge;
    this.rightEdge = rightEdge;
    this.startLine = startLine;
  }

  consumeStats(): TrackPathCacheStats {
    const out = { ...this.stats };
    this.stats = { hits: 0, misses: 0 };
    return out;
  }

  render(ctx: CanvasRenderingContext2D, track: TrackModel): TrackPathCacheStats {
    this.ensure(track);
    if (!this.fill || !this.leftEdge || !this.rightEdge || !this.startLine) {
      return this.consumeStats();
    }

    // Track surface fill
    ctx.fillStyle = '#2d2d2d';
    ctx.fill(this.fill);

    // Edge lines
    ctx.strokeStyle = '#f8f8f8';
    ctx.lineWidth = 0.35;
    ctx.stroke(this.leftEdge);
    ctx.stroke(this.rightEdge);

    // Start line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.stroke(this.startLine);

    return this.consumeStats();
  }
}
