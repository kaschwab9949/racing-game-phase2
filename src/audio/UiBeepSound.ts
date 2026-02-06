// UiBeepSound: simple beep for menu actions
import { AudioEngine } from './AudioEngine';

export class UiBeepSound {
  private ctx: AudioContext;
  private bus: GainNode;

  constructor() {
    this.ctx = AudioEngine.instance.context;
    this.bus = AudioEngine.instance.getBus('ui').input;
  }

  play(type: 'select' | 'back' | 'error' = 'select') {
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = type === 'select' ? 880 : type === 'back' ? 440 : 220;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(this.bus);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
}
