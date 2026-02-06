import React from 'react';
import type { ProcessedInput } from '../../game/input/types';
import type { AssistState } from '../../game/assists/types';

interface Props {
  rawInput: ProcessedInput;
  assistState: AssistState;
  visible: boolean;
}

const BarGraph: React.FC<{
  label: string;
  value: number;
  rawValue?: number;
  color: string;
  width?: number;
}> = ({ label, value, rawValue, color, width = 200 }) => {
  const barHeight = 20;
  const hasRaw = rawValue !== undefined;
  
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        marginBottom: 2
      }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'monospace' }}>
          {hasRaw && <span style={{ color: '#888' }}>Raw: {rawValue!.toFixed(2)} | </span>}
          Proc: {value.toFixed(2)}
        </span>
      </div>
      
      <div style={{
        width,
        height: barHeight,
        background: '#333',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Raw value bar (background) */}
        {hasRaw && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${Math.abs(rawValue!) * 100}%`,
            height: '100%',
            background: '#666',
            opacity: 0.5
          }} />
        )}
        
        {/* Processed value bar */}
        <div style={{
          position: 'absolute',
          left: value < 0 ? `${50 + value * 50}%` : '50%',
          top: 0,
          width: `${Math.abs(value) * 50}%`,
          height: '100%',
          background: color,
          transition: 'width 0.1s ease'
        }} />
        
        {/* Center line for bipolar inputs */}
        {(label.includes('Steer') || hasRaw) && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 1,
            height: '100%',
            background: '#fff',
            opacity: 0.3
          }} />
        )}
      </div>
    </div>
  );
};

const AssistIndicator: React.FC<{
  label: string;
  enabled: boolean;
  active: boolean;
  value?: number;
  unit?: string;
}> = ({ label, enabled, active, value, unit = '' }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 8px',
    background: enabled ? (active ? '#330' : '#003') : '#222',
    border: `1px solid ${enabled ? (active ? '#aa0' : '#006') : '#444'}`,
    borderRadius: 4,
    fontSize: 11,
    marginBottom: 4
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: enabled ? (active ? '#ff0' : '#0a0') : '#666',
        marginRight: 6
      }} />
      <span>{label}</span>
    </div>
    
    {value !== undefined && (
      <span style={{ fontFamily: 'monospace', color: active ? '#ff0' : '#ccc' }}>
        {value.toFixed(1)}{unit}
      </span>
    )}
  </div>
);

export const DrivingFeelOverlay: React.FC<Props> = ({ rawInput, assistState, visible }) => {
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 20,
      right: 20,
      background: 'rgba(0, 0, 0, 0.85)',
      border: '1px solid #444',
      borderRadius: 8,
      padding: 16,
      color: '#fff',
      fontSize: 13,
      fontFamily: 'monospace',
      minWidth: 280,
      zIndex: 100
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: 14,
        borderBottom: '1px solid #444',
        paddingBottom: 8
      }}>
        Driving Feel Debug
      </h3>
      
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#ccc' }}>Input Processing</h4>
        
        <BarGraph
          label="Steering"
          value={rawInput.steer}
          rawValue={rawInput.raw.steer}
          color="#4CAF50"
        />
        
        <BarGraph
          label="Throttle"
          value={rawInput.throttle}
          rawValue={rawInput.raw.throttle}
          color="#2196F3"
        />
        
        <BarGraph
          label="Brake"
          value={rawInput.brake}
          rawValue={rawInput.raw.brake}
          color="#F44336"
        />
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#ccc' }}>Driving Assists</h4>
        
        <AssistIndicator
          label="ABS"
          enabled={assistState.abs.enabled}
          active={assistState.abs.active}
          value={assistState.abs.active ? assistState.abs.pressure * 100 : undefined}
          unit="%"
        />
        
        <AssistIndicator
          label="TCS"
          enabled={assistState.tcs.enabled}
          active={assistState.tcs.active}
          value={assistState.tcs.active ? assistState.tcs.reduction * 100 : undefined}
          unit="%"
        />
        
        <AssistIndicator
          label="ESP"
          enabled={assistState.stability.enabled}
          active={assistState.stability.active}
          value={assistState.stability.active ? Math.abs(assistState.stability.yawCorrection) * 100 : undefined}
          unit="%"
        />
      </div>
      
      <div style={{
        marginTop: 16,
        padding: 8,
        background: '#1a1a1a',
        borderRadius: 4,
        fontSize: 10
      }}>
        <div style={{ color: '#888' }}>Legend:</div>
        <div>• <span style={{ color: '#666' }}>Gray bars</span> = Raw input</div>
        <div>• <span style={{ color: '#4CAF50' }}>Colored bars</span> = Processed input</div>
        <div>• <span style={{ color: '#ff0' }}>Yellow</span> = Active assist intervention</div>
      </div>
    </div>
  );
};

export default DrivingFeelOverlay;
