// Procedural safety features generation

import { TrackModel } from '../track';
import { EnvironmentSettings } from './constants';

/**
 * Generates safety features like hydro barriers and tire stacks.
 * @param trackModel The track model to base the safety features on.
 * @param context The canvas rendering context.
 */
export function generateSafetyFeatures(trackModel: TrackModel, context: CanvasRenderingContext2D) {
  const start = trackModel.getSampleAtS(0).pos;
  const zone = { x: start.x - 60, y: start.y + 40, width: 120, height: 18 };

  // Draw hydro barriers
  context.fillStyle = EnvironmentSettings.barrierColor;
  for (let i = 0; i < zone.width; i += 20) {
    context.fillRect(zone.x + i, zone.y, 15, zone.height);
  }

  // Add tire stacks
  context.fillStyle = EnvironmentSettings.tireStackColor;
  for (let i = 0; i < zone.width; i += 40) {
    context.beginPath();
    context.arc(zone.x + i, zone.y + zone.height + 10, 10, 0, Math.PI * 2);
    context.fill();
  }
}
