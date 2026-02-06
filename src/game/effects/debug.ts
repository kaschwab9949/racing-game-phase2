// Debug overlay for visualizing slip and effects triggers

import type { PhysicsTelemetry, SlipDebugInfo } from './types';
import { DEBUG_CONSTANTS } from './constants';

/**
 * Debug visualization for slip ratios and effects
 */
export class EffectsDebugOverlay {
  private debugInfo: SlipDebugInfo = {
    frontSlip: 0,
    rearSlip: 0,
    slipAngle: 0,
    particlesEmitted: 0,
    skidmarksActive: false,
  };

  /**
   * Update debug info
   */
  update(telemetry: PhysicsTelemetry, particleCount: number, skidmarkActive: boolean): void {
    this.debugInfo.frontSlip = telemetry.frontSlipRatio;
    this.debugInfo.rearSlip = telemetry.rearSlipRatio;
    this.debugInfo.slipAngle = telemetry.slipAngle;
    this.debugInfo.particlesEmitted = particleCount;
    this.debugInfo.skidmarksActive = skidmarkActive;
  }

  /**
   * Render debug overlay
   */
  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const { PADDING, BAR_WIDTH, BAR_HEIGHT, TEXT_SIZE } = DEBUG_CONSTANTS;
    const startX = PADDING;
    const startY = ctx.canvas.height - BAR_HEIGHT - PADDING * 4;

    // Background panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(startX - PADDING / 2, startY - PADDING * 2, BAR_WIDTH * 3 + PADDING * 4, BAR_HEIGHT + PADDING * 3.5);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${TEXT_SIZE + 2}px monospace`;
    ctx.fillText('SLIP DEBUG', startX, startY - PADDING);

    // Draw slip bars
    this.renderSlipBar(ctx, startX, startY, this.debugInfo.frontSlip, 'Front Slip');
    this.renderSlipBar(ctx, startX + BAR_WIDTH + PADDING, startY, this.debugInfo.rearSlip, 'Rear Slip');
    this.renderSlipBar(ctx, startX + (BAR_WIDTH + PADDING) * 2, startY, Math.abs(this.debugInfo.slipAngle) / (Math.PI / 4), 'Slip Angle');

    // Effects status
    const statusY = startY + BAR_HEIGHT + PADDING * 1.5;
    ctx.font = `${TEXT_SIZE}px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Particles: ${this.debugInfo.particlesEmitted}`, startX, statusY);
    ctx.fillText(`Skidmarks: ${this.debugInfo.skidmarksActive ? 'ON' : 'OFF'}`, startX + BAR_WIDTH + PADDING, statusY);

    ctx.restore();
  }

  private renderSlipBar(ctx: CanvasRenderingContext2D, x: number, y: number, value: number, label: string): void {
    const { BAR_WIDTH, BAR_HEIGHT, TEXT_SIZE, COLORS } = DEBUG_CONSTANTS;

    // Clamp value to [0, 1]
    const clampedValue = Math.max(0, Math.min(1, value));

    // Determine color based on value
    let color: string = COLORS.LOW_SLIP;
    if (clampedValue > 0.7) {
      color = COLORS.HIGH_SLIP;
    } else if (clampedValue > 0.4) {
      color = COLORS.MED_SLIP;
    }

    // Draw bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, BAR_WIDTH, BAR_HEIGHT);

    // Draw bar fill
    const fillHeight = BAR_HEIGHT * clampedValue;
    ctx.fillStyle = color;
    ctx.fillRect(x, y + BAR_HEIGHT - fillHeight, BAR_WIDTH, fillHeight);

    // Draw bar outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, BAR_WIDTH, BAR_HEIGHT);

    // Draw label
    ctx.fillStyle = '#ffffff';
    ctx.font = `${TEXT_SIZE}px monospace`;
    ctx.fillText(label, x, y - 5);

    // Draw value
    ctx.fillText(clampedValue.toFixed(2), x + 5, y + BAR_HEIGHT / 2);
  }

  /**
   * Render compact version (just values)
   */
  renderCompact(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const x = 10;
    const y = ctx.canvas.height - 60;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 5, y - 20, 250, 50);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px monospace';
    ctx.fillText(`Front: ${this.debugInfo.frontSlip.toFixed(2)} | Rear: ${this.debugInfo.rearSlip.toFixed(2)}`, x, y);
    ctx.fillText(`Angle: ${(this.debugInfo.slipAngle * 180 / Math.PI).toFixed(1)}° | Particles: ${this.debugInfo.particlesEmitted}`, x, y + 15);

    ctx.restore();
  }
}
