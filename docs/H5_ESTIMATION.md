# H5 parameter-estimation policy v1

## Status

**Frozen before estimator implementation or H5 parameter search.**

This document records the policy in `hypotheses/h5_parameter_estimation_v1.json`. The H5 mechanism and engineering implementation already existed before this policy, and the Poissonnier open-arena outcomes plus H2/H3/H4 development failures were known. This is therefore post-outcome internal development model comparison, not blind preregistration.

No H5 estimator is implemented by this freeze. No H5 reference-data search is authorized yet.

Frozen policy Git blob: `ead45bacff89bf626deaaf3238a5c363b74279d1`.

## What H5 is allowed to estimate

H5 remains a heading-side mechanism. The only shared nuisance parameters are:

- baseline angular diffusion `angular_sigma_rad_sqrt_s`: **0.7–2.4**, linear;
- shared entry-orientation retention `q`: **0–1**, linear.

Baseline speed remains fixed at **24 mm/s**. H5 does not receive the extra baseline-speed nuisance that H4 needed for a speed-side mechanism.

H5 biological parameters are frozen to these search ranges:

- `lambda_commitment_mm`: **100–3000 mm**, log;
- `tau_commitment_s`: **0.5–40 s**, log;
- `kappa_restore_per_s`: **0–2.0 s⁻¹**, linear.

The `kappa` upper bound is four times the engineering reachability value 0.5 s⁻¹. It is a mechanism-scale choice frozen before H5 search, not a bound inferred from the experimental outcomes.

## Exact nested null

The H5-null model uses the same H5 runtime, shared baseline, shared q transition, seeds, and scoring, with:

```text
kappa_restore_per_s = 0
```

At `kappa=0`, `lambda` and `tau` are inert and have no inferential meaning.

Each fold searches 500 H5-null candidates. H5-context receives 499 five-dimensional Halton candidates plus one exact null-equivalent anchor that copies the selected null `sigma` and `q`, sets `kappa=0`, and uses `lambda=500`, `tau=5` only as inert bookkeeping values.

## Entry transition and theta_ref ordering

The shared q transition is part of the nuisance apparatus model, not H5 biology.

After constructing the simulation but **before the first physics step**:

1. with probability `q`, preserve the shared protocol-sampled entry heading;
2. otherwise replace heading by a uniform draw on `[-π, π)`;
3. H5 then lazily captures that realized heading as `theta_ref` on the first physics step.

The same q applies to short and long treatments. Treatment-specific entry-heading or entry-speed distributions remain forbidden H1-style explanations.

## Fitting targets

Only the same threshold-independent DCM-control targets used by H2/H3/H4 may enter the objective:

- exit time;
- middle-zone fraction;
- beeline distance;
- five-category exit edge including timeout.

The objective remains the audited equal-weight H2/H3/H4 scorer: quantile Wasserstein distances normalized by training-colony SD for continuous metrics and twice Hellinger distance for the normalized exit distribution.

Moving speed, moving distance, straightness, proportion-time-moving, and H5-specific raw heading discriminators are diagnostics only and may not affect candidate ranking.

## LOCO and promotion guards

Use six leave-one-colony-out folds.

For each fold:

- 500 H5-null candidates;
- 500 H5-context candidates total;
- 60 training trials per treatment per candidate;
- 120 held-out evaluation trials per treatment;
- 20 ms physics;
- common random numbers.

The primary H5 survival guard is unchanged from the strongest prior internal test:

> H5-context must beat H5-null on at least **5 of 6** held-out colonies and have strictly positive median relative held-out improvement.

Previous H2/H3/H4 candidates are not refit. Their frozen fold candidates are re-evaluated under the H5 held-out rows/scales/evaluation seeds wherever matched randomness is possible.

For a development-preferred H5 claim, H5 must additionally beat the **best prior candidate per fold** among H2/H3/H4 on at least **4 of 6** folds and have positive median relative improvement versus that per-fold best prior. Pairwise H2, H3, and H4 comparisons are also reported.

Cross-family wins cannot rescue failure against H5's own null.

## Search

Deterministic Halton mapping:

```text
prime 2  -> angular_sigma_rad_sqrt_s
prime 3  -> q
prime 5  -> lambda_commitment_mm
prime 7  -> tau_commitment_s
prime 11 -> kappa_restore_per_s
```

Frozen seeds:

```text
fit root:      1,110,000
fold fit:      1,110,000 + fold*10,000
fold eval:     1,710,000 + fold*10,000
```

No local optimizer, adaptive second stage, bound changes, extra candidates, favorable reruns, or post-hoc objective changes are allowed.

## Numerical/runtime freeze

The estimator must use the already-reviewed H5 runtime exactly:

- H5 runtime blob: `b43f8e9fcaa4b2cc9981ed4f2922a833cc1a3177`;
- H5 model blob: `ee2e5570f6d43cd91317fd38299b70bde32f191a`;
- shared integrity blob: `f23c68a6955832b70eeb3bd3e6893d71a3759018`;
- shared core blob: `24777aac3577d442893e4779d70aee4e27761fe8`;
- measurement blob: `8845726e02360655c605851662256bc729277b21`;
- reference-target blob: `07e2b8cf2dddbfcb152f0bd6d3031d473e0901b3`.

H5 uses exact exponential commitment decay and the exact circular deterministic restoration map already implemented in `src/h5.js`. On a moving step, deterministic H5 restoration occurs before the unchanged baseline angular-noise draw. During pauses H5 adds no drift. The pause preview may inspect a cloned RNG state only and may not mutate the real biology RNG.

## Before any high-resolution search

A future H5 estimator must first:

1. pin the exact policy blob and all runtime/model/reference/comparator blobs;
2. pass synthetic null/anchor/wiring qualification without tuning against Poissonnier outcomes;
3. pass the full H0–H5 regression suite and historical H4 immutable-runtime audit;
4. demonstrate Node ↔ real-Chromium parity for selected H5 null/context executions;
5. prove no Y-maze access, forbidden fit metrics, geometry-derived target heading, treatment-specific entry state, or adaptive search path;
6. record the qualified estimator executable blob.

Only then may the frozen 500×60×6 LOCO procedure run.

## Failure rule

A failed H5 result is not permission to change bounds, nuisance parameters, objective metrics, weights, seeds, candidate count, fold thresholds, or to add baseline speed. A failed H5-v1 must remain failed unless a genuine implementation error invalidates the execution.

The Y-maze remains locked throughout H5 development estimation.


## Freeze integrity regression

`tests/h5-estimation-policy.test.js` pins the exact policy blob plus the H5 mechanism/runtime/model, measurement layer, audited scorer reference, threshold-independent target file, and frozen H2/H3/H4 result records. It also asserts that `tools/run-h5-estimation.js` does not yet exist and that high-resolution H5 search remains unauthorized.
