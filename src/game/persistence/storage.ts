import type { StorageSchemaV1, StorageVersion, PersonalBest, LeaderboardEntry, AppSettings, TrackId } from './schemas';

const KEY = 'racing_game_storage_v1';

function defaultSchema(): StorageSchemaV1 {
  return { version: 1 as StorageVersion, personalBests: [], leaderboards: [], settings: {} };
}

export class StorageApi {
  private data: StorageSchemaV1 = defaultSchema();

  constructor() { this.load(); }

  private load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { this.data = defaultSchema(); return; }
      const parsed = JSON.parse(raw);
      // migration point: if missing version, migrate
      if (!parsed.version) {
        this.data = { ...defaultSchema(), ...parsed };
        this.save();
      } else {
        this.data = parsed as StorageSchemaV1;
      }
    } catch (e) {
      console.warn('Storage load failed, resetting', e);
      this.data = defaultSchema();
    }
  }

  private save() { localStorage.setItem(KEY, JSON.stringify(this.data)); }

  getSettings(): AppSettings { return { ...this.data.settings }; }
  setSettings(patch: Partial<AppSettings>) { this.data.settings = { ...this.data.settings, ...patch }; this.save(); }

  getPB(carId: string, trackId: TrackId): PersonalBest | null {
    return this.data.personalBests.find(pb => pb.carId === carId && pb.trackId === trackId) ?? null;
  }
  upsertPB(pb: PersonalBest) {
    const i = this.data.personalBests.findIndex(x => x.carId === pb.carId && x.trackId === pb.trackId);
    if (i >= 0) this.data.personalBests[i] = pb; else this.data.personalBests.push(pb);
    this.save();
  }

  getLeaderboard(trackId: TrackId): LeaderboardEntry[] {
    return this.data.leaderboards.filter(x => x.trackId === trackId).sort((a,b) => a.lapTime - b.lapTime).slice(0, 50);
  }
  addLeaderboard(entry: LeaderboardEntry) { this.data.leaderboards.push(entry); this.save(); }
}
