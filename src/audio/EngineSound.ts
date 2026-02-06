// EngineSound: synth-based, rpm/throttle driven
import { AudioEngine } from './AudioEngine';

export class EngineSound {
  private ctx: AudioContext;
  private osc: OscillatorNode;
  private gain: GainNode;
  private carId: string;
  private bus: GainNode;
  private active: boolean = false;

  constructor(carId: string) {
    this.ctx = AudioEngine.instance.context;
    this.carId = carId;
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sawtooth';
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.001;
    this.bus = AudioEngine.instance.getBus('engine').input;
    this.osc.connect(this.gain);
    this.gain.connect(this.bus);
    this.osc.start();
  }

  update(rpm: number, throttle: number) {
    // Map rpm to frequency (e.g. 50Hz to 4000Hz)
    const freq = 50 + Math.min(4000, rpm * 0.5);
    this.osc.frequency.value = freq;
    // Gain based on throttle and rpm
    this.gain.gain.value = 0.05 + 0.25 * throttle + 0.2 * Math.min(1, rpm / 8000);
    this.active = true;
  }

  stop() {
    this.gain.gain.value = 0;
    this.active = false;
  }

  dispose() {
    this.osc.stop();
    this.osc.disconnect();
    this.gain.disconnect();
  }
}
