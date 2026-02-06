// AudioBus: mixer bus for each sound type
export type AudioBusType = 'master' | 'engine' | 'tire' | 'sfx' | 'ui';

export class AudioBus {
  private ctx: AudioContext;
  private gain: GainNode;
  readonly type: AudioBusType;

  constructor(ctx: AudioContext, type: AudioBusType) {
    this.ctx = ctx;
    this.type = type;
    this.gain = ctx.createGain();
    this.gain.gain.value = 1;
    this.gain.connect(ctx.destination);
  }

  setVolume(vol: number) {
    this.gain.gain.value = Math.max(0, Math.min(1, vol));
  }

  get input() {
    return this.gain;
  }
}
