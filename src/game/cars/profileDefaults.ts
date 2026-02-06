import type { CarRenderProfileTuning } from './types';

export type TuningRange = {
  min: number;
  max: number;
  step: number;
  label: string;
};

export const DEFAULT_TUNING_RANGES: Record<keyof CarRenderProfileTuning, TuningRange> = {
  wheelbaseScale: { min: 0.92, max: 1.08, step: 0.005, label: 'Wheelbase' },
  trackScale: { min: 0.90, max: 1.15, step: 0.005, label: 'Track' },
  frontOverhangScale: { min: 0.85, max: 1.12, step: 0.005, label: 'Front Overhang' },
  rearOverhangScale: { min: 0.85, max: 1.15, step: 0.005, label: 'Rear Overhang' },
  cabinLengthScale: { min: 0.88, max: 1.10, step: 0.005, label: 'Cabin Length' },
  roofWidthScale: { min: 0.82, max: 1.08, step: 0.005, label: 'Roof Width' },
  wheelRadiusScale: { min: 0.88, max: 1.15, step: 0.005, label: 'Wheel Radius' },
};

export const DEFAULT_TUNING_ORDER: Array<keyof CarRenderProfileTuning> = [
  'wheelbaseScale',
  'trackScale',
  'frontOverhangScale',
  'rearOverhangScale',
  'cabinLengthScale',
  'roofWidthScale',
  'wheelRadiusScale',
];
