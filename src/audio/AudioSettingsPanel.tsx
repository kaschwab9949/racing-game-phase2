// AudioSettingsPanel: UI for controlling audio settings
import React, { useState, useEffect } from 'react';
import { AudioEngine } from './AudioEngine';

const sliderStyle = { width: '100%' };

export const AudioSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState(AudioEngine.instance.getSettings());

  useEffect(() => {
    AudioEngine.instance.setSettings(settings);
    // Optionally persist settings here
  }, [settings]);

  function handleChange(key: keyof typeof settings, value: number | boolean) {
    setSettings(s => ({ ...s, [key]: value }));
  }

  return (
    <div style={{ padding: 16, background: '#222', color: '#eee', borderRadius: 8, maxWidth: 320 }}>
      <h3>Audio Settings</h3>
      <label>Master Volume
        <input type="range" min={0} max={1} step={0.01} value={settings.masterVolume} style={sliderStyle}
          onChange={e => handleChange('masterVolume', Number(e.target.value))} />
      </label>
      <label>Engine Volume
        <input type="range" min={0} max={1} step={0.01} value={settings.engineVolume} style={sliderStyle}
          onChange={e => handleChange('engineVolume', Number(e.target.value))} />
      </label>
      <label>Tire Squeal Volume
        <input type="range" min={0} max={1} step={0.01} value={settings.tireVolume} style={sliderStyle}
          onChange={e => handleChange('tireVolume', Number(e.target.value))} />
      </label>
      <label>SFX Volume
        <input type="range" min={0} max={1} step={0.01} value={settings.sfxVolume} style={sliderStyle}
          onChange={e => handleChange('sfxVolume', Number(e.target.value))} />
      </label>
      <label>UI Volume
        <input type="range" min={0} max={1} step={0.01} value={settings.uiVolume} style={sliderStyle}
          onChange={e => handleChange('uiVolume', Number(e.target.value))} />
      </label>
      <label style={{ display: 'block', marginTop: 8 }}>
        <input type="checkbox" checked={settings.muted} onChange={e => handleChange('muted', e.target.checked)} /> Mute All
      </label>
    </div>
  );
};
