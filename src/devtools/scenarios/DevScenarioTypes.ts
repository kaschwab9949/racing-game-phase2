import type { GraphicsSettingsPatch } from '../../game/settings/graphicsTypes';
import type { WeatherScenario } from '../../game/trackCondition/WeatherManager';

export type DevScenarioConfig = {
  id: string;
  label: string;
  description: string;
  aiCount: number;
  graphics: GraphicsSettingsPatch;
  weather?: WeatherScenario | 'custom';
  trackOverrides?: {
    globalGripMultiplier?: number;
    dustIntensity?: number;
    humidity?: number;
  };
};
