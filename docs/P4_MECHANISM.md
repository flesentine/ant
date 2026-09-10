# P4 painted-trail mechanism freeze

## Status

**P4-v1's exact mechanism remains frozen prospectively. Its implementation and reference-free engineering reachability are now qualified; biological fit, response-target access, parameter promotion, response estimation, and reserved Y-maze validation remain unauthorized.**

Mechanism record:

`hypotheses/p4_painted_trail_mechanism_v1.json`

Git blob:

`609551836e540c341365db9cc987d2ca340cc053`

Starting mechanism-freeze checkpoint:

`4a0a007b080039848dc2d3453afb033921460de5`

The P4 independent-evidence gate and candidate-class decision selected the broad class `P4_candidate_absolute_signal_dependent_bilateral_response`. The mechanism gate then chose one exact realization before any P4 simulation.

## Selected P4-v1 realization

P4-v1 uses the same local front-left/front-right sector summaries for absolute evidence and direction:

`S = L + R`

Detection gate:

`G = 0` when `S <= theta_detect`

`G = 1` when `S > theta_detect`

Directional transduction:

`W(L,R;theta_detect) = 0` when `L + R <= theta_detect`

`W(L,R;theta_detect) = (R - L)/(R + L)` when `L + R > theta_detect`

Steering:

`omega_trail = kappa_trail_per_s * W`

The equality boundary is deliberately **off**: `L + R == theta_detect` produces exactly zero trail steering.

## Why this exact subclass was chosen

The choice is prospective and comes from the frozen independent evidence, not P3's target-ranked failures.

- Direct *Lasius niger* evidence shows that absolute pheromone concentration can affect attraction strength.
- Perna et al. independently pair local bilateral Weber-like directional comparison with a minimum sensory detection threshold below which average turning should vanish.
- Separate *Lasius niger* work found no smooth change in several locomotor measures between one- and 20-ant-passage trail strengths in that assay, so this first P4 mechanism avoids inventing a sigmoid slope, Hill exponent, or other soft-gate shape.

This does **not** claim that a hard deterministic threshold is established *Lasius niger* physiology. It is the simplest exact internal-development realization supported by the admitted evidence.

## Frozen sensor and field structure

P4-v1 retains the existing Gaussian distance-to-painted-segment field:

`C(p) = dose_ratio * exp(-d(p,segment)^2/(2*sigma_field_mm^2))`

It uses deterministic equal-area front-quadrant sector means:

- radius: 10 mm;
- 90 degrees per front-left/front-right sector;
- 4 radial bins;
- 8 angular bins per sector;
- 32 samples per sector.

The geometry is source-inspired engineering structure, not an anatomical estimate.

## Structural parameters

Three shared P4-v1 structural parameters exist:

- `sigma_field_mm` — Gaussian field width;
- `kappa_trail_per_s` — above-threshold steering gain;
- `theta_detect` — absolute detection threshold on `L+R`.

The reachability gate does not promote biological values or future estimation bounds for any of them.

## Exact identities and invariances

The implementation has now proved, reference-free:

- zero dose is bit-exact canonical locomotion and biology RNG;
- zero kappa is bit-exact canonical locomotion and biology RNG;
- guaranteed subthreshold `dose_ratio = 0.10` remains bit-exact canonical while actually evaluating local P4 signal;
- `L+R <= theta_detect` gives exactly zero trail steering;
- equality at the threshold is off;
- equal left/right signal gives zero steering;
- above threshold, swapping left/right reverses steering sign with equal magnitude;
- above threshold, positive scaling that does not cross the threshold preserves the Weber ratio;
- scaling across the threshold intentionally changes response expression, so global scale invariance is absent;
- painted-segment endpoint reversal, rigid translation, and rigid rotation preserve the response;
- a centered parallel trail gives equal sector summaries and zero steering;
- the frozen 4x8 sector geometry remains exact.

## Engineering-only reachability panel

Frozen engineering values, **not biological estimates**:

- `sigma_field_mm = 8`
- `kappa_trail_per_s = 4`
- `theta_detect = 0.25`
- `dt = 0.02 s`

