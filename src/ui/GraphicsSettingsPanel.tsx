import React, { useMemo } from 'react';
import { useGraphicsSettings } from '../game/settings/GraphicsSettingsContext';
import type { GraphicsSettings } from '../game/settings/graphicsTypes';
import { GRAPHICS_BOUNDS } from '../game/settings/graphicsTypes';

function LabeledRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
      <div style={{ width: 130, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

export function GraphicsSettingsPanel() {
  const { settings, update } = useGraphicsSettings();

  const renderScalePct = useMemo(() => Math.round(settings.renderScale * 100), [settings.renderScale]);

  const apply = (patch: Partial<GraphicsSettings>) => update(patch);

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        width: 340,
        padding: '12px 14px',
        background: 'rgba(15, 16, 24, 0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        color: '#eee',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(8px)',
        zIndex: 120,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, letterSpacing: 0.5 }}>Graphics Settings</div>
        <div style={{ opacity: 0.7, fontSize: 12 }}>Live</div>
      </div>

      <LabeledRow label={`Render Scale (${renderScalePct}%)`}>
        <input
          type="range"
          min={GRAPHICS_BOUNDS.renderScale.min}
          max={GRAPHICS_BOUNDS.renderScale.max}
          step={0.05}
          value={settings.renderScale}
          onChange={(e) => apply({ renderScale: Number(e.target.value) })}
          style={{ width: '100%' }}
        />
      </LabeledRow>

      <LabeledRow label="Shadows">
        <Toggle checked={settings.shadows} onChange={(v) => apply({ shadows: v })} />
      </LabeledRow>

      <LabeledRow label="Skidmarks">
        <Toggle checked={settings.skidmarks} onChange={(v) => apply({ skidmarks: v })} />
      </LabeledRow>

      <LabeledRow label="Particles">
        <Toggle checked={settings.particles} onChange={(v) => apply({ particles: v })} />
      </LabeledRow>

      <LabeledRow label="Post FX">
        <Toggle checked={settings.post} onChange={(v) => apply({ post: v })} />
      </LabeledRow>

      <LabeledRow label="Antialias">
        <select value={settings.antialias} onChange={(e) => apply({ antialias: e.target.value as GraphicsSettings['antialias'] })}
          style={{ width: '100%', padding: '6px 8px', background: '#111', color: '#eee', border: '1px solid #333' }}>
          <option value="smooth">Smooth</option>
          <option value="pixel">Pixel-snap</option>
        </select>
      </LabeledRow>

      <LabeledRow label="Camera Shake">
        <Toggle checked={settings.cameraShake} onChange={(v) => apply({ cameraShake: v })} />
      </LabeledRow>

      <LabeledRow label="Debug Overlay">
        <Toggle checked={settings.debugOverlay} onChange={(v) => apply({ debugOverlay: v })} />
      </LabeledRow>

      <LabeledRow label="Effects Debug">
        <Toggle checked={settings.effectsDebug} onChange={(v) => apply({ effectsDebug: v })} />
      </LabeledRow>

      <LabeledRow label="Perf HUD">
        <Toggle checked={settings.perfHud} onChange={(v) => apply({ perfHud: v })} />
      </LabeledRow>

      <LabeledRow label="Show Ghost">
        <Toggle checked={settings.showGhost} onChange={(v) => apply({ showGhost: v })} />
      </LabeledRow>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
        Changes apply immediately and persist in localStorage. Performance guardrails may override some settings; use the Perf HUD to monitor.
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{checked ? 'On' : 'Off'}</span>
    </label>
  );
}
