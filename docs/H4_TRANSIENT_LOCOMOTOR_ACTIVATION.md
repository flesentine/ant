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

## Measurement firewall

The existing threshold-independent H2/H3 estimation targets remain the only allowed development-fit targets:

- time to arena edge;
- middle-zone fraction;
- beeline distance;
- exit-edge category.

Moving speed remains a **diagnostic only** until the AnimalTA movement classifier is recovered. H4 is not allowed to win merely by fitting the speed metric that motivated it.

## Required order of work

1. **Freeze H4 mechanism** — this document and `hypotheses/h4_transient_locomotor_activation_v1.json`.
2. Implement H4 with engineering-only values.
3. Add mechanism tests proving that H4 changes speed but not heading RNG, pause RNG, entry state, or observation RNG.
4. Run reachability only — no target fitting and no Y-maze access.
5. Freeze a separate H4 estimation policy only after the implementation passes.
6. If estimation is later run, compare H4-context against a matched H4-null baseline with shared nuisance parameters and common random numbers under leave-one-colony-out evaluation.

## Current scientific status

```text
H0  -> inadequate
H1  -> unresolved; entry-state evidence missing
H2  -> not promoted
H3  -> not promoted
H4  -> mechanism frozen; not implemented; not searched
```

The canonical ant remains unchanged.
