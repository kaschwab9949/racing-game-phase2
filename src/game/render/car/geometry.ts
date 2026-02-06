import type { CarGeometry } from './types';
import type { CarRenderProfile, CarSpec } from '../../cars/specs/types';
import { resolveCarDimensions } from '../../cars/profileMath';

const geometryCache = new Map<string, CarGeometry>();

function keyFor(spec: CarSpec, profile: CarRenderProfile): string {
  const t = profile.tuning;
  return [
    spec.id,
    t.wheelbaseScale,
    t.trackScale,
    t.frontOverhangScale,
    t.rearOverhangScale,
    t.cabinLengthScale,
    t.roofWidthScale,
    t.wheelRadiusScale,
    profile.bodyWidthScale,
    profile.stanceScale,
    profile.fenderBulge,
  ].join(':');
}

export function buildCarGeometry(spec: CarSpec, profile: CarRenderProfile): CarGeometry {
  const key = keyFor(spec, profile);
  const cached = geometryCache.get(key);
  if (cached) return cached;

  const dims = resolveCarDimensions(spec, profile);
  const length = dims.lengthM;
  const width = dims.widthM;
  const fenderBulge = profile.fenderBulge * width;

  const body = {
    length,
    width,
    hoodLength: dims.hoodLengthM,
    trunkLength: dims.trunkLengthM,
    cabinLength: dims.cabinLengthM,
    roofWidth: dims.roofWidthM,
    fenderBulge,
    axleFrontX: dims.axleFrontX,
    axleRearX: dims.axleRearX,
    frontOverhang: dims.frontOverhangM,
    rearOverhang: dims.rearOverhangM,
  };

  const wheelRadius = dims.wheelRadiusM;
  const wheelWidth = dims.wheelWidthM;
  const frontHalfTrack = dims.frontTrackM * 0.5;
  const rearHalfTrack = dims.rearTrackM * 0.5;

  const wheels = [
    { center: { x: dims.axleFrontX, y: -frontHalfTrack }, radius: wheelRadius, width: wheelWidth, steer: true },
    { center: { x: dims.axleFrontX, y: frontHalfTrack }, radius: wheelRadius, width: wheelWidth, steer: true },
    { center: { x: dims.axleRearX, y: -rearHalfTrack }, radius: wheelRadius, width: wheelWidth, steer: false },
    { center: { x: dims.axleRearX, y: rearHalfTrack }, radius: wheelRadius, width: wheelWidth, steer: false },
  ];

  const bounds = {
    minX: -length * 0.5,
    maxX: length * 0.5,
    minY: -width * 0.5 - fenderBulge,
    maxY: width * 0.5 + fenderBulge,
  };

  const geometry: CarGeometry = { body, wheels, bounds };
  geometryCache.set(key, geometry);
  return geometry;
}
