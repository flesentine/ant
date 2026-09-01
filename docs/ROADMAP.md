# Roadmap

## v0.1 — substrate
- deterministic clock
- per-agent RNG
- continuous locomotion
- spatial contacts
- local inspection
- basic metrics

## v0.2 — honest experiment engine
- experiment JSON drives the simulation
- no hidden nest/food steering
- reusable geometry
- observation cadence independent of physics timestep
- neutral-maze and timestep guardrails

## v0.3 — scientific integrity (current)
- species model separated from experiments
- explicit agent-state profiles
- apparatus contains geometry only
- protocol records researcher actions/state facts
- observation profiles separated from simulation truth
- scoring rules separated from apparatus
- model/state/apparatus/protocol/observation/scoring hashes
- independent biology/protocol/treatment/observation RNG streams
- calibration/holdout and evidence manifests
- open-arena first-border scoring
- neutral Y-maze explicitly classified as a synthetic engineering control

## v0.3.1 — reference-data ingestion
- inventory Poissonnier 2026 supplementary XLSX/Rmd fields
- reproduce published open-arena summaries from reference data
- recover AnimalTA movement/tracking settings where available
- recover exact Y-maze choice criterion before biological validation

## v0.3.2 — baseline locomotion calibration
- control data only
- fit speed, turning, persistence and pause behavior
- hold out colonies where dataset structure permits
- freeze locomotion after validation

## v0.3.3 — externally painted trail response
- local egocentric chemical samples
- dose-aware trail stimulus
- fit detection/noise/steering against open-arena pheromone trajectories
- no ant deposition yet

## v0.4 — locked cross-apparatus validation
- frozen model
- four Y-maze protocol/state conditions
- stratified and pooled trail-following results
- no Y-maze fitting/model selection

## v0.5 — trail deposition
- fed-returning assay condition
- discrete deposition events
- independent deposition and response policies

## v0.6 — self recruitment
- ants read other ants' deposits
- field decay
- positive/negative feedback
- first emergent trail test

## v0.7 — resource physics
- finite sucrose
- crop volume
- conserved loading/unloading

## v0.8 — social traffic
- directional contacts
- returning-ant information
- congestion/negative feedback
