import React, { useState, useEffect } from 'react';
import type { InputConfig, InputBinding, GamepadInfo } from '../../game/input/types';
import { GamepadManager } from '../../game/input/GamepadManager';
import { InputConfigManager } from '../../game/input/InputConfigManager';

interface Props {
  config: InputConfig;
  onConfigChange: (config: InputConfig) => void;
  onClose: () => void;
}

const BINDING_LABELS = {
  'steer.left': 'Steer Left',
  'steer.right': 'Steer Right',
  'steer.axis': 'Steer Axis',
  'throttle': 'Throttle',
  'brake': 'Brake',
  'handbrake': 'Handbrake',
  'shiftUp': 'Shift Up',
  'shiftDown': 'Shift Down',
  'abs': 'Toggle ABS',
  'tcs': 'Toggle TCS',
  'stability': 'Toggle Stability'
};

const GAMEPAD_BUTTON_NAMES = [
  'A', 'B', 'X', 'Y',
  'Left Bump', 'Right Bump', 'Left Trigger', 'Right Trigger',
  'Back', 'Start', 'Left Stick', 'Right Stick',
  'D-Up', 'D-Down', 'D-Left', 'D-Right'
];

const GAMEPAD_AXIS_NAMES = [
  'Left Stick X', 'Left Stick Y', 'Right Stick X', 'Right Stick Y',
  'Left Trigger', 'Right Trigger'
];

