// Particle system with pooling for dust and tire smoke

import type { Vec2 } from '../math';
import type { PhysicsTelemetry, Particle } from './types';
import { PARTICLE_CONSTANTS } from './constants';
import { randRange } from '../../devtools/determinism/Random';

/**
 * Particle system with object pooling for performance
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId: number = 0;
  private emissionAccumulator: number = 0;

  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < PARTICLE_CONSTANTS.MAX_PARTICLES; i++) {
      this.particles.push(this.createParticle());
    }
  }

  private createParticle(): Particle {
    return {
      id: this.nextId++,
      active: false,
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      life: 0,
      maxLife: 1,
      size: 0.2,
      color: '#ffffff',
      alpha: 1,
      type: 'dust',
    };
  }

  /**
   * Update particle system based on physics telemetry
   */
  update(telemetry: PhysicsTelemetry, dt: number): void {
    // Update existing particles
    for (const particle of this.particles) {
      if (!particle.active) continue;

      // Update lifetime
      particle.life += dt;
      if (particle.life >= particle.maxLife) {
        particle.active = false;
        continue;
      }

      // Update position
      particle.pos.x += particle.vel.x * dt;
      particle.pos.y += particle.vel.y * dt;

      // Apply drag
      const drag = 0.95;
      particle.vel.x *= drag;
      particle.vel.y *= drag;

      // Update alpha (fade out over lifetime)
      const lifeRatio = particle.life / particle.maxLife;
      particle.alpha = Math.max(0, 1 - lifeRatio);
    }

    // Emit new particles based on slip
    this.emitParticles(telemetry, dt);
  }

  private emitParticles(telemetry: PhysicsTelemetry, dt: number): void {
    // Calculate slip intensity
    const maxSlip = Math.max(telemetry.frontSlipRatio, telemetry.rearSlipRatio);
    
    if (maxSlip < PARTICLE_CONSTANTS.MIN_SLIP_RATIO) {
      this.emissionAccumulator = 0;
      return;
    }

    // Calculate emission rate based on slip
    const emissionRate = PARTICLE_CONSTANTS.EMISSION_RATE * (maxSlip - PARTICLE_CONSTANTS.MIN_SLIP_RATIO) / (1 - PARTICLE_CONSTANTS.MIN_SLIP_RATIO);
    const particlesToEmit = emissionRate * dt;
    
    this.emissionAccumulator += particlesToEmit;

    // Emit particles
    while (this.emissionAccumulator >= 1) {
      this.emissionAccumulator -= 1;
      
      // Determine particle type based on surface and speed
      const isDust = telemetry.speed < 20 || telemetry.brakeInput < 0.5;
      
      this.emitParticle(telemetry, isDust ? 'dust' : 'smoke');
    }
  }

  private emitParticle(telemetry: PhysicsTelemetry, type: 'dust' | 'smoke'): void {
    // Find inactive particle
    const particle = this.particles.find(p => !p.active);
    if (!particle) return;

    // Calculate emission position (behind the car)
    const heading = telemetry.heading;
    const backOffset = -1.5; // meters behind car center
    const emitX = telemetry.position.x + Math.cos(heading) * backOffset;
    const emitY = telemetry.position.y + Math.sin(heading) * backOffset;

    // Random spread
    const spreadAngle = randRange(-0.5, 0.5) * PARTICLE_CONSTANTS.SPREAD_ANGLE;
    const angle = heading + Math.PI + spreadAngle;

    // Random velocity
    const velMag = PARTICLE_CONSTANTS.INITIAL_VELOCITY * randRange(0.8, 1.2);
    const velX = Math.cos(angle) * velMag;
    const velY = Math.sin(angle) * velMag;

    // Configure particle
    particle.active = true;
    particle.pos = { x: emitX, y: emitY };
    particle.vel = { x: velX, y: velY };
    particle.life = 0;
    particle.type = type;

    if (type === 'dust') {
      particle.maxLife = PARTICLE_CONSTANTS.DUST_LIFETIME * randRange(0.8, 1.2);
      particle.size = PARTICLE_CONSTANTS.DUST_SIZE_MIN + 
                     randRange(0, 1) * (PARTICLE_CONSTANTS.DUST_SIZE_MAX - PARTICLE_CONSTANTS.DUST_SIZE_MIN);
      particle.color = this.randomizeDustColor(PARTICLE_CONSTANTS.DUST_COLOR);
    } else {
      particle.maxLife = PARTICLE_CONSTANTS.SMOKE_LIFETIME * randRange(0.8, 1.2);
      particle.size = PARTICLE_CONSTANTS.SMOKE_SIZE_MIN + 
                     randRange(0, 1) * (PARTICLE_CONSTANTS.SMOKE_SIZE_MAX - PARTICLE_CONSTANTS.SMOKE_SIZE_MIN);
      particle.color = PARTICLE_CONSTANTS.SMOKE_COLOR;
    }

    particle.alpha = 1;
  }

  private randomizeDustColor(baseColor: string): string {
    // Parse hex color
    const hex = baseColor.replace('#', '');
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);

    // Add random variance
    const variance = 20;
    r = Math.max(0, Math.min(255, r + randRange(-0.5, 0.5) * variance));
    g = Math.max(0, Math.min(255, g + randRange(-0.5, 0.5) * variance));
    b = Math.max(0, Math.min(255, b + randRange(-0.5, 0.5) * variance));

    return `#${Math.floor(r).toString(16).padStart(2, '0')}${Math.floor(g).toString(16).padStart(2, '0')}${Math.floor(b).toString(16).padStart(2, '0')}`;
  }

  /**
   * Render particles to canvas
   */
  render(ctx: CanvasRenderingContext2D, camera: { pos: Vec2; pxPerMeter: number }): void {
    ctx.save();

    for (const particle of this.particles) {
      if (!particle.active) continue;

      // Convert world to screen coordinates
      const screenX = (particle.pos.x - camera.pos.x) * camera.pxPerMeter + ctx.canvas.width / 2;
      const screenY = (particle.pos.y - camera.pos.y) * camera.pxPerMeter + ctx.canvas.height / 2;

      // Skip if off-screen
      if (screenX < -50 || screenX > ctx.canvas.width + 50 || 
          screenY < -50 || screenY > ctx.canvas.height + 50) {
        continue;
      }

      const size = particle.size * camera.pxPerMeter;

      // Parse color and apply alpha
      const rgb = this.hexToRgb(particle.color);
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${particle.alpha * 0.6})`;

      // Draw particle
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Get count of active particles
   */
  getActiveCount(): number {
    return this.particles.filter(p => p.active).length;
  }

  /**
   * Clear all particles
   */
  clear(): void {
    for (const particle of this.particles) {
      particle.active = false;
    }
    this.emissionAccumulator = 0;
  }
}
