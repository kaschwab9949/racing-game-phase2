import type { GameMode, SessionConfig, SessionResults, RaceStandingsRow } from './types';
import type { GameEngine } from '../engine';

export class RaceMode implements GameMode {
  id = 'race' as const;
  label = 'Race';
  private isQualifying: boolean;
  constructor(isQualifying = false) { this.isQualifying = isQualifying; this.id = isQualifying ? 'qualifying' : 'race' as any; this.label = isQualifying ? 'Qualifying' : 'Race'; }

  start(engine: GameEngine, config: SessionConfig): void {
    // Configure AI count before reset (so spawnAiCars uses the right count)
    const aiCount = typeof config.aiCount === 'number' ? config.aiCount : 8;
    (engine as any).aiCount = Math.max(0, Math.min(24, Math.floor(aiCount)));
    if (config.carId) {
      engine.setCar(config.carId); // setCar calls resetRace internally
    } else {
      (engine as any).resetRace?.();
    }
  }

  update(engine: GameEngine, dt: number): void {
    // Standings handled by engine; we poll via HUD
  }

  shouldFinish(engine: GameEngine, config: SessionConfig): boolean {
    const lapsTarget = config.laps ?? (this.isQualifying ? 5 : 8);
    const hud = (engine as any)['lap'];
    if (!hud) return false;
    return hud.lapIndex >= lapsTarget;
  }

  buildResults(engine: GameEngine, config: SessionConfig): SessionResults {
    const totalCars = (engine as any)['aiCars']?.length + 1 || 1;
    const standings: RaceStandingsRow[] = [];
    standings.push({ position: (engine as any)['playerPosition'] ?? 1, label: 'You', lapsCompleted: (engine as any)['lap']?.lapIndex ?? 0, lastLapTime: (engine as any)['lap']?.lastLapTime ?? null });
    // Simple standings for AI: not detailed
    const rc = engine.getRaceControlState?.() ?? null;
    const penalties = rc?.penaltyHud ? {
      warnings: (rc.penaltyHud as any).warnings ?? (rc.penaltyHud as any).warningCount ?? 0,
      timePenaltySeconds: (rc.penaltyHud as any).timePenaltySeconds ?? 0,
      slowdownServedSeconds: (rc.penaltyHud as any).slowdownServedSeconds ?? 0,
    } : undefined;
    return {
      type: this.isQualifying ? 'qualifying' : 'race',
      totalLaps: config.laps,
      lapResults: [],
      standings,
      penalties,
      raceControlEvents: engine.getRaceControlEventLog(),
    };
  }
}
