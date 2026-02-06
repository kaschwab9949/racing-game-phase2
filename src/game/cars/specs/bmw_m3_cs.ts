import type { CarSpec, CarRenderProfile } from './types';

export const BMW_M3_CS_G80_SPEC: CarSpec = {
  id: 'bmw-m3cs-g80',
  displayName: 'BMW M3 CS (G80)',
  brand: 'BMW',
  model: 'M3 CS',
  modelYear: 2024,
  drivetrain: 'AWD', // M xDrive is standard
  spritePath: '/cars/bmw.png',
  spriteScale: 1,
  spriteMaskThreshold: 45,
  spriteTrimPadding: 3,

  // Dimensions from prompt
  lengthMm: 4795,
  widthMm: 1918,
  wheelbaseMm: 2857,
  frontTrackMm: 1623,
  rearTrackMm: 1605,

  // Derived from other dimensions
  frontOverhangMm: 950,
  rearOverhangMm: 988,
  cabinLengthMm: 1800,
  roofWidthMm: 1300,
  wheelRadiusMm: 360,
  wheelWidthMm: 275,

  // Realistic estimates
  massKg: 1765, // Curb weight
  weightDistribution: 0.53, // Slightly front-biased

  // S58 engine characteristics (simplified)
  powerCurve: [
    [1000, 50],
    [2000, 150],
    [3000, 250],
    [4000, 380],
    [5000, 500],
    [6250, 543], // Peak HP
    [7200, 500],
  ],
  peakTorque: 650, // Nm
  maxRpm: 7200,

  // Placeholder physics values
  tireGrip: 1.15, // High-performance summer tires
  tireGripCurve: [
    [0, 1],
    [5, 0.9],
    [10, 0.8],
    [15, 0.7],
  ],

  dragCoefficient: 0.31,
  frontalArea: 2.3, // m^2 estimate
  downforceFactor: 0.1,

  brakePower: 1.2 * 9.8, // G-force deceleration
};

export const BMW_M3_CS_G80_RENDER_PROFILE_REAL: CarRenderProfile = {
  id: 'RealSpec',
  label: 'RealSpec',
  specId: 'bmw-m3cs-g80',
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
  fenderBulge: 0.05,
  bodyOutline: {
    hoodLength: 0.3,
    trunkLength: 0.2,
    cabinLength: 0.5,
    roofWidth: 0.8,
    fenderBulge: 0.05,
  },
  theme: {
    bodyColor: '#2E8B57', // Signal Green
    wheelColor: '#1a1a1a', // Black
    trimColor: '#1a1a1a',
    glassColor: 'rgba(20, 20, 20, 0.7)',
  },
  decals: [],
};

export const BMW_M3_CS_G80_RENDER_PROFILE_GAME: CarRenderProfile = {
  ...BMW_M3_CS_G80_RENDER_PROFILE_REAL,
  id: 'GameplayDialed',
  label: 'GameplayDialed',
  tuning: {
    wheelbaseScale: 1.02,
    trackScale: 1.05,
    frontOverhangScale: 0.9,
    rearOverhangScale: 0.9,
    cabinLengthScale: 1,
    roofWidthScale: 1,
    wheelRadiusScale: 1.05,
  },
};
