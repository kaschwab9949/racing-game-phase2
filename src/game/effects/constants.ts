// Constants for driving feedback effects

/**
 * Skidmark rendering constants
 */
export const SKIDMARK_CONSTANTS = {
  /** Width of skidmark trail in meters */
  WIDTH: 0.15,
  /** Maximum age before fading (seconds) */
  MAX_AGE: 30,
  /** Fade start age (seconds) */
  FADE_START: 20,
  /** Base color for skidmarks */
  BASE_COLOR: '#1a1a1a',
  /** Minimum slip ratio to start leaving marks */
  MIN_SLIP_RATIO: 0.3,
  /** Segment spacing in meters */
  SEGMENT_SPACING: 0.2,
  /** Maximum segments per trail */
  MAX_SEGMENTS: 500,
} as const;

/**
 * Particle system constants
 */
export const PARTICLE_CONSTANTS = {
  /** Maximum particles in pool */
  MAX_PARTICLES: 300,
  /** Particle emission rate (particles/second at full slip) */
  EMISSION_RATE: 30,
  /** Dust particle lifetime (seconds) */
  DUST_LIFETIME: 1.2,
  /** Smoke particle lifetime (seconds) */
  SMOKE_LIFETIME: 0.8,
  /** Dust particle size range (meters) */
  DUST_SIZE_MIN: 0.1,
  DUST_SIZE_MAX: 0.3,
  /** Smoke particle size range (meters) */
  SMOKE_SIZE_MIN: 0.15,
  SMOKE_SIZE_MAX: 0.4,
  /** Dust color (desert theme) */
  DUST_COLOR: '#c2a880',
  /** Smoke color (tire rubber) */
  SMOKE_COLOR: '#404040',
  /** Minimum slip ratio to emit particles */
  MIN_SLIP_RATIO: 0.4,
  /** Spread angle for particle emission (radians) */
  SPREAD_ANGLE: Math.PI / 6,
  /** Initial velocity magnitude (m/s) */
  INITIAL_VELOCITY: 2,
} as const;

/**
 * Shadow rendering constants
 */
export const SHADOW_CONSTANTS = {
  /** Shadow offset from car (meters) */
  OFFSET_X: 0.3,
  OFFSET_Y: 0.3,
  /** Shadow blur radius (meters) */
  BLUR_RADIUS: 0.5,
  /** Shadow opacity */
  OPACITY: 0.3,
  /** Shadow color */
  COLOR: 'rgba(0, 0, 0, 0.4)',
  /** Contact patch width (meters) */
  CONTACT_PATCH_WIDTH: 0.2,
  /** Contact patch length (meters) */
  CONTACT_PATCH_LENGTH: 0.3,
  /** Contact patch opacity */
  CONTACT_PATCH_OPACITY: 0.5,
} as const;

/**
 * Camera shake constants
 */
export const CAMERA_SHAKE_CONSTANTS = {
  /** Speed threshold to start shaking (m/s) */
  SPEED_THRESHOLD: 30,
  /** Maximum shake intensity at high speeds */
  MAX_INTENSITY: 0.15,
  /** Shake frequency (Hz) */
  FREQUENCY: 12,
  /** Decay rate when below threshold */
  DECAY_RATE: 5,
  /** Camera smoothing factor (0-1, higher = smoother) */
  SMOOTHING: 0.85,
} as const;

/**
 * Debug visualization constants
 */
export const DEBUG_CONSTANTS = {
  /** Bar graph height (pixels) */
  BAR_HEIGHT: 100,
  /** Bar width (pixels) */
  BAR_WIDTH: 60,
  /** Text size (pixels) */
  TEXT_SIZE: 12,
  /** Padding (pixels) */
  PADDING: 10,
  /** Colors for slip visualization */
  COLORS: {
    LOW_SLIP: '#00ff00',
    MED_SLIP: '#ffff00',
    HIGH_SLIP: '#ff0000',
  },
} as const;
