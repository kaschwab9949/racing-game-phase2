import type { PenaltyHudState, RaceControlEvent, OffTrackZone, PenaltyPhase } from '../game/raceControl/types';

export type PenaltyWidgetProps = {
  state: PenaltyHudState | null;
  visible: boolean;
};

const ZONE_COLORS: Record<OffTrackZone, string> = {
  none: 'transparent',
  curb: '#FFD54F',
  gravel: '#8D6E63',
  runoff: '#78909C',
  grass: '#66BB6A',
};

const ZONE_LABELS: Record<OffTrackZone, string> = {
  none: '',
  curb: 'CURB',
  gravel: 'GRAVEL',
  runoff: 'RUNOFF',
  grass: 'GRASS',
};

const PHASE_LABELS: Record<PenaltyPhase, string> = {
  none: '',
  warning: 'WARNING',
  pending: 'PENALTY PENDING',
  serving: 'SERVE NOW',
  served: 'SERVED',
};

function formatEventMessage(event: RaceControlEvent): string {
  switch (event.type) {
    case 'warning_issued':
      return `⚠️ ${event.details}`;
    case 'penalty_issued':
      return `🚨 ${event.details}`;
    case 'penalty_served':
      return `✓ ${event.details}`;
    case 'off_track':
      return `Track Limits`;
    case 'cut_detected':
      return `⛔ Corner Cut!`;
    case 'warning_decayed':
      return event.details;
    default:
      return event.details;
  }
}

export function PenaltyWidget({ state, visible }: PenaltyWidgetProps) {
  if (!visible || !state) return null;

  const hasWarnings = state.warnings > 0;
  const hasPenalty = state.activePenalty !== null;
  const isServing = state.phase === 'serving';
  const hasTimePenalty = state.totalTimePenalties > 0;
  const showZone = state.offTrackZone !== 'none';

  // Determine widget urgency color
  let urgencyClass = 'penalty-widget--normal';
  if (isServing) urgencyClass = 'penalty-widget--urgent';
  else if (hasPenalty) urgencyClass = 'penalty-widget--warning';
  else if (hasWarnings) urgencyClass = 'penalty-widget--caution';

  return (
    <div className={`penalty-widget ${urgencyClass}`}>
      <div className="penalty-widget__header">
        <span className="penalty-widget__title">RACE CONTROL</span>
        {showZone && (
          <span
            className="penalty-widget__zone"
            style={{ backgroundColor: ZONE_COLORS[state.offTrackZone] }}
          >
            {ZONE_LABELS[state.offTrackZone]}
          </span>
        )}
      </div>

      {/* Warnings display */}
      <div className="penalty-widget__warnings">
        <span className="penalty-widget__label">Track Limits</span>
        <div className="penalty-widget__warning-dots">
          {Array.from({ length: state.maxWarnings }).map((_, i) => (
            <span
              key={i}
              className={`penalty-widget__dot ${i < state.warnings ? 'penalty-widget__dot--active' : ''}`}
            />
          ))}
        </div>
        <span className="penalty-widget__count">{state.warnings}/{state.maxWarnings}</span>
      </div>

      {/* Active penalty display */}
      {hasPenalty && state.activePenalty && (
        <div className="penalty-widget__penalty">
          <div className="penalty-widget__penalty-type">
            {state.activePenalty.severity === 'time_penalty' ? (
              <>
                <span className="penalty-widget__icon">⏱</span>
                <span>+{state.activePenalty.timePenalty?.toFixed(1)}s</span>
              </>
            ) : (
              <>
                <span className="penalty-widget__icon">🐢</span>
                <span>SLOW DOWN</span>
              </>
            )}
          </div>
          
          {state.activePenalty.severity === 'slowdown' && (
            <div className="penalty-widget__progress">
              <div className="penalty-widget__progress-label">
                {isServing ? 'Serving...' : 'Pending'}
              </div>
              <div className="penalty-widget__progress-bar">
                <div
                  className="penalty-widget__progress-fill"
                  style={{ width: `${state.serveProgress * 100}%` }}
                />
              </div>
              <div className="penalty-widget__progress-hint">
                {isServing ? 'Maintain &lt;80 km/h' : ''}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Time penalties total */}
      {hasTimePenalty && (
        <div className="penalty-widget__total">
          <span>Total Penalties:</span>
          <strong>+{state.totalTimePenalties.toFixed(1)}s</strong>
        </div>
      )}

      {/* Last event notification */}
      {state.lastEvent && (
        <div className="penalty-widget__event">
          {formatEventMessage(state.lastEvent)}
        </div>
      )}

      {/* Wheels off indicator */}
      {state.wheelsOff > 0 && (
        <div className="penalty-widget__wheels">
          <WheelIndicator wheelsOff={state.wheelsOff} />
        </div>
      )}
    </div>
  );
}

function WheelIndicator({ wheelsOff }: { wheelsOff: number }) {
  const allOff = wheelsOff === 4;
  return (
    <div className={`wheel-indicator ${allOff ? 'wheel-indicator--danger' : ''}`}>
      <div className="wheel-indicator__grid">
        <span className={`wheel-indicator__wheel ${wheelsOff >= 1 ? 'off' : ''}`}>●</span>
        <span className={`wheel-indicator__wheel ${wheelsOff >= 2 ? 'off' : ''}`}>●</span>
        <span className={`wheel-indicator__wheel ${wheelsOff >= 3 ? 'off' : ''}`}>●</span>
        <span className={`wheel-indicator__wheel ${wheelsOff >= 4 ? 'off' : ''}`}>●</span>
      </div>
      <span className="wheel-indicator__label">{wheelsOff}/4 OFF</span>
    </div>
  );
}
