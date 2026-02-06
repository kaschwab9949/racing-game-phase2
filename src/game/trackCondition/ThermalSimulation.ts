import type { EnvironmentState, TrackEvolutionConfig } from './types';
import type { TrackConditionField } from './TrackConditionField';

/**
 * Detailed thermal simulation using Newton's law of cooling and solar flux.
 */
export class ThermalSimulation {
  constructor(
    private field: TrackConditionField,
    private config: TrackEvolutionConfig
  ) {}

  public update(env: EnvironmentState, dt: number): void {
    const data = this.field.getAllData();
    const sSegs = this.field.sSegments;
    const lSegs = this.field.latSegments;
    const stride = 8;

    for (let i = 0; i < data.length; i += stride) {
      let surfaceT = data[i + 3];
      let subSurfaceT = data[i + 4];
      
      // 1. Solar Gain
      // Absorption coefficient ~0.9 for asphalt
      const solarFlux = env.solarRadiation * 0.9;
      
      // 2. Convective Cooling/Heating with Air
      // dT/dt = h * A * (T_air - T_surface)
      const convectionFlux = this.config.convectionCoefficient * (env.ambientTemp - surfaceT);
      
      // 3. Conduction to sub-surface
      // Q = k * A * (T_surf - T_sub) / distance
      const conductionFlux = this.config.trackThermalConductivity * (subSurfaceT - surfaceT) / 0.05;
      
      // 4. Radiative Cooling to Sky (Stephan-Boltzman approx)
      const sigma = 5.67e-8;
      const emissivity = 0.95;
      const skyTempK = (env.ambientTemp + 273.15) - 20; // simplified sky temp
      const radFlux = sigma * emissivity * (Math.pow(skyTempK, 4) - Math.pow(surfaceT + 273.15, 4));

      const totalFlux = solarFlux + convectionFlux + conductionFlux + radFlux;
      
      // dT = Q * dt / (mass * C)
      // Assuming 1kg asphalt per cell approx
      const mass = 5.0; // simplified mass per grid cell volume
      const deltaT = totalFlux * dt / (mass * this.config.trackSpecificHeat);
      
      data[i + 3] += deltaT;
      data[i + 5] = totalFlux;

      // Sub-surface evolves slower
      data[i + 4] += (surfaceT - subSurfaceT) * 0.01 * dt;
    }
  }

  /**
   * Heat added by tire friction
   */
  public injectHeat(s: number, d: number, joules: number): void {
    const indices = this.field.getIndices(s, d);
    const cell = this.field.getCell(s, d);
    const mass = 5.0;
    const deltaT = joules / (mass * this.config.trackSpecificHeat);
    this.field.updateCell(indices[0], indices[1], {
      surfaceTemp: cell.surfaceTemp + deltaT
    });
  }
}
