import type { BenchmarkResult } from '../benchmark/types';
import type { RegressionMetric, RegressionReport, RegressionDirection } from './types';

const THRESHOLDS = {
  fps: 2,
  frameMs: 1,
  lap: 0.5,
  sector: 0.2,
  count: 1,
};

export function compareResults(current: BenchmarkResult, previous: BenchmarkResult): RegressionReport {
  const metrics: RegressionMetric[] = [];

  metrics.push(buildMetric({
    id: 'avg_fps',
    label: 'Avg FPS',
    unit: 'fps',
    current: current.perf.avgFps,
    previous: previous.perf.avgFps,
    threshold: THRESHOLDS.fps,
    higherIsBetter: true,
  }));

  metrics.push(buildMetric({
    id: 'p95_frame',
    label: 'P95 Frame Time',
    unit: 'ms',
    current: current.perf.p95FrameMs,
    previous: previous.perf.p95FrameMs,
    threshold: THRESHOLDS.frameMs,
    higherIsBetter: false,
  }));

  metrics.push(buildMetric({
    id: 'worst_frame',
    label: 'Worst Frame Time',
    unit: 'ms',
    current: current.perf.worstFrameMs,
    previous: previous.perf.worstFrameMs,
    threshold: THRESHOLDS.frameMs * 2,
    higherIsBetter: false,
  }));

  metrics.push(buildMetric({
    id: 'best_lap',
    label: 'Best Lap',
    unit: 's',
    current: current.gameplay.bestLap,
    previous: previous.gameplay.bestLap,
    threshold: THRESHOLDS.lap,
    higherIsBetter: false,
  }));

  metrics.push(buildMetric({
    id: 'avg_lap',
    label: 'Avg Lap',
    unit: 's',
    current: current.gameplay.avgLap,
    previous: previous.gameplay.avgLap,
    threshold: THRESHOLDS.lap,
    higherIsBetter: false,
  }));

  metrics.push(buildMetric({
    id: 'ai_overtakes',
    label: 'AI Overtakes',
    unit: 'count',
    current: current.gameplay.aiOvertakes,
    previous: previous.gameplay.aiOvertakes,
    threshold: THRESHOLDS.count,
    higherIsBetter: false,
  }));

  metrics.push(buildMetric({
    id: 'penalties',
    label: 'Penalties Issued',
    unit: 'count',
    current: current.gameplay.penaltiesIssued,
    previous: previous.gameplay.penaltiesIssued,
    threshold: THRESHOLDS.count,
    higherIsBetter: false,
  }));

  metrics.push(buildMetric({
    id: 'warnings',
    label: 'Warnings Issued',
    unit: 'count',
    current: current.gameplay.warningsIssued,
    previous: previous.gameplay.warningsIssued,
    threshold: THRESHOLDS.count,
    higherIsBetter: false,
  }));

  const sectorCount = Math.max(
    current.gameplay.sectorBestTimes.length,
    previous.gameplay.sectorBestTimes.length,
  );

  for (let i = 0; i < sectorCount; i++) {
    const currentTime = current.gameplay.sectorBestTimes[i] ?? null;
    const previousTime = previous.gameplay.sectorBestTimes[i] ?? null;
    metrics.push(buildMetric({
      id: `sector_${i + 1}`,
      label: `Sector ${i + 1}`,
      unit: 's',
      current: currentTime,
      previous: previousTime,
      threshold: THRESHOLDS.sector,
      higherIsBetter: false,
    }));
  }

  return {
    scenarioId: current.scenarioId,
    generatedAt: Date.now(),
    metrics,
  };
}

function buildMetric(input: {
  id: string;
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
  threshold: number;
  higherIsBetter: boolean;
}): RegressionMetric {
  const { current, previous, threshold, higherIsBetter } = input;
  const delta = current !== null && previous !== null ? current - previous : null;
  const direction = classifyDelta(delta, threshold, higherIsBetter);
  return {
    id: input.id,
    label: input.label,
    unit: input.unit,
    current,
    previous,
    delta,
    direction,
    threshold,
  };
}

function classifyDelta(delta: number | null, threshold: number, higherIsBetter: boolean): RegressionDirection {
  if (delta === null || Number.isNaN(delta)) return 'neutral';
  if (higherIsBetter) {
    if (delta >= threshold) return 'better';
    if (delta <= -threshold) return 'worse';
  } else {
    if (delta <= -threshold) return 'better';
    if (delta >= threshold) return 'worse';
  }
  return 'neutral';
}
