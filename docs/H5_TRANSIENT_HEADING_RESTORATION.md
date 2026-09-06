# H5 v1 — Transient entry-heading restoration

H5 is the next open-arena locomotion hypothesis after H2-v1, H3-v1, and H4-v1 all failed their frozen held-out promotion guards.

This is **not a blind preregistration**. The open-arena short/long outcome and all prior model results are already known. The purpose of this file and `hypotheses/h5_transient_entry_heading_restoration_v1.json` is to freeze a genuinely different mechanism before H5 code or H5 parameter search exists.

## Mechanism

H5 introduces a transient commitment state `C` initialized from observable recent constrained travel:

```text
C0 = 1 - exp(-L / lambda_commitment)
dC/dt = -C / tau_commitment
```

After the normal shared entry transition is fully resolved, H5 stores the ant's **own realized free-arena entry heading** as `theta_ref`. Concretely, `theta_ref` is captured lazily immediately before the first free-arena physics step, not in the constructor. It then adds deterministic circular restoring drift while the ant is moving:

```text
dtheta =
    kappa_restore * C(t) * sin(theta_ref - theta) dt
  + sigma0 * turnScale * dW_t
```

The angular-noise coefficient is unchanged. Speed is unchanged. H5 creates no new random-number stream. During a baseline pause, H5 applies no heading drift; heading remains fixed while `C` continues to decay in real time.

## Critical anti-cheating rule

`theta_ref` is not the arena centerline, an exit bearing, or a fixed apparatus "forward" direction. It is the heading the simulated ant actually has **after** the shared post-toothpick entry transition.

Short and long conditions therefore use the same entry-state distribution. History changes only the strength of restoration around each ant's own realized entry heading. The lazy first-step capture is required because the current shared `q` transition can be applied after `Simulation` construction; constructor-time capture would remember the wrong heading.

This keeps H5 distinct from H1, which would require genuinely measured treatment-specific entry-state distributions.

## Why H5 is different

- **H2** reduced continuous angular diffusion. H5 leaves diffusion amplitude unchanged and adds deterministic drift.
- **H3** reduced discrete reorientation-event hazard. H5 does not alter event timing.
- **H4** increased moving speed. H5 does not alter speed.
- **H1** would change measured short/long entry conditions. H5 uses the same shared entry transition in both conditions.

The key falsifiable distinction from H2 is that H5 predicts unchanged **local residual angular variance** once the deterministic restoring drift is accounted for, but stronger longer-lag return toward the realized entry heading.

## Frozen deterministic identity

With angular noise disabled and `delta = theta - theta_ref`:

```text
d(delta)/dt = -kappa_restore * C(t) * sin(delta)

tan(delta(t)/2)
  = tan(delta(0)/2)
    * exp[-kappa_restore * C0 * tau_commitment
          * (1 - exp(-t/tau_commitment))]
```

The implementation must reproduce this identity in a deterministic uninterrupted-moving regression. This prevents H5 from silently turning into an arbitrary per-tick steering rule. Paused intervals are excluded from this identity because H5 applies no drift while paused, although `C` continues to decay.

## Frozen engineering reachability values

For initial mechanism reachability only:

```text
lambda_commitment = 500 mm
tau_commitment    = 5 s
kappa_restore     = 0.5 s^-1
```

These values are frozen before implementation and are **not biological estimates**. The initial reachability pass must not sweep or tune them against the reference outcomes.

## Structural predictions

Longer constrained travel should produce stronger early correction of heading deviations from the ant's own entry heading. If the mechanism is relevant, that can yield greater path straightness, shorter traveled distance, and earlier arena-edge arrival without directly changing moving speed or angular-noise amplitude.

H5 predicts:

- stronger early restoring drift in the long-history condition;
- unchanged local stochastic angular-noise amplitude;
- stronger longer-lag heading autocorrelation with realized entry heading;
- fewer sustained large heading excursions;
- unchanged moving-speed and pause processes;
- decay of the history effect with time;
- exact context-free recovery when history is zero or `kappa_restore = 0`.

## What H5 may not read

H5 may not read the short/long label, colony identity, reference outcomes, centerline direction, edge bearings, distance to an edge, pheromone state, Y-maze outcomes, or future trajectory information.

## Implementation order

1. Mechanism freeze — **complete**.
2. Implement an engineering-only H5 model exactly against the freeze — **complete**.
3. Add invariance, deterministic-drift, RNG, firewall, and timestep tests — **complete**.
4. Run mechanism reachability only, with no parameter fitting and no Y-maze — **complete**.
5. Perform code review and real-Chromium Node↔browser parity — **complete for the implementation pass**.
6. Design and freeze a **separate H5 estimation policy** — **complete** (`hypotheses/h5_parameter_estimation_v1.json`).
7. Implement and synthetically qualify that frozen estimator policy, then code-review and verify Node ↔ real-Chromium parity before any high-resolution reference-data search — **complete**.
8. Run the one authorized frozen 500×60×6 LOCO search and freeze the result — **complete; failed promotion and closed**.

