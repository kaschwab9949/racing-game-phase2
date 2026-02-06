export class InputCurves {
  /**
   * Apply a power curve to input for more natural feel
   * curve = 1: linear, < 1: more sensitive, > 1: less sensitive
   */
  static applyCurve(value: number, curve: number): number {
    const sign = Math.sign(value);
    const abs = Math.abs(value);
    return sign * Math.pow(abs, curve);
  }
  
  /**
   * Apply deadzone to eliminate controller drift
   */
  static applyDeadzone(value: number, deadzone: number): number {
    const abs = Math.abs(value);
    if (abs < deadzone) return 0;
    
    const sign = Math.sign(value);
    const scaled = (abs - deadzone) / (1 - deadzone);
    return sign * Math.min(1, scaled);
  }
  
  /**
   * Apply saturation point (max input before full output)
   */
  static applySaturation(value: number, saturation: number): number {
    const abs = Math.abs(value);
    if (abs <= saturation) {
      return value / saturation;
    }
    return Math.sign(value);
  }
  
  /**
   * Smooth input changes over time to reduce jerkiness
   */
  static smoothInput(currentValue: number, targetValue: number, smoothing: number, dt: number): number {
    if (smoothing <= 0) return targetValue;
    
    const rate = 1 - Math.exp(-10 * (1 - smoothing) * dt);
    return currentValue + (targetValue - currentValue) * rate;
  }
  
  /**
   * Apply speed-sensitive steering (less responsive at high speed)
   */
  static applySpeedSensitivity(steerInput: number, speed: number, sensitivity: number): number {
    if (sensitivity <= 0) return steerInput;
    
    // Reduce steering authority at high speeds
    const speedKmh = speed * 3.6; // m/s to km/h
    const speedFactor = 1 - (sensitivity * Math.min(speedKmh / 200, 1));
    
    return steerInput * Math.max(0.3, speedFactor);
  }
  
  /**
   * Full input processing pipeline
   */
  static processInput(
    rawValue: number,
    config: {
      curve: number;
      deadzone: number;
      saturation: number;
    }
  ): number {
    let processed = rawValue;
    
    // Apply deadzone first
    processed = this.applyDeadzone(processed, config.deadzone);
    
    // Apply saturation
    processed = this.applySaturation(processed, config.saturation);
    
    // Apply curve
    processed = this.applyCurve(processed, config.curve);
    
    return Math.max(-1, Math.min(1, processed));
  }
}