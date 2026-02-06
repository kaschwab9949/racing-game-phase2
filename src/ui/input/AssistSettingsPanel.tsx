import React from 'react';
import type { AssistConfig } from '../../game/assists/types';

interface Props {
  config: AssistConfig;
  onConfigChange: (config: AssistConfig) => void;
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
  enabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, description, enabled = true }) => (
  <div style={{ marginBottom: 16, opacity: enabled ? 1 : 0.5 }}>
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
      disabled={!enabled}
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

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      style={{ marginRight: 8 }}
    />
    <label style={{ fontWeight: 'bold' }}>{label}</label>
  </div>
);

export const AssistSettingsPanel: React.FC<Props> = ({ config, onConfigChange, onClose }) => {
  const updateABSConfig = (key: keyof AssistConfig['abs'], value: number | boolean) => {
    onConfigChange({
      ...config,
      abs: { ...config.abs, [key]: value }
    });
  };
  
  const updateTCSConfig = (key: keyof AssistConfig['tcs'], value: number | boolean) => {
    onConfigChange({
      ...config,
      tcs: { ...config.tcs, [key]: value }
    });
  };
  
  const updateStabilityConfig = (key: keyof AssistConfig['stability'], value: number | boolean) => {
    onConfigChange({
      ...config,
      stability: { ...config.stability, [key]: value }
    });
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
        maxWidth: 700,
        maxHeight: '90%',
        overflow: 'auto',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Assist Settings</h2>
          <button onClick={onClose} style={buttonStyle}>Close</button>
        </div>
        
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: '1px solid #444', paddingBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 16 }}>ABS (Anti-lock Braking System)</span>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: config.abs.enabled ? '#0f0' : '#f00'
            }} />
          </h3>
          
          <Checkbox
            label="Enable ABS"
            checked={config.abs.enabled}
            onChange={checked => updateABSConfig('enabled', checked)}
          />
          
          <Slider
            label="ABS Sensitivity"
            value={config.abs.sensitivity}
            min={0.1}
            max={1}
            step={0.1}
            onChange={value => updateABSConfig('sensitivity', value)}
            description="How quickly ABS activates when wheels lock"
            enabled={config.abs.enabled}
          />
          
          <Slider
            label="Pulse Rate (Hz)"
            value={config.abs.pulseRate}
            min={5}
            max={15}
            step={1}
            onChange={value => updateABSConfig('pulseRate', value)}
            description="ABS pulsing frequency"
            enabled={config.abs.enabled}
          />
          
          <Slider
            label="Lock Threshold"
            value={config.abs.threshold}
            min={0.05}
            max={0.3}
            step={0.05}
            onChange={value => updateABSConfig('threshold', value)}
            description="Wheel speed difference to trigger ABS"
            enabled={config.abs.enabled}
          />
        </div>
        
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ borderBottom: '1px solid #444', paddingBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 16 }}>TCS (Traction Control System)</span>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: config.tcs.enabled ? '#0f0' : '#f00'
            }} />
          </h3>
          
          <Checkbox
            label="Enable TCS"
            checked={config.tcs.enabled}
            onChange={checked => updateTCSConfig('enabled', checked)}
          />
          
          <Slider
            label="TCS Sensitivity"
            value={config.tcs.sensitivity}
            min={0.1}
            max={1}
            step={0.1}
            onChange={value => updateTCSConfig('sensitivity', value)}
            description="How sensitive to wheel spin detection"
            enabled={config.tcs.enabled}
          />
          
          <Slider
            label="Power Intervention"
            value={config.tcs.intervention}
            min={0.3}
            max={1}
            step={0.1}
            onChange={value => updateTCSConfig('intervention', value)}
            description="How aggressively to cut throttle"
            enabled={config.tcs.enabled}
          />
          
          <Slider
            label="Wheel Spin Threshold"
            value={config.tcs.wheelSpinThreshold}
            min={20}
            max={100}
            step={10}
            onChange={value => updateTCSConfig('wheelSpinThreshold', value)}
            description="Wheel spin level to trigger TCS"
            enabled={config.tcs.enabled}
          />
        </div>
        
        <div>
          <h3 style={{ borderBottom: '1px solid #444', paddingBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: 16 }}>ESP (Electronic Stability Program)</span>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: config.stability.enabled ? '#0f0' : '#f00'
            }} />
          </h3>
          
          <Checkbox
            label="Enable Stability Control"
            checked={config.stability.enabled}
            onChange={checked => updateStabilityConfig('enabled', checked)}
          />
          
          <Slider
            label="Understeer Sensitivity"
            value={config.stability.understeerSensitivity}
            min={0.1}
            max={1}
            step={0.1}
            onChange={value => updateStabilityConfig('understeerSensitivity', value)}
            description="How quickly to detect understeer"
            enabled={config.stability.enabled}
          />
          
          <Slider
            label="Oversteer Sensitivity"
            value={config.stability.oversteerSensitivity}
            min={0.1}
            max={1}
            step={0.1}
            onChange={value => updateStabilityConfig('oversteerSensitivity', value)}
            description="How quickly to detect oversteer"
            enabled={config.stability.enabled}
          />
          
          <Slider
            label="Yaw Damping"
            value={config.stability.yawDamping}
            min={0.1}
            max={1}
            step={0.1}
            onChange={value => updateStabilityConfig('yawDamping', value)}
            description="Counter-steering assistance strength"
            enabled={config.stability.enabled}
          />
          
          <Slider
            label="Intervention Strength"
            value={config.stability.interventionStrength}
            min={0.3}
            max={1}
            step={0.1}
            onChange={value => updateStabilityConfig('interventionStrength', value)}
            description="Overall ESP intervention level"
            enabled={config.stability.enabled}
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
          <strong>Note:</strong> These settings affect the default behavior. You can still toggle assists on/off during gameplay using the assigned keys.
        </div>
      </div>
    </div>
  );
};

export default AssistSettingsPanel;

const buttonStyle: React.CSSProperties = {
  background: '#0066cc',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14
};
