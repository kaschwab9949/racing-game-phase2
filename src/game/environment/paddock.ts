// Procedural paddock zone generation

import { TrackModel } from '../track';
import { EnvironmentSettings } from './constants';

/**
 * Generates the paddock zone near the start/finish line.
 * @param trackModel The track model to base the paddock generation on.
 * @param context The canvas rendering context.
 */
export function generatePaddockZone(trackModel: TrackModel, context: CanvasRenderingContext2D) {
  const start = trackModel.getSampleAtS(0).pos;

  // Draw paddock buildings
  context.fillStyle = EnvironmentSettings.paddockBuildingColor;
  for (let i = 0; i < 5; i++) {
    const x = start.x + i * 50;
    const y = start.y - 100;
    context.fillRect(x, y, 40, 80);
  }

  // Draw access roads
  context.fillStyle = EnvironmentSettings.paddockRoadColor;
  context.fillRect(start.x, start.y - 20, 200, 40);
}
