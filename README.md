# ANTLAB — H0–H4 open-arena model development

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. The canonical ant remains unchanged while alternative open-arena context mechanisms are frozen, implemented, and evaluated behind explicit promotion guards. The Y-maze remains unavailable to development fitting and model selection.

## Current science state

```text
H0  -> screening-incompatible
H1  -> unresolved; measured post-toothpick entry state is missing
H2  -> implemented; high-resolution LOCO not promoted
H3  -> implemented; high-resolution LOCO not promoted
H4  -> implemented; mechanism reachability verified; not fitted or searched
```

H2 directly reduces continuous angular diffusion. H3 instead changes the timing of discrete reorientation events. H4 is a genuinely different speed-side mechanism: recent constrained travel creates a transient locomotor activation state that increases moving speed while leaving heading noise, pauses, entry state, and boundary behavior unchanged.

See `hypotheses/open_arena_locomotion_context_v1.json` for the current decision record. The original H4 freeze file remains unchanged after implementation so the pre-code mechanism specification stays auditable.

## What data may enter development estimation

Only threshold-independent DCM-control observables from the checksummed final Springer XLSX are currently allowed as fitting targets:

- time to edge = `Total_Frames / 25`;
- middle-zone frame fraction;
- beeline distance;
- exit-edge category.

Moving speed, moving distance, straightness, and proportion-time-moving remain diagnostics only until the AnimalTA movement classifier is recovered. In particular, H4 may not fit the moving-speed metric that motivated its mechanism class.

The 51 DCM-control rows are pinned in `reference/poissonnier2026_h2_estimation_targets.json` and regenerated from the final XLSX by `tools/derive-h2-estimation-targets.py`.

## H2/H3 held-out status

H2 and H3 have already undergone leave-one-colony-out development estimation. Neither passed its frozen promotion criteria. H3's corrected 500-candidate × 60-trial result is recorded in `reports/h3_parameter_estimation_500x60_v1.json`; it won only 1/6 held-out colonies versus its own null and 2/6 versus the matched corrected H2 candidates.

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

No H4 parameter estimation policy has been frozen yet, so **no H4 search should be run yet**.

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

See `docs/H2_ESTIMATION.md` and `docs/H4_TRANSIENT_LOCOMOTOR_ACTIVATION.md` for the detailed mechanism/estimation discipline.
