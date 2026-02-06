import type { TrackModel } from '../../track/TrackModel';
import type { Vec2 } from '../../math';

export type TrackBounds = {
  min: Vec2;
  max: Vec2;
  size: { width: number; height: number };
  worldOffset: Vec2;
};

export function computeTrackBounds(track: TrackModel, margin = 5, minSize = 100): TrackBounds {
  if (!track.samples.length) {
    return {
      min: { x: 0, y: 0 },
      max: { x: minSize, y: minSize },
      size: { width: minSize, height: minSize },
      worldOffset: { x: 0, y: 0 },
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const s of track.samples) {
    minX = Math.min(minX, s.pos.x - s.widthLeft - margin);
    maxX = Math.max(maxX, s.pos.x + s.widthRight + margin);
    minY = Math.min(minY, s.pos.y - s.widthLeft - margin);
    maxY = Math.max(maxY, s.pos.y + s.widthRight + margin);
  }

  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;
  const width = Math.max(minSize, rawWidth);
  const height = Math.max(minSize, rawHeight);

  return {
    min: { x: minX, y: minY },
    max: { x: minX + width, y: minY + height },
    size: { width, height },
    worldOffset: { x: -minX, y: -minY },
  };
}
