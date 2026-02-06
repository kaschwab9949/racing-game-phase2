import type { ChangeEvent } from 'react';

export type CarTuningRowProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  realMm: number;
  tunedMm: number;
  pxPerMeter: number;
  percentDelta: number;
  onChange: (value: number) => void;
};

function formatMm(value: number): string {
  return `${value.toFixed(0)} mm`;
}

function formatMeters(value: number): string {
  return `${value.toFixed(3)} m`;
}

function formatPx(mm: number, pxPerMeter: number): string {
  const meters = mm / 1000;
  return `${(meters * pxPerMeter).toFixed(1)} px`;
}

export function CarTuningRow(props: CarTuningRowProps) {
  const { label, value, min, max, step, realMm, tunedMm, pxPerMeter, percentDelta, onChange } = props;
  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(event.target.value));
  };

  return (
    <div className="tuning-row">
      <div className="tuning-label">{label}</div>
      <input
        className="tuning-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onInput}
      />
      <div className="tuning-values">
        <div className="tuning-value">Scale: {value.toFixed(3)}</div>
        <div className="tuning-value">Real: {formatMm(realMm)}</div>
        <div className="tuning-value">Tuned: {formatMm(tunedMm)}</div>
        <div className="tuning-value">World: {formatMeters(tunedMm / 1000)}</div>
        <div className="tuning-value">Pixels: {formatPx(tunedMm, pxPerMeter)}</div>
        <div className={`tuning-value ${percentDelta >= 0 ? 'positive' : 'negative'}`}>
          Δ {percentDelta.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
