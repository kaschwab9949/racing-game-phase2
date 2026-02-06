export type CarId = string;
export type Drivetrain = 'RWD' | 'AWD';

/**
 * Defines the core physical properties and dimensions of a car.
 * This data is used for physics calculations and as the base for rendering.
 */
export type CarSpec = {
  id: CarId;
  displayName: string;
  brand: string;
  model: string;
  modelYear: number;
  drivetrain: Drivetrain;

  // Optional sprite rendering
  spritePath?: string;
  spriteScale?: number;
  spriteOffset?: { x: number; y: number };
  spriteMaskThreshold?: number;
  spriteTrimPadding?: number;

  // Core dimensions (millimeters)
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

  // Mass and balance
  massKg: number;
  // % of mass on the front axle
  weightDistribution: number;

  // Engine and powertrain
  powerCurve: [rpm: number, power: number][]; // Power in horsepower
  peakTorque: number; // Nm
  maxRpm: number;

  // Tire model
  tireGrip: number; // Coefficient of friction
  tireGripCurve: [slipAngle: number, gripFactor: number][];

  // Aerodynamics
  dragCoefficient: number;
  frontalArea: number; // m^2
  downforceFactor: number; // A multiplier for downforce generation

  // Brakes
  brakePower: number; // Deceleration in m/s^2
}

export type CarRenderProfileTuning = {
  wheelbaseScale: number;
  trackScale: number;
  frontOverhangScale: number;
  rearOverhangScale: number;
  cabinLengthScale: number;
  roofWidthScale: number;
  wheelRadiusScale: number;
};

/**
 * Defines the visual appearance of a car, including its shape, colors, and decals.
 * This is used by the rendering engine to draw the car.
 */
export type CarRenderProfile = {
  id: string;
  label: string;
  specId: CarSpec['id'];

  tuning: CarRenderProfileTuning;
  bodyWidthScale: number;
  stanceScale: number;
  fenderBulge: number;

  // Body shape adjustments
  bodyOutline: {
    hoodLength: number;
    trunkLength: number;
    cabinLength: number;
    roofWidth: number;
    fenderBulge: number;
  };

  // Visual theme
  theme: {
    bodyColor: string;
    wheelColor: string;
    trimColor: string;
    glassColor: string;
  };

  // Decals and livery
  decals: CarDecal[];
}

export type CarDecal = {
  id: string;
  texture: string; // URL or asset ID
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
}
