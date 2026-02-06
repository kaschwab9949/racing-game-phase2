import type { GraphicsSettings, GraphicsSettingsPatch } from '../../settings/graphicsTypes';
import type { PerfFrame } from './PerfMonitor';

export type GuardrailAction = {
  applied: boolean;
  reason: string;
  patch: GraphicsSettingsPatch;
};

export class GuardrailController {
  private lowCounter = 0;
  private thresholdFps = 58;
  private windowFrames = 90;

  tick(frame: PerfFrame, currentSettings: GraphicsSettings): GuardrailAction | null {
    if (frame.fps < this.thresholdFps) this.lowCounter++; else this.lowCounter = 0;
    if (this.lowCounter < this.windowFrames) return null;
    this.lowCounter = 0;

    const patch: GraphicsSettingsPatch = {};
    if (currentSettings.renderScale > 0.85) {
      patch.renderScale = Math.max(0.75, currentSettings.renderScale - 0.1);
    } else if (currentSettings.particles) {
      patch.particles = false;
    } else if (currentSettings.skidmarks) {
      patch.skidmarks = false;
    } else if (currentSettings.post) {
      patch.post = false;
    } else {
      return null;
    }

    return {
      applied: true,
      reason: 'Performance guardrail: auto-tuning for FPS stability',
      patch,
    };
  }
}
