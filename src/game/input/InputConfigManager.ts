import type { InputConfig } from './types';

const DEFAULT_INPUT_CONFIG: InputConfig = {
  bindings: {
    steer: {
      left: { type: 'keyboard', keys: ['KeyA', 'ArrowLeft'] },
      right: { type: 'keyboard', keys: ['KeyD', 'ArrowRight'] },
      axis: { type: 'gamepad', gamepadAxis: 0 }
    },
    throttle: { type: 'keyboard', keys: ['KeyW', 'ArrowUp'] },
    brake: { type: 'keyboard', keys: ['KeyS', 'ArrowDown'] },
    handbrake: { type: 'keyboard', key: 'Space' },
    shiftUp: { type: 'keyboard', key: 'KeyQ' },
    shiftDown: { type: 'keyboard', key: 'KeyE' },
    abs: { type: 'keyboard', key: 'KeyZ' },
    tcs: { type: 'keyboard', key: 'KeyX' },
    stability: { type: 'keyboard', key: 'KeyC' }
  },
  curves: {
    steerCurve: 1.2,
    steerSmoothing: 0.1,
    steerDeadzone: 0.05,
    steerSaturation: 0.95,
    speedSensitivity: 0.7,
    throttleDeadzone: 0.02,
    brakeDeadzone: 0.02
  }
};

export class InputConfigManager {
  private static readonly STORAGE_KEY = 'racing_input_config';
  
  static getDefaultConfig(): InputConfig {
    return JSON.parse(JSON.stringify(DEFAULT_INPUT_CONFIG));
  }
  
  static loadConfig(): InputConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return this.mergeConfigs(DEFAULT_INPUT_CONFIG, config);
      }
    } catch (error) {
      console.warn('Failed to load input config:', error);
    }
    
    return this.getDefaultConfig();
  }
  
  static saveConfig(config: InputConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save input config:', error);
    }
  }
  
  private static mergeConfigs(defaultConfig: InputConfig, userConfig: any): InputConfig {
    const mergeBinding = (def: InputConfig['bindings'][keyof InputConfig['bindings']], user: any) => {
      if (!user || typeof user !== 'object') return def as any;
      if (user.type !== 'keyboard' && user.type !== 'gamepad') return def as any;

      if (user.type === 'keyboard') {
        const keys = Array.isArray(user.keys) ? user.keys.filter((k: any) => typeof k === 'string' && k.length > 0) : undefined;
        const key = typeof user.key === 'string' ? user.key : undefined;
        if (!key && (!keys || keys.length === 0)) return def as any;
        return { type: 'keyboard', key, keys } as any;
      }

      if (user.type === 'gamepad') {
        const hasButton = typeof user.gamepadButton === 'number';
        const hasAxis = typeof user.gamepadAxis === 'number';
        if (!hasButton && !hasAxis) return def as any;
        return {
          type: 'gamepad',
          gamepadButton: hasButton ? user.gamepadButton : undefined,
          gamepadAxis: hasAxis ? user.gamepadAxis : undefined,
          gamepadAxisDirection: user.gamepadAxisDirection === -1 ? -1 : 1,
        } as any;
      }

      return def as any;
    };

    return {
      bindings: {
        steer: {
          left: mergeBinding(defaultConfig.bindings.steer.left, userConfig.bindings?.steer?.left),
          right: mergeBinding(defaultConfig.bindings.steer.right, userConfig.bindings?.steer?.right),
          axis: defaultConfig.bindings.steer.axis ? mergeBinding(defaultConfig.bindings.steer.axis, userConfig.bindings?.steer?.axis) : userConfig.bindings?.steer?.axis,
        },
        throttle: mergeBinding(defaultConfig.bindings.throttle, userConfig.bindings?.throttle),
        brake: mergeBinding(defaultConfig.bindings.brake, userConfig.bindings?.brake),
        handbrake: mergeBinding(defaultConfig.bindings.handbrake, userConfig.bindings?.handbrake),
        shiftUp: mergeBinding(defaultConfig.bindings.shiftUp, userConfig.bindings?.shiftUp),
        shiftDown: mergeBinding(defaultConfig.bindings.shiftDown, userConfig.bindings?.shiftDown),
        abs: mergeBinding(defaultConfig.bindings.abs, userConfig.bindings?.abs),
        tcs: mergeBinding(defaultConfig.bindings.tcs, userConfig.bindings?.tcs),
        stability: mergeBinding(defaultConfig.bindings.stability, userConfig.bindings?.stability),
      },
      curves: {
        steerCurve: userConfig.curves?.steerCurve ?? defaultConfig.curves.steerCurve,
        steerSmoothing: userConfig.curves?.steerSmoothing ?? defaultConfig.curves.steerSmoothing,
        steerDeadzone: userConfig.curves?.steerDeadzone ?? defaultConfig.curves.steerDeadzone,
        steerSaturation: userConfig.curves?.steerSaturation ?? defaultConfig.curves.steerSaturation,
        speedSensitivity: userConfig.curves?.speedSensitivity ?? defaultConfig.curves.speedSensitivity,
        throttleDeadzone: userConfig.curves?.throttleDeadzone ?? defaultConfig.curves.throttleDeadzone,
        brakeDeadzone: userConfig.curves?.brakeDeadzone ?? defaultConfig.curves.brakeDeadzone,
      },
    };
  }
  
  static resetToDefaults(): InputConfig {
    const config = this.getDefaultConfig();
    this.saveConfig(config);
    return config;
  }
}
