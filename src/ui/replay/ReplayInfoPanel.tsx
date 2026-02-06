import React from 'react';
import type { ReplaySession } from '../../game/replay';

export function ReplayInfoPanel({ replay }: { replay: ReplaySession }) {
  return (
    <div style={{ fontSize: 12, opacity: 0.8 }}>
      <div>Track: {replay.meta.trackId}</div>
      <div>Mode: {replay.meta.modeLabel}</div>
      <div>Duration: {formatTime(replay.meta.duration)}</div>
      <div>Cars: {replay.cars.length}</div>
      <div>Created: {new Date(replay.meta.createdAt).toLocaleString()}</div>
    </div>
  );
}

function formatTime(t: number): string {
  const totalMs = Math.max(0, Math.floor(t * 1000));
  const ms = totalMs % 1000;
  const totalS = Math.floor(totalMs / 1000);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
