import React from 'react';
import type { GripResult } from '../types';

interface Props {
  grip: GripResult;
  surfaceTemp: number;
}

/**
 * HUD component showing the active grip breakdown for the current car position.
 */
export const GripComponentsDisplay: React.FC<Props> = ({ grip, surfaceTemp }) => {
  const { components, multiplier } = grip;

  const barStyle = (val: number, color: string) => ({
    width: `${Math.abs(val) * 500}%`,
    height: '4px',
    background: color,
    transition: 'width 0.1s ease-out',
    marginRight: val < 0 ? 'auto' : '0',
    marginLeft: val > 0 ? 'auto' : '0'
  });

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '12px',
      borderRadius: '4px',
      width: '180px',
      fontFamily: 'monospace',
      fontSize: '11px',
      pointerEvents: 'none'
    }}>
      <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'center' }}>
        GRIP: {(multiplier * 100).toFixed(1)}%
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        <span>Rubber</span>
        <div style={barStyle(components.rubber, '#00ff00')} />
      </div>

      <div style={{ marginBottom: '4px' }}>
        <span>Marbles</span>
        <div style={barStyle(components.marbles, '#ff9900')} />
      </div>

      <div style={{ marginBottom: '4px' }}>
        <span>Dust</span>
        <div style={barStyle(components.dust, '#ffff00')} />
      </div>

      <div style={{ marginBottom: '4px' }}>
        <span>Heat</span>
        <div style={barStyle(components.thermal, '#ff3300')} />
      </div>

      <div style={{ marginTop: '8px', textAlign: 'right', borderTop: '1px solid #444', paddingTop: '4px' }}>
        Track: {surfaceTemp.toFixed(1)}°C
      </div>
    </div>
  );
};
