# ANTLAB — H0–H5 open-arena model development

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. The canonical ant remains unchanged while alternative open-arena context mechanisms are frozen, implemented, and evaluated behind explicit promotion guards. The Y-maze remains unavailable to development fitting and model selection.

## Current science state

```text
H0  -> screening-incompatible
H1  -> unresolved; measured post-toothpick entry state is missing
H2  -> implemented; high-resolution LOCO not promoted
H3  -> implemented; high-resolution LOCO not promoted
H4  -> implemented; frozen high-resolution LOCO failed promotion
H5  -> estimator qualified; frozen high-resolution search authorized; not yet run
```

H2 directly reduces continuous angular diffusion. H3 instead changes the timing of discrete reorientation events. H4 is a speed-side mechanism. H5 is now frozen as a fourth, distinct mechanism class: recent constrained travel creates a decaying commitment to the ant's own realized post-transition entry heading, producing deterministic circular restoring drift while leaving angular-noise amplitude, speed, pauses, and entry-state distribution unchanged.

See `hypotheses/open_arena_locomotion_context_v1.json` for the current decision record and `hypotheses/h5_transient_entry_heading_restoration_v1.json` for the frozen H5 mechanism. H5 is implemented in an isolated extension layer (`src/h5.js`) so the exact H0–H4 runtime blobs remain unchanged. H5 estimator v1 is implemented in `tools/run-h5-estimation.js` and passed its frozen reference-free synthetic qualification. The exact frozen H5 high-resolution search is now separately authorized by `hypotheses/h5_highres_authorization_v1.json`, but the official run has not yet occurred.

## What data may enter development estimation

Only threshold-independent DCM-control observables from the checksummed final Springer XLSX are currently allowed as fitting targets:

- time to edge = `Total_Frames / 25`;
- middle-zone frame fraction;
- beeline distance;
- exit-edge category.

Moving speed, moving distance, straightness, and proportion-time-moving remain diagnostics only until the AnimalTA movement classifier is recovered. In particular, H4 may not fit the moving-speed metric that motivated its mechanism class.

The 51 DCM-control rows are pinned in `reference/poissonnier2026_h2_estimation_targets.json` and regenerated from the final XLSX by `tools/derive-h2-estimation-targets.py`.

## H2/H3/H4 held-out status

H2 and H3 have already undergone leave-one-colony-out development estimation. Neither passed its frozen promotion criteria. H3's corrected 500-candidate × 60-trial result is recorded in `reports/h3_parameter_estimation_500x60_v1.json`; it won only 1/6 held-out colonies versus its own null and 2/6 versus the matched corrected H2 candidates.

H4 has also completed its frozen 500-candidate × 60-trial × 6-fold LOCO search. It won 2/6 held-out colonies versus its own fitted null with median relative improvement 0.0%, 2/6 versus H2-v1 with median −3.43%, and 3/6 versus H3-v1 with median +3.05%. H4 therefore failed every frozen promotion/comparison guard. The exact result is recorded in `reports/h4_parameter_estimation_500x60_v1.json`.

These are internal development results, not external validation.

## H4 mechanism implementation

H4-v1 is frozen in `hypotheses/h4_transient_locomotor_activation_v1.json` and implemented by `models/lasius_niger_locomotion_h4_v1.json` plus the integrity-layer speed multiplier.

```text
A0 = 1 - exp(-L / lambda_activation)
dA/dt = -A / tau_activation
v_H4(t) = v_baseline(t) * (1 + rho_speed * A(t))
```

The engineering demonstration uses `lambda=500 mm`, `tau=5 s`, and `rho_speed=0.25`. These are not biological estimates.

A 400-trial-per-condition mechanism reachability run passed all intended qualitative checks while matched-seed tests verified unchanged heading, pause, and biology RNG cadence. The exact result is recorded in `reports/h4_mechanism_reachability_v1.json`.

The full H0–H4 implementation suite passed in GitHub Actions before the temporary branch-only verification workflow was removed. The permanent main workflow now includes H4 reachability and will exercise it after merge.

The H4 estimation policy is frozen in `hypotheses/h4_parameter_estimation_v1.json`, and the authorized high-resolution search is complete. H4-v1 was **not promoted**. Per the frozen failure rule, do not rescue H4 by changing bounds, seeds, nuisance parameters, metric weights, fold requirements, or by tuning the same mechanism harder. The next hypothesis must be substantively different or justified by genuinely new evidence.

## H5 mechanism implementation

H5-v1 is frozen in `hypotheses/h5_transient_entry_heading_restoration_v1.json` and implemented in `src/h5.js` plus `models/lasius_niger_locomotion_h5_v1.json`. The H5 layer wraps the frozen H0–H4 integrity runtime without changing the pinned `src/integrity.js` or `src/sim-core.js` blobs used by the H4 estimator audit.

