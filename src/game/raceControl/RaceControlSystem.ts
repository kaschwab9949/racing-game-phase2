import type { TrackModel } from '../track/TrackModel';
import type { CarState } from '../carPhysics';
import type { CarSpec } from '../cars/specs/types';
import type { Vec2 } from '../math';
import { TrackLimitsDetector } from './TrackLimitsDetector';
import { PenaltyManager } from './PenaltyManager';
import {
  type TrackLimitsSnapshot,
  type PenaltyConfig,
  type PenaltyHudState,
  type RaceControlEvent,
  SURFACE_GRIP,
  SURFACE_DRAG,
} from './types';

export interface RaceControlState {
  limitsSnapshot: TrackLimitsSnapshot | null;
  penaltyHud: PenaltyHudState;
  gripMultiplier: number;
  dragMultiplier: number;
  speedLimited: boolean;
  speedLimit: number | null;
}

export interface RaceControlUpdateResult {
  state: RaceControlState;
  events: RaceControlEvent[];
}

/**
 * Main race control coordinator
 * Combines track limits detection with penalty management
 */
export class RaceControlSystem {
  private limitsDetector: TrackLimitsDetector;
  private penaltyManager: PenaltyManager;
  private lastSnapshot: TrackLimitsSnapshot | null = null;
  private frameEvents: RaceControlEvent[] = [];
  private violationCooldown = 0;
  private readonly VIOLATION_COOLDOWN_TIME = 1.5; // seconds between violations

  constructor(track: TrackModel, penaltyConfig?: Partial<PenaltyConfig>) {
    this.limitsDetector = new TrackLimitsDetector(track);
    this.penaltyManager = new PenaltyManager(penaltyConfig);
  }

  /**
   * Update race control for a single frame
   */
  update(
    car: CarState,
    dt: number,
    timestamp: number,
    lapIndex: number,
    cornerId?: number
  ): RaceControlUpdateResult {
    this.frameEvents = [];

    // Detect track limits
    const snapshot = this.limitsDetector.detect(
      car.pos,
      car.heading,
      car.vel,
      car.spec,
      dt,
      timestamp
    );
    this.lastSnapshot = snapshot;

    // Decrement violation cooldown
    this.violationCooldown = Math.max(0, this.violationCooldown - dt);

    // Process violations with cooldown to prevent spam
    if (this.violationCooldown <= 0) {
      if (snapshot.allWheelsOff || snapshot.cutDetected) {
        const violationEvent = this.penaltyManager.processLimitsViolation(
          snapshot,
          lapIndex,
          cornerId
        );
        if (violationEvent) {
          this.frameEvents.push(violationEvent);
          this.violationCooldown = this.VIOLATION_COOLDOWN_TIME;
        }
      }
    }

    // Update penalty state machine
    const currentSpeed = Math.sqrt(car.vel.x * car.vel.x + car.vel.y * car.vel.y);
    const penaltyEvent = this.penaltyManager.update(dt, currentSpeed, timestamp, lapIndex);
    if (penaltyEvent) {
      this.frameEvents.push(penaltyEvent);
    }

    // Build result
    const speedLimit = this.penaltyManager.getSpeedLimit();
    const state: RaceControlState = {
      limitsSnapshot: snapshot,
      penaltyHud: this.penaltyManager.getHudState(snapshot.surface, snapshot.wheelsOff),
      gripMultiplier: snapshot.gripMultiplier,
      dragMultiplier: snapshot.dragMultiplier,
      speedLimited: speedLimit !== null,
      speedLimit,
    };

    return { state, events: this.frameEvents };
  }

  /**
   * Get physics modifiers to apply to car
   */
  getPhysicsModifiers(): { grip: number; drag: number } {
    const snapshot = this.lastSnapshot;
    if (!snapshot) return { grip: 1.0, drag: 1.0 };
    return {
      grip: snapshot.gripMultiplier,
      drag: snapshot.dragMultiplier,
    };
  }

  /**
   * Check if speed limiter should be active
   */
  isSpeedLimited(): boolean {
    return this.penaltyManager.mustSlowDown();
  }

  /**
   * Get current speed limit (m/s) or null if none
   */
  getSpeedLimit(): number | null {
    return this.penaltyManager.getSpeedLimit();
  }

  /**
   * Get total time penalties accumulated
   */
  getTotalTimePenalties(): number {
    return this.penaltyManager.getTotalTimePenalties();
  }

  /**
   * Get full event log for telemetry export
   */
  getEventLog(): RaceControlEvent[] {
    return this.penaltyManager.getEventLog();
  }

  /**
   * Get current penalty HUD state
   */
  getPenaltyHudState(): PenaltyHudState | null {
    const snapshot = this.lastSnapshot;
    if (!snapshot) return null;
    return this.penaltyManager.getHudState(snapshot.surface, snapshot.wheelsOff);
  }

  /**
   * Reset race control state
   */
  reset(): void {
    this.limitsDetector.reset();
    this.penaltyManager.reset();
    this.lastSnapshot = null;
    this.frameEvents = [];
    this.violationCooldown = 0;
  }

  /**
   * Update track reference (e.g., when switching tracks)
   */
  setTrack(track: TrackModel): void {
    this.limitsDetector = new TrackLimitsDetector(track);
    this.reset();
  }
}
