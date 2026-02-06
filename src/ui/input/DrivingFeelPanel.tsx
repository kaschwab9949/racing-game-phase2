import React from 'react';
import type { InputConfig } from '../../game/input/types';

interface Props {
  config: InputConfig;
  onConfigChange: (config: InputConfig) => void;
  onClose: () => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  description?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, description }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <label style={{ fontWeight: 'bold' }}>{label}</label>
      <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{
        width: '100%',
        height: 6,
        background: '#444',
        outline: 'none',
        borderRadius: 3
      }}
    />
    {description && (
      <div style={{ fontSize: 12, color: '#ccc', marginTop: 4 }}>{description}</div>
    )}
  </div>
);

export const DrivingFeelPanel: React.FC<Props> = ({ config, onConfigChange, onClose }) => {
  const updateCurve = (key: keyof InputConfig['curves'], value: number) => {
    const newConfig = {
      ...config,
      curves: {
        ...config.curves,
        [key]: value
      }
    };
    onConfigChange(newConfig);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '2px solid #333',
        borderRadius: 8,
        padding: 24,
        width: '90%',
        maxWidth: 600,
        maxHeight: '90%',
        overflow: 'auto',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Driving Feel Settings</h2>
          <button onClick={onClose} style={buttonStyle}>Close</button>
        </div>
        
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: '1px solid #444', paddingBottom: 8 }}>Steering</h3>
          
          <Slider
            label="Steering Curve"
            value={config.curves.steerCurve}
            min={0.5}
            max={2.0}
            step={0.1}
            onChange={value => updateCurve('steerCurve', value)}
            description="1.0 = Linear, <1.0 = More sensitive, >1.0 = Less sensitive"
          />
          
          <Slider
            label="Steering Smoothing"
            value={config.curves.steerSmoothing}
            min={0}
            max={1}
            step={0.05}
            onChange={value => updateCurve('steerSmoothing', value)}
            description="Reduces jerkiness but adds input lag"
          />
          
          <Slider
            label="Steering Deadzone"
            value={config.curves.steerDeadzone}
            min={0}
            max={0.3}
            step={0.01}
            onChange={value => updateCurve('steerDeadzone', value)}
            description="Eliminates controller drift"
          />
          
          <Slider
            label="Steering Saturation"
            value={config.curves.steerSaturation}
            min={0.5}
            max={1}
            step={0.05}
            onChange={value => updateCurve('steerSaturation', value)}
            description="Input level for full steering output"
          />
          
          <Slider
            label="Speed Sensitivity"
            value={config.curves.speedSensitivity}
            min={0}
            max={1}
            step={0.05}
            onChange={value => updateCurve('speedSensitivity', value)}
            description="Reduces steering authority at high speeds"
          />
        </div>
        
        <div>
          <h3 style={{ borderBottom: '1px solid #444', paddingBottom: 8 }}>Throttle & Brake</h3>
          
          <Slider
            label="Throttle Deadzone"
            value={config.curves.throttleDeadzone}
            min={0}
            max={0.2}
            step={0.01}
            onChange={value => updateCurve('throttleDeadzone', value)}
            description="Prevents accidental throttle input"
          />
          
          <Slider
            label="Brake Deadzone"
            value={config.curves.brakeDeadzone}
            min={0}
            max={0.2}
            step={0.01}
            onChange={value => updateCurve('brakeDeadzone', value)}
            description="Prevents accidental brake input"
          />
        </div>
        
        <div style={{
          marginTop: 24,
          padding: 16,
          background: '#2a2a2a',
          borderRadius: 6,
          fontSize: 12,
          color: '#ccc'
        }}>
          <strong>Tips:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Start with default settings and adjust gradually</li>
            <li>Higher steering curves feel more realistic but require more precise input</li>
            <li>Speed sensitivity helps with high-speed stability</li>
            <li>Use the Driving Feel overlay to visualize your changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DrivingFeelPanel;

const buttonStyle: React.CSSProperties = {
  background: '#0066cc',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14
};
