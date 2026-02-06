import React, { useState } from 'react';
import type { TrackConditionManager } from '../TrackConditionManager';

interface Props {
  manager: TrackConditionManager;
}

export const TrackConditionHud: React.FC<Props> = ({ manager }) => {
  const [config, setConfig] = useState(manager.getConfig());
  const [showHeatmap, setShowHeatmap] = useState(false);

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
    // In actual implementation, this would communicate to the parent to show EvolutionHeatmap
  };

  const updateConfig = (patch: Partial<typeof config>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    manager.setConfig(next);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      width: '220px',
      border: '1px solid #444',
      zIndex: 10
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #666' }}>Track Evolution</h3>
      
      <div style={{ marginBottom: '8px' }}>
        <label>
          <input 
            type="checkbox" 
            checked={config.enabled} 
            onChange={e => updateConfig({ enabled: e.target.checked })} 
          /> Enabled
        </label>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label>Heatmap Mode:</label>
        <select 
          value={config.heatmapMode} 
          onChange={e => updateConfig({ heatmapMode: e.target.value as any })}
          style={{ background: '#333', color: 'white', marginLeft: '5px' }}
        >
          <option value="grip">Grip</option>
          <option value="temp">Temperature</option>
          <option value="rubber">Rubber</option>
          <option value="marbles">Marbles</option>
        </select>
      </div>

      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '10px' }}>
        <div>Ambient: {manager.getAtmosphere().getState().ambientTemp.toFixed(1)}°C</div>
        <div>Time: {manager.getAtmosphere().getTimeOfDay().toFixed(1)}h</div>
      </div>
      
      <button 
        onClick={toggleHeatmap}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '5px',
          background: showHeatmap ? '#cc0000' : '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {showHeatmap ? 'Hide Overlay' : 'Show Evolution Heatmap'}
      </button>
    </div>
  );
};
