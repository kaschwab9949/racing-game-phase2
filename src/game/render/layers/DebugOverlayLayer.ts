import type { TrackModel } from '../../track/TrackModel';
import type { Vec2 } from '../../math';
import type { GraphicsSettings } from '../../settings/graphicsTypes';
import type { AiDebugState } from '../../ai/types';

export type DebugOverlayInput = {
  track: TrackModel;
  playerPos: Vec2;
  trackDebugEnabled: boolean;
  ai: { enabled: boolean; states: AiDebugState[] };
};

export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  input: DebugOverlayInput,
  settings: GraphicsSettings,
): void {
  ctx.save();
  if (input.trackDebugEnabled && settings.debugOverlay) {
    ctx.strokeStyle = 'rgba(0,200,255,0.6)';
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    for (let i = 0; i < input.track.samples.length; i += 8) {
      const s = input.track.samples[i];
      if (i === 0) ctx.moveTo(s.pos.x, s.pos.y);
      else ctx.lineTo(s.pos.x, s.pos.y);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,80,80,0.9)';
    ctx.beginPath();
    ctx.arc(input.playerPos.x, input.playerPos.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (input.ai.enabled) {
    for (const state of input.ai.states) {
      for (const command of state.commands) {
        drawCommand(ctx, command);
      }
    }
  }
  ctx.restore();
}

function drawCommand(ctx: CanvasRenderingContext2D, command: AiDebugState['commands'][number]): void {
  switch (command.type) {
    case 'line': {
      if (!command.points.length) break;
      ctx.strokeStyle = command.color;
      ctx.lineWidth = 0.18;
      ctx.beginPath();
      ctx.moveTo(command.points[0].x, command.points[0].y);
      for (let i = 1; i < command.points.length; i++) {
        ctx.lineTo(command.points[i].x, command.points[i].y);
      }
      ctx.stroke();
      break;
    }
    case 'point': {
      ctx.fillStyle = command.color;
      ctx.beginPath();
      ctx.arc(command.pos.x, command.pos.y, 0.8, 0, Math.PI * 2);
      ctx.fill();
      if (command.label) {
        ctx.font = '1.4px "Space Grotesk", sans-serif';
        ctx.fillText(command.label, command.pos.x + 0.6, command.pos.y - 0.6);
      }
      break;
    }
    case 'text': {
      ctx.font = '1.6px "Space Grotesk", sans-serif';
      ctx.fillStyle = command.color;
      ctx.fillText(command.text, command.pos.x, command.pos.y);
      break;
    }
    case 'arc': {
      ctx.strokeStyle = command.color;
      ctx.lineWidth = 0.15;
      ctx.beginPath();
      ctx.arc(command.center.x, command.center.y, command.radius, command.startAngle, command.endAngle);
      ctx.stroke();
      break;
    }
  }
}
