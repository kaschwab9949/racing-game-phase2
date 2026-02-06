import type { InputTape, InputTapeSummary } from './types';

const STORAGE_KEY = 'racing-game.input-tapes.v1';

type StoredTape = InputTape;

type TapeStore = {
  items: StoredTape[];
};

export class InputTapeStorage {
  private readStore(): TapeStore {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { items: [] };
      return JSON.parse(raw) as TapeStore;
    } catch (err) {
      console.warn('Failed to read input tape storage', err);
      return { items: [] };
    }
  }

  private writeStore(store: TapeStore): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn('Failed to write input tape storage', err);
    }
  }

  list(): InputTapeSummary[] {
    const store = this.readStore();
    return store.items.map((tape) => ({
      id: tape.id,
      createdAt: tape.createdAt,
      seed: tape.seed,
      frameDt: tape.frameDt,
      notes: tape.notes,
      frameCount: tape.frames.length,
    }));
  }

  save(tape: InputTape): void {
    const store = this.readStore();
    const existingIndex = store.items.findIndex((t) => t.id === tape.id);
    if (existingIndex >= 0) {
      store.items[existingIndex] = tape;
    } else {
      store.items.unshift(tape);
    }
    this.writeStore(store);
  }

  load(id: string): InputTape | null {
    const store = this.readStore();
    return store.items.find((t) => t.id === id) ?? null;
  }

  remove(id: string): void {
    const store = this.readStore();
    store.items = store.items.filter((t) => t.id !== id);
    this.writeStore(store);
  }
}
