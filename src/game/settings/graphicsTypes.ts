export type AntialiasMode = 'smooth' | 'pixel';

export type GraphicsSettings = {
  renderScale: number; // 0.75 .. 1.5
  shadows: boolean;
  skidmarks: boolean;
  particles: boolean;
  post: boolean;
  antialias: AntialiasMode;
  cameraShake: boolean;
  debugOverlay: boolean;
  effectsDebug: boolean;
  perfHud: boolean;
  showGhost: boolean;
};

export type GraphicsSettingsPatch = Partial<GraphicsSettings>;

export const GRAPHICS_STORAGE_KEY = 'racing-game.graphics-settings.v1';

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings = {
  renderScale: 1,
  shadows: true,
  skidmarks: true,
  particles: true,
  post: true,
  antialias: 'smooth',
  cameraShake: true,
  debugOverlay: false,
  effectsDebug: false,
  perfHud: false,
  showGhost: false,
};

export const GRAPHICS_BOUNDS = {
  renderScale: { min: 0.75, max: 1.5 },
};

export function clampSettings(settings: GraphicsSettings): GraphicsSettings {
  const { renderScale } = settings;
  const clamped: GraphicsSettings = {
    ...settings,
    renderScale: Math.max(GRAPHICS_BOUNDS.renderScale.min, Math.min(GRAPHICS_BOUNDS.renderScale.max, renderScale)),
  };
  return clamped;
}

export function mergeSettings(base: GraphicsSettings, patch: GraphicsSettingsPatch): GraphicsSettings {
  return clampSettings({ ...base, ...patch });
}

export function settingsEqual(a: GraphicsSettings, b: GraphicsSettings): boolean {
  return (
    a.renderScale === b.renderScale &&
    a.shadows === b.shadows &&
    a.skidmarks === b.skidmarks &&
    a.particles === b.particles &&
    a.post === b.post &&
    a.antialias === b.antialias &&
    a.cameraShake === b.cameraShake &&
    a.debugOverlay === b.debugOverlay &&
    a.effectsDebug === b.effectsDebug &&
    a.perfHud === b.perfHud &&
    a.showGhost === b.showGhost
  );
}

export type GraphicsNotice = {
  message: string;
  kind: 'info' | 'warn';
  ts: number;
};
