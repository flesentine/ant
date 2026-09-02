# ANTLAB v0.3.2b — Frozen H2 Mechanism

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. v0.3.2b keeps the v0.3.1 measurement foundation and v0.3.2a H0 screen intact, then adds a minimal persistent-directional-state mechanism without fitting it to the published targets.

## What changed
H0 remains screened out descriptively: the context-invariant locomotion substrate predicts no 20 cm vs 100 cm difference, while the verified Poissonnier 2026 DCM-control summaries show robust differences in moving distance, exit time, and straightness.

H1 — different measured arena-entry conditions — remains blocked because the raw initial trajectory frames / entry-heading distributions are unavailable in the published supplements we have.

H2 is now implemented as `lasius_niger_locomotion_h2_v1`, governed by `hypotheses/h2_persistent_directional_state_v1.json`. Because we already know the reference outcome, this is explicitly a **post-outcome mechanism freeze before parameter tuning**, not a blind preregistration.

The H2 latent state is intentionally tiny:

```text
P0 = 1 - exp(-L / lambda)
P(t + dt) = P(t) * exp(-dt / tau)
sigma_heading_effective = sigma_heading_base * (1 - rho * P)
```

where `L` is the observable fact `recent_constrained_travel_mm`. The frozen demonstration values are `lambda=500 mm`, `tau=5 s`, and `rho=0.5`; all are marked **ASSUMED_ENGINEERING_DEMONSTRATION_NOT_FITTED**.

H2 cannot directly change speed, pause behavior, entry conditions, boundary rules, or measurement. Protocol JSON cannot inject `directional_persistence` directly. With zero constrained travel, H2 is tested to collapse exactly to H0 for the same random seed.

**No H2 parameter was tuned. The H2 mechanism runner does not load the open-arena target file and does not access the Y-maze holdout.**

## Run
```bash
python3 -m http.server 8080
```
Open `http://localhost:8080`.

## Tests
```bash
./tests/run-tests.sh
```

## H0 model screen
```bash
node tools/run-model-competition.js --trials 400 --seed 928491
```

## H2 mechanism reachability
```bash
node tools/run-h2-mechanism.js --trials 400 --seed 928491
```
This reports the frozen H2 candidate's short/long predictions but performs no reference-target comparison, fitting, or model-selection decision.

## Reference reconstruction
```bash
./tools/fetch-poissonnier2026-reference.sh
```
The probe downloads the final-version Rmd/XLSX, verifies checksums, reconstructs the published summaries, regenerates the control-effect screening file, and requires an exact match with the pinned reference.

Next: inspect the frozen H2 mechanism's behavior and decide whether the project has enough independent evidence to justify unlocking any parameter estimation. H1 remains the simpler unresolved alternative and must stay visible.
