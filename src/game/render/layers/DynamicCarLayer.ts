import type { CarState } from '../../carPhysics';
import type { CarVisualRenderState } from '../../carVisualSystem';
import { renderCar } from '../car/renderer';
import type { GraphicsSettings } from '../../settings/graphicsTypes';
import { carDatabase } from '../../cars/specs';

export type CarRenderInput = {
  cars: CarState[];
  playerVisuals: CarVisualRenderState;
};

export function drawDynamicCars(
  ctx: CanvasRenderingContext2D,
  cameraPxPerMeter: number,
  input: CarRenderInput,
  settings: GraphicsSettings,
): void {
  ctx.save();

  const getProfileForCar = (car: CarState) => {
    if (car.isPlayer) return input.playerVisuals.profile;
    const entry = carDatabase[car.spec.id];
    return entry?.renderProfiles?.['GameplayDialed'] ?? input.playerVisuals.profile;
  };

  for (const car of input.cars) {
    const profile = getProfileForCar(car);
    if (car.isGhost) {
      renderCar({
        ctx,
        position: car.pos,
        heading: car.heading,
        steer: 0,
        profile,
        spec: car.spec,
        pxPerMeter: cameraPxPerMeter,
        showGuides: false,
        ghostAlpha: 0.35,
        tint: undefined,
        decalsEnabled: false,
        shadowsEnabled: settings.shadows,
        antialias: settings.antialias,
      });
    } else if (car.isAi) {
      renderCar({
        ctx,
        position: car.pos,
        heading: car.heading,
        steer: 0,
        profile,
        spec: car.spec,
        pxPerMeter: cameraPxPerMeter,
        showGuides: false,
        ghostAlpha: 1,
        tint: undefined,
        decalsEnabled: false,
        shadowsEnabled: settings.shadows,
        antialias: settings.antialias,
      });
    } else if (car.isPlayer) {
      renderCar({
        ctx,
        position: input.playerVisuals.overridePosition ?? car.pos,
        heading: input.playerVisuals.overrideHeading ?? car.heading,
        steer: car.steer,
        profile,
        spec: car.spec,
        pxPerMeter: cameraPxPerMeter,
        showGuides: input.playerVisuals.showGuides,
        decalsEnabled: true,
        shadowsEnabled: settings.shadows,
        antialias: settings.antialias,
      });
    }
  }

  ctx.restore();
}
