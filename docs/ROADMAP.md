# Roadmap

## v0.1 — substrate
Deterministic clock, per-agent RNG, continuous locomotion, local contacts, inspection and metrics.

## v0.2 — honest experiment engine
JSON-driven geometry, no navigation cheats, virtual observation cadence, persistent movement noise, contact lifecycle, neutral Y-maze and timestep convergence tests.

## v0.3 — experimental integrity (current)
- biological model separated from apparatus/protocol/observation
- one shared Lasius niger locomotion model across assays
- experiment biology overrides rejected
- Poissonnier 2026 open arena corrected to center entry and terminating A4 boundary
- 20 cm / 100 cm approach conditions represented as protocol metadata
- provenance hashes on every run
- calibration/holdout registry with enforced Y-maze lock
- published XLSX supplement located and inventoried, not yet materialized

## v0.3.1 — baseline locomotion calibration
Materialize and inspect open-arena reference data. Fit only ordinary locomotion to DCM/control data.

## v0.3.2 — externally painted trail response
Freeze locomotion, add local egocentric chemical samples and dose-aware trail stimulus, fit only pheromone-response parameters to open-arena pheromone trials.

## v0.4 — locked cross-apparatus validation
Freeze the model and evaluate the Y-maze without using Y-maze outcomes in fitting/model selection.

## v0.5 — trail deposition
Discrete deposition events with independent deposition and response policies.

## v0.6 — self recruitment
Ants read other ants' deposits; field decay and feedback produce the first genuine emergent trail test.
