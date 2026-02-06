import type { BenchmarkScenarioConfig } from './types';
import { DEFAULT_GRAPHICS_SETTINGS } from '../../game/settings/graphicsTypes';

export const BENCHMARK_SCENARIOS: BenchmarkScenarioConfig[] = [
  {
    id: 'baseline_6cars',
    label: 'Baseline 6 Cars',
    description: 'Default graphics, 6 AI cars, deterministic seed 1337.',
    durationSec: 20,
    aiCount: 5,
    graphics: { ...DEFAULT_GRAPHICS_SETTINGS },
    determinism: { enabled: true, seed: 1337 },
    usePlayerBot: true,
  },
  {
    id: 'stress_10cars_fx',
    label: 'Stress 10 Cars + Heavy FX',
    description: 'High render scale, all effects on, 10 AI cars.',
    durationSec: 20,
    aiCount: 10,
    graphics: {
      renderScale: 1.25,
      shadows: true,
      skidmarks: true,
      particles: true,
      post: true,
      antialias: 'smooth',
      cameraShake: true,
    },
    determinism: { enabled: true, seed: 1337 },
    usePlayerBot: true,
  },
  {
    id: 'dust_storm',
    label: 'Dust Storm',
    description: 'Dust intensity high with moderate grip loss.',
    durationSec: 20,
    aiCount: 8,
    graphics: { ...DEFAULT_GRAPHICS_SETTINGS, particles: true },
    determinism: { enabled: true, seed: 4242 },
    weather: 'dust-storm',
    trackOverrides: { dustIntensity: 0.9, globalGripMultiplier: 0.92 },
    usePlayerBot: true,
  },
  {
    id: 'rain_slick',
    label: 'Rain Slick',
    description: 'Reduced grip to simulate wet track.',
    durationSec: 20,
    aiCount: 6,
    graphics: { ...DEFAULT_GRAPHICS_SETTINGS },
    determinism: { enabled: true, seed: 9001 },
    weather: 'overcast',
    trackOverrides: { humidity: 0.9, globalGripMultiplier: 0.85 },
    usePlayerBot: true,
  },
];

export function getBenchmarkScenario(id: string): BenchmarkScenarioConfig | null {
  return BENCHMARK_SCENARIOS.find((s) => s.id === id) ?? null;
}
