import type { ProcessedInput, InputConfig } from './input/types';
import type { AssistState } from './assists/types';
import { InputMapper } from './input/InputMapper';
import { InputConfigManager } from './input/InputConfigManager';
import { AssistManager } from './assists/AssistManager';

export class ProfessionalInputSystem {
  private inputMapper: InputMapper;
  private assistManager = new AssistManager();
  private config: InputConfig;
  
  constructor() {
    this.config = InputConfigManager.loadConfig();
    // Validate loaded config has required bindings - fall back to defaults if corrupted
    if (!this.config?.bindings?.steer?.left || !this.config?.bindings?.throttle || !this.config?.bindings?.brake) {
      console.warn('Input config corrupted, resetting to defaults');
      this.config = InputConfigManager.resetToDefaults();
    }
    this.inputMapper = new InputMapper(this.config);
  }
  
  public processInput(dt: number, currentSpeed: number): {
    finalInput: ProcessedInput;
    rawInput: ProcessedInput;
    assistState: AssistState;
  } {
    // Get raw processed input (after curves but before assists)
    const rawProcessed = this.inputMapper.processInput(dt, currentSpeed);
    
    // Apply assists - this is a placeholder for now since we need car state
    // In the real integration, we'll pass the car state to assists
    const assistState: AssistState = {
      abs: { enabled: rawProcessed.abs, active: false, pressure: 0, pulseFreq: 8 },
      tcs: { enabled: rawProcessed.tcs, active: false, reduction: 0, wheelSpin: 0 },
      stability: { enabled: rawProcessed.stability, active: false, yawCorrection: 0, understeer: 0, oversteer: 0 }
    };
    
    return {
      finalInput: rawProcessed, // Will be modified by assists in full integration
      rawInput: rawProcessed,
      assistState
    };
  }
  
  public updateConfig(config: InputConfig): void {
    this.config = config;
    this.inputMapper.updateConfig(config);
    InputConfigManager.saveConfig(config);
  }
  
  public getConfig(): InputConfig {
    return this.config;
  }
  
  public getAssistManager(): AssistManager {
    return this.assistManager;
  }
  
  public destroy(): void {
    this.inputMapper.destroy();
  }
}