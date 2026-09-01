# Roadmap

## v0.1 — substrate
- deterministic clock
- per-agent RNG
- continuous locomotion
- spatial contacts
- local inspection
- basic metrics

## v0.2 — honest experiment engine (current)
- experiment JSON is an actual simulation input
- no hidden nest/food steering
- reusable geometry primitives
- configurable spawn and terminal/scoring regions
- observation sampler independent of physics timestep
- persistent movement noise
- contact begin/end lifecycle
- neutral Y-maze control
- timestep convergence test
- statistical left/right neutrality test

## v0.3a — baseline locomotion calibration
- ingest/control open-arena trajectory data
- compare at matched observation cadence
- calibrate speed, turning, persistence, and pause behavior only
- preserve approach-condition effects without pheromone parameters

## v0.3b — externally painted trail response
- local egocentric chemical samples
- dose-aware experimental trail stimulus
- calibrate detection/noise/steering against open-arena pheromone trajectories
- no ant deposition yet

## v0.4 — cross-apparatus prediction
- freeze locomotion and trail-response parameters
- reproduce Y-maze geometry/treatment
- predict marked-arm choice without Y-maze tuning
- report uncertainty across simulated seeds

## v0.5 — trail deposition
- fed-returning assay condition
- discrete deposition events
- independent deposition policy and response policy
- spatial/context-dependent deposition benchmark

## v0.6 — self recruitment
- ants read other ants' deposits
- field decay
- positive and negative feedback
- first emergent trail test

## v0.7 — resource physics
- finite sucrose source
- crop volume
- conserved loading/unloading
- food return

## v0.8 — social traffic
- directional contact events
- returning-ant information
- congestion and negative feedback