The engineering threshold exists solely to make the reference-free gate testable. Under the normalized Gaussian field, `C(p) <= dose_ratio`; therefore at `dose_ratio = 0.10`, each sector mean is at most `0.10` and `L+R <= 0.20 < 0.25` everywhere.

Frozen identity seeds: `840001` through `840008`.

Frozen nominal reachability seeds: `841000` through `841399` — 400 trials.

## v0.3.4c implementation + reference-free reachability result

Runtime:

`src/p4.js` — blob `bf7d5781bd69ec4568450ebbd3bdc284897b6f61`

Execution policy:

`hypotheses/p4_reachability_execution_v1.json` — blob `0d452f9c0d548ec962e0a6d9826648bf5e14a4ef`

Implementation authorization:

`hypotheses/p4_implementation_authorization_v1.json` — blob `42f8d51b06a20c0c6001a42b6021a134f2694e0d`

Exact result report:

`reports/p4_reference_free_reachability_v1.json`

- Git blob: `f6e77596eb25cc7bca3bf0dde1da712511a1d0d0`
- file SHA-256: `7105d70ddb80d1d8f91f19fcba8a992560dfb22c5989c1c6d11c5479bd946713`
- bytes: `5763`
- status: `reference_free_reachability_passed`

Frozen result record:

`hypotheses/p4_reachability_result_freeze_v1.json`

### Identity panel

All eight frozen seeds passed all three identities:

- zero dose → exact canonical;
- zero kappa → exact canonical;
- `dose_ratio = 0.10` → exact canonical despite P4 local-signal evaluations.

The low-dose case made between 271 and 400 local-signal evaluations per seed, but every one remained subthreshold and therefore made no heading change.

### Nominal 400-trial panel

The nominal engineering panel exercised both gate states and remained finite:

- detected response reached: **yes**;
- subthreshold moving-step state reached: **yes**;
- biology RNG identical at construction: **yes**;
- mean central-zone fraction: `0.8269531383223194`;
- trail-axis exit rate: `0.8825`;
- mean moving speed: `23.969071878106433 mm/s`;
- mean time to exit: `9.221000000000002 s`;
- mean P4 evaluations/trial: `457.3375`;
- mean detected evaluations/trial: `385.485`;
- mean subthreshold evaluations/trial: `71.8525`.

These are engineering diagnostics only. They must **not** be compared to the biological response target or used to tune bounds, objectives, weights, or promotion criteria.

### Qualification history and Chromium

The first audit run `34517441563` passed the permanent suite, P4 reference-free execution, and report validation, but its stripped browser harness omitted `measurement.js` and `h3.js`, dependencies required by `integrity.js`. That was an audit-harness failure, not a P4 scientific or mechanism failure. No frozen P4 byte changed.

The corrected qualification run `34517794416`, job `103007498050`, passed completely from exact execution head `a4efbdd04da136224cfd7bb66a71d18b77147cc0`.

Fresh browser qualification used **Google Chrome 152.0.7977.82** and passed:

- P4 hard-threshold browser parity;
- above-threshold conditional scale behavior;
- canonical app smoke test;
- no response-target request;
- no P2/P3 runtime request;
- no P4 estimation/report request;
- no reserved Y-maze request.

Qualification artifact `10168383473` has digest `sha256:89faa80894fb75b40a6ce024c0c630d5d4be994eecc1a58dca5593463c46ef24`.

## Still prohibited

P4-v1 still has:

- no biological-fit claim;
- no promoted `sigma`, `kappa`, or `theta_detect` value;
- no P4 response-estimation policy or estimator;
- no target-ranked parameter search;
- no P1/P2/P3 result-semantic use;
- no response-target semantic access;
- no response RNG, stochastic detector, P2 lapse, soft gate, sigmoid, Hill exponent, epsilon, or regularizer;
- no path-, colony-, direction-, treatment-, or recent-experience-specific response;
- no pheromone-driven speed change;
- no canonical locomotion change;
- no H2-H5 recombination;
- no reserved Y-maze access.

## Next gate

The next prospective gate is a separate **P4 response-estimation policy**. Before any estimator implementation or response-target semantic access, that gate must freeze the parameter surface and bounds, comparator structure, objective, fold definitions, seeds, trial budgets, nuisance policy, identifiability rules, and promotion criteria.

Reserved Y-maze validation remains locked.
