# ANTLAB v0.3.1 — Measurement Reconstruction

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. v0.3.1 makes the experimental observation process operational before any biological calibration.

## What changed

The simulator now keeps **simulation truth** separate from **experimental measurement**. The scientific path samples trajectories at exact camera timestamps (25 fps for Poissonnier 2026), streams those observations through a measurement pipeline, and reports observed speed, distance, straightness, exit time, exit coordinate and central-zone occupancy independently from hidden physics truth.

The observation sampler interpolates to exact camera times even when the physics timestep is 10, 20 or 50 ms. Apparatus-boundary outcomes get sub-step truth timing; observed exit time is camera-quantized. Headless runs can calculate measurements without retaining every frame.

State provenance is tightened: protocol may record observable history/labels, but may not assert latent memory/motivation/path-integration state. Results now distinguish `state_profile_hash` from `resolved_state_hash`.

Published Poissonnier 2026 source manifests, article-level targets, supplement fetch/inventory tooling and a calibration lock are included. **No ant parameters are fitted in v0.3.1.**

## Run
```bash
python3 -m http.server 8080
```
Open `http://localhost:8080`.

## Tests
```bash
./tests/run-tests.sh
```

## Headless
```bash
node tools/run-benchmark.js --experiment open_arena_short_control.json --trials 100 --seed 928491
```

## Reference reconstruction
```bash
./tools/fetch-poissonnier2026-reference.sh
```
This downloads the final-version Rmd/XLSX supplements into the ignored `reference/materialized/` directory, prints SHA-256 checksums, workbook sheets/headers/previews and analysis-code lines relevant to tracking/scoring.

Next: finish the published-data reconstruction gate, then **v0.3.2 locomotion model competition**. The open-arena dataset remains locked against biological fitting until that gate passes.
