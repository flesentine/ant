# H2 parameter estimation

ANTLAB v0.3.2c defines a guarded **development-estimation** procedure for the frozen H2 persistent-directional-state mechanism. It does not claim independent validation: the Poissonnier 2026 open-arena outcomes were known before H2 was specified.

## Why λ, τ and ρ cannot be fit alone
The current baseline angular diffusion was never calibrated against the open-arena assay, and the vertical toothpick transition leaves arena-entry orientation unresolved. Both can strongly affect exit time, path geometry and central-zone occupancy. Estimating H2 while holding those assumptions fixed would attribute apparatus/baseline error to H2.

The development fit therefore includes five parameters:

- `sigma0`: baseline angular diffusion, a locomotion nuisance parameter.
- `q`: shared post-toothpick orientation-retention probability. With probability `q`, preserve the protocol-sampled heading; otherwise randomize heading uniformly. The same `q` is used in 20 cm and 100 cm conditions.
- `lambda_mm`: H2 distance scale.
- `tau_s`: H2 decay time.
- `rho`: H2 maximum angular-noise reduction.

Treatment-specific entry-heading parameters are forbidden. Allowing them would turn the fit into H1 (entry-condition explanation) rather than H2.

## Estimation data
Only DCM-control observations that do not depend on the unresolved AnimalTA movement threshold enter the objective:

- `Total_Frames / 25` → time to arena edge.
- `Proportion_Frames_MiddleZone`.
- `Beeline`.
- exit-edge category derived from final coordinate and arena bounds.

`Average_Speed_Moving`, `Traveled_Dist_Moving`, `Straightness` and `Prop_time_moving` are post-fit diagnostics only. The Y-maze is unavailable to fitting, ranking and stopping rules.

## Objective
For each path treatment independently, simulated and empirical distributions are compared using:

- quantile Wasserstein-1 distance for time, central-zone fraction and beeline, normalized by pooled training SD;
- Hellinger distance for the four-way exit-edge distribution.

The eight components (four metrics × two path treatments) enter an equal-weight mean-squared loss. Candidate simulations use common random numbers.

## Nested leave-one-colony-out test
Each of the six colonies becomes the held-out colony once.

For each fold:

1. Fit the nested baseline on the other five colonies using only `sigma0` and `q` (`rho=0`).
2. Fit H2 using `sigma0`, `q`, `lambda_mm`, `tau_s`, and `rho` on the same five colonies.
3. Evaluate both models on the held-out colony with a separate random-number stream.

H2 is not eligible for canonical promotion unless it improves held-out loss over the nested baseline in at least 5 of 6 folds and has positive median held-out relative improvement. Passing this gate would still be internal development evidence, not external validation.

## Identifiability
Because there are only two travel distances, `lambda_mm` and `rho` may lie on a ridge. Every report therefore includes:

- `A200 = rho * (1 - exp(-200/lambda))`
- `A1000 = rho * (1 - exp(-1000/lambda))`

If fold estimates of λ and ρ are unstable while these effective amplitudes are stable, ANTLAB reports the amplitudes/ridge rather than a false precise λ/ρ pair. Repeated boundary solutions are also treated as non-identification.

## Search
`tools/run-h2-estimation.js` uses a deterministic Halton low-discrepancy search over frozen parameter bounds. It writes a report only; it never edits the canonical model.

Quick pooled development search:

```bash
node tools/run-h2-estimation.js --mode pooled --candidates 400 --trials 50 --seed 970000
```

Internal leave-one-colony-out search:

```bash
node tools/run-h2-estimation.js --mode loco --candidates 500 --trials 60 --seed 970000
```

Search resolution must always be reported with results. The tiny CI LOCO run is only a code-path smoke test and is explicitly not a scientific estimate.
