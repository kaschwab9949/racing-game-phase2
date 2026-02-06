import React from 'react';

interface AssistsDisplayProps {
  abs: boolean;
  tcs: boolean;
}

export const AssistsDisplay: React.FC<AssistsDisplayProps> = ({ abs, tcs }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'sans-serif',
        fontSize: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}
    >
      <div>
        <span style={{ color: tcs ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>TCS</span> (T)
      </div>
      <div>
        <span style={{ color: abs ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>ABS</span> (Y)
      </div>
    </div>
  );
};
