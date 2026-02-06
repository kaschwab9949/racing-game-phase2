import type { GameMode, SessionConfig, SessionResults } from './types';
import type { GameEngine } from '../engine';

export class PracticeMode implements GameMode {
  id = 'practice' as const;
  label = 'Practice';

  start(engine: GameEngine, config: SessionConfig): void {
    // Configure AI count before reset (so spawnAiCars uses the right count)
    if (typeof config.aiCount === 'number') {
      (engine as any).aiCount = Math.max(0, Math.min(24, Math.floor(config.aiCount)));
    }
    if (config.carId) {
      engine.setCar(config.carId); // setCar calls resetRace internally
    } else {
      (engine as any).resetRace?.();
    }
  }

  update(engine: GameEngine, dt: number): void {
    // Practice never ends on its own
  }

  shouldFinish(engine: GameEngine, config: SessionConfig): boolean {
    return false;
  }

  buildResults(engine: GameEngine, config: SessionConfig): SessionResults {
    const rcEvents = engine.getRaceControlEventLog();
    return {
      type: 'practice',
      lapResults: [],
      raceControlEvents: rcEvents,
    };
  }
}
