import type { TrackConditionField } from './TrackConditionField';
import { TRACK_CONSTANTS } from './Constants';
import type { EnvironmentState } from './types';

/**
 * Handles the background "relaxation" and "diffusion" of track conditions 
 * (e.g. dust settling, heat evening out, rubber wearing slightly over time).
 */
export class SimulationController {
  constructor(private field: TrackConditionField) {}

  public stepEnvironmental(env: EnvironmentState, dt: number): void {
    const data = this.field.getAllData();
    const stride = 8;
    
    // Process every cell for passive changes
    for (let i = 0; i < data.length; i += stride) {
      // 1. Dust accumulation
      // Dust settles globally over time
      const dustGain = dt * TRACK_CONSTANTS.DUST_DEPOSITION_IDLE * (1.0 + env.dustStormIntensity * 10.0);
      data[i + 2] = Math.min(1.0, data[i + 2] + dustGain);

      // 2. Marble "weathering"
      // Marbles can break down or get blown away slowly
      if (data[i + 1] > 0) {
        const windEffect = env.windSpeed * 0.001;
        data[i + 1] = Math.max(0, data[i + 1] - (0.001 + windEffect) * dt);
      }

      // 3. Rubber "glazing"
      // Rubber line becomes slightly less effective if not used (oxidation/dusting)
      if (data[i + 0] > 0.5) {
        data[i + 0] -= 0.0001 * dt;
      }
    }
  }

  /**
   * Lateral diffusion of temperature. 
   * Smooths out high-heat spots from tire lockups over time.
   */
  public diffuseHeat(dt: number): void {
    const data = this.field.getAllData();
    const sSegs = this.field.sSegments;
    const lSegs = this.field.latSegments;
    const stride = 8;

    // Simple 1D horizontal blur for temperature
    for (let s = 0; s < sSegs; s++) {
      for (let l = 1; l < lSegs - 1; l++) {
        const idx = (s * lSegs + l) * stride;
        const left = ((s * lSegs) + (l - 1)) * stride;
        const right = ((s * lSegs) + (l + 1)) * stride;
        
        const centerT = data[idx + 3];
        const neighborsAvg = (data[left + 3] + data[right + 3]) / 2;
        
        // Diffusion rate proportional to conductivity
        const diff = (neighborsAvg - centerT) * 0.5 * dt;
        data[idx + 3] += diff;
      }
    }
  }
}
