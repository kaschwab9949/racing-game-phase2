import {
  type PenaltyConfig,
  type PenaltyState,
  type PenaltyRecord,
  type PenaltySeverity,
  type PenaltyPhase,
  type RaceControlEvent,
  type TrackLimitsSnapshot,
  type PenaltyHudState,
  DEFAULT_PENALTY_CONFIG,
} from './types';

/**
 * Manages the penalty state machine:
 * - Tracks warnings with decay
 * - Issues penalties after threshold
 * - Handles serve requirements (time or slowdown)
 */
export class PenaltyManager {
  private config: PenaltyConfig;
  private state: PenaltyState;
  private penaltyIdCounter = 0;
  private eventLog: RaceControlEvent[] = [];
  private lastEvent: RaceControlEvent | null = null;

  constructor(config: Partial<PenaltyConfig> = {}) {
    this.config = { ...DEFAULT_PENALTY_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): PenaltyState {
    return {
      warnings: 0,
      warningDecayTimer: 0,
      activePenalty: null,
      penaltyHistory: [],
      totalTimePenalties: 0,
      pendingSlowdown: 0,
    };
  }

  /**
   * Process a track limits snapshot and determine if penalty action needed
   */
  processLimitsViolation(
    snapshot: TrackLimitsSnapshot,
    lapIndex: number,
    cornerId?: number
  ): RaceControlEvent | null {
    // Only penalize if all 4 wheels off or cut detected
    if (!snapshot.allWheelsOff && !snapshot.cutDetected) {
      return null;
    }

    const isCut = snapshot.cutDetected;
    const eventType = isCut ? 'cut_detected' : 'off_track';

    // Record the violation event
    const violationEvent = this.createEvent(
      eventType,
      snapshot.timestamp,
      lapIndex,
      snapshot.s,
      isCut
        ? `Corner cut detected at s=${snapshot.s.toFixed(1)}m`
        : `Track limits exceeded (4 wheels off) at s=${snapshot.s.toFixed(1)}m`
    );

    this.logEvent(violationEvent);

    // Handle based on current state
    if (this.state.activePenalty?.phase === 'serving') {
      // Already serving a penalty, ignore new violations
      return violationEvent;
    }

    // Issue warning or escalate to penalty
    return this.issueWarningOrPenalty(snapshot, lapIndex, isCut, cornerId);
  }

  private issueWarningOrPenalty(
    snapshot: TrackLimitsSnapshot,
    lapIndex: number,
    isCut: boolean,
    cornerId?: number
  ): RaceControlEvent {
    // Reset decay timer on new violation
    this.state.warningDecayTimer = this.config.warningDecayTime;
    this.state.warnings++;

    // Check if we've exceeded warning threshold
    const shouldPenalize = this.state.warnings > this.config.warningsBeforePenalty;

    if (shouldPenalize || isCut) {
      return this.issuePenalty(snapshot, lapIndex, isCut, cornerId);
    }

    // Just a warning
    const warningEvent = this.createEvent(
      'warning_issued',
      snapshot.timestamp,
      lapIndex,
      snapshot.s,
      `Warning ${this.state.warnings}/${this.config.warningsBeforePenalty} - Track limits`
    );

    this.logEvent(warningEvent);
    return warningEvent;
  }

  private issuePenalty(
    snapshot: TrackLimitsSnapshot,
    lapIndex: number,
    isCut: boolean,
    cornerId?: number
  ): RaceControlEvent {
    const penaltyId = ++this.penaltyIdCounter;
    
    // Determine penalty type: cuts get time penalty, track limits get slowdown
    const severity: PenaltySeverity = isCut ? 'time_penalty' : 'slowdown';
    const multiplier = isCut ? this.config.cutPenaltyMultiplier : 1.0;

    const penalty: PenaltyRecord = {
      id: penaltyId,
      type: isCut ? 'cut' : 'track_limits',
      severity,
      phase: 'pending',
      issuedAt: snapshot.timestamp,
      lapIndex,
      s: snapshot.s,
      cornerId,
      timePenalty: severity === 'time_penalty' 
        ? this.config.timePenaltySeconds * multiplier 
        : undefined,
      slowdownRequired: severity === 'slowdown'
        ? this.config.slowdownDurationSeconds * multiplier
        : undefined,
      slowdownServed: 0,
    };

    this.state.activePenalty = penalty;
    this.state.penaltyHistory.push(penalty);
    this.state.warnings = 0; // Reset warnings after penalty

    const penaltyEvent = this.createEvent(
      'penalty_issued',
      snapshot.timestamp,
      lapIndex,
      snapshot.s,
      severity === 'time_penalty'
        ? `${penalty.timePenalty!.toFixed(1)}s time penalty for corner cutting`
        : `Slowdown required (${penalty.slowdownRequired!.toFixed(1)}s) for track limits`,
      penaltyId
    );

    this.logEvent(penaltyEvent);
    return penaltyEvent;
  }

  /**
   * Update penalty state each frame
   */
  update(dt: number, currentSpeed: number, timestamp: number, lapIndex: number): RaceControlEvent | null {
    // Decay warnings over time
    if (this.state.warnings > 0 && this.state.warningDecayTimer > 0) {
      this.state.warningDecayTimer -= dt;
      if (this.state.warningDecayTimer <= 0) {
        this.state.warnings = Math.max(0, this.state.warnings - 1);
        this.state.warningDecayTimer = this.config.warningDecayTime;
        
        if (this.state.warnings > 0) {
          const decayEvent = this.createEvent(
            'warning_decayed',
            timestamp,
            lapIndex,
            0,
            `Warning decayed, ${this.state.warnings} remaining`
          );
          this.logEvent(decayEvent);
          return decayEvent;
        }
      }
    }

    // Process active penalty
    if (!this.state.activePenalty) return null;

    const penalty = this.state.activePenalty;

    switch (penalty.phase) {
      case 'pending':
        // Transition to serving
        penalty.phase = 'serving';
        break;

      case 'serving':
        if (penalty.severity === 'time_penalty') {
          // Time penalty is applied at lap end, mark as served immediately
          penalty.phase = 'served';
          penalty.servedAt = timestamp;
          this.state.totalTimePenalties += penalty.timePenalty!;
          
          const servedEvent = this.createEvent(
            'penalty_served',
            timestamp,
            lapIndex,
            0,
            `${penalty.timePenalty!.toFixed(1)}s time penalty applied`,
            penalty.id
          );
          this.logEvent(servedEvent);
          this.state.activePenalty = null;
          return servedEvent;

        } else if (penalty.severity === 'slowdown') {
          // Check if driver is obeying slowdown
          if (currentSpeed <= this.config.slowdownSpeedLimit) {
            penalty.slowdownServed = (penalty.slowdownServed ?? 0) + dt;

            if (penalty.slowdownServed >= penalty.slowdownRequired!) {
              penalty.phase = 'served';
              penalty.servedAt = timestamp;

              const servedEvent = this.createEvent(
                'penalty_served',
                timestamp,
                lapIndex,
                0,
                `Slowdown penalty served`,
                penalty.id
              );
              this.logEvent(servedEvent);
              this.state.activePenalty = null;
              return servedEvent;
            }
          }
        }
        break;
    }

    return null;
  }

  /**
   * Check if driver must slow down
   */
  mustSlowDown(): boolean {
    const penalty = this.state.activePenalty;
    return penalty?.phase === 'serving' && penalty.severity === 'slowdown';
  }

  /**
   * Get the speed limit if slowdown is active
   */
  getSpeedLimit(): number | null {
    if (this.mustSlowDown()) {
      return this.config.slowdownSpeedLimit;
    }
    return null;
  }

  /**
   * Get serve progress (0-1) for slowdown penalties
   */
  getServeProgress(): number {
    const penalty = this.state.activePenalty;
    if (!penalty || penalty.severity !== 'slowdown') return 0;
    return Math.min(1, (penalty.slowdownServed ?? 0) / (penalty.slowdownRequired ?? 1));
  }

  /**
   * Get HUD state for UI display
   */
  getHudState(currentZone: import('./types').OffTrackZone, wheelsOff: number): PenaltyHudState {
    return {
      warnings: this.state.warnings,
      maxWarnings: this.config.warningsBeforePenalty,
      activePenalty: this.state.activePenalty,
      phase: this.state.activePenalty?.phase ?? 'none',
      serveProgress: this.getServeProgress(),
      totalTimePenalties: this.state.totalTimePenalties,
      lastEvent: this.lastEvent,
      offTrackZone: currentZone,
      wheelsOff,
    };
  }

  /**
   * Get total time penalties to add to lap time
   */
  getTotalTimePenalties(): number {
    return this.state.totalTimePenalties;
  }

  /**
   * Get event log for telemetry
   */
  getEventLog(): RaceControlEvent[] {
    return [...this.eventLog];
  }

  /**
   * Clear event log (e.g., on lap reset)
   */
  clearEventLog(): void {
    this.eventLog = [];
  }

  /**
   * Reset all penalty state (e.g., on race restart)
   */
  reset(): void {
    this.state = this.createInitialState();
    this.eventLog = [];
    this.lastEvent = null;
  }

  private createEvent(
    type: import('./types').RaceControlEventType,
    timestamp: number,
    lapIndex: number,
    s: number,
    details: string,
    penaltyId?: number
  ): RaceControlEvent {
    return { type, timestamp, lapIndex, s, details, penaltyId };
  }

  private logEvent(event: RaceControlEvent): void {
    this.eventLog.push(event);
    this.lastEvent = event;
    
    // Keep log bounded
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }
  }
}
