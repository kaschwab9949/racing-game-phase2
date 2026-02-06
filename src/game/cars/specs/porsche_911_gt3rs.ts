import type { CarSpec, CarRenderProfile } from './types';

export const PORSCHE_911_GT3RS_SPEC: CarSpec = {
  id: 'porsche-911-gt3rs-992',
  displayName: 'Porsche 911 GT3 RS (992)',
  brand: 'Porsche',
  model: '911 GT3 RS',
  modelYear: 2023,
  drivetrain: 'RWD',
  spritePath: '/cars/porsche.png',
  spriteScale: 1,
  spriteMaskThreshold: 45,
  spriteTrimPadding: 3,

  // Dimensions from prompt
  lengthMm: 4572,
  widthMm: 1900,
  wheelbaseMm: 2457,
  frontTrackMm: 1630,
  rearTrackMm: 1582,

  // Derived from other dimensions
  frontOverhangMm: 1000,
  rearOverhangMm: 1115,
  cabinLengthMm: 1500,
  roofWidthMm: 1200,
  wheelRadiusMm: 370,
  wheelWidthMm: 335,

  // Realistic estimates
  massKg: 1450, // Curb weight
  weightDistribution: 0.39, // Rear-engine layout

  // 4.0L Flat-6 engine characteristics
  powerCurve: [
    [1000, 40],
    [2000, 100],
    [3000, 200],
    [4000, 300],
    [5000, 400],
    [6000, 480],
    [8500, 518], // Peak HP
    [9000, 480],
  ],
  peakTorque: 465, // Nm
  maxRpm: 9000,

  // Placeholder physics values
  tireGrip: 1.25, // Track-focused tires
  tireGripCurve: [
    [0, 1],
    [6, 0.95],
    [12, 0.85],
    [18, 0.75],
  ],

  dragCoefficient: 0.39, // High downforce setup
  frontalArea: 2.1, // m^2 estimate
  downforceFactor: 0.4, // Significant aero package

  brakePower: 1.4 * 9.8, // G-force deceleration, carbon ceramics
};

export const PORSCHE_911_GT3RS_RENDER_PROFILE_REAL: CarRenderProfile = {
  id: 'RealSpec',
  label: 'RealSpec',
  specId: 'porsche-911-gt3rs-992',
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
  bodyOutline: {
    hoodLength: 0.25,
    trunkLength: 0.3, // Large wing
    cabinLength: 0.45,
    roofWidth: 0.75,
    fenderBulge: 0.08,
  },
  theme: {
    bodyColor: '#6A0DAD', // Purple
    wheelColor: '#C0C0C0', // Silver
    trimColor: '#1a1a1a',
    glassColor: 'rgba(20, 20, 20, 0.7)',
  },
  decals: [],
};

export const PORSCHE_911_GT3RS_RENDER_PROFILE_GAME: CarRenderProfile = {
  ...PORSCHE_911_GT3RS_RENDER_PROFILE_REAL,
  id: 'GameplayDialed',
  label: 'GameplayDialed',
  tuning: {
    wheelbaseScale: 1.01,
    trackScale: 1.04,
    frontOverhangScale: 0.95,
    rearOverhangScale: 0.95,
    cabinLengthScale: 1,
    roofWidthScale: 1,
    wheelRadiusScale: 1.06,
  },
};
