import type { ReplaySession, ReplaySessionMeta } from './types';

const INDEX_KEY = 'racing_game_replays_index_v1';
const SESSION_PREFIX = 'racing_game_replay_v1_';

export type ReplayIndexEntry = ReplaySessionMeta;

export class ReplayStorage {
  list(): ReplayIndexEntry[] {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) as ReplayIndexEntry[]; } catch { return []; }
  }

  save(session: ReplaySession): void {
    const key = SESSION_PREFIX + session.meta.id;
    localStorage.setItem(key, JSON.stringify(session));
    const index = this.list().filter(e => e.id !== session.meta.id);
    index.unshift(session.meta);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index.slice(0, 20)));
  }

  load(id: string): ReplaySession | null {
    const raw = localStorage.getItem(SESSION_PREFIX + id);
    if (!raw) return null;
    try { return JSON.parse(raw) as ReplaySession; } catch { return null; }
  }

  remove(id: string): void {
    localStorage.removeItem(SESSION_PREFIX + id);
    const index = this.list().filter(e => e.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}
