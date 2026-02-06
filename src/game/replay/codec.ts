import type { EncodedSeries } from './types';

function int32ToBase64(arr: Int32Array): string {
  const bytes = new Uint8Array(arr.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToInt32(data: string): Int32Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int32Array(bytes.buffer);
}

export function encodeSeries(values: number[], scale: number): EncodedSeries {
  const quantized = values.map(v => Math.round(v * scale));
  const deltas = new Int32Array(quantized.length);
  let prev = 0;
  for (let i = 0; i < quantized.length; i++) {
    const d = quantized[i] - prev;
    deltas[i] = d;
    prev = quantized[i];
  }
  return { scale, data: int32ToBase64(deltas) };
}

export function decodeSeries(series: EncodedSeries): number[] {
  const deltas = base64ToInt32(series.data);
  const values: number[] = new Array(deltas.length);
  let prev = 0;
  for (let i = 0; i < deltas.length; i++) {
    const v = prev + deltas[i];
    values[i] = v / series.scale;
    prev = v;
  }
  return values;
}
