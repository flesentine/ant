# H4 v1 — Transient locomotor activation

H4 is the next open-arena mechanism class after H2-v1 and H3-v1 failed their frozen internal held-out promotion guards.

## Why H4 is different

H2 and H3 both changed directional persistence directly:

- H2 reduced continuous angular diffusion.
- H3 reduced the hazard of discrete reorientation events.

H4 is intentionally forbidden from doing either. It changes **moving speed only**.

The candidate state is a transient locomotor activation variable `A` initialized from observable recent constrained travel:

```text
A0 = 1 - exp(-L / lambda_activation_mm)
dA/dt = -A / tau_activation_s
v_H4(t) = v_baseline(t) * (1 + rho_speed * A(t))
```

`L` is `recent_constrained_travel_mm`. The short/long treatment label itself is not an input.

The implementation integrates the exponentially decaying activation analytically over each physics step. If an apparatus boundary is crossed inside a step, the exit timestamp is obtained by solving the corresponding partial-step distance integral rather than treating the full-step mean speed as constant. H4 adds no random-number stream: matched trials consume the same baseline speed, heading, pause, protocol, and observation draws.

The original freeze in `hypotheses/h4_transient_locomotor_activation_v1.json` is intentionally left unchanged after implementation so it remains an auditable record of what was specified before code or H4 search.

## Why test a speed-side mechanism

In the descriptive DCM-control record, long-history ants have higher mean moving speed than short-history ants, and the sign of that contrast is stable in all six leave-one-colony-out recalculations. The descriptive bootstrap interval still reaches zero, so this is motivation rather than proof.

The key structural point is that the existing baseline angular diffusion is time-based. If an ant moves faster while accumulating the same angular variance per unit time, it covers more distance before its heading diffuses by the same amount. H4 can therefore generate a straighter spatial path **indirectly** without touching the heading process.

That makes H4 falsifiably different from H2/H3:

- heading increment law per unit time: unchanged;
- pause hazard and duration: unchanged;
- entry heading and position: unchanged;
- reorientation events/turn angles: unchanged;
- moving speed early after entry: increased for longer history;
- speed contrast: decays with time;
- zero history or `rho_speed = 0`: exact context-free behavior.

## Implementation

The engineering-only model is `models/lasius_niger_locomotion_h4_v1.json`. Its demonstration values are:

```text
lambda_activation = 500 mm
tau_activation    = 5 s
rho_speed         = 0.25
```

These are mechanism-reachability values, **not biological estimates**.

`src/integrity.js` owns H4 latent-state initialization, exact decay, analytical displacement integration, exact mid-step boundary timing, provenance, and integrity firewalls. `src/sim-core.js` exposes a neutral per-ant `speedMultiplier` whose default is exactly `1`, leaving H0/H2/H3 unchanged unless H4 explicitly sets it.

The complete H4 test suite verifies:

- exact exponential activation decay;
- exact activation-integral consistency when a step is split;
- H4-induced displacement convergence across physics steps `0.04`, `0.02`, and `0.01` s in an isolated deterministic walk;
- exact mid-step apparatus-boundary timing from the H4 exponential speed integral;
- matched short/long trials retain identical heading evolution, speed-noise state, pause state, and biology RNG cadence;
- changing observation FPS, observation noise, and trajectory logging does not perturb the biological trajectory or biology RNG;
- zero history is trajectory-equivalent to H4 disabled;
- `rho_speed = 0` is trajectory-equivalent to H4 disabled;
- protocol/state layers cannot inject H4 parameters or latent `A`;
- the intended speed-side signature is mechanically reachable;
- short and long assays use the same H4 model hash.

## Chromium review

Before any H4 estimator design, the final implementation was exercised in real headless Google Chrome on an Ubuntu GitHub runner. The review covered both the normal interactive lab and direct construction of the H4 candidate inside the browser runtime.

The interactive smoke test loaded the canonical 20 cm and 100 cm open-arena assays, stepped the simulation, exercised display controls, changed seed, ran to pause/completion, and loaded/stepped the straight-bridge assay. The interactive assays remained on the canonical `lasius_niger_locomotion_v1` model with the same model hash across the short/long open-arena conditions.

The browser then directly instantiated `lasius_niger_locomotion_h4_v1` for matched short/long seeds. After 1 s at seed `424242`:

```text
short A0       = 0.3296799539643607
long A0        = 0.8646647167633873
short distance = 24.520979777584156 mm
long distance  = 27.29085250725249 mm
heading short  = heading long = -0.22744178799766016 rad
speed factor   = 0.9057014837319515 in both runs
biology RNG    = 474773058246 in both runs
model hash     = fcea34e0 in both runs
```

