import type { Vec2 } from '../math';
import { dist, normalize, sub, dot, perp } from '../math';
import type { TrackControlPoint, TrackSample, TrackMetadata, TrackCorner, TrackSector } from './types';
import { catmullRom, catmullRomDerivative } from './spline';

export class TrackModel {
  public readonly metadata: TrackMetadata;
  public readonly corners: TrackCorner[];
  public readonly sectors: TrackSector[];
  
  private controlPoints: TrackControlPoint[];
  public samples: TrackSample[] = [];
  public length: number = 0;

  constructor(
    metadata: TrackMetadata,
    controlPoints: TrackControlPoint[],
    corners: TrackCorner[],
    sectors: TrackSector[]
  ) {
    this.metadata = metadata;
    this.controlPoints = controlPoints;
    this.corners = corners;
    this.sectors = sectors;
    this.build();
  }

  private build() {
    // Generate high-res samples
    const samples: TrackSample[] = [];
    const stepsPerSegment = 20; // Resolution
    const pts = this.controlPoints;
    const numPts = pts.length;

    let totalLen = 0;

    for (let i = 0; i < numPts; i++) {
      const p0 = pts[(i - 1 + numPts) % numPts];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % numPts];
      const p3 = pts[(i + 2) % numPts];

      for (let j = 0; j < stepsPerSegment; j++) {
        const t = j / stepsPerSegment;
        const pos = catmullRom(p0.pos, p1.pos, p2.pos, p3.pos, t);
        
        // Approximate deriv for tangent
        const deriv = catmullRomDerivative(p0.pos, p1.pos, p2.pos, p3.pos, t);
        const tangent = normalize(deriv);
        // Normal points to the Right
        const normal = { x: tangent.y, y: -tangent.x };

        // Interpolate widths
        // Cubic interpolation for width would be nice, but linear often suffices.
        // Let's stick to linear for width to avoid overshooting.
        const widthLeft = p1.widthLeft + (p2.widthLeft - p1.widthLeft) * t;
        const widthRight = p1.widthRight + (p2.widthRight - p1.widthRight) * t;

        // Calculate distance from previous sample
        let ds = 0;
        if (samples.length > 0) {
          ds = dist(samples[samples.length - 1].pos, pos);
        }
        totalLen += ds;

        samples.push({
          s: totalLen, // Note: This accumulates error, we reconstruct exact S later if needed
          pos,
          tangent,
          normal,
          widthLeft,
          widthRight,
          surface: p1.surface
        });
      }
    }

    // Fixup S values and total length normalization
    // In a closed loop, the last sample connects to the first?
    // Actually our sampling loop goes form i=0 to N-1, covering segment p1->p2.
    // So we cover the whole track.
    // The totalLen computed is the loop length.

    this.length = totalLen;
    
