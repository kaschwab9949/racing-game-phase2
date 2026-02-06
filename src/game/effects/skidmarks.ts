// Skidmark renderer with dedicated offscreen caching layer

import type { Vec2 } from '../math';
import { dist } from '../math';
import type { PhysicsTelemetry, SkidmarkTrail, SkidmarkSegment } from './types';
import { SKIDMARK_CONSTANTS } from './constants';

/**
 * Skidmark renderer that writes to a cached offscreen canvas
 */
export class SkidmarkRenderer {
  private trails: SkidmarkTrail[] = [];
  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
  private lastPosition: Vec2 | null = null;
  private accumulatedDistance: number = 0;
  private canvasSize: { width: number; height: number } = { width: 4000, height: 4000 };
  private needsRedraw: boolean = true;

  constructor(width: number = 4000, height: number = 4000) {
    this.canvasSize = { width, height };
    this.initOffscreenCanvas();
  }

  private initOffscreenCanvas(): void {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(this.canvasSize.width, this.canvasSize.height);
      this.offscreenCtx = this.offscreenCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    }
  }

  /**
   * Update skidmarks based on physics telemetry
   */
  update(telemetry: PhysicsTelemetry, dt: number): void {
    // Determine if we should leave skidmarks
    const maxSlip = Math.max(telemetry.frontSlipRatio, telemetry.rearSlipRatio);
    const isSkidding = maxSlip >= SKIDMARK_CONSTANTS.MIN_SLIP_RATIO;

    if (isSkidding) {
      // Check if we need to add a new segment
      if (this.lastPosition) {
        const distTraveled = dist(this.lastPosition, telemetry.position);
        this.accumulatedDistance += distTraveled;

        if (this.accumulatedDistance >= SKIDMARK_CONSTANTS.SEGMENT_SPACING) {
          this.addSegment(telemetry.position, telemetry.heading, maxSlip);
          this.accumulatedDistance = 0;
          this.needsRedraw = true;
        }
      } else {
        // Start new trail
        this.addSegment(telemetry.position, telemetry.heading, maxSlip);
        this.needsRedraw = true;
      }
      this.lastPosition = { ...telemetry.position };
    } else {
      // Reset trail if not skidding
      this.lastPosition = null;
      this.accumulatedDistance = 0;
    }

    // Age all segments
    this.ageSegments(dt);
  }

  private addSegment(pos: Vec2, heading: number, intensity: number): void {
    // Ensure we have a current trail
    if (this.trails.length === 0 || this.lastPosition === null) {
      this.trails.push({
        segments: [],
        maxAge: SKIDMARK_CONSTANTS.MAX_AGE,
      });
    }

    const currentTrail = this.trails[this.trails.length - 1];
    
    // Add segment to current trail
    currentTrail.segments.push({
      pos: { ...pos },
      heading,
      intensity: Math.min(1, intensity),
      age: 0,
    });

    // Limit segments per trail
    if (currentTrail.segments.length > SKIDMARK_CONSTANTS.MAX_SEGMENTS) {
      currentTrail.segments.shift();
    }
  }

  private ageSegments(dt: number): void {
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const trail = this.trails[i];
      
      // Age all segments in trail
      for (let j = trail.segments.length - 1; j >= 0; j--) {
        trail.segments[j].age += dt;
        
        // Remove expired segments
        if (trail.segments[j].age > SKIDMARK_CONSTANTS.MAX_AGE) {
          trail.segments.splice(j, 1);
          this.needsRedraw = true;
        }
      }

      // Remove empty trails
      if (trail.segments.length === 0) {
        this.trails.splice(i, 1);
      }
    }
  }

  /**
   * Render skidmarks to the offscreen canvas
   */
  private renderToOffscreen(camera: { pos: Vec2; pxPerMeter: number }): void {
    if (!this.offscreenCtx) return;

    const ctx = this.offscreenCtx;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
    
    // Set up rendering
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Render all trails
    for (const trail of this.trails) {
      if (trail.segments.length < 2) continue;

      for (let i = 0; i < trail.segments.length - 1; i++) {
        const seg = trail.segments[i];
        const nextSeg = trail.segments[i + 1];

        // Calculate fade based on age
        let alpha = 1;
        if (seg.age > SKIDMARK_CONSTANTS.FADE_START) {
          alpha = 1 - (seg.age - SKIDMARK_CONSTANTS.FADE_START) / 
                      (SKIDMARK_CONSTANTS.MAX_AGE - SKIDMARK_CONSTANTS.FADE_START);
        }
        alpha *= seg.intensity * 0.6;

        // Convert world to screen coordinates
        const x1 = (seg.pos.x - camera.pos.x) * camera.pxPerMeter + this.canvasSize.width / 2;
        const y1 = (seg.pos.y - camera.pos.y) * camera.pxPerMeter + this.canvasSize.height / 2;
        const x2 = (nextSeg.pos.x - camera.pos.x) * camera.pxPerMeter + this.canvasSize.width / 2;
        const y2 = (nextSeg.pos.y - camera.pos.y) * camera.pxPerMeter + this.canvasSize.height / 2;

        // Draw segment
        ctx.strokeStyle = `rgba(26, 26, 26, ${alpha})`;
        ctx.lineWidth = SKIDMARK_CONSTANTS.WIDTH * camera.pxPerMeter;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    this.needsRedraw = false;
  }

  /**
   * Render skidmarks to the main canvas
   */
  render(ctx: CanvasRenderingContext2D, camera: { pos: Vec2; pxPerMeter: number }): void {
    if (!this.offscreenCanvas || !this.offscreenCtx) {
      // Fallback: render directly to main canvas
      this.renderDirect(ctx, camera);
      return;
    }
    if (
      this.offscreenCanvas.width !== ctx.canvas.width ||
      this.offscreenCanvas.height !== ctx.canvas.height
    ) {
      this.renderDirect(ctx, camera);
      return;
    }

    // Update offscreen canvas if needed
    if (this.needsRedraw) {
      this.renderToOffscreen(camera);
    }

    // Blit offscreen canvas to main canvas
    ctx.drawImage(this.offscreenCanvas as any, 0, 0);
  }

  /**
   * Direct rendering fallback (no offscreen canvas)
   */
  private renderDirect(ctx: CanvasRenderingContext2D, camera: { pos: Vec2; pxPerMeter: number }): void {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const trail of this.trails) {
      if (trail.segments.length < 2) continue;

      for (let i = 0; i < trail.segments.length - 1; i++) {
        const seg = trail.segments[i];
        const nextSeg = trail.segments[i + 1];

        let alpha = 1;
        if (seg.age > SKIDMARK_CONSTANTS.FADE_START) {
          alpha = 1 - (seg.age - SKIDMARK_CONSTANTS.FADE_START) / 
                      (SKIDMARK_CONSTANTS.MAX_AGE - SKIDMARK_CONSTANTS.FADE_START);
        }
        alpha *= seg.intensity * 0.6;

        const x1 = (seg.pos.x - camera.pos.x) * camera.pxPerMeter + ctx.canvas.width / 2;
        const y1 = (seg.pos.y - camera.pos.y) * camera.pxPerMeter + ctx.canvas.height / 2;
        const x2 = (nextSeg.pos.x - camera.pos.x) * camera.pxPerMeter + ctx.canvas.width / 2;
        const y2 = (nextSeg.pos.y - camera.pos.y) * camera.pxPerMeter + ctx.canvas.height / 2;

        ctx.strokeStyle = `rgba(26, 26, 26, ${alpha})`;
        ctx.lineWidth = SKIDMARK_CONSTANTS.WIDTH * camera.pxPerMeter;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Clear all skidmarks
   */
  clear(): void {
    this.trails = [];
    this.lastPosition = null;
    this.accumulatedDistance = 0;
    this.needsRedraw = true;
  }

  /**
   * Get current number of active segments
   */
  getSegmentCount(): number {
    return this.trails.reduce((sum, trail) => sum + trail.segments.length, 0);
  }
}
