import { TRACK_CONSTANTS } from './Constants';
import type { TrackConditionCell } from './types';

const OPTIMAL_TEMP_RANGE: [number, number] = [30, 45];

/**
 * Advanced simulation rules for track surface evolution.
 * Handles non-linear relationships between rubber, heat, and grip.
 */
export class SimulationRules {
  /**
   * Calculates the rate of rubber loss due to high track temperatures.
   * Asphalt can 'bleed' or rubber can lose structural integrity.
   */
  public static calculateRubberDegradationRate(temp: number): number {
    if (temp < OPTIMAL_TEMP_RANGE[1]) {
      return 0.001; // Negligible at low temps
    }
    
    // Exponential increase in degradation above threshold
    const over = temp - OPTIMAL_TEMP_RANGE[1];
    return 0.001 * Math.exp(over * 0.1);
  }

  /**
   * Determines how much marble debris is generated based on slip and vertical load.
   */
  public static calculateMarbleGeneration(slip: number, load: number): number {
    // Marbles are generated when slip exceeds a threshold of material structural failure
    const slipThreshold = 0.4;
    if (slip < slipThreshold) return 0;
    
    const excessSlip = slip - slipThreshold;
    return excessSlip * load * 0.05;
  }

  /**
   * Lateral migration of marbles due to centrifugal force and clearing by tires.
   */
  public static applyMarbleMigration(cells: TrackConditionCell[], windSpeed: number): void {
    // This would ideally operate on the grid, but here we provide the logic
    // for wind-blown debris.
    const windEffect = windSpeed * 0.01;
    
    for (const cell of cells) {
      if (cell.marbles > 0) {
        // Marbles "bounce" away from the racing line when hit by tires (clearing)
        // or drift slowly with wind
        cell.marbles = Math.max(0, cell.marbles - windEffect);
      }
    }
  }

  /**
   * Modeling the "polishing" effect of high-usage track sections.
   * Even with rubber, the micro-texture of the asphalt can smooth out over months,
   * but in a race session, we model the "cleaning" of dust.
   */
  public static calculateCleaningEffect(speed: number, volume: number): number {
    const threshold = 10; // m/s
    if (speed < threshold) return 0;
    
    // High speed air flow under the car cleans dust and loose marbles
    return (speed - threshold) * volume * 0.02;
  }

  /**
   * Nonlinear grip response to rubber density.
   * Grip initially increases rapidly as graining fills, then plateaus.
   */
  public static getRubberGripMultiplier(density: number): number {
    // S-curve model: 1.0 + A * (1 - exp(-B * density^C))
    const scale = 0.08;
    const rate = 5.0;
    return 1.0 + scale * (1 - Math.exp(-rate * density));
  }
}
