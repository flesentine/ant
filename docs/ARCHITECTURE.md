# Architecture v0.3.1

ANTLAB separates biological capability, experimental context and measurement so an assay cannot silently redefine either the animal or the evidence.

## Scientific layers

1. **Species model** (`models/`) — persistent biological parameters/capabilities.
2. **Agent state profile** (`states/`) — observable labels/history at assay entry. Protocol cannot assert latent memory, motivation, path integration or other hidden biological state.
3. **Apparatus** (`apparatus/`) — physical geometry and entry locations only. Scoring owns trial termination semantics.
4. **Protocol** (`experiments/`) — researcher actions/treatments, approach history and entry assumptions, with provenance.
5. **Observation model** (`observations/`) — camera cadence, tracking assumptions and metric definitions.
6. **Scoring** (`scoring/`) — how observed behavior becomes an experimental outcome.

## Measurement reconstruction

`src/measurement.js` introduces the scientific measurement path:

`truth state -> exact-time observation sampler -> observed trajectory -> streaming MeasurementPipeline -> experimental metrics`

The core can step at 10/20/50 ms while a 25-fps observation model always samples at 0.04-s camera timestamps by interpolation. Measurement can stream online without retaining all frames; browser assays may retain frames for inspection.

Results expose `truth_metrics` and `observed_metrics` separately. They must never be silently substituted for one another.

## Event timing

For apparatus-boundary trials, the integrity layer corrects the core's end-of-step terminal timestamp using distance travelled and within-step speed. Truth exit time is sub-step; observed exit time is quantized by the observation cadence.

## Provenance

Results include `model_hash`, `state_profile_hash`, `resolved_state_hash`, `apparatus_hash`, `protocol_hash`, `observation_hash`, `scoring_hash`, `experiment_hash`, and `integrity_bundle_hash`.

Named deterministic RNG streams isolate biology, protocol, treatment and observation.

## Reference evidence

`reference/poissonnier2026_source_manifest.json` pins the final version of record and supplement URLs. Binary supplements are materialized locally with `tools/fetch-poissonnier2026-reference.sh`; the repository does not silently vendor mutable external binaries.

The open-arena dataset is locked against fitting until the measurement-reconstruction gate reproduces the published cohort/metrics. The Y-maze remains a locked cross-apparatus holdout.
