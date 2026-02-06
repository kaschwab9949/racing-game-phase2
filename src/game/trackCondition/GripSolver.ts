import type { TrackConditionCell, GripResult } from './types';

/**
 * Pure functions to solve for grip based on cell state.
 */
export class GripSolver {
  /**
   * Reference optimal temperature for asphalt grip in Celsius.
   */
  private static readonly OPTIMAL_TEMP = 42;

  public static calculateGrip(cell: TrackConditionCell): GripResult {
    // 1. Base rubber effect
    // As the track rubbers in, grip increases up to ~6%
    const rubberGrip = cell.rubber * 0.06;

    // 2. Marble penalty
    // Picking up marbles causes a significant loss of grip (-25%)
    const marblePenalty = -cell.marbles * 0.25;

    // 3. Dust penalty
    // Light dust reduces grip (-10%)
    const dustPenalty = -cell.dust * 0.10;

    // 4. Thermal effect
    // Parabolic curves representing grip falloff from optimal temp
    const tempDiff = cell.surfaceTemp - this.OPTIMAL_TEMP;
    // -0.0001 per degree squared falloff
    const thermalGrip = -0.00008 * (tempDiff * tempDiff);

    const base = 1.0;
    const multiplier = base + rubberGrip + marblePenalty + dustPenalty + thermalGrip;

    return {
      multiplier: Math.max(0.1, multiplier),
      components: {
        base,
        rubber: rubberGrip,
        marbles: marblePenalty,
        dust: dustPenalty,
        thermal: thermalGrip
      }
    };
  }
}