Chrome reported zero runtime exceptions and zero console errors. The Y-maze was not loaded by the browser review.

During this code review, one real numerical issue was found and fixed: mid-step H4 boundary timing had used the full-step mean activation speed as though it were constant over the partial exit interval. The corrected implementation solves

```text
distance(t) = v0 * [t + rho*A0*tau*(1 - exp(-t/tau))]
```

inside the exit step and decays `A` only to the actual event time. A deterministic coarse-step regression test now protects this behavior. This matters because time to arena edge is an allowed future development-fit observable.

The final review run was GitHub Actions run `33683024429` on commit `a1d6b9bf5a2374d7969407754ee43f35845ace7e`. It passed the full H0–H4 suite, Chromium UI/runtime checks, and a fresh 400-trial-per-condition H4 reachability rerun.

## 400-trial mechanism reachability

The post-review reachability rerun used 400 matched trials per condition, seeds `928491..928890`, and 20-ms physics. No reference target file was loaded, no optimization was performed, and the Y-maze was not accessed. The reported reachability numbers were unchanged at the displayed precision after the boundary-timing correction.

| Metric | 200 mm history | 1000 mm history |
| --- | ---: | ---: |
| Initial activation | 0.32968 | 0.86466 |
| Observed moving speed | 24.923 mm/s | 26.640 mm/s |
| Time to edge | 8.787 s | 8.184 s |
| Observed distance | 214.793 mm | 212.107 mm |
| Straightness | 0.73214 | 0.74451 |

All frozen qualitative reachability checks passed: the long-history condition had greater activation, greater moving speed, earlier edge arrival, and slightly greater spatial straightness. The exact execution and final verification are recorded in `reports/h4_mechanism_reachability_v1.json`.

This result answers only **can this mechanism produce the intended structural signature without contaminating the other processes?** It does not answer whether H4 explains the data better than a matched null or H2/H3.

## Frozen estimation policy

The separate H4 estimator policy is `hypotheses/h4_parameter_estimation_v1.json`. It was frozen and audited before estimator implementation or H4 parameter search. The estimator pins its exact Git blob SHA:

```text
a889007f988628a8e61139f4349c23714cc1dd68
```

If that policy file changes by even one byte, `tools/run-h4-estimation.js` refuses to run.

The frozen estimator uses:

- shared nuisance base speed in `[12, 36]` mm/s;
- shared angular diffusion in `[0.35, 2.4]` rad/sqrt(s), log scale;
- shared entry-orientation retention `q` in `[0, 1]`;
- H4 `lambda_activation` in `[100, 3000]` mm, log scale;
- H4 `tau_activation` in `[0.5, 40]` s, log scale;
- H4 `rho_speed` in `[0, 0.95]`;
- deterministic Halton coordinates with primes `2,3,5,7,11,13` assigned in that order;
- the audited corrected H2/H3 score implementation without H4-specific reweighting;
- six leave-one-colony-out folds;
- an H4-null fit with `rho_speed = 0` and independently fitted shared nuisance parameters;
- an H4-context fit with 499 Halton candidates plus one exact fitted-null anchor in the frozen 500-candidate high-resolution search;
- common random numbers and the pre-existing `h2_estimation_entry_transition_v1` entry-transition stream;
- exact H4 boundary timing for `time_to_exit_s`;
- matched held-out re-evaluation of the frozen H2-v1 and H3-v1 fold candidates.

The frozen high-resolution budget is exactly 500 candidates per model family per fold, 60 training trials per condition per candidate, 120 held-out evaluation trials per condition, six folds, root seed `990000`, and `dt = 0.02 s`. High-resolution mode rejects attempts to override those values.

## Estimator implementation and qualification

`tools/run-h4-estimation.js` is implemented with three deliberately separate execution classes:

1. `qualification` — synthetic/reference-free implementation qualification only;
2. `smoke` — low-resolution reference-data execution-path smoke only, explicitly not evidence;
3. `highres` — the only mode allowed to evaluate the frozen H4 promotion guard.

High-resolution mode is hard-gated: it first runs a passing synthetic qualification **before loading the Poissonnier reference target in that process**, then checks that the frozen candidate/trial/seed/dt values have not been overridden, and only then may load the reference target.

The reference-free qualification checks:

- exact frozen policy blob identity;
- paired nuisance Halton coordinates;
- exact H4-null/context equivalence at `rho_speed = 0`;
- insertion of the selected null candidate as the exact context anchor;
- candidate-to-model parameter wiring;
- 200/1000 mm recent constrained travel as the only H4 context input;
- normalized five-category exit scoring including timeout;
- reuse of the audited H3 scoring API;
- exact H4 partial-step boundary timing;
- unchanged baseline biology RNG cadence;
- no colony identity in H4 biology;
- no Y-maze access.

