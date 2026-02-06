import type { BenchmarkResult } from '../../devtools/benchmark/types';
import type { RegressionReport } from '../../devtools/regression/types';
import { badgeStyle, labelStyle, rowStyle, sectionStyle } from './DevtoolsStyles';

export function RegressionPanel({
  current,
  previous,
  report,
}: {
  current: BenchmarkResult | null;
  previous: BenchmarkResult | null;
  report: RegressionReport | null;
}) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Regression Dashboard</div>

      {!current && <div style={{ fontSize: 12, opacity: 0.7 }}>Run a benchmark to populate.</div>}

      {current && previous && report && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Comparing latest run vs previous for scenario {current.scenarioLabel}
          </div>
          {report.metrics.map((metric) => (
            <div key={metric.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
              <div>{metric.label}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {metric.current !== null ? metric.current.toFixed(2) : '--'} {metric.unit}
              </div>
              <div style={badgeStyle(metric.direction === 'better' ? 'good' : metric.direction === 'worse' ? 'bad' : 'warn')}>
                {metric.delta === null ? '—' : `${metric.delta > 0 ? '+' : ''}${metric.delta.toFixed(2)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {current && !previous && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          No previous run found for this scenario. Run a second benchmark to compare.
        </div>
      )}
    </div>
  );
}
