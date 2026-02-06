import type { InputConfig, InputBinding, RawInput, ProcessedInput } from './types';
import { GamepadManager } from './GamepadManager';
import { InputCurves } from './InputCurves';

export class InputMapper {
  private gamepadManager: GamepadManager;
  private keyState: Set<string> = new Set();
  private lastProcessed: ProcessedInput;
  private smoothedValues = {
    steer: 0,
    throttle: 0,
    brake: 0
  };
  private toggleStates = {
    abs: true,
    tcs: true,
    stability: false,
  };
  private prevToggleKeys = {
    abs: false,
    tcs: false,
    stability: false,
  };
  
  private handleKeyDown = (event: KeyboardEvent) => {
    if (this.isEditableTarget(event.target) && !this.isMovementKey(event)) return;
    if (this.shouldPreventDefault(event)) event.preventDefault();
    for (const token of this.getKeyTokens(event)) {
      this.keyState.add(token);
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    if (this.isEditableTarget(event.target) && !this.isMovementKey(event)) return;
    for (const token of this.getKeyTokens(event)) {
      this.keyState.delete(token);
    }
  };

  constructor(private config: InputConfig) {
    this.gamepadManager = GamepadManager.getInstance();
    this.setupKeyboardListeners();
    
    this.lastProcessed = {
      steer: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
      shiftUp: false,
      shiftDown: false,
      abs: false,
      tcs: false,
      stability: false,
      raw: { steer: 0, throttle: 0, brake: 0 }
    };
  }
  
  private isEditableTarget(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return target.isContentEditable;
  }

  private normalizeKey(key: string): string | null {
    if (!key) return null;
    if (key === ' ') return 'Space';
    if (key.startsWith('Arrow')) return key;
    if (key.length === 1) {
      if (/[a-zA-Z]/.test(key)) return `Key${key.toUpperCase()}`;
      if (/[0-9]/.test(key)) return `Digit${key}`;
    }
    return null;
  }

  private getKeyTokens(event: KeyboardEvent): string[] {
    const tokens: string[] = [];
    if (event.code) tokens.push(event.code);
    const normalized = this.normalizeKey(event.key);
    if (normalized && !tokens.includes(normalized)) tokens.push(normalized);
    return tokens;
  }

  private shouldPreventDefault(event: KeyboardEvent): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code);
  }

  private isMovementKey(event: KeyboardEvent): boolean {
    return [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
    ].includes(event.code);
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown, { capture: true });
    window.addEventListener('keyup', this.handleKeyUp, { capture: true });
  }

  private getKeyboardFallback(raw: RawInput): { steer: number; throttle: number; brake: number } {
    const left = raw.keys.has('KeyA') || raw.keys.has('ArrowLeft') ? 1 : 0;
    const right = raw.keys.has('KeyD') || raw.keys.has('ArrowRight') ? 1 : 0;
    const throttle = raw.keys.has('KeyW') || raw.keys.has('ArrowUp') ? 1 : 0;
    const brake = raw.keys.has('KeyS') || raw.keys.has('ArrowDown') ? 1 : 0;
    return {
      steer: right - left,
      throttle,
      brake,
    };
  }
  
  private getRawInput(): RawInput {
    const gamepadState = this.gamepadManager.getGamepadState();
    
    return {
      keys: new Set(this.keyState),
      gamepad: {
        connected: gamepadState.buttons.length > 0,
        leftStick: gamepadState.leftStick,
        rightStick: gamepadState.rightStick,
        leftTrigger: gamepadState.leftTrigger,
        rightTrigger: gamepadState.rightTrigger,
        buttons: gamepadState.buttons
      }
    };
  }
  
  private evaluateBinding(binding: InputBinding, raw: RawInput): number {
    if (binding.type === 'keyboard' && binding.key) {
      return raw.keys.has(binding.key) ? 1 : 0;
    }
    if (binding.type === 'keyboard' && binding.keys && binding.keys.length > 0) {
      for (const key of binding.keys) {
        if (raw.keys.has(key)) return 1;
      }
      return 0;
    }
    
    if (binding.type === 'gamepad') {
      if (binding.gamepadButton !== undefined) {
        return raw.gamepad.buttons[binding.gamepadButton] ? 1 : 0;
      }
      
      if (binding.gamepadAxis !== undefined) {
        let value = 0;
        
        switch (binding.gamepadAxis) {
          case 0: // Left stick X
            value = raw.gamepad.leftStick.x;
            break;
          case 1: // Left stick Y
            value = raw.gamepad.leftStick.y;
            break;
          case 2: // Right stick X
            value = raw.gamepad.rightStick.x;
            break;
          case 3: // Right stick Y
            value = raw.gamepad.rightStick.y;
            break;
          case 4: // Left trigger
            value = raw.gamepad.leftTrigger;
            break;
          case 5: // Right trigger
            value = raw.gamepad.rightTrigger;
            break;
        }
        
        return value * (binding.gamepadAxisDirection || 1);
      }
    }
    
    return 0;
  }
  
  public processInput(dt: number, currentSpeed: number): ProcessedInput {
    const raw = this.getRawInput();
    
    // Calculate raw steering
    const keyboardFallback = this.getKeyboardFallback(raw);
    let rawSteer = 0;
    const left = this.evaluateBinding(this.config.bindings.steer.left, raw);
    const right = this.evaluateBinding(this.config.bindings.steer.right, raw);
    if (this.config.bindings.steer.axis && raw.gamepad.connected) {
      rawSteer = this.evaluateBinding(this.config.bindings.steer.axis, raw);
      if (left !== 0 || right !== 0) {
        rawSteer = right - left;
      }
    } else {
      rawSteer = right - left;
    }
    if (keyboardFallback.steer !== 0) {
      rawSteer = keyboardFallback.steer;
    }
    
    // Calculate raw throttle and brake
    let rawThrottle = this.evaluateBinding(this.config.bindings.throttle, raw);
    let rawBrake = this.evaluateBinding(this.config.bindings.brake, raw);
    if (keyboardFallback.throttle > 0) rawThrottle = keyboardFallback.throttle;
    if (keyboardFallback.brake > 0) rawBrake = keyboardFallback.brake;
    
    // Process steering through curves
    let processedSteer = InputCurves.processInput(rawSteer, {
      curve: this.config.curves.steerCurve,
      deadzone: this.config.curves.steerDeadzone,
      saturation: this.config.curves.steerSaturation
    });
    
    // Apply speed sensitivity
    processedSteer = InputCurves.applySpeedSensitivity(
      processedSteer,
      currentSpeed,
      this.config.curves.speedSensitivity
    );
    
    // Process throttle and brake
    const processedThrottle = InputCurves.processInput(rawThrottle, {
      curve: 1,
      deadzone: this.config.curves.throttleDeadzone,
      saturation: 1
    });
    
    const processedBrake = InputCurves.processInput(rawBrake, {
      curve: 1,
      deadzone: this.config.curves.brakeDeadzone,
      saturation: 1
    });
    
    // Apply smoothing
    this.smoothedValues.steer = InputCurves.smoothInput(
      this.smoothedValues.steer,
      processedSteer,
      this.config.curves.steerSmoothing,
      dt
    );
    
    this.smoothedValues.throttle = InputCurves.smoothInput(
      this.smoothedValues.throttle,
      processedThrottle,
      0.1, // Light smoothing for throttle
      dt
    );
    
    this.smoothedValues.brake = InputCurves.smoothInput(
      this.smoothedValues.brake,
      processedBrake,
      0.1, // Light smoothing for brake
      dt
    );
    
    // Binary inputs
    const handbrake = this.evaluateBinding(this.config.bindings.handbrake, raw) > 0.5;
    const shiftUp = this.evaluateBinding(this.config.bindings.shiftUp, raw) > 0.5;
    const shiftDown = this.evaluateBinding(this.config.bindings.shiftDown, raw) > 0.5;

    // Toggle inputs for assists (press to toggle on/off)
    const absRaw = this.evaluateBinding(this.config.bindings.abs, raw) > 0.5;
    const tcsRaw = this.evaluateBinding(this.config.bindings.tcs, raw) > 0.5;
    const stabilityRaw = this.evaluateBinding(this.config.bindings.stability, raw) > 0.5;
    if (absRaw && !this.prevToggleKeys.abs) this.toggleStates.abs = !this.toggleStates.abs;
    if (tcsRaw && !this.prevToggleKeys.tcs) this.toggleStates.tcs = !this.toggleStates.tcs;
    if (stabilityRaw && !this.prevToggleKeys.stability) this.toggleStates.stability = !this.toggleStates.stability;
    this.prevToggleKeys.abs = absRaw;
    this.prevToggleKeys.tcs = tcsRaw;
    this.prevToggleKeys.stability = stabilityRaw;
    const abs = this.toggleStates.abs;
    const tcs = this.toggleStates.tcs;
    const stability = this.toggleStates.stability;
    
    this.lastProcessed = {
      steer: this.smoothedValues.steer,
      throttle: this.smoothedValues.throttle,
      brake: this.smoothedValues.brake,
      handbrake,
      shiftUp,
      shiftDown,
      abs,
      tcs,
      stability,
      raw: {
        steer: rawSteer,
        throttle: rawThrottle,
        brake: rawBrake
      }
    };
    
    return this.lastProcessed;
  }
  
  public getLastProcessed(): ProcessedInput {
    return this.lastProcessed;
  }
  
  public updateConfig(config: InputConfig): void {
    this.config = config;
  }
  
  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown, { capture: true });
    window.removeEventListener('keyup', this.handleKeyUp, { capture: true });
    this.gamepadManager.destroy();
  }
}
