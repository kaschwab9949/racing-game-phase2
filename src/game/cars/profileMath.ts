import type { CarRenderProfile, CarSpec } from './specs/types';

export type ResolvedCarDimensions = {
  lengthM: number;
  widthM: number;
  wheelbaseM: number;
  frontTrackM: number;
  rearTrackM: number;
  frontOverhangM: number;
  rearOverhangM: number;
  cabinLengthM: number;
  roofWidthM: number;
  wheelRadiusM: number;
  wheelWidthM: number;
  axleFrontX: number;
  axleRearX: number;
  hoodLengthM: number;
  trunkLengthM: number;
};

export function mmToMeters(mm: number): number {
  return mm / 1000;
}

export function resolveCarDimensions(spec: CarSpec, profile: CarRenderProfile): ResolvedCarDimensions {
  const wheelbaseM = mmToMeters(spec.wheelbaseMm) * profile.tuning.wheelbaseScale;
  const frontTrackM = mmToMeters(spec.frontTrackMm) * profile.tuning.trackScale;
  const rearTrackM = mmToMeters(spec.rearTrackMm) * profile.tuning.trackScale;
  const frontOverhangM = mmToMeters(spec.frontOverhangMm) * profile.tuning.frontOverhangScale;
  const rearOverhangM = mmToMeters(spec.rearOverhangMm) * profile.tuning.rearOverhangScale;
  const cabinLengthM = mmToMeters(spec.cabinLengthMm) * profile.tuning.cabinLengthScale;
  const roofWidthM = mmToMeters(spec.roofWidthMm) * profile.tuning.roofWidthScale;
  const wheelRadiusM = mmToMeters(spec.wheelRadiusMm) * profile.tuning.wheelRadiusScale;
  const wheelWidthM = mmToMeters(spec.wheelWidthMm) * profile.stanceScale;

  const widthM = mmToMeters(spec.widthMm) * profile.bodyWidthScale;
  const lengthM = wheelbaseM + frontOverhangM + rearOverhangM;

  const axleFrontX = wheelbaseM * 0.5;
  const axleRearX = -wheelbaseM * 0.5;
  const hoodLengthM = Math.max(0.3, frontOverhangM * 0.65);
  const trunkLengthM = Math.max(0.3, rearOverhangM * 0.6);

  return {
    lengthM,
    widthM,
    wheelbaseM,
    frontTrackM,
    rearTrackM,
    frontOverhangM,
    rearOverhangM,
    cabinLengthM,
    roofWidthM,
    wheelRadiusM,
    wheelWidthM,
    axleFrontX,
    axleRearX,
    hoodLengthM,
    trunkLengthM,
  };
}

export type DimensionDiff = {
  key: string;
  realMm: number;
  tunedMm: number;
  percentDelta: number;
};

export function getDimensionDiff(spec: CarSpec, real: CarRenderProfile, tuned: CarRenderProfile): DimensionDiff[] {
  const realDims = resolveCarDimensions(spec, real);
  const tunedDims = resolveCarDimensions(spec, tuned);

  const pairs: Array<[string, number, number]> = [
    ['Wheelbase', realDims.wheelbaseM, tunedDims.wheelbaseM],
    ['Front Track', realDims.frontTrackM, tunedDims.frontTrackM],
    ['Rear Track', realDims.rearTrackM, tunedDims.rearTrackM],
    ['Front Overhang', realDims.frontOverhangM, tunedDims.frontOverhangM],
    ['Rear Overhang', realDims.rearOverhangM, tunedDims.rearOverhangM],
    ['Cabin Length', realDims.cabinLengthM, tunedDims.cabinLengthM],
    ['Roof Width', realDims.roofWidthM, tunedDims.roofWidthM],
    ['Wheel Radius', realDims.wheelRadiusM, tunedDims.wheelRadiusM],
  ];

  return pairs.map(([label, realM, tunedM]) => {
    const realMm = realM * 1000;
    const tunedMm = tunedM * 1000;
    const percentDelta = ((tunedMm - realMm) / realMm) * 100;
    return { key: label, realMm, tunedMm, percentDelta };
  });
}
