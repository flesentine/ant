# P1 painted-trail response — evidence/protocol freeze

## Status

**Evidence and published protocol frozen before chemical-sensor implementation or pheromone-response parameter search.**

This is the first gate for ANTLAB v0.3.3. It does not implement chemical sensing and does not authorize parameter fitting.

Freeze record: `hypotheses/p1_painted_trail_response_evidence_v1.json`.

## Published open-arena trail

Poissonnier et al. 2026 Experiment 1 used a paper-covered A4 arena, 297 × 210 mm in ANTLAB coordinates. Ants emerged at the arena center after a 200 mm or 1000 mm straight approach.

The published artificial trail pheromone solution was prepared from the hindguts of four workers in 1 mL DCM. In the open arena, approximately 36 µL of solution was applied over the 30 cm arena length, through the center and parallel to the incoming runway. The DCM condition is the solvent control.

ANTLAB freezes the published trail axis as:

```text
start: (0, 105) mm
end:   (297, 105) mm
```

This is an apparatus/protocol fact, not a fitted biological parameter.

The nominal application corresponds to 1.2 µL solution/cm and 0.0048 hindgut-equivalents/cm. These are bookkeeping conversions of the published recipe, not estimates of airborne or surface concentration.

## Open-arena target surface

The reproducible target file is:

`reference/poissonnier2026_pheromone_response_targets.json`

It is generated from the checksummed final XLSX by:

`tools/derive-pheromone-response-targets.py`

The target includes all 102 Experiment 1 rows:

- DCM control, short approach: 25
- DCM control, long approach: 26
- pheromone, short approach: 26
- pheromone, long approach: 25

Six colonies are represented: 0, 7, 16, 20, 21, 27.

## Allowed response observables

Primary response observables:

- `middle_zone_fraction`
- `trail_axis_exit` — whether first border contact occurred on the left/right trail axis rather than top/bottom. This is an **ANTLAB-derived geometric metric**, frozen before P1 mechanism implementation; it is not an article-reported outcome.

Secondary guard observables:

- `time_to_exit_s`
- `beeline_mm`

The response target also retains the four-way `exit_edge` category. A source-XLSX geometry audit found 0 edge-label mismatches, 0 endpoints ambiguous within 5 mm of a competing border, a maximum endpoint-to-assigned-border distance of 6.59 mm, and a minimum nearest-vs-second-nearest border gap of 9.15 mm.

The following remain forbidden fitting targets because they depend on unresolved AnimalTA movement classification or would reopen locomotion fitting:

- `Average_Speed_Moving`
- `Traveled_Dist_Moving`
- `Straightness`
- `Prop_time_moving`
- `Average_Speed`
- `Traveled_Dist`

## Contrast rule

P1 response estimation must not absorb the already-known short-vs-long baseline locomotion mismatch.

Therefore the future P1 objective must estimate the **pheromone treatment effect relative to the DCM control within each path-length stratum**.

A single response law and single response parameter set must apply to both short and long histories.

Forbidden:

- separate short/long pheromone gains;
- treatment-specific baseline locomotion;
- refitting H2, H3, H4, or H5;
- changing canonical locomotion to improve P1 fit.

## Y-maze lock

The Poissonnier 2026 Y-maze remains a locked cross-apparatus holdout.

It may not enter:

- mechanism design choices informed by its outcomes;
- fitting;
- candidate ranking;
- stopping rules;
- model selection.

The published open-arena assay is the only development evidence surface for P1.

## Not frozen yet

This evidence freeze intentionally does **not** choose:

- the transverse chemical-field kernel;
- egocentric sensor positions;
- sensory saturation/transduction;
- the deterministic steering equation;
- response parameter bounds;
- search budget;
- promotion thresholds.

Those choices must be frozen in a separate P1 mechanism/policy gate before implementation.

## Next gate

Freeze P1 mechanism v1 with:

1. an externally painted line-field representation;
2. local egocentric left/right sensing only;
3. a dose-aware transduction rule;
4. a deterministic steering response that leaves baseline speed, pauses, and angular-noise amplitude unchanged;
5. an exact zero-signal null;
6. invariance and anti-navigation-cheat regressions;
7. one engineering-only reachability parameter set;
8. no reference-data parameter search.


## P1-v1 egocentric mechanism freeze

Mechanism record:

`hypotheses/p1_painted_trail_mechanism_v1.json`

Git blob:

