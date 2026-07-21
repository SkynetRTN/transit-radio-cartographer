# @skynet-rtn/observability-chart

Framework-agnostic core for the Skynet observability chart. Given a
`Target`, a list of `Site`s, a time range, and observability constraints,
computes per-site altitude-vs-time series bucketised into six categories:

| series          | meaning                                       |
| --------------- | --------------------------------------------- |
| `visible`       | meets all constraints — observable            |
| `sunElevation`  | sun too high (twilight / day)                 |
| `sunSeparation` | sun too close (angular sep < min)             |
| `earth`         | satellite in Earth's shadow                   |
| `moon`          | moon too close (angular sep < min)            |
| `minElevation`  | target below `minTargetAltitude` constraint   |

The series are renderer-agnostic (`xs: Date[]`, `ys: number[]`,
`airmass: number[]`) — a thin React adapter under `./react` (Phase 3) renders
them with Plotly, but other plotters can consume the same dataset.

See [docs/agents/target-visibility-chart-react-migration.md](../../../docs/agents/target-visibility-chart-react-migration.md)
for the porting plan and rationale.

## Public surface

```ts
import {
  computeObservability,
  plotRaDecObservability,
  plotAltObservability,
  plotMajorSolarSystemObservability,
  plotMpcObservability,
  plotSatelliteObservability,
  type ObservabilityDataset,
  type ObservabilitySeries,
  type ObservabilityConstraints,
  type ObservabilityRange,
} from '@skynet-rtn/observability-chart';
```

## Tests

```
npm test -w @skynet-rtn/observability-chart
```
