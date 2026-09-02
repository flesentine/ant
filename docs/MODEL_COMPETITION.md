# Locomotion model competition

ANTLAB v0.3.2b adds a frozen H2 mechanism candidate without unlocking biological fitting.

## Reference contrast
Only the final-version Poissonnier 2026 **DCM control** rows are used for the already-completed H0 descriptive screen. The comparison is 20 cm approach minus 100 cm approach. `reference/poissonnier2026_control_effects.json` is regenerated from the checksummed XLSX by `tools/derive-poissonnier2026-control-effects.py`.

The descriptive contrasts are approximately: moving speed -3.33 mm/s; moving distance +173.26 mm; time to edge +8.77 s; straightness -0.179; central-zone occupancy essentially unchanged. Distance, time and straightness retain the same sign under all six leave-one-colony-out recalculations. Bootstrap intervals are descriptive because they do not reproduce colony clustering or the paper's mixed-effects model.

## H0 — context invariant
`lasius_niger_locomotion_v1` does not read previous constrained travel. Short and long trials therefore use the same biological model and, under common random-number seeds, produce identical trajectories. H0 is screening-incompatible with the distance, exit-time and straightness contrasts. Speed and central-zone occupancy do not screen H0 out.

## H1 — entry condition
Blocked. This explanation requires measured initial heading/speed distributions at arena entry. Those raw initial trajectory frames are not present in the published XLSX/supplied Rmd materials.

## H2 — persistent directional state
Implemented as a **mechanism demonstration, not a fitted model**. Because the open-arena outcomes were already known, `hypotheses/h2_persistent_directional_state_v1.json` is explicitly a post-outcome mechanism freeze, not a blind preregistration.

H2 introduces one latent scalar `P`:

```text
P0 = 1 - exp(-L / lambda)
P(t + dt) = P(t) * exp(-dt / tau)
sigma_heading_effective = sigma_heading_base * (1 - rho * P)
```

`L` is the observable protocol fact `recent_constrained_travel_mm`. The frozen v0.3.2b engineering demonstration uses `lambda=500 mm`, `tau=5 s`, and `rho=0.5`. These values are **ASSUMED**, not calibrated or claimed as measured ant biology.

H2 is deliberately unable to directly alter base speed, speed noise, pause hazard, pause duration, entry heading, entry position, boundary behavior, or the observation model. Protocol/state JSON is forbidden from setting `directional_persistence` directly.

`tools/run-h2-mechanism.js` runs the same H2 model under the 20 cm and 100 cm protocols with common random numbers. It does **not** load `poissonnier2026_control_effects.json`, does not access the Y-maze, performs no fit, and makes no selection decision. CI publishes its output as a temporary `h2-mechanism-reachability` artifact.

## Mechanical invariants
CI proves:

- 1000 mm constrained travel produces a larger `P0` than 200 mm.
- `P` follows the frozen exponential decay exactly.
- with zero constrained travel, H2 produces exactly the same trajectory as H0 for the same seed.
- protocol cannot inject the latent persistence state.
- H2 short and long runs use the same exact model hash.

## Holdout rule
The Y-maze is not loaded by either H0 screening or the H2 mechanism runner and cannot be used for model selection. Its 398 choices remain the later cross-apparatus holdout.

## What remains locked
The current H2 parameters may not be tuned against the open-arena summary contrasts under v0.3.2b. H1 remains unresolved. Any later H2 fitting requires an explicit new calibration-policy decision and must preserve the frozen mechanism equation or record a new mechanism version.