A 400-trial-per-condition mechanism reachability run using only the one pre-frozen engineering parameter set passed all intended structural checks: long-history trials had lower exit time (8.9304 vs 9.0132 s), lower observed distance (210.659 vs 212.645 mm), and higher straightness (0.7710 vs 0.7440), while observed moving speed stayed essentially unchanged (23.9305 vs 23.9328 mm/s). This is reachability evidence only, not a fit to the reference data.

The exact mechanism report is `reports/h5_mechanism_reachability_v1.json`. The H5 estimator policy is frozen in `hypotheses/h5_parameter_estimation_v1.json`; the qualified estimator blob is `7d4a68f024c09c111a38088be2c943b7de74b464`. No high-resolution H5 search has been run and the Y-maze remains locked.

## H5 development-estimation policy

The H5 estimator policy is frozen before estimator implementation or reference-data search. It uses only shared angular diffusion and shared entry-retention `q` as nuisances, with baseline speed fixed at 24 mm/s. The frozen H5 search ranges are `lambda=100–3000 mm`, `tau=0.5–40 s`, and `kappa=0–2 s⁻¹`.

The primary LOCO guard requires H5-context to beat its exact `kappa=0` null in at least 5/6 held-out colonies with positive median relative improvement. A development-preferred claim additionally requires beating the per-fold best frozen H2/H3/H4 comparator in at least 4/6 folds with positive median improvement.

The estimator has passed synthetic qualification, blob pinning, the full regression suite, low-resolution execution smoke, and real-Chromium parity. The separate authorization record now pins this qualified estimator and the frozen high-resolution procedure. The official 500×60×6 run has not yet been executed.

See `docs/H5_ESTIMATION.md`.

## H5 estimator qualification

Estimator v1 is implemented in `tools/run-h5-estimation.js` (Git blob `7d4a68f024c09c111a38088be2c943b7de74b464`). Reference-free synthetic qualification passed all required checks and is recorded in `reports/h5_estimator_qualification_v1.json` (Git blob `da5afe375fccb54e38b9bf3ef6d9879e2e03270d`, SHA-256 `29565eb5f2f67cf8e480def5a0dc1a677795b06e97873b03fbaadf7ed48dc66c`).

A low-resolution 8-candidate run exercised the reference-data/cross-family code path only; it is not scientific evidence. Selected smoke candidates matched Node in real Chromium across 8/8 cases with zero browser exceptions, console errors, or Y-maze requests. High-resolution mode is authorized by the separate pinned authorization record; no official high-resolution result exists yet.

## H5 high-resolution authorization

The authorization record is `hypotheses/h5_highres_authorization_v1.json` (Git blob `8741ebfff852d85b319ded5dd45f282d06f2c45e`). It pins the frozen policy, qualified estimator, qualification report, merged-main verification, and two successful Chromium audits.

The authorization becomes executable only after merge to `main`; the review branch still rejects `--mode highres`. It authorizes only the unchanged frozen H5 search: 500 null candidates, 500 total context candidates, 60 training trials per treatment/candidate, 120 held-out evaluation trials per treatment, six LOCO folds, root seed 1,110,000, and 20 ms physics. Canonical promotion and Y-maze access remain unauthorized.

## Run

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Tests

```bash
./tests/run-tests.sh
```

## H0 model screen

```bash
node tools/run-model-competition.js --trials 400 --seed 928491
```

## Frozen H2 mechanism reachability

```bash
node tools/run-h2-mechanism.js --trials 400 --seed 928491
```

## Frozen H3 mechanism reachability

```bash
node tools/run-h3-mechanism.js --trials 400 --seed 928491
```

## Frozen H4 mechanism reachability

```bash
node tools/run-h4-mechanism.js --trials 400 --seed 928491
```

This H4 command performs reachability only: no target fitting, no model selection, and no Y-maze access.

## Frozen H5 mechanism reachability

```bash
node tools/run-h5-mechanism.js --trials 400 --seed 928491
```

This H5 command performs mechanism reachability only: one pre-frozen engineering parameter set, no target fitting, no model selection, and no Y-maze access.

## H2 development estimation

Quick pooled search:

```bash
node tools/run-h2-estimation.js --mode pooled --candidates 400 --trials 50 --seed 970000
```

Leave-one-colony-out internal cross-validation:

```bash
node tools/run-h2-estimation.js --mode loco --candidates 500 --trials 60 --seed 970000
```

Search resolution must always be reported. Small CI LOCO runs are code-path smoke tests only and are not scientific estimates.

See `docs/H2_ESTIMATION.md`, `docs/H4_TRANSIENT_LOCOMOTOR_ACTIVATION.md`, and `docs/H5_TRANSIENT_HEADING_RESTORATION.md` for the detailed mechanism/estimation discipline.
