// Shadow and contact patch renderer for cars

import type { Vec2 } from '../math';
import type { PhysicsTelemetry } from './types';
import { SHADOW_CONSTANTS } from './constants';

/**
 * Renders soft shadows and contact patches for cars
 */
export class ShadowRenderer {
  /**
   * Render car shadow
   */
  renderShadow(
    ctx: CanvasRenderingContext2D,
    carPos: Vec2,
    carHeading: number,
    carWidth: number,
    carLength: number,
    camera: { pos: Vec2; pxPerMeter: number }
  ): void {
    ctx.save();

    // Convert world to screen coordinates
    const screenX = (carPos.x - camera.pos.x) * camera.pxPerMeter + ctx.canvas.width / 2;
    const screenY = (carPos.y - camera.pos.y) * camera.pxPerMeter + ctx.canvas.height / 2;

    // Shadow offset in screen space
    const offsetX = SHADOW_CONSTANTS.OFFSET_X * camera.pxPerMeter;
    const offsetY = SHADOW_CONSTANTS.OFFSET_Y * camera.pxPerMeter;

    // Move to shadow position
    ctx.translate(screenX + offsetX, screenY + offsetY);
    ctx.rotate(carHeading);

    // Set up shadow
    const shadowWidth = carWidth * camera.pxPerMeter;
    const shadowHeight = carLength * camera.pxPerMeter;
    const blurRadius = SHADOW_CONSTANTS.BLUR_RADIUS * camera.pxPerMeter;

    // Create radial gradient for soft shadow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(shadowWidth, shadowHeight) / 2 + blurRadius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${SHADOW_CONSTANTS.OPACITY})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${SHADOW_CONSTANTS.OPACITY * 0.3})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;

    // Draw shadow as ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, shadowWidth / 2 + blurRadius, shadowHeight / 2 + blurRadius, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Render contact patches (dark spots where tires touch ground)
   */
  renderContactPatches(
    ctx: CanvasRenderingContext2D,
    carPos: Vec2,
    carHeading: number,
    carWidth: number,
    carLength: number,
    camera: { pos: Vec2; pxPerMeter: number },
    telemetry?: PhysicsTelemetry
  ): void {
    ctx.save();

    // Convert world to screen coordinates
    const screenX = (carPos.x - camera.pos.x) * camera.pxPerMeter + ctx.canvas.width / 2;
    const screenY = (carPos.y - camera.pos.y) * camera.pxPerMeter + ctx.canvas.height / 2;

    ctx.translate(screenX, screenY);
    ctx.rotate(carHeading);

    const patchWidth = SHADOW_CONSTANTS.CONTACT_PATCH_WIDTH * camera.pxPerMeter;
    const patchLength = SHADOW_CONSTANTS.CONTACT_PATCH_LENGTH * camera.pxPerMeter;

    // Positions of the four wheels (roughly)
    const wheelBaseLength = carLength * 0.5;
    const wheelTrack = carWidth * 0.7;

    const wheelPositions = [
      { x: -wheelTrack / 2, y: -wheelBaseLength / 2 }, // Front left
      { x: wheelTrack / 2, y: -wheelBaseLength / 2 },  // Front right
      { x: -wheelTrack / 2, y: wheelBaseLength / 2 },  // Rear left
      { x: wheelTrack / 2, y: wheelBaseLength / 2 },   // Rear right
    ];

    // Draw contact patches
    ctx.fillStyle = `rgba(0, 0, 0, ${SHADOW_CONSTANTS.CONTACT_PATCH_OPACITY})`;

    for (const wheelPos of wheelPositions) {
      // Adjust opacity based on load (simplified - could use telemetry)
      let opacity = SHADOW_CONSTANTS.CONTACT_PATCH_OPACITY;
      
      if (telemetry) {
        // Front wheels get darker when braking
        if (wheelPos.y < 0 && telemetry.brakeInput > 0.3) {
          opacity *= 1 + telemetry.brakeInput * 0.5;
        }
        // Rear wheels get darker when accelerating
        if (wheelPos.y > 0 && telemetry.throttleInput > 0.3) {
          opacity *= 1 + telemetry.throttleInput * 0.3;
        }
      }

      ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.7, opacity)})`;

      ctx.beginPath();
      ctx.ellipse(
        wheelPos.x * camera.pxPerMeter,
        wheelPos.y * camera.pxPerMeter,
        patchWidth / 2,
        patchLength / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Render both shadow and contact patches
   */
  renderAll(
    ctx: CanvasRenderingContext2D,
    carPos: Vec2,
    carHeading: number,
    carWidth: number,
    carLength: number,
    camera: { pos: Vec2; pxPerMeter: number },
    telemetry?: PhysicsTelemetry
  ): void {
    // Render shadow first (below contact patches)
    this.renderShadow(ctx, carPos, carHeading, carWidth, carLength, camera);
    
    // Then render contact patches
    this.renderContactPatches(ctx, carPos, carHeading, carWidth, carLength, camera, telemetry);
  }
}
