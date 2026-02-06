import { useEffect, useRef } from 'react';
import type { TelemetryChannelId, TelemetryLap } from '../../game/telemetry/types';
import { TELEMETRY_CHANNELS } from '../../game/telemetry/channels';

export type TelemetryGraphProps = {
  lap: TelemetryLap | null;
  bestLap: TelemetryLap | null;
  ghostLap: TelemetryLap | null;
  channels: TelemetryChannelId[];
  zoom: { start: number; end: number };
};

function getChannelValue(sample: any, channel: TelemetryChannelId): number {
  if (channel === 'gear') return sample.gear ?? 0;
  return sample[channel];
}

export function TelemetryGraph({ lap, bestLap, ghostLap, channels, zoom }: TelemetryGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (!lap || channels.length === 0) return;

    const samples = lap.samples;
    const totalS = samples.length ? samples[samples.length - 1].s : 1;
    const startS = zoom.start * totalS;
    const endS = zoom.end * totalS;

    const filtered = samples.filter((s) => s.s >= startS && s.s <= endS);
    if (filtered.length < 2) return;

    const channelInfo = TELEMETRY_CHANNELS.filter((c) => channels.includes(c.id));

    for (const channel of channelInfo) {
      let min = Infinity;
      let max = -Infinity;
      for (const sample of filtered) {
        const v = getChannelValue(sample, channel.id);
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (min === max) {
        min -= 1;
        max += 1;
      }

      ctx.strokeStyle = channel.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let i = 0; i < filtered.length; i++) {
        const sample = filtered[i];
        const v = getChannelValue(sample, channel.id);
        const x = ((sample.s - startS) / (endS - startS)) * width;
        const y = height - ((v - min) / (max - min)) * height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Optional overlays for best/ghost lap speed channel
    if (bestLap && channels.includes('speed')) {
      drawReference(ctx, bestLap, startS, endS, width, height, 'rgba(255,255,255,0.25)');
    }
    if (ghostLap && channels.includes('speed')) {
      drawReference(ctx, ghostLap, startS, endS, width, height, 'rgba(255,255,255,0.15)');
    }
  }, [lap, bestLap, ghostLap, channels, zoom]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={260}
      style={{ width: '100%', height: 260, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}
    />
  );
}

function drawReference(
  ctx: CanvasRenderingContext2D,
  lap: TelemetryLap,
  startS: number,
  endS: number,
  width: number,
  height: number,
  color: string
) {
  const samples = lap.samples.filter((s) => s.s >= startS && s.s <= endS);
  if (samples.length < 2) return;

  let min = Infinity;
  let max = -Infinity;
  for (const sample of samples) {
    const v = sample.speed;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) {
    min -= 1;
    max += 1;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const x = ((sample.s - startS) / (endS - startS)) * width;
    const y = height - ((sample.speed - min) / (max - min)) * height;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
