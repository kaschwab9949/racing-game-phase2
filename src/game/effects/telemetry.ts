// Telemetry converter - converts CarState to PhysicsTelemetry

import type { CarState } from '../carPhysics';
import type { Vec2 } from '../math';
import { dot, len, normalize, perp } from '../math';
import type { PhysicsTelemetry } from './types';

/**
 * Convert CarState to PhysicsTelemetry for effects system
 */
export function createTelemetryFromCarState(state: CarState): PhysicsTelemetry {
  // Calculate forward and lateral velocity components
  const fwd: Vec2 = { 
    x: Math.cos(state.heading), 
    y: Math.sin(state.heading) 
  };
  const right = perp(fwd);

  const vF = dot(state.vel, fwd);
  const vR = dot(state.vel, right);
  
  // Calculate speed
  const speed = len(state.vel);

  // Estimate slip ratio (simplified)
  // Real slip ratio = (wheel_speed - vehicle_speed) / vehicle_speed
  // We approximate based on throttle/brake and lateral velocity
  const frontSlipRatio = calculateSlipRatio(vF, vR, state.brake, state.throttle, true);
  const rearSlipRatio = calculateSlipRatio(vF, vR, state.brake, state.throttle, false);

  // Calculate slip angle (angle between velocity and heading)
  const slipAngle = Math.atan2(vR, Math.abs(vF));

  // Estimate wheel speed (simplified)
  const wheelSpeed = Math.abs(vF) * 10; // Convert m/s to approximate rad/s

  return {
    frontSlipRatio,
    rearSlipRatio,
    slipAngle,
    speed,
    wheelSpeed,
    brakeInput: state.brake,
    throttleInput: state.throttle,
    position: { ...state.pos },
    heading: state.heading,
  };
}

/**
 * Calculate slip ratio estimation
 */
function calculateSlipRatio(
  vF: number, 
  vR: number, 
  brake: number, 
  throttle: number, 
  isFront: boolean
): number {
  // Lateral slip contribution
  const lateralSlip = Math.min(1, Math.abs(vR) / 10);

  // Longitudinal slip from braking/acceleration
  let longitudinalSlip = 0;
  
  if (brake > 0.1) {
    // Braking causes slip, more on front wheels
    longitudinalSlip = brake * (isFront ? 1.2 : 0.8);
  } else if (throttle > 0.1 && vF > 0) {
    // Acceleration causes slip, more on rear wheels
    longitudinalSlip = throttle * (isFront ? 0.3 : 1.0) * (1 - Math.min(1, Math.abs(vF) / 40));
  }

  // Combine lateral and longitudinal slip
  const totalSlip = Math.sqrt(lateralSlip * lateralSlip + longitudinalSlip * longitudinalSlip);
  
  return Math.min(1, totalSlip);
}
