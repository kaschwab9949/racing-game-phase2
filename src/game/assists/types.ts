export interface AssistState {
  abs: {
    enabled: boolean;
    active: boolean;
    pressure: number; // 0-1
    pulseFreq: number; // Hz
  };
  tcs: {
    enabled: boolean;
    active: boolean;
    reduction: number; // 0-1
    wheelSpin: number; // rad/s
  };
  stability: {
    enabled: boolean;
    active: boolean;
    yawCorrection: number; // -1 to 1
    understeer: number; // 0-1
    oversteer: number; // 0-1
  };
}

export interface AssistConfig {
  abs: {
    enabled: boolean;
    sensitivity: number; // 0-1
    pulseRate: number; // Hz
    threshold: number; // wheel lock threshold
  };
  tcs: {
    enabled: boolean;
    sensitivity: number; // 0-1
    intervention: number; // 0-1, how aggressively to cut power
    wheelSpinThreshold: number; // rad/s difference
  };
  stability: {
    enabled: boolean;
    understeerSensitivity: number;
    oversteerSensitivity: number;
    yawDamping: number;
    interventionStrength: number;
  };
}