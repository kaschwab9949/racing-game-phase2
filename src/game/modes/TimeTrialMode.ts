import type { GameMode, SessionConfig, SessionResults, LapResult } from './types';
import type { GameEngine } from '../engine';
import { computeSectorSplits } from '../telemetry/sector';

export class TimeTrialMode implements GameMode {
  id = 'time_trial' as const;
  label = 'Time Trial';

  start(engine: GameEngine, config: SessionConfig): void {
    // No AI in time trial - set count before reset
    (engine as any).aiCount = 0;
    if (config.carId) {
      engine.setCar(config.carId); // setCar calls resetRace internally
    } else {
      (engine as any).resetRace?.();
    }
  }

  update(engine: GameEngine, dt: number): void {
    // Ghost rendering handled by engine
  }

  shouldFinish(engine: GameEngine, config: SessionConfig): boolean {
    // Manual exit only; chase PB
    return false;
  }

  buildResults(engine: GameEngine, config: SessionConfig): SessionResults {
    const telemetry = (engine as any)['telemetry'];
    const hud = telemetry?.getLastHudState?.();
    const track = engine.getTrack();
    const lapResults: LapResult[] = [];
    if (hud?.lastLap) {
      const lap = hud.lastLap;
      const sectors = computeSectorSplits(track.sectors ?? [], lap.samples, hud?.bestLap?.samples ?? null, hud?.ghostLap?.samples ?? null);
      lapResults.push({ lapIndex: 0, time: lap.lapTime, valid: lap.valid, sectors: sectors.map(s => ({ id: s.sector.id, time: s.time, deltaBest: s.deltaBest, deltaGhost: s.deltaGhost })) });
    }
    if (hud?.bestLap) {
      const lap = hud.bestLap;
      const sectors = computeSectorSplits(track.sectors ?? [], lap.samples, hud?.bestLap?.samples ?? null, hud?.ghostLap?.samples ?? null);
      lapResults.push({ lapIndex: 1, time: lap.lapTime, valid: lap.valid, sectors: sectors.map(s => ({ id: s.sector.id, time: s.time, deltaBest: s.deltaBest, deltaGhost: s.deltaGhost })) });
    }
    const rc = engine.getRaceControlState?.() ?? null;
    const penalties = rc?.penaltyHud ? {
      warnings: (rc.penaltyHud as any).warnings ?? (rc.penaltyHud as any).warningCount ?? 0,
      timePenaltySeconds: (rc.penaltyHud as any).timePenaltySeconds ?? 0,
      slowdownServedSeconds: (rc.penaltyHud as any).slowdownServedSeconds ?? 0,
    } : undefined;

    return {
      type: 'time_trial',
      lapResults,
      bestLapTime: hud?.bestLap?.lapTime ?? null,
      penalties,
      raceControlEvents: engine.getRaceControlEventLog(),
    };
  }
}
