# Architecture v0.2

## Core rule

The simulation no longer owns a hard-coded arena. It owns an `ExperimentDefinition`.

```text
ExperimentDefinition
        ↓
Simulation(experiment, seed)
        ↓
geometry + spawn + movement + observation + scoring
```

The same definition format is used by the browser, headless benchmark runner, and tests.

## Coordinate and time system

- distance: millimetres
- time: seconds
- reference physics step: 0.02 s
- renderer: browser animation frames, independent of biology
- observation stream: experiment-defined FPS, independent of both rendering and physics

## Geometry

v0.2 supports unions of local primitives:

- rectangle
- circle
- corridor
- polygon

Workers query only whether their proposed local movement remains in accessible geometry. There is no navmesh path request or shortest-path operation.

## Agent state

Each worker currently stores:

- identity
- x/y position
- heading
- individual base speed
- persistent speed state
- individual turning/pause variation
- current movement/pause/finished state
- local wall/contact event counts
- personal RNG stream
- short visualization trajectory
- optional terminal outcome

The provisional v0.1 food/carrying state and directional homing/food nudges were removed.

## Movement stochasticity

Heading diffusion scales with `sqrt(dt)`. Speed variation uses a mean-reverting continuous-time process rather than independent per-frame speed rerolls. Pause initiation uses a real-time hazard:

`P(event in dt) = 1 - exp(-λ dt)`

The CI suite compares aggregate locomotion statistics at 10, 20, and 50 ms timesteps.

## Contacts

Contacts are lifecycle events:

```text
separate → contact_begin → overlapping → contact_end
```

A sustained overlap is not counted as a new social event every physics step.

## Observation model

Experiment definitions specify an observation FPS. The simulation records an observation stream at that cadence so later comparisons can use measurements that resemble an experimental camera rather than mathematically perfect continuous state.

## Scoring

Experiments may define labeled terminal regions. Entering one ends that worker's trial and records an outcome such as `left` or `right`.

The neutral Y-maze therefore tests the apparatus itself before pheromone exists.
