import type { TrackConditionField } from './TrackConditionField';
import type { TrackConditionManager } from './TrackConditionManager';

class TrackConditionStoreState {
  private manager: TrackConditionManager | null = null;
  private trackId: string | null = null;

  init(manager: TrackConditionManager, trackId = 'default'): void {
    this.manager = manager;
    this.trackId = trackId;
  }

  saveSummary(): void {
    if (!this.manager || !this.trackId) return;
    TrackConditionStore.save(this.trackId, this.manager.getField());
  }
}

/**
 * Handles persistence of track state to LocalStorage so sessions can feel cohesive.
 */
export class TrackConditionStore {
  private static readonly KEY_PREFIX = 'racing_sim_track_v1_';
  private static state = new TrackConditionStoreState();

  public static getState(): TrackConditionStoreState {
    return this.state;
  }

  public static save(trackId: string, field: TrackConditionField): void {
    try {
      const data = field.getAllData();
      // We'll store as a base64 string or similar if small enough, 
      // but for high res fields we might just store metadata.
      const summary = {
        avgRubber: this.calcAvg(data, 0),
        avgMarbles: this.calcAvg(data, 1),
        avgTemp: this.calcAvg(data, 3),
        timestamp: Date.now()
      };
      
      localStorage.setItem(`${this.KEY_PREFIX}${trackId}_summary`, JSON.stringify(summary));
      
      // Optionally save full binary blob if requested
      // localStorage.setItem(`${this.KEY_PREFIX}${trackId}_bin`, this.toBase64(data));
    } catch (e) {
      console.warn('Failed to save track condition', e);
    }
  }

  public static loadSummary(trackId: string): any {
    const raw = localStorage.getItem(`${this.KEY_PREFIX}${trackId}_summary`);
    return raw ? JSON.parse(raw) : null;
  }

  private static calcAvg(data: Float32Array, offset: number): number {
    let sum = 0;
    let count = 0;
    for (let i = offset; i < data.length; i += 8) {
      sum += data[i];
      count++;
    }
    return sum / count;
  }
}
