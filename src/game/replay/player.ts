import type { ReplayPlaybackState, ReplaySession, ReplayCarSnapshot, ReplayFrameSnapshot } from './types';
import { decodeSeries } from './codec';

export class ReplayPlayer {
  private session: ReplaySession;
  private decoded: Record<string, { posX: number[]; posY: number[]; heading: number[]; velX: number[]; velY: number[]; throttle: number[]; brake: number[]; steer: number[] }> = {};
  private state: ReplayPlaybackState;

  constructor(session: ReplaySession) {
    this.session = session;
    this.state = {
      time: 0,
      duration: session.meta.duration,
      speed: 1,
      paused: true,
      cameraMode: 'follow_player',
      targetCarId: session.cars.find(c => c.isPlayer)?.carId ?? session.cars[0]?.carId ?? null,
      freePan: { x: 0, y: 0 },
    };
    this.decodeAll();
  }

  private decodeAll() {
    for (const car of this.session.cars) {
      const data = this.session.data[car.carId];
      this.decoded[car.carId] = {
        posX: decodeSeries(data.posX),
        posY: decodeSeries(data.posY),
        heading: decodeSeries(data.heading),
        velX: decodeSeries(data.velX),
        velY: decodeSeries(data.velY),
        throttle: decodeSeries(data.throttle),
        brake: decodeSeries(data.brake),
        steer: decodeSeries(data.steer),
      };
    }
  }

  getState(): ReplayPlaybackState { return { ...this.state, freePan: { ...this.state.freePan } }; }

  setTime(t: number) { this.state.time = Math.max(0, Math.min(this.state.duration, t)); }
  setSpeed(speed: number) { this.state.speed = speed; }
  setPaused(paused: boolean) { this.state.paused = paused; }
  setCameraMode(mode: ReplayPlaybackState['cameraMode']) { this.state.cameraMode = mode; }
  setTargetCar(id: string | null) { this.state.targetCarId = id; }
  setFreePan(x: number, y: number) { this.state.freePan = { x, y }; }

  tick(dt: number) {
    if (this.state.paused) return;
    this.setTime(this.state.time + dt * this.state.speed);
  }

  getFrame(): ReplayFrameSnapshot {
    const idx = Math.min(Math.floor(this.state.time / this.session.meta.frameDt), this.session.meta.frames - 1);
    const nextIdx = Math.min(idx + 1, this.session.meta.frames - 1);
    const t0 = idx * this.session.meta.frameDt;
    const t1 = nextIdx * this.session.meta.frameDt;
    const blend = t1 > t0 ? (this.state.time - t0) / (t1 - t0) : 0;

    const cars: ReplayCarSnapshot[] = this.session.cars.map((car) => {
      const d = this.decoded[car.carId];
      const lerp = (a: number, b: number) => a + (b - a) * blend;
      return {
        carId: car.carId,
        isPlayer: car.isPlayer,
        pos: { x: lerp(d.posX[idx], d.posX[nextIdx]), y: lerp(d.posY[idx], d.posY[nextIdx]) },
        vel: { x: lerp(d.velX[idx], d.velX[nextIdx]), y: lerp(d.velY[idx], d.velY[nextIdx]) },
        heading: lerp(d.heading[idx], d.heading[nextIdx]),
        throttle: lerp(d.throttle[idx], d.throttle[nextIdx]),
        brake: lerp(d.brake[idx], d.brake[nextIdx]),
        steer: lerp(d.steer[idx], d.steer[nextIdx]),
      };
    });

    return { time: this.state.time, cars };
  }
}
