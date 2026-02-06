import type { GameMode, SessionConfig, SessionResults } from './types';
import type { GameEngine } from '../engine';
import { PracticeMode } from './PracticeMode';
import { RaceMode } from './RaceMode';

export class WeekendMode implements GameMode {
  id = 'weekend' as const;
  label = 'Race Weekend';
  private phaseIndex = 0;
  private phases: GameMode[] = [new PracticeMode(), new RaceMode(true), new RaceMode(false)];

  start(engine: GameEngine, config: SessionConfig): void {
    this.phaseIndex = 0;
    this.phases[0].start(engine, { ...config, type: 'practice' });
  }

  update(engine: GameEngine, dt: number): void {
    const phase = this.phases[this.phaseIndex];
    phase.update(engine, dt);
    if (phase.shouldFinish(engine, { ...this.getPhaseConfig(this.phaseIndex) })) {
      this.phaseIndex++;
      if (this.phaseIndex < this.phases.length) {
        const nextType = this.phaseIndex === 1 ? 'qualifying' : 'race';
        this.phases[this.phaseIndex].start(engine, { type: nextType } as any);
      }
    }
  }

  shouldFinish(engine: GameEngine, config: SessionConfig): boolean {
    return this.phaseIndex >= this.phases.length;
  }

  buildResults(engine: GameEngine, config: SessionConfig): SessionResults {
    return { type: 'weekend', lapResults: [], raceControlEvents: engine.getRaceControlEventLog() };
  }

  private getPhaseConfig(i: number): SessionConfig {
    switch (i) {
      case 0: return { type: 'practice' };
      case 1: return { type: 'qualifying', laps: 5 } as any;
      case 2: return { type: 'race', laps: 8 } as any;
      default: return { type: 'practice' };
    }
  }

  /** Manually advance to the next phase in the weekend */
  public advancePhase(engine: GameEngine): void {
    if (this.phaseIndex < this.phases.length - 1) {
      this.phaseIndex++;
      const nextType = this.phaseIndex === 1 ? 'qualifying' : 'race';
      this.phases[this.phaseIndex].start(engine, { type: nextType } as any);
    }
  }
}