export const InputRemappingPanel: React.FC<Props> = ({ config, onConfigChange, onClose }) => {
  const [editingBinding, setEditingBinding] = useState<string | null>(null);
  const [gamepads, setGamepads] = useState<GamepadInfo[]>([]);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<InputConfig>(config);
  
  useEffect(() => {
    const gamepadManager = GamepadManager.getInstance();
    const updateGamepads = (gpInfo: GamepadInfo[]) => setGamepads(gpInfo);
    
    gamepadManager.addListener(updateGamepads);
    setGamepads(gamepadManager.getGamepadInfo());
    
    return () => gamepadManager.removeListener(updateGamepads);
  }, []);
  
  const formatBinding = (binding: InputBinding): string => {
    if (binding.type === 'keyboard' && binding.key) {
      return binding.key.replace('Key', '').replace('Arrow', '');
    }
    if (binding.type === 'keyboard' && binding.keys && binding.keys.length) {
      return binding.keys.map((key) => key.replace('Key', '').replace('Arrow', '')).join(' / ');
    }
    
    if (binding.type === 'gamepad') {
      if (binding.gamepadButton !== undefined) {
        return `GP: ${GAMEPAD_BUTTON_NAMES[binding.gamepadButton] || `Button ${binding.gamepadButton}`}`;
      }
      if (binding.gamepadAxis !== undefined) {
        const axisName = GAMEPAD_AXIS_NAMES[binding.gamepadAxis] || `Axis ${binding.gamepadAxis}`;
        const dir = binding.gamepadAxisDirection === -1 ? ' (-)' : ' (+)';
        return `GP: ${axisName}${dir}`;
      }
    }
    
    return 'None';
  };
  
  const startBindingCapture = (bindingPath: string) => {
    setEditingBinding(bindingPath);
    setAwaitingInput(true);
    
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      
      if (event.code === 'Escape') {
        setAwaitingInput(false);
        setEditingBinding(null);
        return;
      }
      
      const newBinding: InputBinding = {
        type: 'keyboard',
        key: event.code
      };
      
      updateBinding(bindingPath, newBinding);
      setAwaitingInput(false);
      setEditingBinding(null);
    };
    
    const handleGamepadInput = () => {
      const gamepad = GamepadManager.getInstance().getPrimaryGamepad();
      if (!gamepad) return;
      
      // Check buttons
      gamepad.buttons.forEach((button, index) => {
        if (button.pressed) {
          const newBinding: InputBinding = {
            type: 'gamepad',
            gamepadButton: index
          };
          
          updateBinding(bindingPath, newBinding);
          setAwaitingInput(false);
          setEditingBinding(null);
        }
      });
      
      // Check axes
      gamepad.axes.forEach((axis, index) => {
        if (Math.abs(axis) > 0.5) {
          const newBinding: InputBinding = {
            type: 'gamepad',
            gamepadAxis: index,
            gamepadAxisDirection: axis > 0 ? 1 : -1
          };
          
          updateBinding(bindingPath, newBinding);
          setAwaitingInput(false);
          setEditingBinding(null);
        }
      });
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    const gamepadInterval = setInterval(handleGamepadInput, 50);
    
    setTimeout(() => {
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(gamepadInterval);
      if (awaitingInput) {
        setAwaitingInput(false);
        setEditingBinding(null);
      }
    }, 10000); // 10 second timeout
  };
  
  const updateBinding = (path: string, binding: InputBinding) => {
    const newConfig = JSON.parse(JSON.stringify(currentConfig));
    const pathParts = path.split('.');
    
    if (pathParts[0] === 'steer') {
      if (pathParts[1] === 'left') newConfig.bindings.steer.left = binding;
      else if (pathParts[1] === 'right') newConfig.bindings.steer.right = binding;
      else if (pathParts[1] === 'axis') newConfig.bindings.steer.axis = binding;
    } else {
      (newConfig.bindings as any)[pathParts[0]] = binding;
    }
    
    setCurrentConfig(newConfig);
  };
  
  const handleSave = () => {
    onConfigChange(currentConfig);
    InputConfigManager.saveConfig(currentConfig);
    onClose();
  };
  
  const handleReset = () => {
    const defaultConfig = InputConfigManager.getDefaultConfig();
    setCurrentConfig(defaultConfig);
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
        maxWidth: 800,
        maxHeight: '90%',
        overflow: 'auto',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>Input Remapping</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleReset} style={buttonStyle}>Reset to Default</button>
            <button onClick={handleSave} style={buttonStyle}>Save</button>
            <button onClick={onClose} style={buttonStyle}>Cancel</button>
          </div>
        </div>
        
        {gamepads.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, background: '#2a2a2a', borderRadius: 6 }}>
            <h3 style={{ margin: '0 0 12px 0' }}>Connected Gamepads:</h3>
            {gamepads.map(gamepad => (
              <div key={gamepad.index} style={{ fontSize: 14, color: '#ccc' }}>
                {gamepad.id} ({gamepad.buttons} buttons, {gamepad.axes} axes)
              </div>
            ))}
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 100px', gap: 16, alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>Action</div>
          <div style={{ fontWeight: 'bold' }}>Current Binding</div>
          <div style={{ fontWeight: 'bold' }}>Change</div>
          
          {Object.entries(BINDING_LABELS).map(([bindingPath, label]) => {
            let currentBinding: InputBinding;
            
            if (bindingPath.startsWith('steer.')) {
              const steerType = bindingPath.split('.')[1];
              if (steerType === 'left') currentBinding = currentConfig.bindings.steer.left;
              else if (steerType === 'right') currentBinding = currentConfig.bindings.steer.right;
              else currentBinding = currentConfig.bindings.steer.axis!;
            } else {
              currentBinding = (currentConfig.bindings as any)[bindingPath];
            }
            
            const isEditing = editingBinding === bindingPath;
            
            return (
              <React.Fragment key={bindingPath}>
                <div>{label}</div>
                <div style={{
                  padding: 8,
                  background: '#333',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  color: isEditing ? '#ff0' : '#fff'
                }}>
                  {isEditing ? (awaitingInput ? 'Press key or button...' : 'Timeout') : formatBinding(currentBinding)}
                </div>
                <button
                  onClick={() => startBindingCapture(bindingPath)}
                  disabled={isEditing}
                  style={{
                    ...buttonStyle,
                    fontSize: 12,
                    padding: '4px 8px',
                    opacity: isEditing ? 0.5 : 1
                  }}
                >
                  {isEditing ? 'Wait...' : 'Change'}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        
        {awaitingInput && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ff6600',
            color: '#000',
            padding: 16,
            borderRadius: 8,
            fontWeight: 'bold',
            zIndex: 1001
          }}>
            Press any key or gamepad button/axis...<br/>
            <small>ESC to cancel</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputRemappingPanel;

const buttonStyle: React.CSSProperties = {
  background: '#0066cc',
  color: '#fff',
  border: 'none',
  padding: '8px 16px',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 14
};