`90e86bce29bf45c6e390f7046a6c25a74f409c78`

P1-v1 represents the painted pheromone as an **undirected external scalar field**. The ant is not given a trail bearing, line distance, arena-center target, edge target, treatment label, path-history label, or any Y-maze information.

### External field

For applied dose ratio (A), trail segment (L), sensor point (p), and effective spread (sigma):

```text
c(p) = A * exp( -d_segment(p,L)^2 / (2*sigma_field_mm^2) )
```

The published nominal pheromone dose is normalized to (A=1). DCM is exactly (A=0).

The field is stationary during a P1-v1 open-arena trial. P1-v1 has no deposition, evaporation, diffusion, depletion, or ant-written pheromone state.

### Egocentric sensors

ANTLAB uses x right, y down, so increasing heading is clockwise.

For heading (	heta):

```text
u(theta) = ( cos(theta),  sin(theta))   forward
r(theta) = (-sin(theta),  cos(theta))   right
l(theta) = ( sin(theta), -cos(theta))   left
```

Two fixed engineering sensor points are used:

```text
p_L = p + 2.0 mm*u(theta) + 1.5 mm*l(theta)
p_R = p + 2.0 mm*u(theta) + 1.5 mm*r(theta)
```

These offsets are structural engineering values, not fitted biological estimates.

### Transduction

Each local concentration is transformed by the same fixed saturating map:

```text
T(c) = c / (1 + c)

s_L = T(c(p_L))
s_R = T(c(p_R))
```

P1-v1 intentionally adds no fitted sensory half-saturation or Hill exponent.

### Steering

While moving:

```text
omega_trail = kappa_trail_per_s * (s_R - s_L)
theta <- theta + omega_trail*dt + unchanged canonical angular-noise increment
```

With the ANTLAB coordinate convention, an eastbound ant above the horizontal trail has the trail closer to its right sensor; (s_R>s_L), so positive trail steering rotates clockwise/downward toward the trail.

P1-v1 changes **heading drift only**. It does not change:

- base speed;
- speed noise or reversion;
- pause rate or duration;
- angular-noise amplitude;
- RNG streams;
- locomotion history state.

There is no trail-induced heading update while paused.

### Future response parameters

Only two P1-v1 response quantities may later be estimated:

- `sigma_field_mm`
- `kappa_trail_per_s`

They must be shared across both 20 cm and 100 cm approach histories, all colonies, and both treatment strata. Bounds and search budget remain unfrozen until the later estimator-policy gate.

### Exact nested nulls

Two exact identities are required:

1. **DCM zero signal:** applied dose (A=0) gives (c_L=c_R=s_L=s_R=omega=0) exactly.
2. **Zero response gain:** `kappa_trail_per_s=0` gives (omega=0) exactly even with a painted field.

Because P1-v1 adds no RNG draws, both nulls must be bit-for-bit identical to canonical locomotion for the same seed/configuration. Implementation must take an explicit computational bypass when `A=0` or `kappa_trail_per_s=0`: no field/sensor evaluation and no trail heading addition, returning positive numeric zero rather than relying on floating-point multiplication that can produce signed `-0`.

### Structural invariances

Before any reference-data search, implementation must prove:

- reversing trail endpoints changes nothing;
- translating the whole scene changes nothing;
- rotating the whole scene and heading together changes nothing;
- reflection across the trail axis mirrors steering sign;
- an on-trail ant moving parallel to the trail has zero deterministic trail steering;
- P1-v1 has no preferred direction along the trail;
- short/long approach history is not available to the mechanism.

### Frozen engineering reachability values

For the first reference-free implementation check only:

- `sigma_field_mm = 8.0`
- `kappa_trail_per_s = 4.0`
- sensor forward offset = 2.0 mm
- sensor half-separation = 1.5 mm
- nominal dose ratio = 1.0
- physics timestep = 0.02 s

These are not biological estimates and were not chosen by fitting the 102-row response target.

If a correctly implemented P1-v1 fails its frozen reference-free structural reachability requirements, do not tune these engineering values after the fact. Only a genuine implementation bug permits an unchanged-mechanism rerun.

## Gate after mechanism freeze

After this mechanism freeze is merged to `main`, P1 sensor/runtime implementation is authorized.

Still **not authorized**:

- response-parameter search;
- target-driven tuning;
- canonical promotion;
- Y-maze access or unlocking.

The next stage is isolated P1 implementation plus reference-free reachability only.
