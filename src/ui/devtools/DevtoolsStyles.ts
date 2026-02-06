import type React from 'react';

export const panelStyle: React.CSSProperties = {
  position: 'absolute',
  right: 16,
  bottom: 16,
  width: 420,
  maxHeight: '80vh',
  overflow: 'auto',
  background: 'rgba(16,18,24,0.96)',
  border: '1px solid #2a2d3a',
  borderRadius: 10,
  padding: 14,
  color: '#e6e6e6',
  zIndex: 200,
  boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
};

export const sectionStyle: React.CSSProperties = {
  border: '1px solid #2a2d3a',
  borderRadius: 8,
  padding: 10,
  marginBottom: 12,
  background: 'rgba(24,26,34,0.9)',
};

export const labelStyle: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
  marginBottom: 4,
};

export const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
};

export const buttonStyle: React.CSSProperties = {
  background: '#1d1f27',
  color: '#e6e6e6',
  border: '1px solid #333',
  padding: '6px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
};

export const badgeStyle = (tone: 'good' | 'warn' | 'bad'): React.CSSProperties => ({
  padding: '2px 6px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  background:
    tone === 'good'
      ? 'rgba(34,197,94,0.2)'
      : tone === 'warn'
      ? 'rgba(251,146,60,0.2)'
      : 'rgba(239,68,68,0.2)',
  border:
    tone === 'good'
      ? '1px solid rgba(34,197,94,0.6)'
      : tone === 'warn'
      ? '1px solid rgba(251,146,60,0.6)'
      : '1px solid rgba(239,68,68,0.6)',
  color:
    tone === 'good'
      ? '#22c55e'
      : tone === 'warn'
      ? '#fb923c'
      : '#ef4444',
});
