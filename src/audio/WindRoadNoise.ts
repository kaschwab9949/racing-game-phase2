// WindRoadNoise: speed-driven filtered noise
import { AudioEngine } from './AudioEngine';
import { randRange } from '../devtools/determinism/Random';

export class WindRoadNoise {
  private ctx: AudioContext;
  private noise: AudioBufferSourceNode;
  private gain: GainNode;
  private filter: BiquadFilterNode;
  private bus: GainNode;
  private buffer: AudioBuffer;
  private active: boolean = false;

  constructor() {
    this.ctx = AudioEngine.instance.context;
    this.bus = AudioEngine.instance.getBus('sfx').input;
    this.buffer = this.createNoiseBuffer();
    this.noise = this.ctx.createBufferSource();
    this.noise.buffer = this.buffer;
    this.noise.loop = true;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.001;
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 1200;
    this.noise.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.bus);
    this.noise.start();
  }

  update(speed: number) {
    // speed: 0..max
    this.gain.gain.value = Math.min(0.5, speed * 0.01);
    this.filter.frequency.value = 1200 + speed * 10;
    this.active = speed > 5;
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
