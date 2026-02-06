import type { TrackConditionManager } from '../TrackConditionManager';
import type { TelemetryRecorder } from '../../telemetry';

/**
 * Maps track condition variables to telemetry channels.
 */
export class TrackTelemetryBridge {
  constructor(
    private manager: TrackConditionManager,
    private telemetry: TelemetryRecorder
  ) {}

  /**
   * Samples the track state at the car's current position and logs it.
   */
  public logCarPositionState(s: number, d: number): void {
    const field = this.manager.getField();
    const cell = field.getCell(s, d);
    const env = this.manager.getAtmosphere().getState();
    const grip = this.manager.processCarPhysics(s, d, 1.0, 0, 0); // peek grip without updating

    // Assuming telemetry system has a 'addCustomSample' or similar
    // We'll use a standard object structure that the TelemetryRecorder can consume
    const trackData = {
      'track.surfaceTemp': cell.surfaceTemp,
      'track.gripMult': grip.multiplier,
      'track.rubber': cell.rubber,
      'track.marbles': cell.marbles,
      'track.dust': cell.dust,
      'env.ambientTemp': env.ambientTemp,
      'env.solarRad': env.solarRadiation
    };

    // Note: Integration with actual TelemetryRecorder happens in engine.ts
  }
}
