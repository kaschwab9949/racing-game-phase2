// CollisionSound: event-driven thump/impact
import { AudioEngine } from './AudioEngine';

export class CollisionSound {
  private ctx: AudioContext;
  private gain: GainNode;
  private bus: GainNode;

  constructor() {
    this.ctx = AudioEngine.instance.context;
    this.bus = AudioEngine.instance.getBus('sfx').input;
    this.gain = this.ctx.createGain();
    this.gain.connect(this.bus);
  }

  play(strength: number) {
    // strength: 0..1
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 80 + strength * 120;
    const impactGain = this.ctx.createGain();
    impactGain.gain.value = Math.min(1, 0.2 + strength * 0.8);
    osc.connect(impactGain);
    impactGain.connect(this.gain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12 + strength * 0.08);
    osc.onended = () => {
      osc.disconnect();
      impactGain.disconnect();
    };
  }
}
