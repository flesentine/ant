# Architecture v0.3 — Experimental Integrity

ANTLAB separates four concepts that must not leak into one another.

## Model
`models/lasius_niger_locomotion_v1.json` contains biological/behavioral parameters. Experiments are forbidden from overriding movement, contacts, chemical sensing, memory, or physiology fields. `compileBundle()` rejects such definitions.

## Apparatus
`apparatus/*.json` describes physical geometry, entry points, boundary behavior, and scored terminal regions. The 2026 open arena is 297 × 210 mm and uses a terminating border.

## Protocol
`experiments/*.json` describes what researchers did: approach distance, treatment, entry point, and trial conditions. It references a model and apparatus by ID; it does not define the ant.

## Observation
Experiments declare camera cadence and intended measurements. The virtual camera remains independent of the physics timestep.

## Provenance
Each compiled run records deterministic content hashes for model, apparatus, experiment, and combined bundle. Cross-assay validation must use an identical model hash.

## Scientific status
The locomotion model remains provisional and uncalibrated. The published XLSX supplement has been located and registered but is not stored in the repository yet.
