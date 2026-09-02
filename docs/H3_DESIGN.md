# H3 — transient reorientation gate

Status: **mechanism and estimation design frozen; not implemented; not fitted**.

H3 is a new locomotion mechanism class proposed after H2-v1 failed its high-resolution internal leave-one-colony-out promotion guard. It is deliberately not a more flexible version of H2.

## Core idea

Represent locomotion as **runs separated by discrete major reorientation events**.

The context-free H3-family walk has:

- current speed dynamics and pauses retained from the existing locomotion substrate;
- no continuous Gaussian major-turn diffusion;
- stochastic reorientation events with a hazard proportional to distance walked;
- a symmetric turn-angle distribution conditional on an event.

Let `ell0` be the baseline mean free path. The baseline reorientation hazard is:

```text
k0_per_mm = 1 / ell0
h0_per_s(t) = speed(t) / ell0
```

At a reorientation event:

```text
delta_heading ~ vonMises(mean = 0, concentration = kappa_turn)
```

There is no left/right bias and no attraction to the arena centerline, start, or edge.

## History-dependent H3 gate

Observable protocol history provides only:

```text
L = recent_constrained_travel_mm
```

The species model creates the latent gate:

```text
G0 = 1 - exp(-L / lambda_history)
G(t) = G0 * exp(-t / tau_gate)
```

The gate changes only the reorientation-event hazard:

```text
h_turn_per_s(t)
  = speed(t) / ell0
  * (1 - rho_gate * G(t))
```

Equivalently:

```text
ell_effective(t)
  = ell0 / (1 - rho_gate * G(t))
```

Longer constrained travel therefore predicts a lower early turn-event rate and longer early free paths. As `G` decays, the walk returns to the same context-free event process.

## What H3 is not allowed to do

H3 cannot directly modify:

- base speed;
- speed noise;
- pause rate or duration;
- turn-angle distribution conditional on a reorientation;
- entry heading or position;
- boundary behavior;
- centerline attraction;
- pheromone response;
- observation/scoring rules.

The experiment may not set `G`, `ell0`, `kappa_turn`, `lambda_history`, `tau_gate`, or `rho_gate`.

## Why this is distinct from H2

H2 modifies every small heading perturbation:

```text
sigma_effective = sigma0 * (1 - rho * P)
```

H3 leaves conditional turn size unchanged and changes only **when major turns happen**.

This creates different trajectory signatures:

### H2 prediction

- smaller continuous heading increments after long travel;
- no necessary change in the number of discrete large-turn events.

### H3 prediction

- fewer early major reorientation events after long travel;
- longer first free path;
- same turn-angle distribution once a turn occurs;
- history effect decays through event frequency, not event magnitude.

If raw AnimalTA trajectories are recovered, these models become directly distinguishable.

## Biological representation support

Published work on *Lasius niger* has repeatedly used Boltzmann-walker / correlated-walk representations in which trajectories are decomposed into approximately straight segments separated by reorientation events. That literature supports using a run-and-reorientation representation. It does **not** establish the proposed history-dependent gate; that remains the H3 hypothesis.

Relevant representation literature includes:

- Khuong / related *Lasius niger* Boltzmann-walker analyses of straight segments and reorientation events;
- later work on random walks with spatial/temporal resets in ant search;
- recent re-analysis showing that segment lengths and reorientation properties can carry search structure in *Lasius niger* trajectories.

## Development estimation

The frozen estimation policy is `hypotheses/h3_parameter_estimation_v1.json`.

### H3-family nuisance parameters

```text
ell0        baseline mean free path
kappa_turn  conditional turn-angle concentration
q           shared post-toothpick orientation retention
```

### H3 context parameters

```text
lambda_history
tau_gate
rho_gate
```

Only threshold-independent open-arena measurements may be used during development estimation:

- `Total_Frames / 25`;
- central-zone frame fraction;
- beeline;
- exit edge.

AnimalTA moving-speed, moving-distance, straightness, and Y-maze outcomes remain unavailable for H3 fitting/model selection.

## Nested comparison

For every leave-one-colony-out fold:

```text
H3-null
  ell0 + kappa_turn + q
  rho_gate = 0

versus

H3-context
  ell0 + kappa_turn + q
  + lambda_history + tau_gate + rho_gate
```

H3-context must beat H3-null on at least **5 of 6** held-out colonies with positive median relative improvement.

To call H3 development-preferred over the already-evaluated H2-v1, it must additionally beat H2-v1 held-out loss on at least **4 of 6** matching folds with positive median improvement.

Even passing both rules does not constitute external validation and does not automatically change the canonical ant model.

## Identifiability reporting

Do not over-interpret `lambda_history` and `rho_gate` separately if they form a ridge. Always report:

```text
M200  = 1 - rho_gate*(1-exp(-200/lambda_history))
M1000 = 1 - rho_gate*(1-exp(-1000/lambda_history))

ell200  = ell0 / M200
ell1000 = ell0 / M1000
```

These are the effective initial reorientation-hazard multipliers and mean free paths after the two observed travel histories.

## Implementation order

1. Add an H3 model profile separate from H0/H2.
2. Add continuous-time reorientation-event hazard.
3. Add deterministic seeded von Mises turn sampling.
4. Add latent `G` initialization and exact exponential decay.
5. Extend the biology firewall with all H3 parameter/state keys.
6. Add mechanism-only tests.
7. Run a no-reference reachability report.
8. Only after all of the above pass, implement H3 LOCO estimation using the already-frozen policy.

## Required mechanism tests before fitting

- deterministic replay;
- turn-hazard timestep convergence;
- exact `G` decay;
- `G0(long) > G0(short)`;
- zero-history / `rho=0` removes the context effect exactly;
- matched `kappa_turn` gives the same conditional turn-angle distribution across histories;
- H3 does not change speed directly;
- protocol cannot inject H3 latent state or parameters;
- short/long treatments use the exact same H3 biological model hash;
- Y-maze is not loaded.

## Failure criteria

H3 should be rejected or revised as a new mechanism version if any of the following occur:

- it requires treatment-specific parameter values;
- it requires treatment-specific entry-heading distributions;
- it needs direct speed modulation to pass;
- it generates its short/long effect by changing turn size rather than turn timing;
- it creates strong centerline attraction without a local sensory mechanism;
- high-resolution LOCO fails the frozen promotion rule;
- fitted parameters repeatedly hit bounds or effective multipliers remain unidentifiable.

H3-v1 should not be made more complex after a failed promotion guard. A materially different mechanism should receive a new hypothesis/version identifier.
