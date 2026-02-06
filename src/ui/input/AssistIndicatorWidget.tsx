import React from 'react';
import type { AssistState } from '../../game/assists/types';

interface Props {
  assistState: AssistState;
}

const AssistWidget: React.FC<{
  label: string;
  enabled: boolean;
  active: boolean;
  size?: number;
}> = ({ label, enabled, active, size = 24 }) => {
  const bgColor = enabled ? (active ? '#ff6600' : '#006600') : '#444';
  const textColor = enabled ? (active ? '#fff' : '#ccc') : '#666';
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size * 2.5,
      height: size,
      background: bgColor,
      border: `1px solid ${enabled ? (active ? '#ffaa33' : '#00aa00') : '#666'}`,
      borderRadius: 4,
      fontSize: size * 0.4,
      fontWeight: 'bold',
      color: textColor,
      fontFamily: 'monospace',
      boxShadow: active ? '0 0 8px rgba(255, 102, 0, 0.5)' : 'none',
      transition: 'all 0.1s ease'
    }}>
      {label}
    </div>
  );
};

export const AssistIndicatorWidget: React.FC<Props> = ({ assistState }) => {
  return (
    <div style={{
      position: 'absolute',
      bottom: 80,
      left: 20,
      display: 'flex',
      gap: 8,
      zIndex: 50
    }}>
      <AssistWidget
        label="ABS"
        enabled={assistState.abs.enabled}
        active={assistState.abs.active}
      />
      
      <AssistWidget
        label="TCS"
        enabled={assistState.tcs.enabled}
        active={assistState.tcs.active}
      />
      
      <AssistWidget
        label="ESP"
        enabled={assistState.stability.enabled}
        active={assistState.stability.active}
      />
    </div>
  );
};

export default AssistIndicatorWidget;
