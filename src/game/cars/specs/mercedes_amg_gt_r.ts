import type { CarSpec, CarRenderProfile } from './types';

export const MERCEDES_AMG_GT_R_SPEC: CarSpec = {
  id: 'mercedes-amg-gt-r-c190',
  displayName: 'Mercedes-AMG GT R (C190)',
  brand: 'Mercedes-AMG',
  model: 'GT R',
  modelYear: 2019,
  drivetrain: 'RWD',
  spritePath: '/cars/amg.png',
  spriteScale: 1,
  spriteMaskThreshold: 45,
  spriteTrimPadding: 3,

  // Dimensions (approx)
  lengthMm: 4544,
  widthMm: 1939,
  wheelbaseMm: 2630,
  frontTrackMm: 1680,
  rearTrackMm: 1688,

  // Derived (approx)
  frontOverhangMm: 880,
  rearOverhangMm: 1034,
  cabinLengthMm: 1600,
  roofWidthMm: 1250,
  wheelRadiusMm: 365,
  wheelWidthMm: 315,

  // Mass and balance
  massKg: 1630,
  weightDistribution: 0.47,

  // Engine and powertrain (4.0L twin-turbo V8)
  powerCurve: [
    [1000, 60],
    [2000, 180],
    [3000, 320],
    [4000, 430],
    [5000, 520],
    [6250, 577],
    [7000, 520],
  ],
  peakTorque: 700,
  maxRpm: 7000,

  // Tires / grip
  tireGrip: 1.22,
  tireGripCurve: [
    [0, 1],
    [6, 0.94],
    [12, 0.84],
    [18, 0.74],
  ],

  // Aero
  dragCoefficient: 0.38,
  frontalArea: 2.2,
  downforceFactor: 0.25,

  // Brakes
  brakePower: 1.3 * 9.8,
};

export const MERCEDES_AMG_GT_R_RENDER_PROFILE_REAL: CarRenderProfile = {
  id: 'RealSpec',
  label: 'RealSpec',
  specId: 'mercedes-amg-gt-r-c190',
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
  fenderBulge: 0.07,
  bodyOutline: {
    hoodLength: 0.33,
    trunkLength: 0.22,
    cabinLength: 0.45,
    roofWidth: 0.76,
    fenderBulge: 0.07,
  },
  theme: {
    bodyColor: '#9CA3AF',
    wheelColor: '#111827',
    trimColor: '#111827',
    glassColor: 'rgba(18, 18, 18, 0.7)',
  },
  decals: [],
};

export const MERCEDES_AMG_GT_R_RENDER_PROFILE_GAME: CarRenderProfile = {
  ...MERCEDES_AMG_GT_R_RENDER_PROFILE_REAL,
  id: 'GameplayDialed',
  label: 'GameplayDialed',
  tuning: {
    wheelbaseScale: 1.01,
    trackScale: 1.04,
    frontOverhangScale: 0.95,
    rearOverhangScale: 0.95,
    cabinLengthScale: 1,
    roofWidthScale: 1,
    wheelRadiusScale: 1.05,
  },
};
