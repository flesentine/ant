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


## P1-v1 implementation and reference-free reachability

v0.3.3c implements the frozen P1-v1 mechanism in an isolated extension:

- runtime: `src/p1.js`
- runtime Git blob: `f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca`
- engineering model: `models/lasius_niger_painted_trail_p1_v1.json`
- model Git blob: `73873fd6763838423ca27648136bb0b9ff062817`
- P1 apparatus field: `apparatus/poissonnier2026_open_arena_p1_v1.json`
- apparatus Git blob: `df589d6b39c1617a7dedc3bfa9d34a408c51b2f4`

The canonical locomotion model, `src/sim-core.js`, and `src/integrity.js` remain unchanged.

### Post-merge implementation authorization

Implementation began only after the v0.3.3b mechanism freeze merged to `main` and the permanent main test/deploy workflow passed.

Authorization:

`hypotheses/p1_implementation_authorization_v1.json`

Git blob:

`f9fbaeb63c72de7a639d54b597f5c1247d354e20`

That authorization permits only isolated P1 implementation and reference-free reachability. It does not authorize response-data search, canonical promotion, or Y-maze access.

### Frozen reachability execution

Because the mechanism freeze required a frozen seed panel but did not itself specify the execution seeds/trial count, a separate execution policy was frozen **before P1 runtime execution**:

`hypotheses/p1_reachability_execution_v1.json`

Git blob:

`282a95ec6761acd8d94163b25f712f191181f2ff`

It fixes:

- physics timestep: 0.02 s
- 32 exact-identity seeds: 1333001–1333032
- fixed identity comparison time: 2.0 s
- 400 matched trials per attraction condition
- attraction seeds: 1334001–1334400
- common random numbers
- zero dose versus the frozen nominal dose
- all pass/fail criteria
- no target/reference loading
- no fitting/search/ranking
- no Y-maze
- no adaptive tuning

### Implementation qualification

The final provenance-hardened implementation qualification was:

- run: `34055606885`
- job: `101546830143`
- artifact ID: `9995854425`
- artifact digest: `sha256:0ecb9fd22ce17e9897d17688ab9960eb2c873a95b05fec6a5c8d806110c7b61d`

It passed:

- exact implementation/runtime/model/apparatus pins
- full H0–H5 + P1 regression suite
- low-volume code-path smoke explicitly marked **not scientific evidence**
- real Chromium Node parity: 4/4
- browser exceptions: 0
- console errors: 0
- response-target requests: 0
- Y-maze requests: 0

### Official reference-free result

The one frozen reachability execution completed on attempt 1:

- run: `34055700128`
- job: `101547080088`
- exact execution head: `da177e90b270d0ed62f627ec1621f7fe2e2ed1ed`
- artifact ID: `9995881229`
- artifact digest: `sha256:b89a0860f56daffa00c676768d3e951fa02055492d10a3b1eb93f1f8a7859197`

Exact report:

- file: `reports/p1_reference_free_reachability_v1.json`
- Git blob: `5a8da255db2eb8a9e2b6dc51a7bd8d30a0e429ed`
- SHA-256: `6a992cd0a19fefd5d3afbd5fc0b919c55d0b24fbeda9dc5c6d047a758e747fcb`
- status: `reference_free_reachability_passed`

Result-freeze record:

`hypotheses/p1_reachability_result_freeze_v1.json`

Git blob:

`e9187ff27fb04015ded038a5f98354995455e377`

### Frozen outcome

All structural requirements passed:

- exact zero-dose canonical identity: **PASS**
- exact `kappa=0` canonical identity: **PASS**
- nonzero-dose speed/pause/biology RNG identity: **PASS**
- local steering sign: **PASS**
- on-trail zero deterministic steering: **PASS**
- endpoint reversal: **PASS**
- rigid translation: **PASS**
- rigid rotation: **PASS**

The 400-trial-per-condition engineering panel was:

| Observable | Zero dose | Nominal dose | Difference |
| --- | ---: | ---: | ---: |
| Mean central-zone fraction | 0.27026 | 0.33142 | +0.06116 |
| Trail-axis exit rate | 0.4150 | 0.4775 | +0.0625 |
| Mean moving speed (mm/s) | 23.71418 | 23.71454 | +0.00036 |
| Mean time to exit (s) | 9.3847 | 9.6343 | +0.2496 |

The frozen pass rule required both central-zone occupancy and trail-axis exit rate to increase under nominal pheromone. Both did.

The moving-speed difference is not a fit target or biological effect claim. The stronger fixed-time matched-state tests establish that P1 does not alter the stochastic speed/pause/RNG process.

### Interpretation boundary

This is **reference-free engineering reachability**, not evidence that P1-v1 fits the Poissonnier pheromone-response data.

The run did not:

- load the 102-row P1 response target;
- load reference outcomes;
- fit or search any parameter;
- rank candidates;
- update the canonical model;
- access the Y-maze.

The frozen engineering values may not be retuned from this outcome.

### Next gate

v0.3.3d must freeze the P1 response-estimation policy **before** any fitting/ranking access to the response target.

The future response parameter surface remains exactly:

- `sigma_field_mm`
- `kappa_trail_per_s`

The estimator policy must freeze bounds, objective/contrast construction, nuisance handling, folds, seeds, search budget, and promotion guards before search. Canonical locomotion remains unchanged and the Y-maze remains locked.
