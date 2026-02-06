import type { CarState } from '../carPhysics';
import type { ProcessedInput } from '../input/types';
import type { AssistConfig, AssistState } from './types';
import { ABSController, TractionController, StabilityController } from './AssistControllers';

const DEFAULT_ASSIST_CONFIG: AssistConfig = {
  abs: {
    enabled: true,
    sensitivity: 0.7,
    pulseRate: 8,
    threshold: 0.1
  },
  tcs: {
    enabled: true,
    sensitivity: 0.6,
    intervention: 0.8,
    wheelSpinThreshold: 50
  },
  stability: {
    enabled: true,
    understeerSensitivity: 0.7,
    oversteerSensitivity: 0.8,
    yawDamping: 0.6,
    interventionStrength: 0.7
  }
};

export class AssistManager {
  private abs = new ABSController();
  private tcs = new TractionController();
  private stability = new StabilityController();
  private config: AssistConfig = JSON.parse(JSON.stringify(DEFAULT_ASSIST_CONFIG));
  private state: AssistState = {
    abs: { enabled: true, active: false, pressure: 0, pulseFreq: 0 },
    tcs: { enabled: true, active: false, reduction: 0, wheelSpin: 0 },
    stability: { enabled: true, active: false, yawCorrection: 0, understeer: 0, oversteer: 0 }
  };
  
  public update(
    car: CarState,
    input: ProcessedInput,
    dt: number
  ): {
    modifiedInput: ProcessedInput;
    assistState: AssistState;
  } {
    const speed = Math.sqrt(car.vel.x * car.vel.x + car.vel.y * car.vel.y);
    
    // Update assist configs from input toggles
    this.config.abs.enabled = input.abs;
    this.config.tcs.enabled = input.tcs;
    this.config.stability.enabled = input.stability;
    
    // ABS processing
    const absResult = this.abs.update(car, this.config.abs, input.brake, dt);
    
    // TCS processing
    const tcsResult = this.tcs.update(car, this.config.tcs, input.throttle, dt);
    
    // Stability processing
    const stabilityResult = this.stability.update(
      car,
      this.config.stability,
      input.steer,
      speed,
      dt
    );
    
    // Update state
    this.state.abs = {
      enabled: this.config.abs.enabled,
      active: absResult.active,
      pressure: absResult.pressure,
      pulseFreq: this.config.abs.pulseRate
    };
    
    this.state.tcs = {
      enabled: this.config.tcs.enabled,
      active: tcsResult.active,
      reduction: 1 - tcsResult.throttleMultiplier,
      wheelSpin: tcsResult.wheelSpin
    };
    
    this.state.stability = {
      enabled: this.config.stability.enabled,
      active: stabilityResult.active,
      yawCorrection: stabilityResult.steerCorrection,
      understeer: stabilityResult.understeer,
      oversteer: stabilityResult.oversteer
    };
    
    // Apply modifications to input
    const modifiedInput: ProcessedInput = {
      ...input,
      throttle: input.throttle * tcsResult.throttleMultiplier,
      brake: input.brake * absResult.brakeMultiplier,
      steer: input.steer + stabilityResult.steerCorrection
    };
    
    // Clamp values
    modifiedInput.steer = Math.max(-1, Math.min(1, modifiedInput.steer));
    modifiedInput.throttle = Math.max(0, Math.min(1, modifiedInput.throttle));
    modifiedInput.brake = Math.max(0, Math.min(1, modifiedInput.brake));
    
    return {
      modifiedInput,
      assistState: this.state
    };
  }
  
  public getConfig(): AssistConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
  
  public updateConfig(config: Partial<AssistConfig>): void {
    if (config.abs) {
      this.config.abs = { ...this.config.abs, ...config.abs };
    }
    if (config.tcs) {
      this.config.tcs = { ...this.config.tcs, ...config.tcs };
    }
    if (config.stability) {
      this.config.stability = { ...this.config.stability, ...config.stability };
    }
  }
  
  public getState(): AssistState {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  public resetToDefaults(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_ASSIST_CONFIG));
  }
}