export type InputAxes = {
  throttle: number;
  brake: number;
  steer: number;
  abs: boolean;
  tcs: boolean;
};

export class Input {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private absEnabled = true;
  private tcsEnabled = true;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.keys.has(e.code)) {
      this.pressed.add(e.code);
    }
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }

  getAxes(): InputAxes {
    if (this.wasPressed('KeyY')) {
      this.absEnabled = !this.absEnabled;
    }
    if (this.wasPressed('KeyT')) {
      this.tcsEnabled = !this.tcsEnabled;
    }

    let throttle = 0;
    let brake = 0;
    let steer = 0;

    if (this.isDown('KeyW') || this.isDown('ArrowUp')) throttle = 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) brake = 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) steer -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) steer += 1;

    return {
      throttle,
      brake,
      steer,
      abs: this.absEnabled,
      tcs: this.tcsEnabled,
    };
  }

  endFrame() {
    this.pressed.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
