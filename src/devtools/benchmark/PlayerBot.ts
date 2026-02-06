import type { CarState, CarInput } from '../../game/carPhysics';
import type { ProcessedInput } from '../../game/input/types';
import type { TrackModel } from '../../game/track/TrackModel';
import type { CarSpec } from '../../game/cars/specs/types';
import { AiDriverController } from '../../game/ai/AiDriverController';
import { RacingLineCache } from '../../game/ai/line/RacingLineCache';
import { AiSettingsStore } from '../../game/ai/AiSettingsStore';

export class PlayerBot {
  private controller: AiDriverController;

  constructor(track: TrackModel, spec: CarSpec) {
    const cache = new RacingLineCache(track);
    const settings = new AiSettingsStore();
    this.controller = new AiDriverController({
      id: 999,
      slotLabel: 'Benchmark Bot',
      track,
      spec,
      cache,
      settings,
    });
  }

  update(car: CarState, dt: number): ProcessedInput {
    const result = this.controller.update(car, [], dt);
    return toProcessedInput(result.input);
  }
}

function toProcessedInput(input: CarInput): ProcessedInput {
  return {
    steer: input.steer,
    throttle: input.throttle,
    brake: input.brake,
    handbrake: false,
    shiftUp: false,
    shiftDown: false,
    abs: input.abs,
    tcs: input.tcs,
    stability: true,
    raw: {
      steer: input.steer,
      throttle: input.throttle,
      brake: input.brake,
    },
  };
}