The exact null anchor reports `lambda_activation_mm = null` and `tau_activation_s = null`, because those values have no inferential meaning when `rho_speed = 0`. Its fixed `rho_speed = 0` is also not falsely reported as a fitted parameter hitting a search boundary.

GitHub Actions run `33701361416` on estimator/test commit `65b0e462f2a7874a3a4c9f097b1d9ff45dc5d10a` passed:

- exact frozen policy-blob verification;
- the complete H0–H4 test suite;
- the new H4 estimator tests;
- reference-free estimator qualification;
- low-resolution six-fold estimator smoke;
- rejection of a deliberately invalid `--mode highres --candidates 499` override.

The qualification reported `reference_outcomes_accessed = false`, `ymaze_accessed = false`, and `scientific_evidence = false`. The low-resolution smoke explicitly reported `scientific_evidence = false` and `promotion_evaluated = false`. Its numerical fold results are not interpreted scientifically.

Review artifact `9873626596` has ZIP SHA-256 `ad18e8d7e4ce40acad73ec05c174cbcc937fc1a44e4b169cef86e419f255d59a`.

## Frozen high-resolution result

The authorized frozen high-resolution H4 search has now been completed. The scientific execution used commit `cb63d00e030b87016890f169f2852699ee6f8d6b` and exactly the frozen budget: 500 H4-null candidates per fold; 499 H4-context Halton candidates plus one exact fitted-null anchor per fold; 60 training trials per condition per candidate; 120 held-out evaluation trials per condition; six LOCO folds; root seed `990000`; and `dt = 0.02 s`.

GitHub Actions run `33709353049` completed successfully. Artifact `9876724477` has ZIP SHA-256 `a81dd68a4c0e39f0cd7bf81831b7ab72098c0759b2a3489095ce523af4808473`. The committed report `reports/h4_parameter_estimation_500x60_v1.json` has SHA-256 `05f76e18d6ecdff9f038f4244227ede7a73cc323ca9857ac1d6dbbff1dd2e310`.

### Promotion decision: FAIL

Primary H4 vs H4-null guard:

- H4 wins: **2/6** folds; required **>=5/6**;
- median relative held-out improvement: **0.0%**; required strictly positive;
- H4 promotion guard: **failed**.

Secondary comparisons:

- vs H2-v1: **2/6** wins, median relative improvement **-3.43%** → failed;
- vs H3-v1: **3/6** wins, median relative improvement **+3.05%**, but required >=4/6 wins → failed.

Held-out colonies `20` and `21` selected the exact null anchor. No selected H4-context parameter hit the frozen 1% search-bound diagnostic.

H4-v1 therefore failed its frozen internal development test and is not development-preferred over H2-v1 or H3-v1. No canonical parameters were updated, moving speed remained diagnostic-only, and the Y-maze was not accessed.

Per the frozen failure rule, H4-v1 must not be rescued by changing bounds, seeds, nuisance parameters, metric weights, fold requirements, or by tuning the same mechanism harder. Any next hypothesis must be substantively different or justified by genuinely new evidence.

## Measurement firewall

The existing threshold-independent H2/H3 estimation targets remain the only allowed development-fit targets:

- time to arena edge;
- middle-zone fraction;
- beeline distance;
- exit-edge category.

Moving speed remains a **diagnostic only** until the AnimalTA movement classifier is recovered. H4 is not allowed to win merely by fitting the speed metric that motivated it.

## Required order of work

1. **Freeze H4 mechanism** — complete.
2. Implement H4 with engineering-only values — complete.
3. Add the complete frozen mechanism/invariance tests — complete.
4. Run reachability and Chromium/code review — complete.
5. **Freeze and audit the separate H4 estimation policy** — complete.
6. Implement the estimator against the exact frozen policy blob — complete.
7. Run the reference-free synthetic estimator qualification — complete.
8. Run low-resolution execution-path smoke only — complete; not evidence.
9. Run the frozen 500 × 60 × 6 high-resolution LOCO search — complete; failed the frozen promotion guard.
10. Record the frozen failure and stop same-mechanism H4 retuning — complete.

## Current scientific status

```text
H0  -> inadequate
H1  -> unresolved; entry-state evidence missing
H2  -> not promoted
H3  -> not promoted
H4  -> high-resolution searched; failed frozen promotion guard; not promoted
```

The canonical ant remains unchanged. The Y-maze remains locked. The next model-development hypothesis must be substantively different from H4 or be justified by genuinely new evidence.
