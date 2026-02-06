import type { EnvironmentState } from './types';
import { randRange, randBool } from '../../devtools/determinism/Random';

/**
 * Simulates atmospheric conditions that affect track evolution.
 */
export class Atmosphere {
  private state: EnvironmentState;
  private timeOfDay = 10; // 0..24 hours

  constructor() {
    this.state = {
      ambientTemp: 22,
      trackAmbientTemp: 24,
      solarRadiation: 800,
      windSpeed: 2.0,
      windDirection: Math.PI * 0.25,
      humidity: 0.4,
      dustStormIntensity: 0.0
    };
  }

  public update(dt: number): void {
    // Advance time of day
    this.timeOfDay = (this.timeOfDay + (dt / 3600)) % 24;

    // Solar radiation model (simple sine wave for day/night)
    const solarFactor = Math.max(0, Math.sin((this.timeOfDay - 6) / 12 * Math.PI));
    this.state.solarRadiation = 1000 * solarFactor;

    // Ambient temperature fluctuates with sun
    this.state.ambientTemp = 20 + 10 * solarFactor + randRange(-0.05, 0.05);

    // Wind variance
    this.state.windSpeed += randRange(-0.1, 0.1);
    this.state.windSpeed = Math.max(0, Math.min(15, this.state.windSpeed));

    // Occasional dust variance
    if (randBool(0.001)) {
       this.state.dustStormIntensity = Math.min(1.0, this.state.dustStormIntensity + 0.05);
    } else {
       this.state.dustStormIntensity = Math.max(0.0, this.state.dustStormIntensity - 0.001);
    }
  }

  public getState(): EnvironmentState {
    return { ...this.state };
  }

  public applyOverrides(patch: Partial<EnvironmentState>): void {
    if (patch.ambientTemp !== undefined) this.state.ambientTemp = patch.ambientTemp;
    if (patch.trackAmbientTemp !== undefined) this.state.trackAmbientTemp = patch.trackAmbientTemp;
    if (patch.solarRadiation !== undefined) this.state.solarRadiation = patch.solarRadiation;
    if (patch.windSpeed !== undefined) this.state.windSpeed = Math.max(0, patch.windSpeed);
    if (patch.windDirection !== undefined) this.state.windDirection = patch.windDirection;
    if (patch.humidity !== undefined) this.state.humidity = Math.max(0, Math.min(1, patch.humidity));
    if (patch.dustStormIntensity !== undefined) {
      this.state.dustStormIntensity = Math.max(0, Math.min(1, patch.dustStormIntensity));
    }
  }

  public setTimeOfDay(hours: number): void {
    this.timeOfDay = ((hours % 24) + 24) % 24;
  }

  public getTimeOfDay(): number {
    return this.timeOfDay;
  }
}
