import type { CarState } from '../carPhysics';
import type { AssistConfig } from './types';

export class ABSController {
  private lastWheelSpeeds: number[] = [0, 0, 0, 0];
  private pulseTimer = 0;
  private pulseActive = false;
  
  public update(
    car: CarState,
    config: AssistConfig['abs'],
    brakeInput: number,
    dt: number
  ): { brakeMultiplier: number; active: boolean; pressure: number } {
    if (!config.enabled || brakeInput < 0.1) {
      return { brakeMultiplier: 1, active: false, pressure: 0 };
    }
    
    // Simplified wheel speed calculation
    const speed = Math.sqrt(car.vel.x * car.vel.x + car.vel.y * car.vel.y);
    const targetWheelSpeed = speed / 0.32; // Assuming 32cm wheel radius
    
    // Simulate wheel lock detection (simplified)
    const wheelLockThreshold = targetWheelSpeed * config.threshold;
    const currentWheelSpeed = targetWheelSpeed * (1 - brakeInput * 0.3); // Simplified
    
    let isLocking = false;
    if (currentWheelSpeed < wheelLockThreshold && brakeInput > 0.5) {
      isLocking = true;
    }
    
    if (!isLocking) {
      this.pulseTimer = 0;
      this.pulseActive = false;
      return { brakeMultiplier: 1, active: false, pressure: brakeInput };
    }
    
    // ABS pulsing logic
    this.pulseTimer += dt;
    const pulseFreq = config.pulseRate;
    const pulsePeriod = 1 / pulseFreq;
    
    if (this.pulseTimer >= pulsePeriod) {
      this.pulseTimer = 0;
      this.pulseActive = !this.pulseActive;
    }
    
    const brakeMultiplier = this.pulseActive ? 0.3 : 1.0;
    const effectivePressure = brakeInput * brakeMultiplier;
    
    return {
      brakeMultiplier,
      active: true,
      pressure: effectivePressure
    };
  }
}

export class TractionController {
  private targetSlip = 0.1; // Optimal slip ratio
  
  public update(
    car: CarState,
    config: AssistConfig['tcs'],
    throttleInput: number,
    dt: number
  ): { throttleMultiplier: number; active: boolean; wheelSpin: number } {
    if (!config.enabled || throttleInput < 0.1) {
      return { throttleMultiplier: 1, active: false, wheelSpin: 0 };
    }
    
    // Calculate wheel spin (simplified)
    const speed = Math.sqrt(car.vel.x * car.vel.x + car.vel.y * car.vel.y);
    const engineRPM = car.physics?.rpm || 1000;
    const wheelSpeed = engineRPM * 0.01; // Very simplified gear ratio
    const vehicleSpeed = speed * 30; // Convert to similar units
    
    const wheelSpin = Math.max(0, wheelSpeed - vehicleSpeed);
    const isSpinning = wheelSpin > config.wheelSpinThreshold;
    
    if (!isSpinning) {
      return { throttleMultiplier: 1, active: false, wheelSpin };
    }
    
    // Calculate intervention
    const excessSpin = wheelSpin - config.wheelSpinThreshold;
    const reductionNeeded = Math.min(1, excessSpin / 100) * config.intervention;
    const throttleMultiplier = 1 - reductionNeeded;
    
    return {
      throttleMultiplier: Math.max(0.1, throttleMultiplier),
      active: true,
      wheelSpin
    };
  }
}

export class StabilityController {
  private targetYawRate = 0;
  private lastYawRate = 0;
  
  public update(
    car: CarState,
    config: AssistConfig['stability'],
    steerInput: number,
    speed: number,
    dt: number
  ): {
    steerCorrection: number;
    brakeCorrection: { front: number; rear: number };
    active: boolean;
    understeer: number;
    oversteer: number;
  } {
    if (!config.enabled || speed < 5) {
      return {
        steerCorrection: 0,
        brakeCorrection: { front: 0, rear: 0 },
        active: false,
        understeer: 0,
        oversteer: 0
      };
    }
    
    // Calculate desired vs actual yaw rate (simplified)
    const desiredYawRate = steerInput * speed * 0.02; // Simplified relationship
    
    // Calculate actual yaw rate from heading change
    const currentYawRate = car.heading - this.lastYawRate;
    this.lastYawRate = car.heading;
    
    const yawError = desiredYawRate - currentYawRate;
    
    // Detect understeer/oversteer
    let understeer = 0;
    let oversteer = 0;
    
    if (Math.abs(steerInput) > 0.1) {
      if (yawError > 0.1) {
        understeer = Math.min(1, yawError * 10);
      } else if (yawError < -0.1) {
        oversteer = Math.min(1, Math.abs(yawError) * 10);
      }
    }
    
    const isActive = understeer > 0.3 || oversteer > 0.3;
    
    if (!isActive) {
      return {
        steerCorrection: 0,
        brakeCorrection: { front: 0, rear: 0 },
        active: false,
        understeer,
        oversteer
      };
    }
    
    // Calculate corrections
    let steerCorrection = 0;
    let frontBrake = 0;
    let rearBrake = 0;
    
    if (understeer > 0.3) {
      // Brake rear to rotate car
      rearBrake = understeer * config.interventionStrength * 0.3;
    }
    
    if (oversteer > 0.3) {
      // Counter-steer and brake front outside wheel
      steerCorrection = -Math.sign(yawError) * oversteer * config.yawDamping * 0.5;
      frontBrake = oversteer * config.interventionStrength * 0.2;
    }
    
    return {
      steerCorrection,
      brakeCorrection: { front: frontBrake, rear: rearBrake },
      active: isActive,
      understeer,
      oversteer
    };
  }
}