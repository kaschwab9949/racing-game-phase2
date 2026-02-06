export type RegressionDirection = 'better' | 'worse' | 'neutral';

export type RegressionMetric = {
  id: string;
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  direction: RegressionDirection;
  threshold: number;
};

export type RegressionReport = {
  scenarioId: string;
  generatedAt: number;
  metrics: RegressionMetric[];
};
