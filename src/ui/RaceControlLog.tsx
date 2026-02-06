import type { RaceControlEvent, RaceControlEventType } from '../game/raceControl/types';

export type RaceControlLogProps = {
  events: RaceControlEvent[];
  visible: boolean;
  maxEntries?: number;
};

const EVENT_ICONS: Record<RaceControlEventType, string> = {
  off_track: '⚪',
  cut_detected: '⛔',
  warning_issued: '⚠️',
  penalty_issued: '🚨',
  penalty_served: '✅',
  warning_decayed: '↓',
};

const EVENT_COLORS: Record<RaceControlEventType, string> = {
  off_track: '#9e9e9e',
  cut_detected: '#f44336',
  warning_issued: '#ff9800',
  penalty_issued: '#e91e63',
  penalty_served: '#4caf50',
  warning_decayed: '#607d8b',
};

function formatTime(timestamp: number): string {
  const totalSeconds = Math.floor(timestamp);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((timestamp % 1) * 10);
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms}`;
}

export function RaceControlLog({ events, visible, maxEntries = 8 }: RaceControlLogProps) {
  if (!visible || events.length === 0) return null;

  const displayEvents = events.slice(-maxEntries).reverse();

  return (
    <div className="rc-log">
      <div className="rc-log__header">
        <span className="rc-log__title">Race Control Log</span>
        <span className="rc-log__count">{events.length} events</span>
      </div>
      <div className="rc-log__entries">
        {displayEvents.map((event, index) => (
          <div
            key={`${event.timestamp}-${index}`}
            className="rc-log__entry"
            style={{ borderLeftColor: EVENT_COLORS[event.type] }}
          >
            <span className="rc-log__icon">{EVENT_ICONS[event.type]}</span>
            <span className="rc-log__time">{formatTime(event.timestamp)}</span>
            <span className="rc-log__lap">L{event.lapIndex + 1}</span>
            <span className="rc-log__details">{event.details}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
