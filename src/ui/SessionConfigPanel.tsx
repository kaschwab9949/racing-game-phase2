import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { SessionConfig, Difficulty } from '../game/modes/types';
import { carDatabase } from '../game/cars/specs';
import type { CarId } from '../game/cars/specs/types';

export function SessionConfigPanel({
  value,
  onChange,
  className,
  style,
}: {
  value: SessionConfig;
  onChange: (next: SessionConfig) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const carIds = useMemo(() => Object.keys(carDatabase) as CarId[], []);

  function patch(p: Partial<SessionConfig>) { onChange({ ...value, ...p }); }

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        background: 'rgba(20,22,30,0.85)',
        padding: 10,
        borderRadius: 8,
        border: '1px solid #333',
        ...style,
      }}
    >
      <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#e6e6e6' }}>Session Config</div>
      <label style={{ color: '#cfcfcf' }}>Laps
        <input type="number" min={1} max={99} value={value.laps ?? 5} onChange={(e) => patch({ laps: Number(e.target.value) })} style={{ width: '100%', marginTop: 4 }} />
      </label>
      <label style={{ color: '#cfcfcf' }}>AI Count
        <input type="number" min={0} max={24} value={value.aiCount ?? 8} onChange={(e) => patch({ aiCount: Number(e.target.value) })} style={{ width: '100%', marginTop: 4 }} />
      </label>
      <label style={{ color: '#cfcfcf' }}>Difficulty
        <select value={value.difficulty ?? 'medium'} onChange={(e) => patch({ difficulty: e.target.value as Difficulty })} style={{ width: '100%', marginTop: 4 }}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
      <label style={{ color: '#cfcfcf' }}>Car Selection
        <select value={value.carId ?? carIds[0]} onChange={(e) => patch({ carId: e.target.value as CarId })} style={{ width: '100%', marginTop: 4 }}>
          {carIds.map(id => <option key={id} value={id}>{carDatabase[id].spec.displayName}</option>)}
        </select>
      </label>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 8 }}>
        <button style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #333', background: '#2f3240', color: '#e6e6e6' }} onClick={() => patch({})}>Apply</button>
      </div>
    </div>
  );
}
