import { DEFAULT_GRAPHICS_SETTINGS, GRAPHICS_STORAGE_KEY, type GraphicsSettings, type GraphicsSettingsPatch, mergeSettings, clampSettings } from './graphicsTypes';

function safeParse(json: string): GraphicsSettings | null {
  try {
    const parsed = JSON.parse(json) as GraphicsSettings;
    return mergeSettings(DEFAULT_GRAPHICS_SETTINGS, parsed);
  } catch (e) {
    console.warn('Failed to parse graphics settings', e);
    return null;
  }
}

export function loadGraphicsSettings(): GraphicsSettings {
  if (typeof window === 'undefined') return { ...DEFAULT_GRAPHICS_SETTINGS };
  const cached = window.localStorage.getItem(GRAPHICS_STORAGE_KEY);
  if (!cached) return { ...DEFAULT_GRAPHICS_SETTINGS };
  return safeParse(cached) ?? { ...DEFAULT_GRAPHICS_SETTINGS };
}

export function saveGraphicsSettings(settings: GraphicsSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GRAPHICS_STORAGE_KEY, JSON.stringify(clampSettings(settings)));
  } catch (e) {
    console.warn('Failed to persist graphics settings', e);
  }
}

export function updateGraphicsSettings(current: GraphicsSettings, patch: GraphicsSettingsPatch): GraphicsSettings {
  const merged = mergeSettings(current, patch);
  saveGraphicsSettings(merged);
  return merged;
}
