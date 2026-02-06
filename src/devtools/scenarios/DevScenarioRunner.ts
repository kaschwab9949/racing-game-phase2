import type { GameEngine } from '../../game/engine';
import { mergeSettings } from '../../game/settings/graphicsTypes';
import type { DevScenarioConfig } from './DevScenarioTypes';
import { WeatherManager } from '../../game/trackCondition/WeatherManager';

export class DevScenarioRunner {
  constructor(private engine: GameEngine) {}

  applyScenario(scenario: DevScenarioConfig): void {
    const current = this.engine.getGraphicsSettings();
    const nextGraphics = mergeSettings(current, scenario.graphics);
    this.engine.setGraphicsSettings(nextGraphics);
    this.engine.setAiCount(scenario.aiCount);

    if (scenario.weather && scenario.weather !== 'custom') {
      WeatherManager.getInstance().setScenario(scenario.weather);
    }

    if (scenario.trackOverrides) {
      const track = this.engine.getTrackCondition();
      if (scenario.trackOverrides.globalGripMultiplier !== undefined) {
        track.setGlobalGripMultiplier(scenario.trackOverrides.globalGripMultiplier);
      }
      track.applyEnvironmentOverrides({
        dustStormIntensity: scenario.trackOverrides.dustIntensity,
        humidity: scenario.trackOverrides.humidity,
      });
    }
  }
}
