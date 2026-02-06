import { Atmosphere } from './Atmosphere';
import { TrackConditionField } from './TrackConditionField';
import { ThermalSimulation } from './ThermalSimulation';
import { RubberModel } from './RubberModel';
import { GripSolver } from './GripSolver';
import type { TrackEvolutionConfig, GripResult } from './types';
import type { TrackModel } from '../track/TrackModel';

/**
 * High-level manager for the dynamic track condition system.
 * Integrates environmental, thermal, and physical evolution models.
 */
export class TrackConditionManager {
  private atmosphere: Atmosphere;
  private field: TrackConditionField;
  private thermal: ThermalSimulation;
  private rubber: RubberModel;
  private globalGripMultiplier = 1;
  
  private config: TrackEvolutionConfig = {
    enabled: true,
    simulationStepDt: 0.1,
    rubberTransferCoefficient: 0.005,
    marbleDiscardRate: 0.012,
    dustDepositionRate: 0.0001,
    trackSpecificHeat: 900,
    trackThermalConductivity: 0.75,
    convectionCoefficient: 15.0,
    overlayAlpha: 0.5,
    heatmapMode: 'grip'
  };

  private accumulator = 0;

  constructor(track: TrackModel) {
    this.field = new TrackConditionField(track.length, 15, 300, 24);
    this.atmosphere = new Atmosphere();
    this.thermal = new ThermalSimulation(this.field, this.config);
    this.rubber = new RubberModel(this.field, this.config);
  }

  public update(dt: number): void {
    if (!this.config.enabled) return;

    this.atmosphere.update(dt);
    this.accumulator += dt;

    // Run thermal and deposition simulation at a lower fixed frequency for performance
    while (this.accumulator >= this.config.simulationStepDt) {
      const env = this.atmosphere.getState();
      this.thermal.update(env, this.config.simulationStepDt);
      
      // Natural dust deposition
      if (env.dustStormIntensity > 0.1) {
        this.rubber.applyGlobalDust(env.dustStormIntensity * 0.001);
      }
      
      this.accumulator -= this.config.simulationStepDt;
    }
  }

  /**
   * Called by the physics engine for each car frame.
   */
  public processCarPhysics(s: number, d: number, load: number, slip: number, dt: number): GripResult {
    // 1. Update the field (rubbering in)
    this.rubber.processTirePass(s, d, load, slip, dt);
    
    // 2. Heat transfer from tire friction (simplified)
    const frictionHeat = Math.abs(slip * load * 5000 * dt); // Joules estimate
    this.thermal.injectHeat(s, d, frictionHeat);

    // 3. Return effective grip
    const cell = this.field.getCell(s, d);
    const grip = GripSolver.calculateGrip(cell);
    return { ...grip, multiplier: grip.multiplier * this.globalGripMultiplier };
  }

  public getGripMultiplier(s: number, d: number): GripResult {
    const cell = this.field.getCell(s, d);
    const grip = GripSolver.calculateGrip(cell);
    return { ...grip, multiplier: grip.multiplier * this.globalGripMultiplier };
  }

  public onTirePass(s: number, d: number, speed: number, slip: number, load: number, dt = this.config.simulationStepDt): GripResult {
    return this.processCarPhysics(s, d, load, slip, dt);
  }

  public getField(): TrackConditionField {
    return this.field;
  }

  public getAtmosphere(): Atmosphere {
    return this.atmosphere;
  }

  public getConfig(): TrackEvolutionConfig {
    return this.config;
  }

  public setConfig(patch: Partial<TrackEvolutionConfig>): void {
    Object.assign(this.config, patch);
  }

  public setGlobalGripMultiplier(value: number): void {
    this.globalGripMultiplier = Math.max(0.2, Math.min(1.2, value));
  }

  public getGlobalGripMultiplier(): number {
    return this.globalGripMultiplier;
  }

  public applyEnvironmentOverrides(patch: Partial<import('./types').EnvironmentState>): void {
    this.atmosphere.applyOverrides(patch);
  }
}
