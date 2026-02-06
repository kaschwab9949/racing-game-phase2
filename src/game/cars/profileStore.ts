import type { CarRenderProfile, CarRenderProfileTuning } from './types';

const STORAGE_KEY = 'car-visual-profile-gameplay-v1';

export type StoredProfile = {
  tuning: CarRenderProfileTuning;
  bodyWidthScale: number;
  stanceScale: number;
  fenderBulge: number;
};

export function saveProfileToStorage(profile: CarRenderProfile): void {
  const payload: StoredProfile = {
    tuning: profile.tuning,
    bodyWidthScale: profile.bodyWidthScale,
    stanceScale: profile.stanceScale,
    fenderBulge: profile.fenderBulge,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadProfileFromStorage(base: CarRenderProfile): CarRenderProfile {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return base;

  try {
    const data = JSON.parse(raw) as StoredProfile;
    return {
      ...base,
      tuning: { ...base.tuning, ...data.tuning },
      bodyWidthScale: Number.isFinite(data.bodyWidthScale) ? data.bodyWidthScale : base.bodyWidthScale,
      stanceScale: Number.isFinite(data.stanceScale) ? data.stanceScale : base.stanceScale,
      fenderBulge: Number.isFinite(data.fenderBulge) ? data.fenderBulge : base.fenderBulge,
    };
  } catch {
    return base;
  }
}

export function clearStoredProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}
