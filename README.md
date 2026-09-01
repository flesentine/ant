# ANTLAB v0.3 — Boring Ant Laboratory

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. v0.3 is the **Experimental Integrity** release.

## What changed
Biology now lives in `models/`, physical setups in `apparatus/`, and experiment files contain protocol/observation only. The core rejects experiments that try to override locomotion biology.

The Poissonnier 2026 open-arena assay is represented as a 297 × 210 mm A4 arena with center entry, 25-fps observation, and trial termination on first border contact. Separate 20 cm and 100 cm control protocols both use the same model.

Every result records `model_hash`, `apparatus_hash`, `experiment_hash`, and `bundle_hash`. A calibration manifest registers the open-arena data for future fitting and locks the Y-maze against fitting/model selection.

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

Next: **v0.3.1 baseline locomotion calibration**, only after the published open-arena XLSX is materialized and its actual fields are inventoried.
