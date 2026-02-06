import React, { useMemo } from 'react';
import type { TrackConditionField } from '../TrackConditionField';
import type { TrackModel } from '../../track/TrackModel';
import { GripSolver } from '../GripSolver';

interface Props {
  field: TrackConditionField;
  track: TrackModel;
  mode: 'grip' | 'temp' | 'rubber' | 'marbles';
  visible: boolean;
}

/**
 * Renders a full-track heatmap overlay for condition visualization.
 */
export const EvolutionHeatmap: React.FC<Props> = ({ field, track, mode, visible }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 5,
      opacity: 0.6
    }}>
      <svg width="100%" height="100%" viewBox="0 0 1000 1000">
         {/* In a real project we would render this to a buffer or use Canvas. 
             This SVG approach is a conceptual high-level representation. */}
         {track.samples.filter((_, i) => i % 5 === 0).map((s, i) => {
           const latPoints = [-4, -2, 0, 2, 4]; // Sample across track width
           return latPoints.map(d => {
             const cell = field.getCell(s.s, d);
             let color = '#ccc';
             
             if (mode === 'grip') {
               const g = GripSolver.calculateGrip(cell).multiplier;
               color = `rgb(${Math.floor((1-g)*500)}, ${Math.floor(g*200)}, 50)`;
             } else if (mode === 'temp') {
               const t = (cell.surfaceTemp - 10) / 60;
               color = `rgb(${Math.floor(t*255)}, 50, ${Math.floor((1-t)*255)})`;
             } else if (mode === 'rubber') {
               color = `rgba(0,0,0,${cell.rubber})`;
             }
             
             return (
               <circle 
                 key={`${i}-${d}`}
                 cx={s.pos.x / 4 + 500} 
                 cy={s.pos.y / 4 + 500} 
                 r={1} 
                 fill={color} 
               />
             );
           });
         })}
      </svg>
    </div>
  );
};
