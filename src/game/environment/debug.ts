// Debug visualization for environment placement zones

import { TrackModel } from '../track';

/**
 * Visualizes environment placement zones for debugging.
 * @param trackModel The track model to base the visualization on.
 * @param context The canvas rendering context.
 */
export function visualizeEnvironmentZones(trackModel: TrackModel, context: CanvasRenderingContext2D) {
  // Visualize runoff zones
  trackModel.corners.forEach((corner) => {
    const sample = trackModel.getSampleAtS(corner.apexS);
    const radius = (sample.widthLeft + sample.widthRight) * 0.35;
    context.strokeStyle = 'blue';
    context.beginPath();
    context.arc(sample.pos.x, sample.pos.y, radius + 10, 0, Math.PI * 2);
    context.stroke();
  });

  // Visualize safety zones
  const start = trackModel.getSampleAtS(0).pos;
  context.strokeStyle = 'red';
  context.strokeRect(start.x - 60, start.y + 40, 120, 20);

  // Visualize paddock zone
  context.strokeStyle = 'green';
  context.strokeRect(start.x - 80, start.y - 100, 200, 100);
}
