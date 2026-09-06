# Locomotion model competition

ANTLAB v0.3.2 has now evaluated four distinct post-history locomotion mechanisms (H2–H5) under frozen held-out development guards while preserving the H0 browser assays and the locked Y-maze holdout. None earned canonical promotion. H5-v1 completed its one official frozen high-resolution search and is now failed, frozen, and closed.

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

## H3 — transient reorientation gate
H3 changed the timing of discrete major reorientation events instead of scaling continuous angular diffusion. Its corrected frozen high-resolution LOCO search is recorded in `reports/h3_parameter_estimation_500x60_v1.json`.

H3 won only **1/6** held-out colonies versus its own null, with median relative improvement **−0.60%**. Against matched re-evaluated H2-v1 candidates it won **2/6**, with median relative improvement **−6.20%**. H3 therefore failed both frozen guards and was not promoted.

## H4 — transient locomotor activation
H4 moved to a speed-side mechanism: recent constrained travel initialized a decaying activation that increased moving speed without changing heading noise, reorientation events, pauses, entry state, or boundary behavior. Its frozen search is recorded in `reports/h4_parameter_estimation_500x60_v1.json`.

The authorized 500-candidate × 60-trial × 6-fold LOCO search produced:

```text
H4 vs H4-null held-out wins:  2 / 6
median relative improvement:   0.00%
H4 vs H2-v1 wins:             2 / 6
median vs H2-v1:              -3.43%
H4 vs H3-v1 wins:             3 / 6
median vs H3-v1:              +3.05%
promotion/comparison guards:  FAIL
canonical parameters updated: NO
```

Held-out colonies 20 and 21 selected the exact null anchor. Moving speed remained diagnostic-only and the Y-maze was not accessed. Per the frozen failure rule, H4 must not be rescued by changing bounds, seeds, nuisance parameters, metric weights, fold requirements, or by tuning the same speed-gain mechanism harder.

## H5 — transient entry-heading restoration

H5 is frozen in `hypotheses/h5_transient_entry_heading_restoration_v1.json` before implementation or H5 parameter search.

After the existing shared entry transition is sampled, H5 stores the ant's own realized free-arena entry heading `theta_ref`. Recent constrained travel initializes a decaying commitment `C`, and H5 adds deterministic circular drift:

```text
C0 = 1 - exp(-L / lambda_commitment)
dC/dt = -C / tau_commitment
dtheta_drift/dt = kappa_restore * C(t) * sin(theta_ref - theta)
```

The baseline angular-noise amplitude is unchanged. Speed and pauses are unchanged. H5 may not use the arena centerline, edge bearings, a fixed apparatus forward axis, or treatment-specific fitted entry headings as its target.

H5 is implemented in `src/h5.js` as an extension over the exact frozen H0–H4 integrity runtime, preserving the historical H4 runtime blob pins.

The one pre-frozen engineering parameter set was run for 400 common-random-number trials per condition. The long-history engineering condition had lower mean exit time (8.9304 vs 9.0132 s), lower mean observed distance (210.659 vs 212.645 mm), and higher mean straightness (0.7710 vs 0.7440). Mean observed moving speed was essentially unchanged (23.9305 vs 23.9328 mm/s). All frozen structural reachability checks passed.

That reachability pass was engineering-only. H5 later proceeded through its separately frozen estimator policy, qualification, authorization, and one official 500×60×6 LOCO execution.

Official H5-v1 result:
```text
H5 vs H5-null wins:          3 / 6
median vs H5-null:           +0.81%
H5 survival guard:           FAIL
H5 vs H2-v1 wins:            4 / 6
H5 vs H3-v1 wins:            4 / 6
H5 vs H4-v1 wins:            3 / 6
H5 vs per-fold best prior:   2 / 6
median vs best prior:        -7.12%
development preferred:       NO
canonical promotion:         NO
```

The exact result is `reports/h5_parameter_estimation_500x60_v1.json` (Git blob `1fcdb357e1755b5ba5cb4be6ee8b69db617e732d`, SHA-256 `28bcbcb4782dac05606f3c204fe661f5503d2a93ecfefa6fc2c27b719e885053`). A post-hoc audit reproduced all six folds exactly and passed 48/48 real-Chromium parity cases with zero Y-maze requests. No implementation error invalidates the failure. Per the frozen rule, H5-v1 may not be tuned harder.

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
Do **not** promote H2-v1, H3-v1, or H4-v1. The current evidence is:

- H0: inadequate;
- H1: unresolved because measured entry-state data are missing;
- H2-v1: closest so far, but 4/6 held-out wins still failed its frozen >=5/6 guard;
- H3-v1: failed its own null and H2 comparison guards;
- H4-v1: failed its own null and H2/H3 comparison guards;
- H5-v1: official frozen high-resolution result failed own-null and best-prior guards; result frozen; not promoted; closed;
- canonical browser model: unchanged;
- Y-maze: still locked.

The short-vs-long data still contain a large, sign-stable locomotion structure that H0 cannot explain, but H2-v1 through H5-v1 have all failed their frozen held-out guards. Do not retune H2, H3, H4, or H5 against these same outcomes. Any next hypothesis must be substantively different or justified by genuinely new evidence. The canonical model remains unchanged and the Y-maze remains locked.
