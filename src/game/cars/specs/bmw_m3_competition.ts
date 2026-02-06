import type { CarSpec, CarRenderProfile } from './types';
import { BMW_M3_CS_G80_SPEC } from './bmw_m3_cs';

export const BMW_M3_COMPETITION_SPEC: CarSpec = {
  ...BMW_M3_CS_G80_SPEC,
  id: 'bmw-m3-competition-g80',
  displayName: 'BMW M3 Competition (G80)',
  drivetrain: 'RWD',
  massKg: 1730, // Lighter without AWD
  powerCurve: BMW_M3_CS_G80_SPEC.powerCurve.map(([rpm, power]) => [rpm, power * 0.95]), // 5% less power
  peakTorque: 600,
  tireGrip: 1.1,
  downforceFactor: 0.08,
};

export const BMW_M3_COMPETITION_RENDER_PROFILE: CarRenderProfile = {
  id: 'bmw-m3-competition-g80-default',
  label: 'Default',
  specId: 'bmw-m3-competition-g80',
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
  fenderBulge: 0.04,
  bodyOutline: {
    hoodLength: 0.3,
    trunkLength: 0.2,
    cabinLength: 0.5,
    roofWidth: 0.8,
    fenderBulge: 0.04,
  },
  theme: {
    bodyColor: '#007bff', // Blue
    wheelColor: '#cccccc', // Silver
    trimColor: '#1a1a1a',
    glassColor: 'rgba(20, 20, 20, 0.7)',
  },
  decals: [],
};
