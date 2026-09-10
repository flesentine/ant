# P4 painted-trail mechanism freeze

## Status

**Exact P4-v1 mechanism selected and frozen prospectively; no P4 runtime, model, simulation, estimation policy, response-target access, or reserved Y-maze access is authorized yet.**

Mechanism record:

`hypotheses/p4_painted_trail_mechanism_v1.json`

Git blob:

`609551836e540c341365db9cc987d2ca340cc053`

Starting checkpoint:

`4a0a007b080039848dc2d3453afb033921460de5`

The P4 independent-evidence gate and candidate-class decision selected the broad class `P4_candidate_absolute_signal_dependent_bilateral_response`. This mechanism gate now chooses one exact realization before any new P4 simulation.

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

No biological values or future estimation bounds are chosen here.

## Exact identities and invariances

The future implementation must prove, reference-free:

- zero dose is bit-exact canonical locomotion and biology RNG;
- zero kappa is bit-exact canonical locomotion and biology RNG;
- `L+R <= theta_detect` gives exactly zero trail steering;
- equality at the threshold is off;
- equal left/right signal gives zero steering;
- above threshold, swapping left/right reverses steering sign with equal magnitude;
- above threshold, positive scaling that does not cross the threshold preserves the Weber ratio;
- scaling across the threshold intentionally changes response expression, so global scale invariance is absent;
- painted-segment endpoint reversal, rigid translation, and rigid rotation preserve the response;
- a centered parallel trail gives equal sector summaries and zero steering.

## Engineering-only reachability panel

Frozen engineering values, **not biological estimates**:

- `sigma_field_mm = 8`
- `kappa_trail_per_s = 4`
- `theta_detect = 0.25`
- `dt = 0.02 s`

The engineering threshold is chosen solely to make the future reference-free gate testable. Under the normalized Gaussian field, `C(p) <= dose_ratio`; therefore at `dose_ratio = 0.10`, each sector mean is at most `0.10` and `L+R <= 0.20 < 0.25` everywhere. That gives a guaranteed global subthreshold canonical-identity case without consulting any biological response target.

Frozen identity seeds: `840001` through `840008`.

Frozen nominal reachability seeds: `841000` through `841399` — 400 trials.

The panel also includes synthetic exact-threshold, just-above-threshold, left/right sign, scale-crossing, transformation, and centerline-symmetry checks. These values and checks may not be retuned after observing reachability.

## Still prohibited

P4-v1 currently has:

- no `src/p4.js`;
- no P4 model file;
- no P4 simulation execution;
- no response RNG or stochastic detector;
- no P2 lapse state;
- no soft gate, sigmoid, Hill exponent, epsilon, or regularizer;
- no path-, colony-, direction-, treatment-, or recent-experience-specific response;
- no pheromone-driven speed change;
- no canonical locomotion change;
- no H2-H5 recombination;
- no P1/P2/P3 result-semantic use;
- no response-target semantic access;
- no target-ranked parameter search;
- no reserved Y-maze access.

## Next gate

After this mechanism freeze is audited and merged, create a separate **P4 implementation + reference-free reachability execution gate**. That gate may implement exactly this frozen mechanism and execute only the frozen engineering panel. It must remain completely blind to response-target semantics and reserved Y-maze validation.
