# H3 — transient reorientation gate

Status: **mechanism implemented and frozen; not fitted; not selected**.

H3 is a distinct locomotion mechanism proposed after H2-v1 failed its high-resolution internal leave-one-colony-out promotion guard. The mechanism and estimation policy were frozen before H3 implementation or parameter search.

## Core idea

Represent locomotion as approximately straight runs separated by discrete major reorientation events. H3 changes **when** those events occur, not the size of every heading perturbation.

The H3-family baseline uses the existing speed dynamics and pause process, but continuous major-turn angular diffusion is disabled. Reorientation events use a continuous-time hazard proportional to distance walked:

```text
k0_per_mm = 1 / ell0
h0_per_s(t) = speed(t) / ell0
```

At a reorientation event:

```text
delta_heading ~ vonMises(mean = 0, concentration = kappa_turn)
```

There is no left/right bias and no attraction to the centerline, entry point, or arena edge.

## History-dependent gate

The protocol may provide only the observable history fact:

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

## Exact event clock

H3 does **not** use one Bernoulli turn draw per physics tick. Each ant carries an exponential unit-hazard threshold. The runtime integrates the turn hazard through elapsed motion, resolves threshold crossings at sub-step time, turns at that exact time, then continues through the remainder of the physics step. Multiple events in a sufficiently large step are representable.

This is required so event time, event count, and free-path length converge across physics timesteps.

## RNG isolation

H3 stochastic events have dedicated named streams:

```text
biology_h3_turn_event:<ant_id>
biology_h3_turn_angle:<ant_id>
```

Speed, pauses, individual locomotion heterogeneity, protocol randomness, and observation randomness remain on their existing streams. H3-null and H3-context use matched named stream seeds. Adding H3 logging or changing observation retention must not alter H3 biology.

The runtime also preserves the existing biology-RNG cadence by consuming and discarding the old continuous-angular draw while H3 suppresses its effect. This prevents H3's representation change from silently reshuffling later speed/pause randomness.

## What H3 cannot do

H3 cannot directly modify:

- base speed or speed noise;
- pause rate or pause duration;
- turn-angle distribution conditional on a reorientation;
- entry heading or position;
- boundary behavior;
- centerline attraction;
- pheromone response;
- observation or scoring rules.

Assay JSON cannot set `G`, `reorientation_gate`, `ell0`, `kappa_turn`, `lambda_history`, `tau_gate`, `rho_gate`, or the corresponding model-field names.

## Current engineering model

`models/lasius_niger_locomotion_h3_v1.json` is a mechanism demonstration only. Its values are assumed, not fitted biological parameters:

```text
ell0 = 40 mm
kappa_turn = 2
lambda_history = 500 mm
tau_gate = 5 s
rho_gate = 0.5
```

The canonical interactive ant remains H0.

## Mechanism-only acceptance tests

The implemented H3 runtime now has CI tests for:

- deterministic replay;
- `G0(long) > G0(short)`;
- exact exponential `G` decay;
- zero-history and `rho=0` context removal;
- integrated-hazard event time/count convergence at 10, 20, and 50 ms physics timesteps;
- sub-step event times rather than tick-boundary turns;
- dedicated event/angle RNG streams;
- baseline speed/pause RNG isolation across different history conditions;
- observation-retention independence;
- matched conditional turn-angle sequences for matched `kappa_turn` and angle-stream seed;
- assay-side H3 latent/parameter injection rejection;
- identical H3 biological model hash in short and long assays;
- no Y-maze access in the H3 reachability workflow.

## No-reference reachability result

The CI reachability runner uses 400 matched seeds per condition and does **not** load a reference target, perform fitting, or access the Y-maze.

With the frozen engineering values it produced:

```text
                         20 cm history     100 cm history
initial G                 0.32968           0.86466
mean reorientation count  4.41              3.81
mean first-turn time      1.655 s           2.037 s
mean first-turn distance 39.45 mm          48.75 mm
```

So the implemented mechanism reaches its structural prediction: longer constrained travel produces fewer early reorientation events and a later/farther first major turn. These values are **not** evidence that the engineering parameters are correct.

## Distinction from H2

H2 continuously scales angular diffusion:

```text
sigma_effective = sigma0 * (1 - rho * P)
```

H3 leaves turn size conditional on an event unchanged and changes only the event timing/frequency. If raw trajectories are recovered, useful discriminators include first-turn distance/time, early/late turn counts, free-path-length distributions, and conditional turn-angle distributions.

## Development estimation policy

The already-frozen policy is `hypotheses/h3_parameter_estimation_v1.json`.

For each leave-one-colony-out fold it will compare:

```text
H3-null
  ell0 + kappa_turn + shared q
  rho_gate = 0

versus

H3-context
  ell0 + kappa_turn + shared q
  + lambda_history + tau_gate + rho_gate
```

Only threshold-independent open-arena measurements may be used. H3-context must beat H3-null on at least **5 of 6** held-out colonies with positive median improvement. To be considered development-preferred over H2-v1, it must additionally beat H2-v1 on at least **4 of 6** matching held-out folds with positive median improvement.

The Y-maze remains inaccessible to fitting, ranking, stopping rules, and model selection.

## Next gate

H3 parameter estimation is still locked. The next step is to implement the frozen H3 LOCO estimator without changing this mechanism or its promotion rules. Even a passed internal promotion guard would create only a development-preferred candidate; it would not automatically modify the canonical ant.
