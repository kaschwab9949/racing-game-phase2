import type { BenchmarkResult } from '../benchmark/types';

const STORAGE_KEY = 'racing-game.regression.v1';

type Store = {
  byScenario: Record<string, BenchmarkResult>;
};

export class RegressionStore {
  private read(): Store {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { byScenario: {} };
      return JSON.parse(raw) as Store;
    } catch (err) {
      console.warn('Failed to read regression store', err);
      return { byScenario: {} };
    }
  }

  private write(store: Store): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.warn('Failed to write regression store', err);
    }
  }

  save(result: BenchmarkResult): void {
    const store = this.read();
    store.byScenario[result.scenarioId] = result;
    this.write(store);
  }

  load(scenarioId: string): BenchmarkResult | null {
    const store = this.read();
    return store.byScenario[scenarioId] ?? null;
  }

  clear(): void {
    this.write({ byScenario: {} });
  }
}
