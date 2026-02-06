import type { CarRenderProfile, CarSpec, CarTheme } from './types';
import { getDefaultBrandDecals } from './brandDecals';

export const M3CS_SPEC: CarSpec = {
  id: 'bmw-m3cs-g80',
  displayName: 'BMW M3 CS (G80)',
  modelYear: 2024,
  lengthMm: 4795,
  widthMm: 1918,
  wheelbaseMm: 2857,
  frontTrackMm: 1623,
  rearTrackMm: 1605,
  frontOverhangMm: 900,
  rearOverhangMm: 1038,
  cabinLengthMm: 1950,
  roofWidthMm: 1400,
  wheelRadiusMm: 335,
  wheelWidthMm: 295,
};

export const M3CS_THEME: CarTheme = {
  bodyColor: '#f4f3ef',
  bodyShadow: '#d8d6d1',
  bodyHighlight: '#ffffff',
  roofColor: '#1b1f24',
  roofHighlight: '#2c3137',
  windowTint: 'rgba(18, 24, 30, 0.88)',
  trimDark: '#111418',
  trimLight: '#2f343a',
  wheelMetal: '#b48a2c',
  wheelMetalHighlight: '#d2b463',
  tireColor: '#191919',
  headlight: '#f6f4e6',
  taillight: '#b10012',
};

export const M3CS_PROFILE_REAL: CarRenderProfile = {
  id: 'RealSpec',
  label: 'RealSpec',
  tuning: {
    wheelbaseScale: 1,
    trackScale: 1,
    frontOverhangScale: 1,
    rearOverhangScale: 1,
    cabinLengthScale: 1,
    roofWidthScale: 1,
    wheelRadiusScale: 1,
  },
  bodyWidthScale: 1,
  stanceScale: 1,
  fenderBulge: 0.08,
  decals: getDefaultBrandDecals(),
};

export const M3CS_PROFILE_GAMEPLAY: CarRenderProfile = {
  id: 'GameplayDialed',
  label: 'GameplayDialed',
  tuning: {
    wheelbaseScale: 1.02,
    trackScale: 1.06,
    frontOverhangScale: 0.96,
    rearOverhangScale: 1.04,
    cabinLengthScale: 0.98,
    roofWidthScale: 0.92,
    wheelRadiusScale: 1.05,
  },
  bodyWidthScale: 1.03,
  stanceScale: 1.02,
  fenderBulge: 0.11,
  decals: getDefaultBrandDecals(),
};
