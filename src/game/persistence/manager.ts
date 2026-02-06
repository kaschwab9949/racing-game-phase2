import type { GameEngine } from '../engine';
import type { TrackModel } from '../track/TrackModel';
import { StorageApi } from './storage';
import type { PersonalBest, LeaderboardEntry, TrackId } from './schemas';

function currentTrackId(track: TrackModel): TrackId {
  // For now, single track
  return 'podium_club_ccw';
}

export class PersistenceManager {
  private storage: StorageApi;
  private lastBest: number | null = null;
  private playerName: string = 'You';

  constructor(storage?: StorageApi) {
    this.storage = storage ?? new StorageApi();
  }

  setPlayerName(name: string) { this.playerName = name; this.storage.setSettings({}); }

  attach(engine: GameEngine): void {
    const prevTelemetry = (engine as any)['options'].onTelemetry;
    (engine as any)['options'].onTelemetry = (hud: any) => {
      try {
        const bestLap = hud?.bestLap?.lapTime ?? null;
        const carId = (engine.getCarSpec() as any).id as string;
        const track = engine.getTrack();
        const trackId = currentTrackId(track);
        if (bestLap !== null && bestLap !== this.lastBest) {
          this.lastBest = bestLap;
          const sectors = (hud?.bestLap?.sectors ?? []).map((s: any) => ({ id: s.sector.id, time: s.time }));
          const pb: PersonalBest = { carId, trackId, bestLapTime: bestLap, sectors, timestamp: Date.now() };
          this.storage.upsertPB(pb);
        }
      } catch {}
      prevTelemetry?.(hud);
    };
  }

  addLeaderboardFromLastLap(engine: GameEngine): void {
    const hud = (engine as any)['telemetry']?.getLastHudState?.();
    if (!hud?.lastLap) return;
    const lap = hud.lastLap;
    const carId = (engine.getCarSpec() as any).id as string;
    const trackId = currentTrackId(engine.getTrack());
    const entry: LeaderboardEntry = {
      playerName: this.playerName,
      carId,
      trackId,
      lapTime: lap.lapTime,
      valid: lap.valid,
      timestamp: Date.now(),
    };
    this.storage.addLeaderboard(entry);
  }

  getLeaderboard(engine: GameEngine) {
    const trackId = currentTrackId(engine.getTrack());
    return this.storage.getLeaderboard(trackId);
  }

  getPB(engine: GameEngine) {
    const carId = (engine.getCarSpec() as any).id as string;
    const trackId = currentTrackId(engine.getTrack());
    return this.storage.getPB(carId, trackId);
  }
}
