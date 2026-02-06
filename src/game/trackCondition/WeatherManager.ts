import type { Atmosphere } from './Atmosphere';
import type { TrackConditionManager } from './TrackConditionManager';
import { randBool } from '../../devtools/determinism/Random';

export type WeatherScenario = 'clear' | 'overcast' | 'heatwave' | 'dust-storm' | 'night';

/**
 * Higher-level manager for weather patterns and scenarios.
 */
export class WeatherManager {
  private static instance: WeatherManager | null = null;
  private currentScenario: WeatherScenario = 'clear';
  private transitionAlpha = 0;
  private atmosphere: Atmosphere | null = null;

  constructor(atmosphere?: Atmosphere) {
    if (atmosphere) {
      this.atmosphere = atmosphere;
    }
  }

  public static getInstance(): WeatherManager {
    if (!WeatherManager.instance) {
      WeatherManager.instance = new WeatherManager();
    }
    return WeatherManager.instance;
  }

  public setCondition(manager: TrackConditionManager): void {
    this.atmosphere = manager.getAtmosphere();
  }

  public setScenario(scenario: WeatherScenario): void {
    this.currentScenario = scenario;
    // Apply immediate shifts or start transitions
    switch (scenario) {
      case 'clear':
        // Standard day
        this.atmosphere?.applyOverrides({ humidity: 0.35, dustStormIntensity: 0 });
        break;
      case 'heatwave':
        // High temp, high solar
        this.atmosphere?.applyOverrides({ ambientTemp: 35, trackAmbientTemp: 45, humidity: 0.2 });
        break;
      case 'dust-storm':
        // High wind, high dust
        this.atmosphere?.applyOverrides({ dustStormIntensity: 0.8, windSpeed: 12 });
        break;
    }
  }

  public update(dt: number): void {
    // Dynamic logic for scenario transitions can go here
    // For now, we'll just influence the Atmosphere object
    if (this.currentScenario === 'dust-storm') {
       // Force atmospheric variables
    }
  }

  public getScenario(): WeatherScenario {
    return this.currentScenario;
  }

  /**
   * Procedurally generates a random weather shift.
   */
  public generateRandomEvent(): string | null {
    if (randBool(0.0001)) {
      this.setScenario('dust-storm');
      return 'Sandstorm Approaching!';
    }
    return null;
  }
}
