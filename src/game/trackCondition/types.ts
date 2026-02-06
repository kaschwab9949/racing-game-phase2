export interface TrackConditionCell {
  // Grip factors
  rubber: number;    // 0 to 1 (clean to fully rubbered line)
  marbles: number;   // 0 to 1 (density of marbles off-line)
  dust: number;      // 0 to 1 (global dust layer)
  
  // Thermal state
  surfaceTemp: number; // Celsius at surface
  subSurfaceTemp: number; // Celsius 5cm down (thermal mass)
  heatFlux: number; // Current Wattage influx/outflux
  
  // Historical / Statistics
  totalPassingVolume: number; // Accumulated "traffic"
  lastUpdatedFrame: number;
}

export interface EnvironmentState {
  ambientTemp: number;
  trackAmbientTemp: number; // usually higher than air
  solarRadiation: number; // W/m^2
  windSpeed: number; // m/s
  windDirection: number; // radians
  humidity: number; // 0 to 1
  dustStormIntensity: number; // 0 to 1
}

export type TrackEvolutionConfig = {
  enabled: boolean;
  simulationStepDt: number; // Simulation might run slower than physics
  
  // Rate constants
  rubberTransferCoefficient: number;
  marbleDiscardRate: number;
  dustDepositionRate: number;
  
  // Thermal constants
  trackSpecificHeat: number; // J/(kg*K)
  trackThermalConductivity: number; // W/(m*K)
  convectionCoefficient: number;
  
  // Visuals
  overlayAlpha: number;
  heatmapMode: 'grip' | 'temp' | 'rubber' | 'marbles';
};

export interface GripResult {
  multiplier: number;
  components: {
    base: number;
    rubber: number;
    marbles: number;
    dust: number;
    thermal: number;
  };
}

export interface TrackPoint {
  s: number;
  d: number;
  width: number;
}
