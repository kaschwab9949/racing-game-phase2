import type { DeterminismSettings } from './types';

export const DEFAULT_DETERMINISM_SETTINGS: DeterminismSettings = {
  enabled: false,
  seed: 1337,
  fixedStep: {
    enabled: true,
    dt: 1 / 60,
    maxFrameDt: 0.1,
  },
  mode: 'off',
};
