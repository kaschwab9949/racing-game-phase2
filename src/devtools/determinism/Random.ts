export interface RandomSource {
  next(): number; // returns [0, 1)
}

export class MathRandomSource implements RandomSource {
  next(): number {
    return Math.random();
  }
}

export class Mulberry32Random implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return result;
  }
}

export class Xorshift32Random implements RandomSource {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 0x12345678;
  }

  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return (this.state >>> 0) / 4294967296;
  }
}

export type RandomStreamId = string;

export class RandomContext {
  private static active: RandomSource = new MathRandomSource();
  private static rootSeed = 1;
  private static streams = new Map<RandomStreamId, RandomSource>();

  static useMathRandom(): void {
    this.active = new MathRandomSource();
  }

  static setSeed(seed: number, algorithm: 'mulberry32' | 'xorshift32' = 'mulberry32'): void {
    this.rootSeed = seed >>> 0;
    this.streams.clear();
    this.active = algorithm === 'mulberry32'
      ? new Mulberry32Random(this.rootSeed)
      : new Xorshift32Random(this.rootSeed);
  }

  static getSeed(): number {
    return this.rootSeed;
  }

  static setSource(source: RandomSource): void {
    this.active = source;
  }

  static next(): number {
    return this.active.next();
  }

  static range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  static int(min: number, max: number): number {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return Math.floor(this.range(lo, hi + 1));
  }

  static bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  static pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error('RandomContext.pick requires a non-empty array');
    }
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  static jitter(amount: number): number {
    return (this.next() - 0.5) * amount * 2;
  }

  static normal(mean = 0, stdDev = 1): number {
    // Box-Muller
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    const mag = Math.sqrt(-2.0 * Math.log(u));
    const z0 = mag * Math.cos(2.0 * Math.PI * v);
    return mean + z0 * stdDev;
  }

  static fork(streamId: RandomStreamId, salt = 0): RandomSource {
    const key = `${streamId}_${salt}`;
    const existing = this.streams.get(key);
    if (existing) return existing;
    const seed = hashSeed(`${this.rootSeed}:${streamId}:${salt}`);
    const source = new Mulberry32Random(seed);
    this.streams.set(key, source);
    return source;
  }
}

export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rand(): number {
  return RandomContext.next();
}

export function randRange(min: number, max: number): number {
  return RandomContext.range(min, max);
}

export function randInt(min: number, max: number): number {
  return RandomContext.int(min, max);
}

export function randBool(probability = 0.5): boolean {
  return RandomContext.bool(probability);
}

export function randPick<T>(items: T[]): T {
  return RandomContext.pick(items);
}
