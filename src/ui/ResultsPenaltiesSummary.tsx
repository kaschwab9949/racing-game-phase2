import React from 'react';
import type { SessionResults } from '../game/modes/types';

export function ResultsPenaltiesSummary({ results }: { results: SessionResults }) {
  const p = results.penalties;
  if (!p) return null;
  return (
    <div>
      <div style={{ fontWeight: 600, color: '#e6e6e6' }}>Penalties</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#1d1f27', border: '1px solid #333' }}>Warnings: {p.warnings}</span>
        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#1d1f27', border: '1px solid #333' }}>Time: +{p.timePenaltySeconds.toFixed(1)}s</span>
        <span style={{ padding: '2px 6px', borderRadius: 4, background: '#1d1f27', border: '1px solid #333' }}>Slowdown: {p.slowdownServedSeconds.toFixed(1)}s</span>
      </div>
    </div>
  );
}
