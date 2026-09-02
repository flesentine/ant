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

The implementation integrates the exponentially decaying activation over each physics step and uses its exact step mean as the speed multiplier. H4 adds no random-number stream: matched trials consume the same baseline speed, heading, pause, protocol, and observation draws.

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

`src/integrity.js` owns H4 latent-state initialization, exact decay, step-averaged speed gain, provenance, and integrity firewalls. `src/sim-core.js` exposes a neutral per-ant `speedMultiplier` whose default is exactly `1`, leaving H0/H2/H3 unchanged unless H4 explicitly sets it.

The complete H4 test suite verifies:

- exact exponential activation decay;
- exact activation-integral consistency when a step is split;
- H4-induced displacement convergence across physics steps `0.04`, `0.02`, and `0.01` s in an isolated deterministic walk;
- matched short/long trials retain identical heading evolution, speed-noise state, pause state, and biology RNG cadence;
- changing observation FPS, observation noise, and trajectory logging does not perturb the biological trajectory or biology RNG;
- zero history is trajectory-equivalent to H4 disabled;
- `rho_speed = 0` is trajectory-equivalent to H4 disabled;
- protocol/state layers cannot inject H4 parameters or latent `A`;
- the intended speed-side signature is mechanically reachable;
- short and long assays use the same H4 model hash.

The final full H0–H4 implementation suite and 400-trial H4 reachability rerun passed on commit `820a69695168922f59f54f51d82262662c1cf3b6` in GitHub Actions run `33681326517`. The temporary branch-only verification workflow was removed after the successful run.

## 400-trial mechanism reachability

The verified reachability run used 400 matched trials per condition, seeds `928491..928890`, and 20-ms physics. No reference target file was loaded, no optimization was performed, and the Y-maze was not accessed.

| Metric | 200 mm history | 1000 mm history |
| --- | ---: | ---: |
| Initial activation | 0.32968 | 0.86466 |
| Observed moving speed | 24.923 mm/s | 26.640 mm/s |
| Time to edge | 8.787 s | 8.184 s |
| Observed distance | 214.793 mm | 212.107 mm |
| Straightness | 0.73214 | 0.74451 |

All frozen qualitative reachability checks passed: the long-history condition had greater activation, greater moving speed, earlier edge arrival, and slightly greater spatial straightness. The exact execution and final verification are recorded in `reports/h4_mechanism_reachability_v1.json`.

This result answers only **can this mechanism produce the intended structural signature without contaminating the other processes?** It does not answer whether H4 explains the data better than a matched null or H2/H3.

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
4. Run reachability only — complete.
5. **Freeze a separate H4 estimation policy before any H4 parameter search.**
6. Only then, if estimation is authorized, compare H4-context against a matched H4-null baseline with shared nuisance parameters and common random numbers under leave-one-colony-out evaluation.

## Current scientific status

```text
H0  -> inadequate
H1  -> unresolved; entry-state evidence missing
H2  -> not promoted
H3  -> not promoted
H4  -> implemented; complete mechanism reachability verified; not fitted; not searched; not promoted
```

The canonical ant remains unchanged.
