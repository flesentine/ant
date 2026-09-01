# ANTLAB v0.2 — Boring Ant Laboratory

**Live laboratory:** https://flesentine.github.io/ant/

ANTLAB is a deliberately small experimental substrate for building a biologically constrained ant simulator one falsifiable capability at a time.

## What changed in v0.2

The experiment files are now real inputs to the engine instead of documentation.

- `Simulation(experimentDefinition, seed)` — geometry, spawn, duration, observation cadence, contacts, and scoring come from the experiment definition
- removed the provisional east/west nest-food steering cheat
- removed provisional food/carrying state from the worker model
- rectangle, corridor, circle, and polygon geometry primitives
- terminal regions and labeled outcomes
- persistent continuous-time speed variation instead of per-frame speed rerolls
- contact begin/end lifecycle instead of repeatedly counting an overlap every tick
- 25 fps observation sampling independent of the physics step
- neutral Y-maze control experiment
- open-arena control experiment
- generic multi-seed benchmark runner
- timestep-convergence and Y-maze-neutrality CI tests

There is still **no pheromone** in v0.2. That is intentional.

## Run the live lab

https://flesentine.github.io/ant/

Choose an assay from the Experiment menu. The most important new one is **Neutral Y-maze**. With no chemical cue, repeated trials should not systematically prefer left or right.

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

On macOS you can also run `./start.command`.

## Run the tests

```bash
./tests/run-tests.sh
```

The v0.2 suite checks:

- deterministic reproduction for identical seeds
- real-time hazard math
- experiment definitions actually control simulation behavior
- locomotion statistics remain stable at 10, 20, and 50 ms timesteps
- a symmetric Y-maze remains statistically neutral across hundreds of seeded trials

## Run a headless experiment

```bash
node tools/run-benchmark.js --experiment neutral_y_maze.json --trials 1000 --seed 928491
```

This writes `benchmark-results.json` and reports left/right/timeout outcomes.

## Current experiments

- `experiments/neutral_y_maze.json` — symmetric no-pheromone control
- `experiments/open_arena_control.json` — baseline locomotion/observation apparatus
- `experiments/straight_bridge.json` — constrained locomotion/contact substrate

## Next scientific milestone

Calibrate ordinary locomotion against the **control** open-arena trajectories first. Then add an externally painted pheromone stimulus and calibrate only chemical sensing/steering. Freeze those parameters and use the Y-maze as a cross-apparatus prediction.

Only after trail response is independently defensible will ants be allowed to deposit their own pheromone.
