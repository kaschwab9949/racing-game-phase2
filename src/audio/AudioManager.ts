// AudioManager: pools and maps car audio generators, handles updates
import { AudioEngine } from './AudioEngine';
import { EngineSound } from './EngineSound';
import { TireSquealSound } from './TireSquealSound';
import { WindRoadNoise } from './WindRoadNoise';
import { CollisionSound } from './CollisionSound';
import { UiBeepSound } from './UiBeepSound';
import { CarAudioChannels } from './types';

export class AudioManager {
  private carAudio: Map<string, CarAudioChannels> = new Map();
  private collision: CollisionSound;
  private ui: UiBeepSound;

  constructor() {
    this.collision = new CollisionSound();
    this.ui = new UiBeepSound();
  }

  addCar(carId: string) {
    if (this.carAudio.has(carId)) return;
    this.carAudio.set(carId, {
      engine: new EngineSound(carId),
      tires: new TireSquealSound(),
      wind: new WindRoadNoise(),
    });
  }

  removeCar(carId: string) {
    const audio = this.carAudio.get(carId);
    if (audio) {
      audio.engine.dispose();
      audio.tires.dispose();
      audio.wind.dispose();
      this.carAudio.delete(carId);
    }
  }

  updateCar(carId: string, params: { rpm: number; throttle: number; slip: number; speed: number }) {
    const audio = this.carAudio.get(carId);
    if (!audio) return;
    audio.engine.update(params.rpm, params.throttle);
    audio.tires.update(params.slip);
    audio.wind.update(params.speed);
  }

  playCollision(strength: number) {
    this.collision.play(strength);
  }

  playUi(type: 'select' | 'back' | 'error') {
    this.ui.play(type);
  }

  stopCar(carId: string) {
    const audio = this.carAudio.get(carId);
    if (audio) {
      audio.engine.stop();
      audio.tires.stop();
      audio.wind.stop();
    }
  }

  setSettings(settings: Partial<AudioEngine['settings']>) {
    AudioEngine.instance.setSettings(settings);
  }
}
