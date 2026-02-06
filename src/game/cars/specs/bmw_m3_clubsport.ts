import type { CarSpec, CarRenderProfile } from './types';
import { BMW_M3_CS_G80_SPEC } from './bmw_m3_cs';

export const BMW_M3_CLUBSPORT_SPEC: CarSpec = {
  ...BMW_M3_CS_G80_SPEC,
  id: 'bmw-m3-clubsport-g80',
  displayName: 'BMW M3 Clubsport (G80)',
  drivetrain: 'RWD',
  massKg: 1650, // Lighter
  powerCurve: BMW_M3_CS_G80_SPEC.powerCurve.map(([rpm, power]) => [rpm, power * 1.05]), // 5% more power
  peakTorque: 680,
  tireGrip: 1.2, // Stickier tires
  downforceFactor: 0.2, // More aero
  brakePower: 1.3 * 9.8,
};

export const BMW_M3_CLUBSPORT_RENDER_PROFILE: CarRenderProfile = {
  id: 'bmw-m3-clubsport-g80-default',
  label: 'Default',
  specId: 'bmw-m3-clubsport-g80',
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
  fenderBulge: 0.06,
  bodyOutline: {
    hoodLength: 0.3,
    trunkLength: 0.22, // small spoiler
    cabinLength: 0.5,
    roofWidth: 0.8,
    fenderBulge: 0.06,
  },
  theme: {
    bodyColor: '#28a745', // Green
    wheelColor: '#000000', // Black
    trimColor: '#1a1a1a',
    glassColor: 'rgba(20, 20, 20, 0.7)',
  },
  decals: [],
};
