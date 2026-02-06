// TireSquealSound: slip-driven noise
import { AudioEngine } from './AudioEngine';
import { randRange } from '../devtools/determinism/Random';

export class TireSquealSound {
  private ctx: AudioContext;
  private noise: AudioBufferSourceNode;
  private gain: GainNode;
  private filter: BiquadFilterNode;
  private bus: GainNode;
  private buffer: AudioBuffer;
  private active: boolean = false;

  constructor() {
    this.ctx = AudioEngine.instance.context;
    this.bus = AudioEngine.instance.getBus('tire').input;
    this.buffer = this.createNoiseBuffer();
    this.noise = this.ctx.createBufferSource();
    this.noise.buffer = this.buffer;
    this.noise.loop = true;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.001;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'highpass';
    this.filter.frequency.value = 800;
    this.noise.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.bus);
    this.noise.start();
  }

  update(slip: number) {
    // slip: 0..1
    this.gain.gain.value = Math.min(1, slip * 0.7);
    this.filter.frequency.value = 800 + slip * 4000;
    this.active = slip > 0.05;
  }

  stop() {
    this.gain.gain.value = 0;
    this.active = false;
  }

  dispose() {
    this.noise.stop();
    this.noise.disconnect();
    this.gain.disconnect();
    this.filter.disconnect();
  }

  private createNoiseBuffer(): AudioBuffer {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = randRange(-1, 1);
    }
    return buffer;
  }
}
