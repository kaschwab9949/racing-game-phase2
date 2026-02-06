// Procedural ground generation logic

import { TrackModel } from '../track';
import { EnvironmentSettings } from './constants';
import { randRange } from '../../devtools/determinism/Random';

/**
 * Generates the procedural ground outside the track.
 * @param trackModel The track model to base the ground generation on.
 * @param context The canvas rendering context.
 */
export function generateGround(trackModel: TrackModel, context: CanvasRenderingContext2D) {
  const { width, height } = context.canvas;

  // Fill the entire canvas with desert soil tones
  context.fillStyle = EnvironmentSettings.groundColor;
  context.fillRect(0, 0, width, height);

  // Add subtle noise and scrub/rocks
  for (let i = 0; i < EnvironmentSettings.scrubDensity; i++) {
    const x = randRange(0, width);
    const y = randRange(0, height);
    const size = randRange(0, EnvironmentSettings.scrubMaxSize);

    context.fillStyle = EnvironmentSettings.scrubColor;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }
}