    // Normalize samples S and create LUT
    // We'll just keep the raw samples array, it acts as our LUT.
    this.samples = samples;
  }

  public getSampleAtS(s: number): TrackSample {
    // Wrap S
    const wrappedS = ((s % this.length) + this.length) % this.length;
    
    // Binary search or direct index lookup?
    // Since samples are not perfectly equidistant, we search.
    // BUT we built them iteratively, they are roughly equidistant.
    // Let's use binary search for precision.
    let lo = 0, hi = this.samples.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (this.samples[mid].s < wrappedS) {
        lo = mid + 1;
      } else {
        hi = mid - 1; 
      }
    }
    
    // lo is now the index of the sample >= wrappedS
    // We interpolate between lo-1 and lo
    const idxB = lo % this.samples.length;
    const idxA = (lo - 1 + this.samples.length) % this.samples.length;

    const sampleA = this.samples[idxA];
    const sampleB = this.samples[idxB];

    // Handle wrap-around case for interpolation
    let distAB = sampleB.s - sampleA.s;
    let distToS = wrappedS - sampleA.s;
    if (distAB < 0) {
        // Wrap around happened (sampleA is near end, sampleB is near start 0)
        distAB += this.length;
    }
    // Also check if wrappedS is smaller than sampleA.s (meaning we wrapped)
    if (distToS < 0) {
        distToS += this.length;
    }

    const t = distAB > 0.0001 ? distToS / distAB : 0;

    return {
        s: wrappedS,
        pos: {
            x: sampleA.pos.x + (sampleB.pos.x - sampleA.pos.x) * t,
            y: sampleA.pos.y + (sampleB.pos.y - sampleA.pos.y) * t,
        },
        tangent: {
            x: sampleA.tangent.x + (sampleB.tangent.x - sampleA.tangent.x) * t,
            y: sampleA.tangent.y + (sampleB.tangent.y - sampleA.tangent.y) * t,
        }, // Should normalize but we skip for perf unless needed
        normal: {
            x: sampleA.normal.x + (sampleB.normal.x - sampleA.normal.x) * t,
            y: sampleA.normal.y + (sampleB.normal.y - sampleA.normal.y) * t,
        },
        widthLeft: sampleA.widthLeft + (sampleB.widthLeft - sampleA.widthLeft) * t,
        widthRight: sampleA.widthRight + (sampleB.widthRight - sampleA.widthRight) * t,
        surface: sampleA.surface
    };
  }

  public project(pos: Vec2): { s: number; dist: number; sample: TrackSample } {
    // Brute force scan over samples (optimize later if needed)
    // 2000-4000 samples is cheap for JS per frame (1-2ms).
    
    let closestDistSq = Infinity;
    let closestSample = this.samples[0];
    let closestIdx = 0;

    // Phase 1: Coarse find nearest sample
    // Skip step optimization could be dangerous on hairpins, so we step e.g. every 5
    const step = 4; // optimization
    for (let i = 0; i < this.samples.length; i += step) {
        const smp = this.samples[i];
        const dx = pos.x - smp.pos.x;
        const dy = pos.y - smp.pos.y;
        const dSq = dx*dx + dy*dy;
        if (dSq < closestDistSq) {
            closestDistSq = dSq;
            closestSample = smp;
            closestIdx = i;
        }
    }

    // Phase 2: Refine neighborhood
    let bestDistSq = closestDistSq;
    let bestIdx = closestIdx;
    
    // Check neighbors
    const range = step * 2;
    for (let i = closestIdx - range; i <= closestIdx + range; i++) {
        const idx = (i + this.samples.length) % this.samples.length;
        const smp = this.samples[idx];
        const dx = pos.x - smp.pos.x;
        const dy = pos.y - smp.pos.y;
        const dSq = dx*dx + dy*dy;
        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestIdx = idx;
        }
    }

    // Precise projection onto the segment [bestIdx-1, bestIdx] vs [bestIdx, bestIdx+1]
    // We basically project point P onto line AB.
    const trySegment = (idx1: number, idx2: number) => {
        const p1 = this.samples[idx1].pos;
        const p2 = this.samples[idx2].pos;
        
        // Vector v = p2 - p1
        const vx = p2.x - p1.x;
        const vy = p2.y - p1.y;
        const lenSq = vx*vx + vy*vy;
        if (lenSq < 0.00001) return { dSq: Infinity, t: 0, s: this.samples[idx1].s };

        // Vector w = pos - p1
        const wx = pos.x - p1.x;
        const wy = pos.y - p1.y;

        // t = dot(w, v) / lenSq
        let t = (wx*vx + wy*vy) / lenSq;
        // clamp t [0, 1]
        t = Math.max(0, Math.min(1, t));

        // Projection point
        const proxX = p1.x + t * vx;
        const proxY = p1.y + t * vy;
        
        const distSq = (pos.x - proxX)**2 + (pos.y - proxY)**2;
        
        // Interpolate s
        // Handle wrapping S math carefully.
        let s1 = this.samples[idx1].s;
        let s2 = this.samples[idx2].s;
        if (s2 < s1) s2 += this.length; // wrap case
        
        let s = s1 + t * (s2 - s1);
        if (s >= this.length) s -= this.length;

        return { dSq: distSq, t, s };
    };

    const prevIdx = (bestIdx - 1 + this.samples.length) % this.samples.length;
    const nextIdx = (bestIdx + 1) % this.samples.length;

    const resPrev = trySegment(prevIdx, bestIdx);
    const resNext = trySegment(bestIdx, nextIdx);

    let finalS = 0;
    let finalDSq = 0;

    if (resPrev.dSq < resNext.dSq) {
        finalS = resPrev.s;
        finalDSq = resPrev.dSq;
    } else {
        finalS = resNext.s;
        finalDSq = resNext.dSq;
    }

    return {
        s: finalS,
        dist: Math.sqrt(finalDSq),
        sample: this.getSampleAtS(finalS)
    };
  }

  public getSector(s: number): TrackSector | undefined {
      // Linear scan of 3 sectors is fine
      const wrappedS = ((s % this.length) + this.length) % this.length;
      return this.sectors.find(sec => {
          if (sec.startS < sec.endS) {
              return wrappedS >= sec.startS && wrappedS < sec.endS;
          } else {
              // Wrap around sector (e.g. crossing finish)
              return wrappedS >= sec.startS || wrappedS < sec.endS;
          }
      });
  }

  public getCorner(s: number): TrackCorner | undefined {
      // Find corner we are "in" or "approaching"? Usually "in".
      const wrappedS = ((s % this.length) + this.length) % this.length;
        return this.corners.find(c => {
            if (c.startS < c.endS) {
                return wrappedS >= c.startS && wrappedS <= c.endS;
            } else {
                return wrappedS >= c.startS || wrappedS <= c.endS;
            }
        });
  }
}
