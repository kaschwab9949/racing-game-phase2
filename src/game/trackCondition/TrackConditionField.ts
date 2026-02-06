import type { TrackConditionCell, TrackPoint } from './types';

/**
 * Enhanced grid for track condition storage.
 * Maps arc-length (S) and lateral-offset (D) to track cells.
 */
export class TrackConditionField {
  private cells: Float32Array; // Memory-efficient storage [rubber, marbles, dust, surfaceTemp, subSurfaceTemp, heatFlux, volume, lastFrame]
  private readonly STRIDE = 8;
  
  public readonly sSegments: number;
  public readonly latSegments: number;
  public readonly trackLength: number;
  public readonly trackWidth: number;

  constructor(trackLength: number, trackWidth = 15, sRes = 250, latRes = 24) {
    this.trackLength = trackLength;
    this.trackWidth = trackWidth;
    this.sSegments = sRes;
    this.latSegments = latRes;
    
    this.cells = new Float32Array(sRes * latRes * this.STRIDE);
    this.initialize();
  }

  private initialize(): void {
    for (let i = 0; i < this.cells.length; i += this.STRIDE) {
      this.cells[i + 0] = 0.0;    // Rubber
      this.cells[i + 1] = 0.02;   // Marbles
      this.cells[i + 2] = 0.05;   // Dust
      this.cells[i + 3] = 25.0;   // Surface Temp
      this.cells[i + 4] = 22.0;   // Subsurface Temp
      this.cells[i + 5] = 0.0;    // Flux
      this.cells[i + 6] = 0.0;    // Volume
      this.cells[i + 7] = 0.0;    // Frame
    }
  }

  public getIndices(s: number, d: number): [number, number] {
    const sWrapped = ((s % this.trackLength) + this.trackLength) % this.trackLength;
    const sIdx = Math.floor((sWrapped / this.trackLength) * (this.sSegments - 1));
    
    // d is center-relative. -trackWidth/2 to +trackWidth/2
    const latNorm = (d / this.trackWidth) + 0.5;
    const latIdx = Math.floor(Math.max(0, Math.min(0.999, latNorm)) * (this.latSegments - 1));
    
    return [sIdx, latIdx];
  }

  public getCell(s: number, d: number): TrackConditionCell {
    const [sIdx, latIdx] = this.getIndices(s, d);
    const offset = (sIdx * this.latSegments + latIdx) * this.STRIDE;
    
    return {
      rubber: this.cells[offset + 0],
      marbles: this.cells[offset + 1],
      dust: this.cells[offset + 2],
      surfaceTemp: this.cells[offset + 3],
      subSurfaceTemp: this.cells[offset + 4],
      heatFlux: this.cells[offset + 5],
      totalPassingVolume: this.cells[offset + 6],
      lastUpdatedFrame: this.cells[offset + 7]
    };
  }

  public updateCell(sIdx: number, latIdx: number, updates: Partial<TrackConditionCell>): void {
    const offset = (sIdx * this.latSegments + latIdx) * this.STRIDE;
    
    if (updates.rubber !== undefined) this.cells[offset + 0] = Math.max(0, Math.min(1, updates.rubber));
    if (updates.marbles !== undefined) this.cells[offset + 1] = Math.max(0, Math.min(1, updates.marbles));
    if (updates.dust !== undefined) this.cells[offset + 2] = Math.max(0, Math.min(1, updates.dust));
    if (updates.surfaceTemp !== undefined) this.cells[offset + 3] = updates.surfaceTemp;
    if (updates.subSurfaceTemp !== undefined) this.cells[offset + 4] = updates.subSurfaceTemp;
    if (updates.heatFlux !== undefined) this.cells[offset + 5] = updates.heatFlux;
    if (updates.totalPassingVolume !== undefined) this.cells[offset + 6] = updates.totalPassingVolume;
    if (updates.lastUpdatedFrame !== undefined) this.cells[offset + 7] = updates.lastUpdatedFrame;
  }

  public getAllData(): Float32Array {
    return this.cells;
  }
}
