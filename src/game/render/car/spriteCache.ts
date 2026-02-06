export type SpriteAsset = {
  path: string;
  image: HTMLImageElement;
  canvas: HTMLCanvasElement | null;
  ready: boolean;
  failed: boolean;
  trim: { x: number; y: number; width: number; height: number } | null;
  originalWidth: number;
  originalHeight: number;
  transparentRatio: number;
};

export type SpriteProcessOptions = {
  maskThreshold?: number;
  trimPadding?: number;
};

const spriteCache = new Map<string, SpriteAsset>();
const DEFAULT_MASK_THRESHOLD = 45;
const DEFAULT_TRIM_PADDING = 3;

export function getSpriteAsset(path: string, options: SpriteProcessOptions = {}): SpriteAsset {
  const key = buildCacheKey(path, options);
  const existing = spriteCache.get(key);
  if (existing) return existing;

  const image = new Image();
  const asset: SpriteAsset = {
    path,
    image,
    canvas: null,
    ready: false,
    failed: false,
    trim: null,
    originalWidth: 0,
    originalHeight: 0,
    transparentRatio: 0,
  };
  spriteCache.set(key, asset);

  image.onload = () => {
    try {
      const processed = processSprite(image, options);
      asset.canvas = processed.canvas;
      asset.trim = processed.trim;
      asset.originalWidth = processed.originalWidth;
      asset.originalHeight = processed.originalHeight;
      asset.transparentRatio = processed.transparentRatio;
      asset.ready = true;
    } catch (err) {
      console.warn(`Failed to process sprite ${path}`, err);
      asset.failed = true;
    }
  };
  image.onerror = () => {
    asset.failed = true;
  };
  image.src = path;

  return asset;
}

function buildCacheKey(path: string, options: SpriteProcessOptions): string {
  const threshold = options.maskThreshold ?? DEFAULT_MASK_THRESHOLD;
  const padding = options.trimPadding ?? DEFAULT_TRIM_PADDING;
  return `${path}|t${threshold}|p${padding}`;
}

function processSprite(
  image: HTMLImageElement,
  options: SpriteProcessOptions,
): {
  canvas: HTMLCanvasElement;
  trim: { x: number; y: number; width: number; height: number } | null;
  originalWidth: number;
  originalHeight: number;
  transparentRatio: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create sprite canvas');

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const originalWidth = canvas.width;
  const originalHeight = canvas.height;

  if (!hasTransparency(ctx, canvas.width, canvas.height)) {
    const threshold = options.maskThreshold ?? DEFAULT_MASK_THRESHOLD;
    removeBackgroundWithFloodFill(ctx, canvas.width, canvas.height, threshold);
  }

  const padding = options.trimPadding ?? DEFAULT_TRIM_PADDING;
  const trimmed = trimTransparentBorders(ctx, canvas.width, canvas.height, padding);

  const trimCtx = trimmed.canvas.getContext('2d');
  if (!trimCtx) throw new Error('Failed to create trimmed sprite context');
  const transparentRatio = calcTransparentRatio(trimCtx, trimmed.canvas.width, trimmed.canvas.height);

  return {
    canvas: trimmed.canvas,
    trim: trimmed.trim,
    originalWidth,
    originalHeight,
    transparentRatio,
  };
}

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const data = ctx.getImageData(0, 0, width, height).data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }
  return false;
}

function removeBackgroundWithFloodFill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  threshold: number,
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  const thrSq = threshold * threshold;

  const push = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (queue.length) {
    const idx = queue.pop()!;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const baseOffset = idx * 4;
    const br = data[baseOffset];
    const bg = data[baseOffset + 1];
    const bb = data[baseOffset + 2];

    data[baseOffset + 3] = 0;

    const x = idx % width;
    const y = Math.floor(idx / width);

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nIdx = ny * width + nx;
      if (visited[nIdx]) continue;
      const nOffset = nIdx * 4;
      const nr = data[nOffset];
      const ng = data[nOffset + 1];
      const nb = data[nOffset + 2];
      const na = data[nOffset + 3];
      if (na === 0) {
        queue.push(nIdx);
        continue;
      }
      const dr = nr - br;
      const dg = ng - bg;
      const db = nb - bb;
      const distSq = dr * dr + dg * dg + db * db;
      if (distSq <= thrSq) {
        queue.push(nIdx);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function trimTransparentBorders(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
): { canvas: HTMLCanvasElement; trim: { x: number; y: number; width: number; height: number } | null } {
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4 + 3;
      if (data[idx] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { canvas: ctx.canvas, trim: null };
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const trimWidth = maxX - minX + 1;
  const trimHeight = maxY - minY + 1;
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimWidth;
  trimmedCanvas.height = trimHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');
  if (!trimmedCtx) throw new Error('Failed to create trimmed sprite canvas');
  trimmedCtx.drawImage(ctx.canvas, minX, minY, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);

  return {
    canvas: trimmedCanvas,
    trim: { x: minX, y: minY, width: trimWidth, height: trimHeight },
  };
}

function calcTransparentRatio(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  const data = ctx.getImageData(0, 0, width, height).data;
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) transparent++;
  }
  return transparent / (width * height);
}
