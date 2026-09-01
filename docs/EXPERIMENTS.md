# Experiment definitions

Experiment JSON files live in `experiments/` and are first-class inputs to ANTLAB.

A definition may specify:

```json
{
  "id": "neutral_y_maze_v1",
  "world": { "width": 215, "height": 240 },
  "workers": 1,
  "duration_s": 90,
  "observation": { "fps": 25, "record_trajectories": true },
  "geometry": { "primitives": [] },
  "spawn": {},
  "movement": {},
  "contacts": {},
  "terminal_regions": []
}
```

## Why this matters

Published observations should become experiment definitions and benchmarks, not hard-coded behavior inside an ant.

The worker should never be told that `left` is correct. `left` and `right` are labels used by instrumentation after the ant physically enters a scored region.

## Neutral Y-maze acceptance test

Before any pheromone is added, the symmetric Y-maze is run across hundreds of deterministic seeds. CI requires:

- at least 85% of trials reach a scored branch within the trial duration
- left choice among scored trials remains between 44% and 56%
- timeout rate remains below 15%

This is deliberately broad enough to test unwanted apparatus bias without pretending the exact no-cue choice proportion is a biological calibration target.
