# Locomotion model competition

ANTLAB v0.3.2c adds guarded development estimation for H2 while preserving the H0 browser assays and the locked Y-maze holdout.

## Reference contrast
Only the final-version Poissonnier 2026 **DCM control** rows are used for the already-completed H0 descriptive screen and H2 internal development estimation. The comparison is 20 cm approach versus 100 cm approach. Reference rows are regenerated from the checksummed XLSX.

The descriptive contrasts are approximately: moving speed -3.33 mm/s; moving distance +173.26 mm; time to edge +8.77 s; straightness -0.179; central-zone occupancy essentially unchanged. Distance, time and straightness retain the same sign under all six leave-one-colony-out recalculations.

## H0 — context invariant
`lasius_niger_locomotion_v1` does not read previous constrained travel. Short and long trials therefore use the same biological model and, under common random-number seeds, produce identical trajectories. H0 is screening-incompatible with the distance, exit-time and straightness contrasts.

## H1 — entry condition
Still unresolved. This explanation requires measured initial heading/speed distributions at arena entry. Those raw initial trajectory frames are not present in the published XLSX/supplied Rmd materials.

The H2 estimator therefore treats post-toothpick orientation as a **shared nuisance transition**, not a treatment-specific fitted effect. A single `q` applies to both 20 cm and 100 cm conditions. Allowing treatment-specific entry distributions would be H1 and remains forbidden.

## H2 — persistent directional state
H2 introduces one latent scalar `P`:

```text
P0 = 1 - exp(-L / lambda)
P(t + dt) = P(t) * exp(-dt / tau)
sigma_heading_effective = sigma_heading_base * (1 - rho * P)
```

`L` is the observable protocol fact `recent_constrained_travel_mm`. The original v0.3.2b values (`lambda=500 mm`, `tau=5 s`, `rho=0.5`) remain engineering demonstration values and are **not promoted estimates**.

## v0.3.2c estimation policy
The estimator compares two nested models inside leave-one-colony-out cross-validation:

- baseline: estimate shared baseline angular diffusion `sigma0` and shared entry-orientation retention `q`, with H2 disabled;
- H2: estimate `sigma0`, `q`, `lambda`, `tau`, and `rho`.

Only threshold-independent observables enter the fitting objective:

- `Total_Frames / 25` -> time to exit;
- `Proportion_Frames_MiddleZone` -> central-zone occupancy;
- `Beeline` -> direct entry-to-exit distance;
- exit edge from the recorded final coordinate and arena bounds.

`Average_Speed_Moving`, `Traveled_Dist_Moving`, `Straightness`, `Prop_time_moving`, and every Y-maze field are forbidden fit observables because the AnimalTA movement classifier is unresolved or because the Y-maze is the later cross-apparatus holdout.

The frozen promotion guard is:

> H2 must beat the nested baseline on at least 5 of 6 held-out colonies and have positive median held-out relative improvement before canonical parameter promotion is even considered.

## High-resolution result — 500 candidates x 60 trials
The recorded result is `reports/h2_parameter_estimation_500x60_v1.json`.

Execution used the v0.3.2c simulation at commit `83d3a14906df9fe32faee5b77ba30c65cd50fc2c`, 20 ms physics, 500 deterministic Halton candidates per model, 60 common-random-number trials per condition, seed 970000, and six leave-one-colony-out folds. Folds were parallelized only; a 20-candidate x 10-trial equivalence check reproduced every official sequential fold exactly before the high-resolution run.

Held-out relative improvements for H2 were:

```text
colony 0    +0.78%
colony 7    +2.33%
colony 16   +2.98%
colony 20   +3.96%
colony 21   -3.34%
colony 27  -33.29%
```

Therefore:

```text
H2 held-out wins:             4 / 6
median relative improvement:  +1.55%
promotion guard:              FAIL
canonical parameters updated: NO
```

H2 often reduced training loss, but it did not generalize reliably enough to earn its three extra biological parameters. Colony 27 is a particularly strong failure.

## Identifiability
Fold-specific H2 estimates vary substantially rather than converging on one biological parameter set. Across the six folds the selected values span roughly:

```text
lambda   342 – 1277 mm
tau      2.9 – 37.5 s
rho      0.18 – 0.88
q        0.07 – 0.97
sigma0   0.99 – 1.45 rad/sqrt(s)
A1000    0.11 – 0.72
```

This is not a defensible point estimate for `lambda`, `tau`, or `rho`. Do not average the fold estimates and call that an ant parameter. H2-v1 remains a development hypothesis.

## Browser/runtime verification
The exact v0.3.2c GitHub Pages artifact was re-run in Chromium after estimation. H0 same-seed results remained identical, Y-maze engineering outcomes remained valid left/right choices, bridge duration locking remained correct, direct H2 latent-state decay matched Node, mobile layout had no overflow, and there were zero browser errors. A fitted fold candidate was also executed directly in Chromium and matched the Node simulation outputs for the same seed to floating-point precision.

## Holdout rule
The Y-maze was not accessed by parameter fitting, candidate ranking, stopping rules, or model selection. Its 398 choices remain the later cross-apparatus holdout.

## Current decision
Do **not** promote H2-v1 parameters. The current evidence is:

- H0: inadequate;
- H1: unresolved because entry-state data are missing;
- H2-v1: qualitatively plausible but fails the frozen internal generalization guard;
- canonical browser model: unchanged.

The next scientific move should be to investigate H1 or specify a genuinely different H3 mechanism rather than tune H2-v1 harder against the same data.
