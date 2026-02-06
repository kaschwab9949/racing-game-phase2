import React from 'react';
import type { PerfFrame } from './PerfMonitor';

export function PerfHud({ frame }: { frame: PerfFrame | null }) {
  if (!frame) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: 12,
      left: 12,
      background: 'rgba(0,0,0,0.7)',
      color: '#e9f1ff',
      padding: '10px 12px',
      borderRadius: 8,
      fontFamily: 'Menlo, monospace',
      fontSize: 12,
      minWidth: 200,
      zIndex: 130,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>FPS</span>
        <span>{frame.fps.toFixed(1)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Frame ms</span>
        <span>{frame.frameTimeMs.toFixed(2)}</span>
      </div>
      <div style={{ marginTop: 8, opacity: 0.8 }}>Cache</div>
      {renderCacheRow('Track', frame.layerStats.track)}
      {renderCacheRow('Env', frame.layerStats.environment)}
      {renderCacheRow('Cars', frame.layerStats.cars)}
      {renderCacheRow('FX', frame.layerStats.effects)}
    </div>
  );
}

function renderCacheRow(label: string, stats?: { hits?: number; misses?: number }) {
  if (!stats) return <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.5 }}><span>{label}</span><span>-</span></div>;
  const hits = stats.hits ?? 0;
  const misses = stats.misses ?? 0;
  const total = hits + misses;
  const rate = total === 0 ? 0 : (hits / total) * 100;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
      <span>{label}</span>
      <span>{rate.toFixed(0)}% hit</span>
    </div>
  );
}
