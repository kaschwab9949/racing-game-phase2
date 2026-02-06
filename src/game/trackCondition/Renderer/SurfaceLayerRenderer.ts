import type { TrackConditionField } from '../TrackConditionField';
import type { Camera } from '../../render';
import type { TrackModel } from '../../track/TrackModel';
import { randRange } from '../../../devtools/determinism/Random';

/**
 * Handles rendering of procedural track aging (rubber path, marbles).
 */
export class SurfaceLayerRenderer {
  private cacheCanvas: HTMLCanvasElement;
  private cacheCtx: CanvasRenderingContext2D;
  private dirty = true;

  constructor(private field: TrackConditionField, private track: TrackModel) {
    this.cacheCanvas = document.createElement('canvas');
    this.cacheCanvas.width = 2048;
    this.cacheCanvas.height = 2048;
    this.cacheCtx = this.cacheCanvas.getContext('2d')!;
  }

  public render(ctx: CanvasRenderingContext2D, camera: Camera): void {
    // In a real implementation, we might use a dedicated texture or 
    // update a subset of the track segments.
    // For this prototype, we'll draw a subtle darkening on the racing line.
    
    ctx.save();
    
    // Low frequency update logic could go here
    this.renderProceduralDetails(ctx, camera);
    
    ctx.restore();
  }

  private renderProceduralDetails(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const samples = this.track.samples;
    const lSegs = this.field.latSegments;
    const dStep = this.field.trackWidth / lSegs;

    ctx.globalCompositeOperation = 'multiply';
    
    // We only render segments near the camera for performance
    for (let i = 0; i < samples.length; i += 2) {
      const sample = samples[i];
      const distSq = Math.pow(sample.pos.x - camera.pos.x, 2) + Math.pow(sample.pos.y - camera.pos.y, 2);
      
      if (distSq > Math.pow(150, 2)) continue; // Culling

      for (let l = 0; l < lSegs; l += 2) {
        const d = (l / lSegs - 0.5) * this.field.trackWidth;
        const cell = this.field.getCell(sample.s, d);
        
        if (cell.rubber > 0.1 || cell.marbles > 0.1) {
          const worldPos = {
            x: sample.pos.x + sample.normal.x * d,
            y: sample.pos.y + sample.normal.y * d
          };
          
          // Draw rubber darkening
          if (cell.rubber > 0.1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${cell.rubber * 0.3})`;
            ctx.beginPath();
            ctx.arc(worldPos.x, worldPos.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Draw marbles (specks)
          if (cell.marbles > 0.3) {
            ctx.fillStyle = `rgba(50, 50, 50, ${cell.marbles * 0.5})`;
            ctx.beginPath();
            ctx.arc(worldPos.x + randRange(-0.5, 0.5), worldPos.y + randRange(-0.5, 0.5), 0.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }
}
