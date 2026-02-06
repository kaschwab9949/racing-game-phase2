export const TRACK_CONSTANTS = {
  // Thermal properties of materials
  ASPHALT_SPECIFIC_HEAT: 920.0, // J/kg*K
  ASPHALT_DENSITY: 2300.0,      // kg/m^3
  ASPHALT_THERMAL_CONDUCTIVITY: 0.75, // W/m*K
  ASPHALT_EMISSIVITY: 0.92,
  
  // Simulation constants
  AIR_THERMAL_CONDUCTIVITY: 0.026,
  GRAVITY: 9.81,
  SOLAR_CONSTANT: 1361.0, // W/m^2
  
  // Rate constants for evolution
  RUBBER_DEPOSITION_BASE: 0.002,   // Base rate per tire pass
  RUBBER_SATURATION_MAX: 0.85,     // Hard limit on rubber buildup
  MARBLE_EJECTION_THRESHOLD: 0.15, // Slip required to start throwing marbles
  MARBLE_ACCUMULATION_LIMIT: 1.0,  
  DUST_DEPOSITION_IDLE: 0.00005,   // Dust settling per second
  
  // Thermal dynamics
  CONVECTION_BASE: 5.0,  // Natural convection coefficient
  CONVECTION_WIND_MULT: 3.5, // Forced convection multiplier per m/s
  
  // Grid settings
  DEFAULT_S_RES: 400,
  DEFAULT_LAT_RES: 32,
  
  // Physics integration
  MAX_GRIP_GAIN_RUBBER: 0.07,   // +7% max
  MAX_GRIP_LOSS_MARBLES: -0.30, // -30% max
  MAX_GRIP_LOSS_DUST: -0.12     // -12% max
};
