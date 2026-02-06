import type { Vec2 } from '../../math';
import type { CarRenderProfile, CarSpec } from '../../cars/specs/types';

export type CarWheelGeometry = {
  center: Vec2;
  radius: number;
  width: number;
  steer: boolean;
};

export type CarBodyGeometry = {
  length: number;
  width: number;
  hoodLength: number;
  trunkLength: number;
  cabinLength: number;
  roofWidth: number;
  fenderBulge: number;
  axleFrontX: number;
  axleRearX: number;
  frontOverhang: number;
  rearOverhang: number;
};

export type CarGeometry = {
  body: CarBodyGeometry;
  wheels: CarWheelGeometry[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
};

export type CarRenderParams = {
  ctx: CanvasRenderingContext2D;
  position: Vec2;
  heading: number;
  steer: number;
  profile: CarRenderProfile;
  spec: CarSpec;
  pxPerMeter: number;
  showGuides: boolean;
  ghostAlpha?: number;
  tint?: string | null;
  decalsEnabled?: boolean;
  shadowsEnabled?: boolean;
  antialias?: 'smooth' | 'pixel';
};
