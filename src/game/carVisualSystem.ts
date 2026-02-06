import type { Vec2 } from './math';
import { randRange } from '../devtools/determinism/Random';
import type { CarRenderProfile, CarSpec } from './cars/specs/types';

export type CarVisualUiState = {
  overlayVisible: boolean;
  showGuides: boolean;
  spinTest: { enabled: boolean; speedDegPerSec: number };
  jitterTest: { enabled: boolean; amplitudePx: number; speedHz: number };
  spec: CarSpec;
  profile: CarRenderProfile;
  pxPerMeter: number;
  activeProfileId: string;
  realProfile: CarRenderProfile;
  gameplayProfile: CarRenderProfile;
};

export type CarVisualRenderState = {
  spec: CarSpec;
  profile: CarRenderProfile;
  showGuides: boolean;
  overrideHeading: number | null;
  overridePosition: Vec2 | null;
  jitterOffset: Vec2;
};

export class CarVisualSystem {
  private spec: CarSpec;
  private profile: CarRenderProfile;
  private realProfile: CarRenderProfile;
  private gameplayProfile: CarRenderProfile;
  private activeProfileId: string = 'GameplayDialed';

  private overlayVisible = false;
  private showGuides = true;

  private spinEnabled = false;
  private spinSpeedRad = Math.PI * 0.6;
  private spinAngle = 0;
  private spinAnchor: Vec2 | null = null;

  private jitterEnabled = false;
  private jitterAmplitudePx = 2;
  private jitterSpeedHz = 2.5;
  private jitterPhase = 0;

  constructor(spec: CarSpec, profile: CarRenderProfile) {
    this.spec = spec;
    this.profile = profile;
    this.realProfile = profile;
    this.gameplayProfile = profile;
  }

  update(dt: number): void {
    if (this.spinEnabled) {
      this.spinAngle += this.spinSpeedRad * dt;
      if (this.spinAngle > Math.PI * 2) this.spinAngle -= Math.PI * 2;
    }

    if (this.jitterEnabled) {
      this.jitterPhase += dt * this.jitterSpeedHz * Math.PI * 2;
    }
  }

  setCar(spec: CarSpec, profile: CarRenderProfile): void {
    this.spec = spec;
    this.profile = profile;
    this.realProfile = profile;
    this.gameplayProfile = profile;
  }

  toggleOverlay(): void {
    this.overlayVisible = !this.overlayVisible;
  }

  setOverlayVisible(value: boolean): void {
    this.overlayVisible = value;
  }

  toggleGuides(): void {
    this.showGuides = !this.showGuides;
  }

  setGuides(value: boolean): void {
    this.showGuides = value;
  }

  setSpinTest(enabled: boolean, speedDegPerSec?: number, anchor?: Vec2): void {
    this.spinEnabled = enabled;
    if (speedDegPerSec !== undefined) {
      this.spinSpeedRad = (speedDegPerSec * Math.PI) / 180;
    }
    if (enabled && anchor) {
      this.spinAnchor = { ...anchor };
    }
    if (!enabled) {
      this.spinAngle = 0;
      this.spinAnchor = null;
    }
  }

  setJitterTest(enabled: boolean, amplitudePx?: number, speedHz?: number): void {
    this.jitterEnabled = enabled;
    if (amplitudePx !== undefined) this.jitterAmplitudePx = amplitudePx;
    if (speedHz !== undefined) this.jitterSpeedHz = speedHz;
  }

  setActiveProfile(id: string): void {
    this.activeProfileId = id;
    this.profile = id === 'RealSpec' ? this.realProfile : this.gameplayProfile;
  }

  updateGameplayTuning(partial: Partial<CarRenderProfile['tuning']>): void {
    this.gameplayProfile.tuning = {
      ...this.gameplayProfile.tuning,
      ...partial,
    };
    if (this.activeProfileId === 'GameplayDialed') {
      this.profile = this.gameplayProfile;
    }
  }

  saveGameplayProfile(): void {
    // In a real app, this would be saved to localStorage or a server
    console.log('Saving gameplay profile:', this.gameplayProfile);
  }

  loadGameplayProfile(): void {
    // In a real app, this would be loaded from localStorage or a server
    console.log('Loading gameplay profile');
  }

  getUiState(pxPerMeter: number): CarVisualUiState {
    return {
      overlayVisible: this.overlayVisible,
      showGuides: this.showGuides,
      spinTest: { enabled: this.spinEnabled, speedDegPerSec: (this.spinSpeedRad * 180) / Math.PI },
      jitterTest: {
        enabled: this.jitterEnabled,
        amplitudePx: this.jitterAmplitudePx,
        speedHz: this.jitterSpeedHz,
      },
      spec: this.spec,
      profile: this.profile,
      pxPerMeter,
      activeProfileId: this.activeProfileId,
      realProfile: this.realProfile,
      gameplayProfile: this.gameplayProfile,
    };
  }

  getRenderState(pxPerMeter: number, carPos: Vec2, carHeading: number): CarVisualRenderState {
    let jitterOffset: Vec2 = { x: 0, y: 0 };
    if (this.jitterEnabled) {
      const angle = randRange(0, Math.PI * 2);
      const magnitude = randRange(0, this.jitterAmplitudePx);
      jitterOffset = {
        x: Math.cos(angle) * magnitude,
        y: Math.sin(angle) * magnitude,
      };
    }

    return {
      spec: this.spec,
      profile: this.profile,
      showGuides: this.showGuides && this.overlayVisible,
      overrideHeading: this.spinEnabled ? this.spinAngle : null,
      overridePosition: this.spinEnabled ? this.spinAnchor : null,
      jitterOffset,
    };
  }
}
