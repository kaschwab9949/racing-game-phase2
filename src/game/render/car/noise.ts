type NoiseOptions = {
  size: number;
  intensity: number;
  seed: number;
  alpha: number;
};

function lcg(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 48271) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function createNoiseCanvas(options: NoiseOptions): HTMLCanvasElement {
  const { size, intensity, seed, alpha } = options;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rand = lcg(seed);
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = Math.floor(rand() * 255);
    const shade = Math.max(0, Math.min(255, value * intensity));
    image.data[i] = shade;
    image.data[i + 1] = shade;
    image.data[i + 2] = shade;
    image.data[i + 3] = Math.floor(alpha * 255);
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

const noiseCache = new Map<string, CanvasPattern>();

export function getNoisePattern(ctx: CanvasRenderingContext2D, options: NoiseOptions): CanvasPattern {
  const key = `${options.size}-${options.intensity}-${options.seed}-${options.alpha}`;
  const cached = noiseCache.get(key);
  if (cached) return cached;

  const canvas = createNoiseCanvas(options);
  const pattern = ctx.createPattern(canvas, 'repeat');
  if (!pattern) {
    throw new Error('Failed to create noise pattern');
  }
  noiseCache.set(key, pattern);
  return pattern;
}
