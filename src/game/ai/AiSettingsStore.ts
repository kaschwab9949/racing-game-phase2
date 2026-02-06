import { clamp } from '../math';
import { randRange } from '../../devtools/determinism/Random';
import type { AiGlobalSettings, AiSkillProfile } from './types';

export const DEFAULT_AI_GLOBAL_SETTINGS: AiGlobalSettings = {
  difficulty: 0.72,
  aggression: 0.65,
  awareness: 0.7,
  debugEnabled: false,
};

const SKILL_PRESETS: Omit<AiSkillProfile, 'name'>[] = [
  { aggression: 0.85, awareness: 0.6, discipline: 0.55, bravery: 0.8 },
  { aggression: 0.55, awareness: 0.85, discipline: 0.7, bravery: 0.5 },
  { aggression: 0.7, awareness: 0.75, discipline: 0.85, bravery: 0.65 },
  { aggression: 0.45, awareness: 0.65, discipline: 0.9, bravery: 0.4 },
];

export class AiSettingsStore {
  private global: AiGlobalSettings = { ...DEFAULT_AI_GLOBAL_SETTINGS };
  private driverSeed = 0;

  getGlobal(): AiGlobalSettings {
    return { ...this.global };
  }

  updateGlobal(patch: Partial<AiGlobalSettings>): AiGlobalSettings {
    this.global = {
      ...this.global,
      ...patch,
      difficulty: clamp(patch.difficulty ?? this.global.difficulty, 0.2, 1),
      aggression: clamp(patch.aggression ?? this.global.aggression, 0, 1),
      awareness: clamp(patch.awareness ?? this.global.awareness, 0, 1),
      debugEnabled: patch.debugEnabled ?? this.global.debugEnabled,
    };
    return this.getGlobal();
  }

  createDriverSkill(labelSeed?: number): AiSkillProfile {
    const index = labelSeed ?? this.driverSeed++;
    const base = SKILL_PRESETS[index % SKILL_PRESETS.length];
    const jitter = () => randRange(-0.1, 0.1);
    return {
      name: `Driver ${index + 1}`,
      aggression: clamp(base.aggression + jitter(), 0, 1),
      awareness: clamp(base.awareness + jitter(), 0, 1),
      discipline: clamp(base.discipline + jitter(), 0, 1),
      bravery: clamp(base.bravery + jitter(), 0, 1),
    };
  }
}