## Current scientific status

```text
H0  -> screening-incompatible
H1  -> unresolved; measured entry-state evidence missing
H2  -> high-resolution searched; not promoted
H3  -> high-resolution searched; not promoted
H4  -> high-resolution searched; not promoted
H5  -> official frozen high-resolution search failed promotion; result frozen; closed
```

The canonical ant remains unchanged, and the Y-maze remains locked.


## Pre-implementation freeze review clarification

Before any H5 code was written, review of the current runtime exposed two implementation ambiguities and one event-timing edge case. They are now part of the freeze:

- `theta_ref` is captured **at the first physics step**, after all shared entry-transition logic, so a shared `q` transition applied after construction is correctly remembered.
- H5 restoring drift runs **only on moving intervals**. Baseline pauses keep heading fixed while `C` decays in real time.
- If an apparatus-boundary termination occurs partway through a step, the reported final `C` must be advanced only to that exact terminal event time.

These clarifications were made before H5 implementation and before any H5 estimator or parameter search. They do not change the frozen engineering reachability values or introduce outcome-dependent tuning.


## Implementation and reachability result

H5 is implemented in `src/h5.js`, intentionally layered over the unchanged H0–H4 integrity runtime. This was necessary because the historical H4 estimator pins the exact `src/integrity.js` and `src/sim-core.js` blobs; H5 does not weaken or rewrite that audit boundary.

The H5 runtime uses no independent H5 randomness. To preserve the baseline pause semantics without changing the frozen core, it previews the upcoming pause decision using a cloned copy of the current biology RNG state. The clone does not mutate the real RNG and does not create an independent stochastic source. Deterministic restoration is applied only when the frozen core will execute a moving step.

The real 400-trial-per-condition mechanism-reachability execution used seeds 928491–928890 and `dt=0.02`. It loaded no reference target, performed no fitting or parameter sweep, and did not access the Y-maze.

```text
                         short history   long history
commitment initial        0.329680        0.864665
mean exit time (s)        9.0132          8.9304
mean distance (mm)      212.6449        210.6593
mean straightness         0.74398         0.77100
mean moving speed        23.9328         23.9305
```

All frozen structural checks passed: larger long-history commitment, all entry-heading references captured, lower long-history exit time, lower long-history distance, and greater long-history straightness. Moving speed remained effectively unchanged, as H5 requires.

The exact report is `reports/h5_mechanism_reachability_v1.json` (SHA-256 `babcf964ea01a877650a238959b25e7483f6a5afad22aa8ef79ad84da115f2e6`).

A real Chromium parity audit replayed four H5 cases against Node with zero browser exceptions, zero console errors, and zero Y-maze network requests.


## Frozen estimator policy

The separate H5 development-estimation policy is now frozen in `hypotheses/h5_parameter_estimation_v1.json` before any H5 estimator implementation or H5 parameter search.

Key choices:

- shared nuisances: `angular_sigma_rad_sqrt_s` and shared entry-retention `q` only;
- baseline speed remains fixed at 24 mm/s;
- H5 bounds: `lambda=100–3000 mm`, `tau=0.5–40 s`, `kappa=0–2 s⁻¹`;
- exact nested null: `kappa=0`;
- 500 null + 500 total context candidates per fold, 60 training trials per condition, 120 held-out evaluation trials, six LOCO folds;
- primary guard: at least 5/6 H5-vs-null held-out wins plus positive median relative improvement;
- development-preferred guard: at least 4/6 wins plus positive median improvement versus the per-fold best frozen H2/H3/H4 comparator;
- fitting targets remain limited to exit time, middle-zone fraction, beeline, and five-category exit edge;
- moving speed, distance, straightness, raw heading discriminators, colony identity as biology, treatment-specific entry state, and every Y-maze quantity remain forbidden fitting inputs.

No H5 estimator implementation or high-resolution H5 search is authorized by the policy freeze alone. See `docs/H5_ESTIMATION.md`.


## Official result and closure

H5-v1 completed its one official frozen high-resolution LOCO evaluation in run `33947883644`. The exact result is `reports/h5_parameter_estimation_500x60_v1.json` (Git blob `1fcdb357e1755b5ba5cb4be6ee8b69db617e732d`, SHA-256 `28bcbcb4782dac05606f3c204fe661f5503d2a93ecfefa6fc2c27b719e885053`).

It won only **3/6** held-out folds versus its own exact nested null, below the frozen **5/6** requirement. Against the per-fold best frozen H2/H3/H4 comparator it won only **2/6**, with median relative improvement **−7.12%**, below the frozen **4/6 + positive median** requirement.

A separate post-hoc audit reproduced every held-out loss exactly and passed **48/48** real-Chromium parity cases with zero exceptions, console errors, or Y-maze requests. No implementation error invalidates the result.

H5-v1 is therefore not promoted. The result is frozen and the hypothesis is permanently closed under its predeclared failure rule.
