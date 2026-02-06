export type CarSpec = {
  id: string;
  displayName: string;
  modelYear: number;
  lengthMm: number;
  widthMm: number;
  wheelbaseMm: number;
  frontTrackMm: number;
  rearTrackMm: number;
  frontOverhangMm: number;
  rearOverhangMm: number;
  cabinLengthMm: number;
  roofWidthMm: number;
  wheelRadiusMm: number;
  wheelWidthMm: number;
};

export type CarTheme = {
  bodyColor: string;
  bodyShadow: string;
  bodyHighlight: string;
  roofColor: string;
  roofHighlight: string;
  windowTint: string;
  trimDark: string;
  trimLight: string;
  wheelMetal: string;
  wheelMetalHighlight: string;
  tireColor: string;
  headlight: string;
  taillight: string;
};

export type CarDecal = {
  id: string;
  path: string;
  placement: 'hood' | 'door' | 'roof' | 'trunk';
  scale: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
};

export type CarRenderProfileTuning = {
  wheelbaseScale: number;
  trackScale: number;
  frontOverhangScale: number;
  rearOverhangScale: number;
  cabinLengthScale: number;
  roofWidthScale: number;
  wheelRadiusScale: number;
};

export type CarRenderProfile = {
  id: 'RealSpec' | 'GameplayDialed';
  label: string;
  tuning: CarRenderProfileTuning;
  bodyWidthScale: number;
  stanceScale: number;
  fenderBulge: number;
  decals: CarDecal[];
};

export const CAR_TUNING_KEYS: Array<keyof CarRenderProfileTuning> = [
  'wheelbaseScale',
  'trackScale',
  'frontOverhangScale',
  'rearOverhangScale',
  'cabinLengthScale',
  'roofWidthScale',
  'wheelRadiusScale',
];

export function cloneProfile(profile: CarRenderProfile): CarRenderProfile {
  return {
    ...profile,
    tuning: { ...profile.tuning },
    decals: profile.decals.map(d => ({ ...d })),
  };
}

export function applyTuning(profile: CarRenderProfile, tuning: Partial<CarRenderProfileTuning>): CarRenderProfile {
  return {
    ...profile,
    tuning: {
      ...profile.tuning,
      ...tuning,
    },
  };
}

export function clampTuningValue(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
