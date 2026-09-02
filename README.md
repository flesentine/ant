# ANTLAB v0.3.2c — H2 Development Estimation

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. v0.3.2c keeps the frozen H2 mechanism intact and adds a guarded development-estimation procedure without unlocking canonical biological fitting or touching the Y-maze holdout.

## Why H2 cannot be fit alone
The current baseline angular diffusion and the vertical-toothpick entry orientation were never independently calibrated. Both can strongly alter arena exit time and path geometry. Fitting only `lambda`, `tau`, and `rho` would risk forcing apparatus/baseline error into H2.

The estimator therefore includes five development parameters:

- `sigma0`: baseline angular diffusion nuisance parameter.
- `q`: shared post-toothpick orientation-retention probability; the same value must apply to 20 cm and 100 cm conditions.
- `lambda_mm`, `tau_s`, `rho`: the frozen H2 mechanism parameters.

Treatment-specific entry-heading fitting is forbidden because that would become H1 rather than H2.

## What data may enter estimation
Only threshold-independent DCM-control observables from the checksummed final Springer XLSX are allowed:

- time to edge = `Total_Frames / 25`;
- middle-zone frame fraction;
- beeline distance;
- exit-edge category.

Moving speed, moving distance, straightness and proportion-time-moving remain diagnostics only until the AnimalTA movement classifier is recovered. The Y-maze is unavailable to fitting, candidate ranking, stopping rules and model selection.

The 51 DCM-control rows are pinned in `reference/poissonnier2026_h2_estimation_targets.json` and regenerated from the final XLSX by `tools/derive-h2-estimation-targets.py`.

## Internal cross-validation
`tools/run-h2-estimation.js` performs simulation-based minimum-distance estimation using deterministic Halton candidates and common random numbers.

Leave-one-colony-out mode fits two nested models on five colonies and evaluates them on the sixth:

1. Baseline: estimate only `sigma0` and shared `q` with H2 disabled (`rho=0`).
2. H2: estimate `sigma0`, `q`, `lambda_mm`, `tau_s`, and `rho`.

H2 is not eligible for canonical promotion unless it improves held-out loss over the nested baseline in at least 5 of 6 folds and has positive median held-out improvement. Passing that gate would still be internal development evidence, not independent validation.

Because `lambda` and `rho` may be weakly identifiable with only 200 mm and 1000 mm travel histories, reports also include the more directly identifiable effective amplitudes:

```text
A200  = rho * (1 - exp(-200/lambda))
A1000 = rho * (1 - exp(-1000/lambda))
```

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

## H2 development estimation
Quick pooled search:
```bash
node tools/run-h2-estimation.js --mode pooled --candidates 400 --trials 50 --seed 970000
```

Leave-one-colony-out internal cross-validation:
```bash
node tools/run-h2-estimation.js --mode loco --candidates 500 --trials 60 --seed 970000
```

Search resolution must always be reported. The small CI LOCO run is only a code-path smoke test and is not a scientific estimate.

See `docs/H2_ESTIMATION.md` for the full estimation policy.
