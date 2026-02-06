import type { Vec2 } from '../math';

export type SurfaceType = 'asphalt' | 'curb' | 'gravel' | 'runoff' | 'grass';

export interface TrackControlPoint {
  pos: Vec2;
  widthLeft: number;
  widthRight: number;
  surface: SurfaceType;
}

export interface TrackSample {
  s: number;
  pos: Vec2;
  tangent: Vec2;
  normal: Vec2; // Right vector
  widthLeft: number;
  widthRight: number;
  surface: SurfaceType;
}

export interface TrackSector {
  id: number;
  name: string;
  startS: number;
  endS: number;
}

export interface TrackCorner {
  id: number;
  apexS: number;
  startS: number;
  endS: number;
  name?: string;
}

export interface TrackMetadata {
  name: string;
  author: string;
  version: string;
  year?: number;
  location?: string;
  totalLengthM: number;
  turns: number;
  direction: 'CW' | 'CCW';
}
