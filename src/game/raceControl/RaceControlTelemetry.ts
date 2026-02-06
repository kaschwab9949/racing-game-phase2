import type { RaceControlEvent, PenaltyHudState, TrackLimitsSnapshot } from './types';
import { GameClock } from '../../devtools/determinism/GameClock';

/**
 * Telemetry sample extension for race control data
 */
export interface RaceControlTelemetrySample {
  timestamp: number;
  s: number;
  lapIndex: number;
  wheelsOff: number;
  surface: string;
  gripMultiplier: number;
  dragMultiplier: number;
  warnings: number;
  penaltyActive: boolean;
  penaltyPhase: string;
  totalTimePenalties: number;
}

/**
 * Full race control session data for export
 */
export interface RaceControlSessionData {
  sessionStartTime: number;
  events: RaceControlEvent[];
  samples: RaceControlTelemetrySample[];
  summary: RaceControlSessionSummary;
}

export interface RaceControlSessionSummary {
  totalOffTrackEvents: number;
  totalCutEvents: number;
  totalWarnings: number;
  totalPenalties: number;
  totalTimePenaltiesSeconds: number;
  offTrackPercentage: number;
  lapsWithViolations: number[];
}

/**
 * Records race control telemetry for analysis and export
 */
export class RaceControlTelemetryRecorder {
  private sessionStartTime: number;
  private events: RaceControlEvent[] = [];
  private samples: RaceControlTelemetrySample[] = [];
  private sampleInterval = 0.1; // Sample every 100ms
  private lastSampleTime = 0;
  private totalSamples = 0;
  private offTrackSamples = 0;
  private lapsWithViolations = new Set<number>();

  constructor() {
    this.sessionStartTime = GameClock.nowSec();
  }

  /**
   * Record a race control event
   */
  recordEvent(event: RaceControlEvent): void {
    this.events.push(event);
    
    // Track laps with violations
    if (event.type === 'warning_issued' || event.type === 'penalty_issued') {
      this.lapsWithViolations.add(event.lapIndex);
    }
  }

  /**
   * Record telemetry sample if interval has passed
   */
  recordSample(
    snapshot: TrackLimitsSnapshot,
    hudState: PenaltyHudState,
    lapIndex: number
  ): void {
    if (snapshot.timestamp - this.lastSampleTime < this.sampleInterval) {
      return;
    }

    this.lastSampleTime = snapshot.timestamp;
    this.totalSamples++;
    
    if (snapshot.wheelsOff > 0) {
      this.offTrackSamples++;
    }

    const sample: RaceControlTelemetrySample = {
      timestamp: snapshot.timestamp,
      s: snapshot.s,
      lapIndex,
      wheelsOff: snapshot.wheelsOff,
      surface: snapshot.surface,
      gripMultiplier: snapshot.gripMultiplier,
      dragMultiplier: snapshot.dragMultiplier,
      warnings: hudState.warnings,
      penaltyActive: hudState.activePenalty !== null,
      penaltyPhase: hudState.phase,
      totalTimePenalties: hudState.totalTimePenalties,
    };

    this.samples.push(sample);

    // Limit sample buffer
    if (this.samples.length > 10000) {
      this.samples = this.samples.slice(-5000);
    }
  }

  /**
   * Get session data for export
   */
  getSessionData(): RaceControlSessionData {
    return {
      sessionStartTime: this.sessionStartTime,
      events: [...this.events],
      samples: [...this.samples],
      summary: this.computeSummary(),
    };
  }

  /**
   * Compute session summary statistics
   */
  private computeSummary(): RaceControlSessionSummary {
    let offTrackEvents = 0;
    let cutEvents = 0;
    let warningCount = 0;
    let penaltyCount = 0;
    let totalTimePenalties = 0;

    for (const event of this.events) {
      switch (event.type) {
        case 'off_track':
          offTrackEvents++;
          break;
        case 'cut_detected':
          cutEvents++;
          break;
        case 'warning_issued':
          warningCount++;
          break;
        case 'penalty_issued':
          penaltyCount++;
          break;
        case 'penalty_served':
          // Extract time from details if it's a time penalty
          const timeMatch = event.details.match(/(\d+\.?\d*)s/);
          if (timeMatch) {
            totalTimePenalties += parseFloat(timeMatch[1]);
          }
          break;
      }
    }

    return {
      totalOffTrackEvents: offTrackEvents,
      totalCutEvents: cutEvents,
      totalWarnings: warningCount,
      totalPenalties: penaltyCount,
      totalTimePenaltiesSeconds: totalTimePenalties,
      offTrackPercentage: this.totalSamples > 0 
        ? (this.offTrackSamples / this.totalSamples) * 100 
        : 0,
      lapsWithViolations: Array.from(this.lapsWithViolations).sort((a, b) => a - b),
    };
  }

  /**
   * Export to CSV format
   */
  exportEventsCSV(): string {
    const headers = ['timestamp', 'type', 'lapIndex', 's', 'details', 'penaltyId'];
    const rows = this.events.map(e => [
      e.timestamp.toFixed(3),
      e.type,
      e.lapIndex.toString(),
      e.s.toFixed(2),
      `"${e.details}"`,
      e.penaltyId?.toString() ?? '',
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export samples to CSV format
   */
  exportSamplesCSV(): string {
    const headers = [
      'timestamp', 's', 'lapIndex', 'wheelsOff', 'surface',
      'gripMult', 'dragMult', 'warnings', 'penaltyActive', 'phase', 'totalPenalties'
    ];
    
    const rows = this.samples.map(s => [
      s.timestamp.toFixed(3),
      s.s.toFixed(2),
      s.lapIndex.toString(),
      s.wheelsOff.toString(),
      s.surface,
      s.gripMultiplier.toFixed(3),
      s.dragMultiplier.toFixed(3),
      s.warnings.toString(),
      s.penaltyActive ? '1' : '0',
      s.penaltyPhase,
      s.totalTimePenalties.toFixed(1),
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Reset recorder for new session
   */
  reset(): void {
    this.sessionStartTime = GameClock.nowSec();
    this.events = [];
    this.samples = [];
    this.lastSampleTime = 0;
    this.totalSamples = 0;
    this.offTrackSamples = 0;
    this.lapsWithViolations.clear();
  }
}
