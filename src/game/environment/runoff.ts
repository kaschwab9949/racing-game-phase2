// Procedural runoff zone generation

import { TrackModel } from '../track';
import { EnvironmentSettings } from './constants';

/**
 * Generates runoff zones near corners.
 * @param trackModel The track model to base the runoff generation on.
 * @param context The canvas rendering context.
 */
export function generateRunoffZones(trackModel: TrackModel, context: CanvasRenderingContext2D) {
  trackModel.corners.forEach((corner) => {
    const sample = trackModel.getSampleAtS(corner.apexS);
    const radius = (sample.widthLeft + sample.widthRight) * 0.35;

    // Draw lighter asphalt patch
    context.fillStyle = EnvironmentSettings.runoffColor;
    context.beginPath();
    context.arc(sample.pos.x, sample.pos.y, radius + 10, 0, Math.PI * 2);
    context.fill();

    // Add gravel traps
    context.fillStyle = EnvironmentSettings.gravelColor;
    context.beginPath();
    context.arc(sample.pos.x, sample.pos.y, radius, 0, Math.PI * 2);
    context.fill();
  });
}
