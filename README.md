# ANTLAB v0.3.2a — Null Locomotion Screen

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. v0.3.2a starts locomotion model competition without pretending the missing raw AnimalTA trajectories are available.

## What changed
v0.3.1's measurement/integrity foundation remains frozen. The final Poissonnier 2026 per-ant summary XLSX is now used to derive a checksummed **control treatment-contrast** reference for descriptive model screening only. Biological parameter fitting remains locked.

The first registered hypothesis is `H0_context_invariant`: the same frozen locomotion model is run under the 20 cm and 100 cm DCM-control protocols with matched random seeds. Because the current model does not read previous travel distance, it predicts a zero short-minus-long contrast.

The real summary data show robust nonzero contrasts in moving distance, exit time and straightness. All three keep the same sign under every leave-one-colony-out recalculation. H0 therefore fails the descriptive screen. Moving speed is less decisive, and central-zone occupancy acts as a useful negative control.

**No ant parameter was tuned. The Y-maze holdout is not loaded or used by the competition runner.**

## Run
```bash
python3 -m http.server 8080
```
Open `http://localhost:8080`.

## Tests
```bash
./tests/run-tests.sh
```

## Headless benchmark
```bash
node tools/run-benchmark.js --experiment open_arena_short_control.json --trials 100 --seed 928491
```

## H0 model competition
```bash
node tools/run-model-competition.js --trials 400 --seed 928491
```
This writes `model-competition-results.json` and reports predicted short-minus-long contrasts against the descriptive reference intervals.

## Reference reconstruction
```bash
./tools/fetch-poissonnier2026-reference.sh
```
The probe downloads the final-version Rmd/XLSX, verifies checksums, reconstructs the published summaries, regenerates the control-effect screening file, and requires an exact match with the pinned reference.

Next: **H1 entry-condition evidence if the missing raw entry frames can be recovered; otherwise pre-register H2's minimal persistent-directional-state equation without fitting it to the Y-maze.**
