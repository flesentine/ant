# H5 v1 — Transient entry-heading restoration

H5 is the next open-arena locomotion hypothesis after H2-v1, H3-v1, and H4-v1 all failed their frozen held-out promotion guards.

This is **not a blind preregistration**. The open-arena short/long outcome and all prior model results are already known. The purpose of this file and `hypotheses/h5_transient_entry_heading_restoration_v1.json` is to freeze a genuinely different mechanism before H5 code or H5 parameter search exists.

## Mechanism

H5 introduces a transient commitment state `C` initialized from observable recent constrained travel:

```text
C0 = 1 - exp(-L / lambda_commitment)
dC/dt = -C / tau_commitment
```

After the normal shared entry transition is sampled, H5 stores the ant's **own realized free-arena entry heading** as `theta_ref`. It then adds deterministic circular restoring drift:

```text
dtheta =
    kappa_restore * C(t) * sin(theta_ref - theta) dt
  + sigma0 * turnScale * dW_t
```

The angular-noise coefficient is unchanged. Speed is unchanged. Pauses are unchanged. H5 creates no new random-number stream.

## Critical anti-cheating rule

`theta_ref` is not the arena centerline, an exit bearing, or a fixed apparatus "forward" direction. It is the heading the simulated ant actually has **after** the shared post-toothpick entry transition.

Short and long conditions therefore use the same entry-state distribution. History changes only the strength of restoration around each ant's own realized entry heading.

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

The implementation must reproduce this identity in a deterministic regression. This prevents H5 from silently turning into an arbitrary per-tick steering rule.

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
2. Implement an engineering-only H5 model exactly against the freeze.
3. Add invariance, deterministic-drift, RNG, firewall, and timestep tests.
4. Run mechanism reachability only, with no parameter fitting and no Y-maze.
5. Perform code review and real-Chromium Node↔browser parity.
6. Only after the implementation is stable, design and freeze a **separate H5 estimation policy**.
7. Do not run a reference-data H5 parameter search until that separate policy is frozen and audited.

## Current scientific status

```text
H0  -> screening-incompatible
H1  -> unresolved; measured entry-state evidence missing
H2  -> high-resolution searched; not promoted
H3  -> high-resolution searched; not promoted
H4  -> high-resolution searched; not promoted
H5  -> mechanism frozen; not implemented; not searched
```

The canonical ant remains unchanged, and the Y-maze remains locked.
