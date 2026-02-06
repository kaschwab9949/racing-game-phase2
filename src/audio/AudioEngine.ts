// Core AudioEngine: manages WebAudio context, buses, pooling
import { AudioBus, AudioBusType } from './AudioBus';

export type AudioEngineSettings = {
  masterVolume: number;
  engineVolume: number;
  tireVolume: number;
  sfxVolume: number;
  uiVolume: number;
  muted: boolean;
};

export class AudioEngine {
  private ctx: AudioContext;
  private buses: Record<AudioBusType, AudioBus>;
  private settings: AudioEngineSettings;
  private static _instance: AudioEngine;
  private degradedToOffline = false;

  private constructor() {
    // Some browsers/platforms throw if AudioContext is created before a user gesture.
    // We fall back to an OfflineAudioContext so the rest of the game can run.
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (err) {
      console.warn('AudioContext unavailable; falling back to OfflineAudioContext (audio disabled).', err);
      const Offline = (window as any).OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      if (!Offline) {
        // Last resort: rethrow; boot overlay will show the error.
        throw err;
      }
      this.ctx = new Offline(1, 1, 44100) as AudioContext;
      this.degradedToOffline = true;
    }
    this.buses = {
      master: new AudioBus(this.ctx, 'master'),
      engine: new AudioBus(this.ctx, 'engine'),
      tire: new AudioBus(this.ctx, 'tire'),
      sfx: new AudioBus(this.ctx, 'sfx'),
      ui: new AudioBus(this.ctx, 'ui'),
    };
    this.settings = {
      masterVolume: 1,
      engineVolume: 1,
      tireVolume: 1,
      sfxVolume: 1,
      uiVolume: 1,
      muted: this.degradedToOffline,
    };
    this.updateVolumes();
  }

  static get instance() {
    if (!AudioEngine._instance) {
      AudioEngine._instance = new AudioEngine();
    }
    return AudioEngine._instance;
  }

  get context() {
    return this.ctx;
  }

  getBus(type: AudioBusType) {
    return this.buses[type];
  }

  setSettings(settings: Partial<AudioEngineSettings>) {
    Object.assign(this.settings, settings);
    this.updateVolumes();
  }

  getSettings(): AudioEngineSettings {
    return { ...this.settings };
  }

  updateVolumes() {
    const { masterVolume, engineVolume, tireVolume, sfxVolume, uiVolume, muted } = this.settings;
    this.buses.master.setVolume(muted ? 0 : masterVolume);
    this.buses.engine.setVolume(muted ? 0 : engineVolume);
    this.buses.tire.setVolume(muted ? 0 : tireVolume);
    this.buses.sfx.setVolume(muted ? 0 : sfxVolume);
    this.buses.ui.setVolume(muted ? 0 : uiVolume);
  }

  resume() {
    if (this.degradedToOffline) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  suspend() {
    if (this.degradedToOffline) return;
    if (this.ctx.state === 'running') this.ctx.suspend();
  }
}
