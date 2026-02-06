import type { DevScenarioRunner } from '../../devtools/scenarios/DevScenarioRunner';
import { DEV_SCENARIOS } from '../../devtools/scenarios/DevScenarioCatalog';
import { buttonStyle, sectionStyle } from './DevtoolsStyles';

export function ScenarioPanel({ runner }: { runner: DevScenarioRunner }) {
  return (
    <div style={sectionStyle}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Dev Scenarios</div>
      {DEV_SCENARIOS.map((scenario) => (
        <div
          key={scenario.id}
          style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center', marginBottom: 8 }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{scenario.label}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{scenario.description}</div>
          </div>
          <button style={buttonStyle} onClick={() => runner.applyScenario(scenario)}>Apply</button>
        </div>
      ))}
    </div>
  );
}
