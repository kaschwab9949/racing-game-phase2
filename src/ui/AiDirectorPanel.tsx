import type { AiDebugState, AiGlobalSettings, AiIntent } from '../game/ai/types';
import { useMemo } from 'react';

export type AiDirectorPanelProps = {
  open: boolean;
  states: AiDebugState[];
  settings: AiGlobalSettings;
  onClose: () => void;
  onSettingsChange: (patch: Partial<AiGlobalSettings>) => void;
};

const intentLabels: Record<AiIntent['type'], string> = {
  follow_line: 'Following Line',
  overtake_inside: 'Dive Inside',
  overtake_outside: 'Sweep Outside',
  defend_line: 'Defending',
  error_brake_lockup: 'Brake Lockup',
  error_late_apex: 'Late Apex',
};

export function AiDirectorPanel({ open, states, settings, onClose, onSettingsChange }: AiDirectorPanelProps) {
  const orderedStates = useMemo(() => [...states].sort((a, b) => a.carId - b.carId), [states]);
  if (!open) return null;
  return (
    <section className="ai-panel" aria-label="AI race director">
      <div className="ai-panel__gradient" />
      <div className="ai-panel__shell">
        <header className="ai-panel__header">
          <div>
            <p className="ai-panel__eyebrow">Race Control</p>
            <h2>Adaptive AI</h2>
            <p className="ai-panel__subtitle">Tweak aggression, watch intents, and stream their overlay live.</p>
          </div>
          <div className="ai-panel__headerActions">
            <button className="ai-chip" onClick={() => onSettingsChange({ debugEnabled: !settings.debugEnabled })}>
              {settings.debugEnabled ? 'Overlay: Visible' : 'Overlay: Hidden'}
            </button>
            <button className="ai-chip ai-chip--ghost" onClick={onClose}>Close</button>
          </div>
        </header>

        <div className="ai-panel__settings">
          <SliderControl
            label="Race Difficulty"
            hint="Blends braking margins, throttle confidence, and reaction time."
            value={settings.difficulty}
            onChange={(value) => onSettingsChange({ difficulty: value })}
          />
          <SliderControl
            label="Aggression"
            hint="Controls how eager drivers are to launch overtakes."
            value={settings.aggression}
            onChange={(value) => onSettingsChange({ aggression: value })}
          />
          <SliderControl
            label="Awareness"
            hint="Higher awareness keeps mirrors checked and avoids chaos."
            value={settings.awareness}
            onChange={(value) => onSettingsChange({ awareness: value })}
          />
        </div>

        <div className="ai-panel__grid">
          {orderedStates.length === 0 && (
            <div className="ai-panel__empty">AI controllers will populate once the session begins.</div>
          )}
          {orderedStates.map(state => (
            <article key={state.carId} className="ai-card">
              <div className="ai-card__title">{state.carLabel}</div>
              <div className="ai-card__skill">{state.skill.name}</div>
              <div className="ai-card__meta">
                <span>Intent</span>
                <strong>{intentLabels[state.intent.type]}</strong>
              </div>
              <div className="ai-card__meta">
                <span>Target Speed</span>
                <strong>{Math.round(state.targetSpeed * 3.6)} km/h</strong>
              </div>
              <div className="ai-card__bars">
                <StatBar label="Aggression" value={state.skill.aggression} tone="hot" />
                <StatBar label="Awareness" value={state.skill.awareness} tone="calm" />
                <StatBar label="Discipline" value={state.skill.discipline} tone="focus" />
                <StatBar label="Bravery" value={state.skill.bravery} tone="bold" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SliderControl({ label, hint, value, onChange }: { label: string; hint: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="ai-panel__control">
      <div>
        <p className="ai-panel__controlLabel">{label}</p>
        <p className="ai-panel__controlHint">{hint}</p>
      </div>
      <div className="ai-panel__controlInput">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(event) => onChange(parseFloat(event.target.value))}
        />
        <span>{Math.round(value * 100)}%</span>
      </div>
    </label>
  );
}

function StatBar({ label, value, tone }: { label: string; value: number; tone: 'hot' | 'calm' | 'focus' | 'bold' }) {
  return (
    <div className={`ai-bar ai-bar--${tone}`}>
      <div className="ai-bar__label">{label}</div>
      <div className="ai-bar__track">
        <div className="ai-bar__fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}
