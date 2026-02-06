import type { CarState } from '../carPhysics';
import type { ReplaySession, ReplaySessionMeta, ReplayCarMeta, ReplayCarData } from './types';
import { encodeSeries } from './codec';

export type ReplayRecordConfig = {
  frameDt: number;
  sampleEveryN?: number;
  scalePos?: number;
  scaleHeading?: number;
  scaleVel?: number;
  scaleInput?: number;
};

export class ReplayRecorder {
  private config: ReplayRecordConfig;
  private frames = 0;
  private time = 0;
  private samples: Record<string, {
    meta: ReplayCarMeta;
    posX: number[];
    posY: number[];
    heading: number[];
    velX: number[];
    velY: number[];
    throttle: number[];
    brake: number[];
    steer: number[];
  }> = {};

  constructor(config: ReplayRecordConfig) {
    this.config = config;
  }

  reset(): void {
    this.frames = 0;
    this.time = 0;
    this.samples = {};
  }

  recordFrame(dt: number, cars: CarState[]): void {
    const sampleEveryN = this.config.sampleEveryN ?? 1;
    this.time += dt;
    if (this.frames % sampleEveryN !== 0) {
      this.frames++;
      return;
    }

    for (const car of cars) {
      const id = car.spec.id;
      if (!this.samples[id]) {
        this.samples[id] = {
          meta: { carId: id, label: car.spec.displayName, isPlayer: car.isPlayer },
          posX: [], posY: [], heading: [], velX: [], velY: [], throttle: [], brake: [], steer: [],
        };
      }
      const s = this.samples[id];
      s.posX.push(car.pos.x);
      s.posY.push(car.pos.y);
      s.heading.push(car.heading);
      s.velX.push(car.vel.x);
      s.velY.push(car.vel.y);
      s.throttle.push(car.throttle);
      s.brake.push(car.brake);
      s.steer.push(car.steer);
    }

    this.frames++;
  }

  buildSession(meta: Omit<ReplaySessionMeta, 'frames' | 'duration'>): ReplaySession {
    const scalePos = this.config.scalePos ?? 100;
    const scaleHeading = this.config.scaleHeading ?? 1000;
    const scaleVel = this.config.scaleVel ?? 100;
    const scaleInput = this.config.scaleInput ?? 1000;

    const cars: ReplayCarMeta[] = [];
    const data: Record<string, ReplayCarData> = {};

    for (const id of Object.keys(this.samples)) {
      const s = this.samples[id];
      cars.push(s.meta);
      data[id] = {
        posX: encodeSeries(s.posX, scalePos),
        posY: encodeSeries(s.posY, scalePos),
        heading: encodeSeries(s.heading, scaleHeading),
        velX: encodeSeries(s.velX, scaleVel),
        velY: encodeSeries(s.velY, scaleVel),
        throttle: encodeSeries(s.throttle, scaleInput),
        brake: encodeSeries(s.brake, scaleInput),
        steer: encodeSeries(s.steer, scaleInput),
      };
    }

    const frames = Math.max(0, this.frames);
    const duration = frames * this.config.frameDt * (this.config.sampleEveryN ?? 1);

    return {
      version: 1,
      meta: { ...meta, frames, duration, frameDt: this.config.frameDt * (this.config.sampleEveryN ?? 1) },
      cars,
      data,
    };
  }
}
