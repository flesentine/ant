# Locomotion model competition

ANTLAB v0.3.2a begins model competition without unlocking biological fitting.

## Reference contrast
Only the final-version Poissonnier 2026 **DCM control** rows are used. The comparison is 20 cm approach minus 100 cm approach. `reference/poissonnier2026_control_effects.json` is regenerated from the checksummed XLSX by `tools/derive-poissonnier2026-control-effects.py`.

The descriptive contrasts are approximately: moving speed -3.33 mm/s; moving distance +173.26 mm; time to edge +8.77 s; straightness -0.179; central-zone occupancy essentially unchanged. Distance, time and straightness retain the same sign under all six leave-one-colony-out recalculations. Bootstrap intervals are descriptive because they do not reproduce colony clustering or the paper's mixed-effects model.

## H0 — context invariant
The current `lasius_niger_locomotion_v1` model does not read `recent_travel_mm`. Short and long trials therefore use the same biological model and, under common random-number seeds, produce identical trajectories. This is an explicit null hypothesis, not a bug.

`tools/run-model-competition.js` compares its predicted treatment contrasts with the pinned descriptive reference. No parameters are changed. H0 is currently screening-incompatible with the distance, exit-time and straightness contrasts. Speed and central-zone occupancy do not screen H0 out.

## H1 — entry condition
Blocked. This explanation requires measured initial heading/speed distributions at arena entry. Those raw initial trajectory frames are not present in the published XLSX/supplied Rmd materials.

## H2 — persistent directional state
Candidate only. The idea is that sustained constrained travel creates a decaying persistence state. ANTLAB must pre-register the state equation and parameter provenance before implementation. Parameters may not be optimized against the summary contrasts while the biological fitting gate remains locked.

## Holdout rule
The Y-maze is not loaded by the competition runner and cannot be used for model selection. Its 398 choices remain the later cross-apparatus holdout.
