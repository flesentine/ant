# Architecture v0.3

ANTLAB separates the simulation into six scientific layers so an assay cannot silently redefine the animal it is supposed to test.

## 1. Species model

`models/` contains persistent biological capabilities and parameters: locomotion, individual variability, contacts, and later sensing/memory/physiology. Experiments are rejected if they contain model parameter overrides.

## 2. Agent state

`states/` contains factual conditions of an individual at assay entry: experience, travel direction, feeding state, crop state, food memory, recent travel history, etc. Protocol can establish state facts, but state cannot contain model parameters.

## 3. Apparatus

`apparatus/` contains geometry, entry points and physical boundary behavior. Choice/scoring regions do not belong here.

## 4. Protocol

Each experiment records what the researcher did: treatment, approach distance, transition, entry condition, and factual state changes. Protocol is not allowed to directly change walking/sensing parameters.

## 5. Observation model

`observations/` defines sampling cadence and measurement assumptions. Poissonnier 2026 is sampled at 25 fps; unresolved AnimalTA movement classification/tracking settings remain explicitly marked pending rather than guessed.

## 6. Scoring

`scoring/` defines how trajectories become outcomes: first border contact, first scoring-region entry, etc. The neutral Y-maze endpoint rule is engineering-only until the exact biological scoring rule is recovered.

## Integrity orchestration

`src/integrity.js` resolves the six layers, applies scoring to a clone of the apparatus for execution, resolves protocol state facts, and then runs the unchanged physics core. Results include independent hashes for every layer.

## Randomness firewall

Named deterministic streams isolate biology from experimental machinery:

- `biology:<ant_id>`
- `protocol`
- `treatment`
- `observation`

Changing observation noise therefore cannot consume biological random numbers and alter the underlying trajectory.

## Calibration firewall

`reference/calibration_manifest.json` defines which datasets may enter fitting. Holdout data may be reported but must not enter parameter fitting or model selection.
