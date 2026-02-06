import React from 'react';
import type { SessionResults } from '../game/modes/types';
import { ResultsLapChart } from './ResultsLapChart';
import { ResultsSectorTimes } from './ResultsSectorTimes';
import { ResultsPenaltiesSummary } from './ResultsPenaltiesSummary';

export function ResultsScreen({ results, onClose, onSaveReplay, onWatchReplay }: { results: SessionResults; onClose: () => void; onSaveReplay?: () => void; onWatchReplay?: () => void }) {
  return (
    <div style={{ position: 'absolute', left: 16, bottom: 16, zIndex: 190, background: 'rgba(20,22,30,0.92)', border: '1px solid #333', borderRadius: 8, padding: 12, maxWidth: 540 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, color: '#e6e6e6' }}>Results · {results.type.toUpperCase()}</div>
        <button onClick={onClose} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #333', background: '#2f3240', color: '#e6e6e6' }}>Close</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {onSaveReplay && <button onClick={onSaveReplay} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #333', background: '#1d1f27', color: '#e6e6e6' }}>Save Replay</button>}
        {onWatchReplay && <button onClick={onWatchReplay} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #333', background: '#1d1f27', color: '#e6e6e6' }}>Watch Replay</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 8 }}>
        <ResultsLapChart results={results} />
        <ResultsSectorTimes results={results} />
        <ResultsPenaltiesSummary results={results} />
      </div>
    </div>
  );
}
