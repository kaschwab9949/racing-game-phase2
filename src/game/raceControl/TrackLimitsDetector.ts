import type { Vec2 } from '../math';
import type { CarSpec } from '../cars/specs/types';
import type { TrackModel } from '../track/TrackModel';
import type { TrackSample } from '../track/types';
import {
  type WheelCorner,
  type WheelOffTrackState,
  type TrackLimitsSnapshot,
  type OffTrackZone,
  SURFACE_GRIP,
  SURFACE_DRAG,
  SURFACE_WIDTHS,
} from './types';
import { add, scale, sub } from '../math';

/**
 * Computes wheel positions in world space based on car spec and state
 */
function getWheelPositions(
  pos: Vec2,
  heading: number,
  spec: CarSpec
): Record<WheelCorner, Vec2> {
  const cosH = Math.cos(heading);
  const sinH = Math.sin(heading);

  // Convert mm to meters
  const wheelbaseM = spec.wheelbaseMm / 1000;
  const frontTrackM = spec.frontTrackMm / 1000;
  const rearTrackM = spec.rearTrackMm / 1000;
  const frontOverhangM = spec.frontOverhangMm / 1000;

  // Calculate axle positions relative to center
  const frontAxleOffset = wheelbaseM / 2;
  const rearAxleOffset = -wheelbaseM / 2;

  // Forward and right vectors
  const fwd = { x: cosH, y: sinH };
  const right = { x: -sinH, y: cosH };

  return {
    FL: add(pos, add(scale(fwd, frontAxleOffset), scale(right, -frontTrackM / 2))),
    FR: add(pos, add(scale(fwd, frontAxleOffset), scale(right, frontTrackM / 2))),
    RL: add(pos, add(scale(fwd, rearAxleOffset), scale(right, -rearTrackM / 2))),
    RR: add(pos, add(scale(fwd, rearAxleOffset), scale(right, rearTrackM / 2))),
  };
}

/**
 * Determines which surface zone a point is in relative to track edge
 */
function classifySurface(distFromEdge: number): OffTrackZone {
  if (distFromEdge <= 0) return 'none';
  if (distFromEdge <= SURFACE_WIDTHS.curb) return 'curb';
  if (distFromEdge <= SURFACE_WIDTHS.curb + SURFACE_WIDTHS.gravel) return 'gravel';
  if (distFromEdge <= SURFACE_WIDTHS.curb + SURFACE_WIDTHS.gravel + SURFACE_WIDTHS.runoff) return 'runoff';
  return 'grass';
}

/**
 * Checks a single wheel position against track bounds
 */
function checkWheelOffTrack(
  wheelPos: Vec2,
  corner: WheelCorner,
  track: TrackModel
): WheelOffTrackState {
  const proj = track.project(wheelPos);
  const sample = proj.sample;

  // Calculate signed distance from track center along normal
  const dx = wheelPos.x - sample.pos.x;
  const dy = wheelPos.y - sample.pos.y;
  const sideDist = dx * sample.normal.x + dy * sample.normal.y;

  // Determine which edge we're relative to
  let distanceFromEdge = 0;
  if (sideDist > sample.widthRight) {
    distanceFromEdge = sideDist - sample.widthRight;
  } else if (sideDist < -sample.widthLeft) {
    distanceFromEdge = Math.abs(sideDist) - sample.widthLeft;
  }

  const offTrack = distanceFromEdge > 0;
  const surface = classifySurface(distanceFromEdge);

  return {
    corner,
    offTrack,
    surface,
    distanceFromEdge,
  };
}

/**
 * Detects potential corner cutting by checking if car is taking
 * a significantly shorter path than the racing line
 */
function detectCut(
  currentS: number,
  previousS: number,
  trackLength: number,
  wheelsOff: number,
  dt: number,
  speed: number
): boolean {
  if (wheelsOff < 2) return false;

  // Calculate distance traveled
  let deltaS = currentS - previousS;
  if (deltaS < -trackLength / 2) deltaS += trackLength;
  if (deltaS > trackLength / 2) deltaS -= trackLength;

  // Expected distance based on speed
  const expectedDist = speed * dt;
  
  // If we traveled significantly more track distance than expected,
  // and multiple wheels are off, likely cutting
  const ratio = deltaS / Math.max(0.1, expectedDist);
  
  return ratio > 1.3 && wheelsOff >= 3;
}

/**
 * Main track limits detector class
 */
export class TrackLimitsDetector {
  private track: TrackModel;
  private lastS = 0;
  private consecutiveOffTrackFrames = 0;
  private lastSnapshot: TrackLimitsSnapshot | null = null;

  constructor(track: TrackModel) {
    this.track = track;
  }

  /**
   * Analyzes car position and returns track limits snapshot
   */
  detect(
    pos: Vec2,
    heading: number,
    vel: Vec2,
    spec: CarSpec,
    dt: number,
    timestamp: number
  ): TrackLimitsSnapshot {
    const wheelPositions = getWheelPositions(pos, heading, spec);
    const corners: WheelCorner[] = ['FL', 'FR', 'RL', 'RR'];

    const wheelStates: WheelOffTrackState[] = corners.map(corner =>
      checkWheelOffTrack(wheelPositions[corner], corner, this.track)
    );

    const wheelsOff = wheelStates.filter(w => w.offTrack).length;
    const allWheelsOff = wheelsOff === 4;

    // Track consecutive off-track frames
    if (wheelsOff >= 2) {
      this.consecutiveOffTrackFrames++;
    } else {
      this.consecutiveOffTrackFrames = 0;
    }

    // Get car's current track position
    const proj = this.track.project(pos);
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);

    // Detect corner cutting
    const cutDetected = detectCut(
      proj.s,
      this.lastS,
      this.track.length,
      wheelsOff,
      dt,
      speed
    );

    this.lastS = proj.s;

    // Determine dominant surface (worst case for grip)
    let worstSurface: OffTrackZone = 'none';
    let minGrip = 1.0;
    for (const ws of wheelStates) {
      const grip = SURFACE_GRIP[ws.surface];
      if (grip < minGrip) {
        minGrip = grip;
        worstSurface = ws.surface;
      }
    }

    // Calculate blended grip/drag based on wheel distribution
    const offTrackWheels = wheelStates.filter(w => w.offTrack);
    const wheelFactor = offTrackWheels.length / 4;
    
    let gripMultiplier = 1.0;
    let dragMultiplier = 1.0;
    
    if (offTrackWheels.length > 0) {
      const avgSurfaceGrip = offTrackWheels.reduce(
        (sum, w) => sum + SURFACE_GRIP[w.surface],
        0
      ) / offTrackWheels.length;
      
      const avgSurfaceDrag = offTrackWheels.reduce(
        (sum, w) => sum + SURFACE_DRAG[w.surface],
        0
      ) / offTrackWheels.length;

      // Blend with on-track wheels
      gripMultiplier = 1.0 - wheelFactor * (1.0 - avgSurfaceGrip);
      dragMultiplier = 1.0 + wheelFactor * (avgSurfaceDrag - 1.0);
    }

    const snapshot: TrackLimitsSnapshot = {
      timestamp,
      s: proj.s,
      wheelsOff,
      wheelStates,
      allWheelsOff,
      cutDetected,
      surface: worstSurface,
      gripMultiplier,
      dragMultiplier,
    };

    this.lastSnapshot = snapshot;
    return snapshot;
  }

  getLastSnapshot(): TrackLimitsSnapshot | null {
    return this.lastSnapshot;
  }

  reset(): void {
    this.lastS = 0;
    this.consecutiveOffTrackFrames = 0;
    this.lastSnapshot = null;
  }
}
