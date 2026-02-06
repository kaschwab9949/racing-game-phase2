export interface RawInput {
  // Keyboard state
  keys: Set<string>;
  
  // Gamepad state
  gamepad: {
    connected: boolean;
    leftStick: { x: number; y: number };
    rightStick: { x: number; y: number };
    leftTrigger: number;
    rightTrigger: number;
    buttons: boolean[];
  };
}

export interface ProcessedInput {
  // Normalized controls (-1 to 1)
  steer: number;
  throttle: number;
  brake: number;
  
  // Binary inputs
  handbrake: boolean;
  shiftUp: boolean;
  shiftDown: boolean;
  abs: boolean;
  tcs: boolean;
  stability: boolean;
  
  // Raw values for debug
  raw: {
    steer: number;
    throttle: number;
    brake: number;
  };
}

export interface InputBinding {
  type: 'keyboard' | 'gamepad';
  key?: string;
  keys?: string[];
  gamepadButton?: number;
  gamepadAxis?: number;
  gamepadAxisDirection?: 1 | -1;
}

export interface InputConfig {
  bindings: {
    steer: {
      left: InputBinding;
      right: InputBinding;
      axis?: InputBinding;
    };
    throttle: InputBinding;
    brake: InputBinding;
    handbrake: InputBinding;
    shiftUp: InputBinding;
    shiftDown: InputBinding;
    abs: InputBinding;
    tcs: InputBinding;
    stability: InputBinding;
  };
  
  curves: {
    steerCurve: number; // 0-2, 1 = linear
    steerSmoothing: number; // 0-1
    steerDeadzone: number; // 0-1
    steerSaturation: number; // 0-1
    speedSensitivity: number; // 0-1
    throttleDeadzone: number;
    brakeDeadzone: number;
  };
}

export interface GamepadInfo {
  index: number;
  id: string;
  connected: boolean;
  buttons: number;
  axes: number;
}
