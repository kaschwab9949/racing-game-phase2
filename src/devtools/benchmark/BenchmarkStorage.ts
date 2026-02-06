import type { BenchmarkResult } from './types';

const STORAGE_KEY = 'racing-game.benchmark.results.v1';

type Store = {
  results: BenchmarkResult[];
};

export class BenchmarkStorage {
  private read(): Store {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { results: [] };
      return JSON.parse(raw) as Store;
    } catch (err) {
      console.warn('Failed to read benchmark storage', err);
      return { results: [] };
    }
  }

  private write(store: Store): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn('Failed to write benchmark storage', err);
    }
  }

  save(result: BenchmarkResult): void {
    const store = this.read();
    store.results.unshift(result);
    store.results = store.results.slice(0, 20);
    this.write(store);
  }

  list(): BenchmarkResult[] {
    return this.read().results;
  }

  loadLast(): BenchmarkResult | null {
    return this.read().results[0] ?? null;
  }

  clear(): void {
    this.write({ results: [] });
  }
}
