import type { TrackControlPoint } from '../types';
import { dist } from '../../math';

export type PolylineTrackOptions = {
  widthLeft?: number;
  widthRight?: number;
  targetLengthM?: number;
  resampleSpacing?: number;
  reverse?: boolean;
  flipY?: boolean;
};

export function buildTrackControlPointsFromPolyline(
  points: Array<{ x: number; y: number }>,
  options: PolylineTrackOptions = {},
): TrackControlPoint[] {
  if (points.length < 3) return [];

  const {
    widthLeft = 6,
    widthRight = 6,
    targetLengthM = 3730,
    resampleSpacing = 40,
    reverse = false,
    flipY = false,
  } = options;

  let pts = points.map((p) => ({ x: p.x, y: flipY ? -p.y : p.y }));
  if (reverse) pts = pts.slice().reverse();

  const centered = centerPoints(pts);
  const resampled = resamplePolyline(centered, resampleSpacing);
  const scaled = scalePolylineToLength(resampled, targetLengthM);

  return scaled.map((p) => ({
    pos: { x: p.x, y: p.y },
    widthLeft,
    widthRight,
    surface: 'asphalt',
  }));
}

function centerPoints(points: Array<{ x: number; y: number }>) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return points.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

function resamplePolyline(points: Array<{ x: number; y: number }>, spacing: number) {
  if (points.length < 2) return points;
  const out: Array<{ x: number; y: number }> = [];
  let prev = points[0];
  out.push({ ...prev });
  let accum = 0;

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    let segLen = dist(prev, curr);
    while (accum + segLen >= spacing) {
      const t = (spacing - accum) / segLen;
      const nx = prev.x + (curr.x - prev.x) * t;
      const ny = prev.y + (curr.y - prev.y) * t;
      out.push({ x: nx, y: ny });
      prev = { x: nx, y: ny };
      segLen = dist(prev, curr);
      accum = 0;
    }
    accum += segLen;
    prev = curr;
  }
  return out;
}

function polylineLength(points: Array<{ x: number; y: number }>): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += dist(points[i - 1], points[i]);
  }
  return len;
}

function scalePolylineToLength(points: Array<{ x: number; y: number }>, targetLength: number) {
  const length = polylineLength(points);
  if (length <= 0) return points;
  const scale = targetLength / length;
  return points.map((p) => ({ x: p.x * scale, y: p.y * scale }));
}
