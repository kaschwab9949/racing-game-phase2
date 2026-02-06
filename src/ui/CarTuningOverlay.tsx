import type { CarRenderProfileTuning } from '../game/cars/specs/types';
import type { CarVisualUiState } from '../game/carVisualSystem';
import { DEFAULT_TUNING_ORDER, DEFAULT_TUNING_RANGES } from '../game/cars/profileDefaults';
import { CarTuningRow } from './CarTuningRow';

export type CarTuningOverlayProps = {
  carVisual: CarVisualUiState;
  onClose: () => void;
  onProfileChange: (id: string) => void;
  onUpdateTuning: (partial: Partial<CarRenderProfileTuning>) => void;
  onToggleGuides: (value: boolean) => void;
  onSpinToggle: (value: boolean) => void;
  onSpinSpeedChange: (value: number) => void;
  onJitterToggle: (value: boolean) => void;
  onJitterAmplitudeChange: (value: number) => void;
  onJitterSpeedChange: (value: number) => void;
  onSaveProfile: () => void;
  onLoadProfile: () => void;
};

const TUNING_MM_BASE: Record<keyof CarRenderProfileTuning, (spec: CarVisualUiState['spec']) => number> = {
  wheelbaseScale: spec => spec.wheelbaseMm,
  trackScale: spec => (spec.frontTrackMm + spec.rearTrackMm) * 0.5,
  frontOverhangScale: spec => spec.frontOverhangMm,
  rearOverhangScale: spec => spec.rearOverhangMm,
  cabinLengthScale: spec => spec.cabinLengthMm,
  roofWidthScale: spec => spec.roofWidthMm,
  wheelRadiusScale: spec => spec.wheelRadiusMm,
};

export function CarTuningOverlay(props: CarTuningOverlayProps) {
  const { carVisual: state } = props;
  if (!state.overlayVisible) return null;

  const activeProfile = state.activeProfileId === 'RealSpec' ? state.realProfile : state.gameplayProfile;
  const gameplayProfile = state.gameplayProfile;

  return (
    <div className="tuning-overlay">
      <div className="tuning-panel">
        <div className="tuning-header">
          <div>
            <div className="tuning-title">Car Visual Tuning</div>
            <div className="tuning-subtitle">{state.spec.displayName} • {state.spec.modelYear}</div>
          </div>
          <button className="tuning-button" onClick={props.onClose}>Close (V)</button>
        </div>

        <div className="tuning-section">
          <div className="tuning-section-title">Profiles</div>
          <div className="tuning-buttons">
            <button
              className={`tuning-button ${state.activeProfileId === 'RealSpec' ? 'active' : ''}`}
              onClick={() => props.onProfileChange('RealSpec')}
            >A • RealSpec</button>
            <button
              className={`tuning-button ${state.activeProfileId === 'GameplayDialed' ? 'active' : ''}`}
              onClick={() => props.onProfileChange('GameplayDialed')}
            >B • GameplayDialed</button>
          </div>
          <div className="tuning-meta">Active: {activeProfile.label}</div>
        </div>

        <div className="tuning-section">
          <div className="tuning-section-title">Tuning Ratios (Profile B)</div>
          {DEFAULT_TUNING_ORDER.map(key => {
            const range = DEFAULT_TUNING_RANGES[key];
            const baseMm = TUNING_MM_BASE[key](state.spec);
            const tunedMm = baseMm * gameplayProfile.tuning[key];
            const percentDelta = ((tunedMm - baseMm) / baseMm) * 100;

            return (
              <CarTuningRow
                key={key}
                label={range.label}
                value={gameplayProfile.tuning[key]}
                min={range.min}
                max={range.max}
                step={range.step}
                realMm={baseMm}
                tunedMm={tunedMm}
                pxPerMeter={state.pxPerMeter}
                percentDelta={percentDelta}
                onChange={(value) => props.onUpdateTuning({ [key]: value } as Partial<CarRenderProfileTuning>)}
              />
            );
          })}
        </div>

        <div className="tuning-section">
          <div className="tuning-section-title">Visual Guides</div>
          <label className="tuning-toggle">
            <input
              type="checkbox"
              checked={state.showGuides}
              onChange={(event) => props.onToggleGuides(event.target.checked)}
            />
            <span>Show axle/track/overhang guides</span>
          </label>
        </div>

        <div className="tuning-section">
          <div className="tuning-section-title">Motion Stability</div>
          <label className="tuning-toggle">
            <input
              type="checkbox"
              checked={state.spinTest.enabled}
              onChange={(event) => props.onSpinToggle(event.target.checked)}
            />
            <span>Spin test</span>
          </label>
          <div className="tuning-inline">
            <div className="tuning-label">Spin speed</div>
            <input
              className="tuning-slider"
              type="range"
              min={10}
              max={240}
              step={1}
              value={state.spinTest.speedDegPerSec}
              onChange={(event) => props.onSpinSpeedChange(parseFloat(event.target.value))}
            />
            <div className="tuning-meta">{state.spinTest.speedDegPerSec.toFixed(0)}°/s</div>
          </div>

          <label className="tuning-toggle">
            <input
              type="checkbox"
              checked={state.jitterTest.enabled}
              onChange={(event) => props.onJitterToggle(event.target.checked)}
            />
            <span>Camera jitter test</span>
          </label>
          <div className="tuning-inline">
            <div className="tuning-label">Jitter amplitude</div>
            <input
              className="tuning-slider"
              type="range"
              min={0}
              max={8}
              step={0.25}
              value={state.jitterTest.amplitudePx}
              onChange={(event) => props.onJitterAmplitudeChange(parseFloat(event.target.value))}
            />
            <div className="tuning-meta">{state.jitterTest.amplitudePx.toFixed(2)} px</div>
          </div>
          <div className="tuning-inline">
            <div className="tuning-label">Jitter speed</div>
            <input
              className="tuning-slider"
              type="range"
              min={0.5}
              max={6}
              step={0.1}
              value={state.jitterTest.speedHz}
              onChange={(event) => props.onJitterSpeedChange(parseFloat(event.target.value))}
            />
            <div className="tuning-meta">{state.jitterTest.speedHz.toFixed(1)} Hz</div>
          </div>
        </div>

        <div className="tuning-section">
          <div className="tuning-section-title">Profile Storage</div>
          <div className="tuning-buttons">
            <button className="tuning-button" onClick={props.onSaveProfile}>Save Profile B</button>
            <button className="tuning-button" onClick={props.onLoadProfile}>Load Profile B</button>
          </div>
          <div className="tuning-meta">Stored in localStorage only.</div>
        </div>
      </div>
    </div>
  );
}
