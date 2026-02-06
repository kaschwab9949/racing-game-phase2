import type { TrackConditionField } from './TrackConditionField';
import type { TrackEvolutionConfig } from './types';

/**
 * Manages the "laying down" of rubber on the racing line 
 * and the creation of marbles (track debris).
 */
export class RubberModel {
  constructor(
    private field: TrackConditionField,
    private config: TrackEvolutionConfig
  ) {}

  /**
   * Called per frame for each tire contact.
   * @param s Arc length
   * @param d Lateral offset
   * @param pressure Vertical load factor 0..2
   * @param slip Combined slip ratio 0..1
   */
  public processTirePass(s: number, d: number, pressure: number, slip: number, dt: number): void {
    const [sIdx, dIdx] = this.field.getIndices(s, d);
    const cell = this.field.getCell(s, d);

    // 1. Rubber lines buildup
    // Rubber sticks best when slip is low but pressure is high
    const gripEfficiency = Math.max(0, 1.0 - slip * 2.0);
    const rubberDelta = this.config.rubberTransferCoefficient * pressure * gripEfficiency * dt;
    
    // 2. Marble creation
    // Marbles (tire debris) are discarded when slip is high (tearing rubber)
    const marbleDelta = this.config.marbleDiscardRate * pressure * Math.max(0, slip - 0.1) * dt;

    // 3. Dust cleaning
    // Passing cars "blow" dust off the line
    const dustCleaning = -0.05 * pressure * dt;

    this.field.updateCell(sIdx, dIdx, {
      rubber: cell.rubber + rubberDelta,
      marbles: cell.marbles + marbleDelta,
      dust: cell.dust + dustCleaning,
      totalPassingVolume: cell.totalPassingVolume + 1
    });

    // 4. Marble migration
    // Marbles tend to get pushed outward by racing cars
    if (marbleDelta > 0) {
      this.scatterMarbles(sIdx, dIdx, marbleDelta * 0.5);
    }
  }

  private scatterMarbles(sIdx: number, dIdx: number, amount: number): void {
    // Push marbles to adjacent lateral cells
    const neighbors = [dIdx - 1, dIdx + 1];
    for (const n of neighbors) {
      if (n >= 0 && n < this.field.latSegments) {
        const neighborCell = this.field.getCell(sIdx * (this.field.trackLength / this.field.sSegments), 
                                                (n / this.field.latSegments - 0.5) * this.field.trackWidth);
        this.field.updateCell(sIdx, n, {
          marbles: neighborCell.marbles + amount
        });
      }
    }
  }

  public applyGlobalDust(amount: number): void {
    const data = this.field.getAllData();
    for (let i = 0; i < data.length; i += 8) {
      data[i + 2] = Math.min(1.0, data[i + 2] + amount);
    }
  }
}
