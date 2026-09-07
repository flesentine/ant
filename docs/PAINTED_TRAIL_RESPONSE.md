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


## P1-v1 response-estimation policy freeze

v0.3.3d freezes the response-estimation procedure before any P1 target-ranked candidate search.

Policy:

`hypotheses/p1_response_estimation_v1.json`

Git blob:

`628d17f6eb69fd11216aff33d1356d184365aedd`

### Estimated response surface

Exactly two P1 quantities may be estimated:

- `sigma_field_mm`: 2–32 mm, log scale
- `kappa_trail_per_s`: 0–16 s⁻¹, linear scale

There are **no nuisance parameters**. Canonical angular diffusion, speed, pauses, entry state, H2–H5, P1 sensor geometry, transduction, apparatus, and observation behavior remain fixed.

The bounds were frozen from the pre-search engineering scale: sigma spans a factor of four below/above the 8 mm reachability value, and kappa extends from the exact zero-gain null to four times the 4 s⁻¹ reachability value. They were not chosen by target-ranked search.

### Frozen contrast objective

Candidate ranking uses only the two primary response observables:

- middle-zone fraction
- trail-axis exit probability

For each short/long path stratum separately:

```text
Delta_ref = reference pheromone summary - reference DCM summary
Delta_sim = simulated pheromone summary - simulated DCM summary
```

The primary loss is the equal-weight mean squared error over the four path × primary-observable treatment contrasts.

Within each colony, the pheromone-minus-DCM contrast is computed first. A LOCO training target is then the equal-weight mean of the five training-colony contrasts, and the final all-data target equal-weights all six colonies. Ant-row count may not give one colony more influence than another.

No short-minus-long quantity is a P1 fitting target. No pooled treatment contrast may erase the path strata.

Secondary guards remain:

- exit time
- beeline distance

They cannot rank or select candidates. They are checked only after selection.

### Frozen search and validation

Per leave-one-colony-out fold:

- six colonies / six folds
- 499 deterministic two-dimensional Halton candidates
- one exact `kappa=0` null anchor
- 500 candidates total
- 60 training trials per treatment × path × candidate
- 120 held-out evaluation trials per treatment × path
- matched pheromone/DCM common random numbers
- fixed fit/evaluation seed streams
- no adaptive refinement

The exact null anchor is `sigma=8 mm, kappa=0`; sigma is inert under the frozen bypass.

P1 survives internal development only if it beats the exact null in at least **5/6 held-out folds** and has strictly positive median relative held-out improvement.

If that guard passes, a final all-102-row fit uses the same frozen candidate panel, followed by an independent simulation-only final-check panel. Identifiability and secondary-observable guards must also pass before a fixed P1 response pair can be eligible for a later v0.4 freeze.

### Current authorization state

This policy freeze does **not** implement an estimator and does **not** authorize the high-resolution response search.

Before response-target ranking can occur, a separate estimator must be implemented and qualified for:

- exact DCM and `kappa=0` canonical identity
- contrast construction
- Halton mapping and null anchor
- fold isolation
- common-random-number seed pairing
- target/Y-maze firewalls
- full regression suite
- Node ↔ real-Chromium parity

A later authorization artifact must pin the exact policy and qualified estimator before the one frozen high-resolution response search.

Canonical locomotion remains unchanged. The Y-maze remains locked.


## P1-v1 estimator implementation and qualification

v0.3.3e implements the frozen response-estimator mechanics without authorizing or running the 102-row high-resolution search.

Estimator:

`tools/run-p1-estimation.js`

Current estimator Git blob:

`a307e74e8ba2366e2546eebe1a7cccac69a3ff9a`

### What the estimator is allowed to do now

The default qualification path may:

- verify the exact frozen policy/runtime/model/apparatus chain;
- hash-verify the frozen P1 response-target file without parsing its outcomes;
- construct synthetic colony/path/treatment fixtures;
- verify equal-weight colony contrast construction;
- verify the 499-point Halton mapping plus exact null anchor;
- verify short/long seed separation and pheromone/DCM common-random-number pairing;
- run low-volume reference-free P1 simulation smoke;
- prove exact DCM and `kappa=0` canonical identity.

Qualification is explicitly marked:

- scientific evidence: false
- reference outcomes accessed: false
- response-target semantics loaded: false
- Y-maze accessed: false

### Authorization boundary

The semantic target loader itself is authorization-gated.

`loadReferenceTarget(...)` refuses to parse the 102-row response outcomes unless the active file

`hypotheses/p1_highres_authorization_v1.json`

exists and pins:

- this exact policy blob;
- this exact estimator blob;
- high-resolution response search = true;
- canonical promotion = false;
- Y-maze access = false.

The authorization may also be marked effective only after merge to `main`; in that case branch execution is refused.

The CLI high-resolution path runs synthetic qualification and authorization checks **before** the semantic target loader is called.

### Frozen high-resolution implementation

The estimator already implements the frozen future execution path, but it remains inaccessible until authorization:

- 499 Halton candidates + one exact null anchor;
- no nuisance parameters;
- six LOCO folds;
- equal-weight five-colony training contrasts;
- held-out colony scored separately;
- primary ranking only on middle-zone and trail-axis-exit treatment contrasts;
- post-selection exit-time/beeline guards;
- final all-data fit only if the 5/6 survival gate passes;
- frozen identifiability checks;
- no canonical locomotion update;
- no H2-H5 refit;
- no Y-maze access.

The next gate is exact-head code + Chromium qualification, followed by a **separate** authorization artifact. The high-resolution response search is still locked.


## P1-v1 high-resolution authorization freeze

v0.3.3f freezes the post-qualification authorization for the one official P1-v1 response-estimation execution.

Authorization:

`hypotheses/p1_highres_authorization_v1.json`

Git blob:

`7e77c5b1b9a6de9d665ff2be55c0780cc7d24d9c`

Permanent qualification report:

`reports/p1_estimator_qualification_v1.json`

Git blob:

`2f737a1e7059f023fa8acfa2a1f1bbc1e688ddb3`

SHA-256:

`6620ebc25729d540bef489bbf7748f2859f5eb4e3fb153428f428fb6ff1c779e`

### Qualification provenance

The authorization pins the successful v0.3.3e estimator audit:

- run: `34058735013`
- job: `101555308225`
- tested head: `f733fede7cbd5bd0e9ee2d26f6d2914e438b0990`
- clean estimator PR head: `93b27f6aa684a4de5d07a0861bc4b786e1b6b9bf`
- merged estimator main commit: `143e2bd469a0e68b96d8c5f7ba6705e924fe353b`
- artifact ID: `9996776691`
- artifact digest: `sha256:75cbf626a1ed579aabfa1c9726612c1f27c85ba5fb5134e798116e8edb81a756`
- Node↔Chromium parity: 8/8
- browser exceptions: 0
- console errors: 0
- response-target requests: 0
- Y-maze requests: 0

The qualification itself accessed no response outcomes and loaded no response-target semantics.

### Authorization semantics

The authorization sets:

- high-resolution response search: **authorized after merge to main**
- canonical locomotion promotion: **not authorized**
- Y-maze access: **not authorized**

The authorization is intentionally marked `effective_when_merged_to_main=true`.

Therefore, while this authorization is under review on its branch:

- the estimator must reject `--mode highres`;
- the semantic 102-row target loader must remain blocked;
- no official result may be produced.

### One-shot execution contract

After merge and a green permanent main checkpoint, exactly one official execution is authorized with the already-frozen policy:

- 499 Halton candidates + one exact `kappa=0` null per fold
- six LOCO folds
- 60 training trials per treatment × path × candidate
- 120 held-out trials per treatment × path
- fit root seed 2210000
- evaluation root seed 2810000
- final all-data candidate panel unchanged
- 120 final-fit trials per treatment × path × candidate
- final-fit seed 3210000
- 240 independent final-check trials per treatment × path
- final-check seed 3610000
- no nuisance parameters
- no adaptive second stage or favorable-seed rerun

If the primary 5/6 survival guard fails, P1-v1 response estimation closes. If survival passes but identifiability or secondary guards fail, mechanism survival may be reported but a fixed parameter pair is not promoted.

The response search has **not been run by this authorization PR**.


## Official P1-v1 response-estimation result and closure

The one authorized frozen high-resolution P1-v1 response-estimation execution completed successfully on **attempt 1**.

Execution provenance:

- main commit: `4da2101267093ead0e3f2569b28940f49f89a552`
- GitHub Actions run: `34081980126`
- job: `101618864436`
- artifact ID: `10004082907`
- artifact digest: `sha256:e8ad929fca97a5c2d7b74147434ee81ef5ba8fd3b0ab1f44609e566f1769f3c7`

Exact official report:

- file: `reports/p1_response_estimation_500x60_v1.json`
- Git blob: `561aca4a14346ebb4f062f30d0438d3115784172`
- bytes: 174770
- SHA-256: `4e3de4c1fb35465a877fbc78b8ce178763b5bcb968af05d66085186a93a3facf`
- status: `development_response_estimation_failed_primary_survival_guard`

Exact execution provenance:

- file: `reports/p1_response_estimation_execution_provenance_v1.json`
- Git blob: `6afe2727a88b7294d2bd09b8704755a5a355826a`
- SHA-256: `96b86db1070c221a0e5040b2f05ebab40303c7ee3a0b486133a181f56e4d5e93`

Result-freeze record:

- file: `hypotheses/p1_response_estimation_result_freeze_v1.json`
- Git blob: `1d99ebfaa378aeb1b98963f63b3a513a616a6617`

### Frozen primary result

The preregistered survival rule was conjunctive:

1. P1 must beat the exact `kappa=0` null in at least **5 of 6** held-out colonies; and
2. median held-out relative improvement must be **strictly positive**.

Observed:

- held-out wins vs exact null: **4/6**
- required wins: **5/6**
- median relative improvement: **+0.26132694328143546** (+26.13%)
- primary survival guard: **FAIL**

The positive median does not override the failed 5/6 requirement.

Held-out relative improvements were:

| Held-out colony | Relative improvement vs exact null |
| ---: | ---: |
| 0 | −17.10% |
| 7 | +31.53% |
| 16 | +20.74% |
| 20 | +72.24% |
| 21 | +52.29% |
| 27 | −153.94% |

The two failures are not treated as opportunities to alter folds, seeds, bounds, weights, or budgets. Colony 27 in particular is a strong held-out failure under the already-frozen procedure.

### Frozen downstream consequence

Because the primary survival guard failed:

- `final_all_data_fit` is **null**;
- the final all-102-row candidate ranking was **not run**;
- identifiability was **not evaluated**;
- final secondary exit-time/beeline promotion guards were **not evaluated**;
- no fixed `sigma_field_mm` / `kappa_trail_per_s` pair is eligible for v0.4;
- canonical locomotion remains unchanged;
- Y-maze remains locked.

This is the required behavior of the frozen policy, not missing analysis.

### P1-v1 closure

P1-v1 response estimation is now closed.

The active high-resolution authorization has been retired to:

`hypotheses/archive/p1_highres_authorization_v1.json`

with its historical Git blob unchanged:

`7e77c5b1b9a6de9d665ff2be55c0780cc7d24d9c`

The one-shot official execution workflow has also been retired. A valid second P1-v1 search is not authorized.

P1-v1 may not be rescued by changing:

- parameter bounds or scales;
- Halton candidates or candidate budget;
- trial counts or seed streams;
- fold membership or colony weighting;
- primary objective construction or weights;
- nuisance parameters;
- sensor geometry or transduction;
- apparatus or observation semantics;
- promotion thresholds;
- favorable reruns.

Any future painted-trail hypothesis must be a **new versioned mechanism with a new pre-search policy**, not a retuned P1-v1.


## Post-P1 failure characterization and P2 candidate-class evidence gate

After P1-v1 was permanently closed, v0.3.3i adds a **descriptive-only** characterization of the already-frozen official result and a separate independent-evidence gate for possible future mechanism classes.

Characterization record:

`hypotheses/p1_post_failure_characterization_v1.json`

Git blob:

`1befbcb097959ba698d316adea1eb0c735eccc7f`

Candidate-class evidence record:

`hypotheses/p2_painted_trail_candidate_class_evidence_v1.json`

Git blob:

`f7eb9fe38f8955c0227501e2d257ff32a40eaf74`

### Characterization boundary

The characterization may summarize only quantities already contained in the immutable official P1 report.

It does **not**:

- reload the raw 102-row response target;
- run new simulations;
- re-rank candidates;
- alter folds, weights, objectives, seeds, or budgets;
- run new significance tests;
- select a P2 mechanism;
- authorize implementation;
- reopen P1-v1;
- access Y-maze data or geometry.

The frozen report shows substantial variation among the held-out colony/path treatment contrasts. That is a descriptive property of the official development result. It does **not** prove a specific biological source of heterogeneity, and colony 27 may not be removed, downweighted, or used as a tuning target.

### Independent candidate class A — transient response engagement/lapses

Koch & Czaczkes (2021), *No specialist pheromone-ignoring ants in Lasius niger* (Ecological Entomology, DOI 10.1111/een.12995), reports an approximately 20% non-following/lapse rate in *L. niger* and found that ignoring a trail was not repeatable one hour later.

This independently supports considering **transient stochastic response engagement/lapse behavior** as a future mechanism class.

It does **not** support:

- a stable specialist trail-ignorer caste;
- colony-specific lapse probabilities;
- a Poissonnier-assay lapse parameter;
- using the P1 failed folds to set a lapse rate.

### Independent candidate class B — relative bilateral sensing

Perna et al. (2012), *Individual rules for trail pattern formation in Argentine ants* (PLoS Computational Biology; PMID 22829756), reports local turning responses consistent with a Weber-like bilateral signal, where relative left-right pheromone difference rather than an absolute difference predicts turning magnitude. Speed was reported as largely unaffected.

This supports **relative/normalized bilateral transduction** as a mechanistic class worth considering.

However, the evidence is from *Linepithema humile*, not *Lasius niger*. It therefore cannot set a P2 equation or parameters by itself.

### Negative evidence constraint

Poissonnier et al. (2026), *Pheromone trail following is not modulated by previous visit to food location, distance travelled, or travel direction in the ant Lasius niger* (Insectes Sociaux, DOI 10.1007/s00040-026-01106-9), reports no detected trail-following modulation by the tested path-distance, travel-direction, or recent-food-experience variables.

Therefore the P1 failure does **not** authorize:

- short-vs-long response parameters;
- inward-vs-outward response parameters;
- naïve-vs-experienced response parameters;
- recent-food-specific response parameters.

### Selection firewall

At v0.3.3i:

- P2 candidate A: **plausible, not selected**
- P2 candidate B: **plausible, not selected**
- P2 mechanism record: **absent**
- P2 runtime/model: **absent**
- P2 estimation policy: **absent**
- P2 high-resolution authorization: **absent**
- new P2 simulation: **not authorized**
- Y-maze: **locked**

A later mechanism-selection gate may choose, reject, or prospectively combine classes only by explicit independent biological rationale. If it does, it must freeze the exact equations, structural parameters, null identity, invariances, engineering-only reachability values, and a no-reference-search firewall **before** implementation.


## P2-v1 mechanism selection freeze

v0.3.3j prospectively selects the first post-P1 mechanism class **before any P2 implementation or new simulation**.

Mechanism record:

`hypotheses/p2_painted_trail_mechanism_v1.json`

Git blob:

`70f51e5cab5db0024947ed71cf760590089f8aea`

### Selected class

P2-v1 selects:

**transient per-trial trail-response engagement/lapse**

This is Candidate A from the independently frozen evidence gate.

The selection is intentionally minimal:

- it has direct *Lasius niger* support;
- the cited evidence supports transient non-following but argues against a stable specialist pheromone-ignoring caste;
- Candidate B relative/Weber bilateral sensing currently has cross-species support only;
- P2-v1 therefore does **not** combine A+B.

Candidate B remains available only for a later independently justified versioned hypothesis if needed.

### Exact P2 state

For each ant in an active non-null painted-trail simulation:

`E ~ Bernoulli(1 - p_lapse)`

is drawn exactly once from a dedicated P2 response RNG.

Equivalently, for one response-RNG uniform variate `U`:

`engaged = (U >= p_lapse)`

The state:

- is fixed for that ant during one simulation trial;
- is discarded at the end of that trial;
- is redrawn for another trial/seed;
- is not a persistent phenotype, caste, memory state, or ant identity.

### Engaged response

When `engaged = true`, P2 reuses the previously frozen local P1 egocentric steering kernel **unchanged as a component**:

`C(p) = dose_ratio * exp(-d(p,segment)^2 / (2*sigma_field_mm^2))`

`T(C) = C / (1 + C)`

`omega_trail = engaged * kappa_trail_per_s * (T(C_right) - T(C_left))`

The bilateral sensor geometry remains:

- forward offset: 2 mm
- lateral half separation: 1.5 mm

This component reuse does **not** promote or reopen P1-v1. The failed P1-v1 result remains permanently closed.

### Dedicated response RNG

P2 engagement must never consume canonical biology RNG draws.

A separate response seed is frozen as:

`hash32((world_seed >>> 0) XOR Math.imul(ant_id + 1, 0x27d4eb2d) XOR 0x6c8e9cf5)`

using the exact same hash32 arithmetic specified in the mechanism record, then a separate `core.RNG`.

For `0 < p_lapse < 1`, exactly one response-RNG `next()` draw is used per ant.

### Exact identities

The future implementation must prove:

1. **dose ratio = 0**  
   exact canonical trajectory and canonical biology RNG state; no P2 response draw.

2. **kappa = 0**  
   exact canonical trajectory and canonical biology RNG state; no P2 response draw.

3. **p_lapse = 1**  
   every ant deterministically lapses; exact canonical trajectory and canonical biology RNG state; no response draw.

4. **p_lapse = 0**  
   every ant deterministically engages; for the same sigma/kappa/apparatus/protocol/seed/dt, trajectory is exactly identical to the frozen P1 local-kernel runtime. This is a nested implementation identity only, not a reopening of P1-v1.

### Reference-free engineering values

The implementation/reachability stage is pre-frozen to use:

- `sigma_field_mm = 8`
- `kappa_trail_per_s = 4`
- `p_lapse = 0.20`
- sensor forward offset = 2 mm
- sensor lateral half separation = 1.5 mm

The 0.20 lapse value is a literature-motivated *L. niger* engineering anchor only. It is **not** asserted to be the Poissonnier open-arena lapse probability and is not fitted evidence.

The next implementation PR must exercise exactly this reference-free panel:

- zero-dose canonical identity
- zero-kappa canonical identity
- always-engaged nested P1 identity
- 20% lapse stochastic reachability
- all-lapse canonical identity

Reachability outcomes may not be used to retune these engineering values.

### Still locked

At this mechanism-selection freeze:

- `src/p2.js`: absent
- P2 model: absent
- P2 estimator: absent
- P2 estimation policy: absent
- response-target access: not authorized
- new P2 simulation: not authorized
- canonical locomotion changes: not authorized
- Y-maze: locked

A separate implementation + reference-free reachability gate is required after this mechanism record is audited and merged.


## P2-v1 implementation and reference-free reachability

v0.3.3k implements the already-frozen P2-v1 transient engagement mechanism and qualifies it **without loading response targets or Y-maze evidence**.

Pre-implementation execution policy:

`hypotheses/p2_reachability_execution_v1.json`

Git blob:

`8431ada87724953128104077f4ce1c11b569b1cf`

Pre-implementation authorization:

`hypotheses/p2_implementation_authorization_v1.json`

Git blob:

`462997ea7399d98efca5a6b19a0e38160fbddbaf`

### Runtime

Implementation:

`src/p2.js`

Current Git blob:

`f91a2f7ede1b8119acc1fd57ac94a9718d074e15`

The runtime extends the canonical integrity simulation directly.

It uses the frozen P1 local-kernel helper functions for:

- painted-trail apparatus parsing;
- applied-dose ratio;
- bilateral sensor geometry;
- Gaussian field response;
- saturating transduction;
- local steering rate;
- moving-step preview without biology-RNG mutation.

It does **not** subclass the P1 simulation and does not reopen P1-v1.

The only new structural state is the per-ant, per-trial engagement gate.

### Dedicated response RNG

For `0 < p_lapse < 1`, one response-only `core.RNG` draw is generated from the already-frozen namespaced seed.

The response draw occurs after canonical ant initialization and never consumes `ant.rng`.

Exact endpoints and null cases consume zero response draws:

- zero applied dose
- `kappa=0`
- `p_lapse=1`
- `p_lapse=0`

### Engineering model

`models/lasius_niger_painted_trail_p2_v1.json`

Current Git blob:

`7d3eecc44cb2eaf727249083a6fcfa21986fd475`

Engineering-only values remain:

- sigma = 8 mm
- kappa = 4 s⁻¹
- p_lapse = 0.20
- forward sensor offset = 2 mm
- lateral half separation = 1.5 mm

These values remain unfitted and cannot be retuned from the reference-free reachability result.

### Frozen execution panels

Exact-identity panel:

- eight seeds: 730001 through 730008
- fixed 8 s
- zero dose vs canonical
- zero kappa vs canonical
- all lapse vs canonical
- always engaged vs frozen P1 local-kernel runtime

Stochastic engagement panel:

- 400 nominal-dose trials
- seeds 731000 through 731399
- one ant per trial
- shared trial seeds for P2, P1 component, and canonical simulations
- p_lapse = 0.20

For every stochastic trial:

- exactly one response-RNG draw must occur;
- engagement state must remain fixed during the trial;
- if engaged, P2 must be bit-exact to the same-seed P1-kernel trajectory;
- if lapsed, P2 must be bit-exact to the same-seed canonical trajectory;
- canonical biology RNG must remain isolated from the response draw.

The observed lapse count is reported descriptively. It is **not** a fitting target or a pass threshold beyond requiring the fixed panel to contain both states.

### Still locked

This implementation/reachability gate does not authorize:

- response-target loading;
- P1 failed-fold tuning;
- P2 parameter search/ranking;
- P2 response-estimation policy;
- Candidate B Weber-style transduction;
- canonical model changes;
- H2-H5 refit/combination;
- Y-maze access.

A successful reachability result qualifies implementation wiring only. It does not establish biological fit or authorize a fixed P2 parameter set for v0.4.


### Frozen P2 reference-free reachability result

The first frozen P2-v1 reference-free reachability execution completed successfully on **attempt 1**.

Audit provenance:

- tested head: `e92484e909ddf9968071bda29d19b6a332c1486c`
- GitHub Actions run: `34089553046`
- job: `101640096955`
- artifact ID: `10006342916`
- artifact digest: `sha256:1712b4b9a5ccfcc87659f90c44a5211c5bbaa23a5748d810f610e7363b97b4ee`

Exact report:

- file: `reports/p2_reference_free_reachability_v1.json`
- Git blob: `78a5e0ac4a3dd536a0e2d06ece2e9e37cdb2aefa`
- bytes: 5765
- SHA-256: `de481a25ad36d6124bb51cb644bb55199fa655471fbadc082f7d3f04cb2ac37b`
- status: `reference_free_reachability_passed`

Result-freeze record:

- file: `hypotheses/p2_reachability_result_freeze_v1.json`
- Git blob: `8dddaf083d4af046051fc1b7412b9f22cda8618a`

#### Exact identities

All eight seeds 730001–730008 passed all four frozen identities:

- zero dose P2 = canonical;
- `kappa=0` P2 = canonical;
- `p_lapse=1` P2 = canonical;
- `p_lapse=0` P2 = frozen P1 local-kernel trajectory.

The identities include canonical biology-RNG state. Endpoint/null cases use zero P2 response draws.

#### 400-trial stochastic panel

Frozen seeds: 731000–731399.

Observed:

- lapses: **75**
- engaged: **325**
- realized lapse fraction: **0.1875**
- mean central-zone fraction: **0.3105365527822391**
- trail-axis exit rate: **0.4825**
- mean moving speed: **23.628478016068925 mm/s**
- mean time to exit: **9.353299999999999 s**
- mean steering samples: **381.61**

Every trial satisfied the stronger structural mixture identity:

- engaged P2 trial = exact same-seed P1 local-kernel trajectory;
- lapsed P2 trial = exact same-seed canonical trajectory.

Every intermediate-`p_lapse` trial consumed exactly one dedicated response-RNG draw, and engagement remained fixed within the trial.

The 18.75% realized lapse fraction and all behavioral summaries are **descriptive only**. They do not estimate a Poissonnier-assay lapse probability and may not be used to retune `p_lapse`, sigma, kappa, sensors, seeds, dt, or trial count.

#### Browser/firewall audit

Real Chromium:

- Node↔Chromium parity: **6/6**
- browser exceptions: **0**
- console errors: **0**
- response-target requests: **0**
- Y-maze requests: **0**
- P2 estimation-surface requests: **0**

#### Scientific consequence

P2-v1 implementation is qualified and reference-free reachability passed.

This does **not** authorize:

- a biological fit claim;
- promotion of the engineering values as fixed biological parameters;
- a P2 parameter search;
- a P2 estimator;
- canonical locomotion changes;
- Candidate B transduction;
- Y-maze access.

If development continues, the next gate is a separate prospective **P2 response-estimation policy freeze** before estimator implementation or semantic response-target access.


## P2-v1 response-estimation policy freeze

v0.3.3l freezes the full P2 response-estimation procedure **before a P2 estimator exists and before semantic access to the 102-row response target**.

Policy:

`hypotheses/p2_response_estimation_v1.json`

Git blob:

`eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce`

### Why the policy is intentionally strict

The failed P1-v1 result is already known. To avoid turning P2 into an outcome-driven rescue, this policy does not soften the existing development standard.

It retains the same meanings for:

- six-colony leave-one-colony-out partition;
- equal colony weighting;
- short/long within-path pheromone-minus-DCM contrasts;
- primary observables:
  - middle-zone fraction
  - trail-axis exit;
- equal-weight four-component squared-error primary objective;
- 5-of-6 heldout robustness criterion;
- exit-time and beeline secondary guards;
- 60 training / 120 heldout / 120 final-fit / 240 independent-final-check simulation budgets.

Fresh P2-only seed streams are used instead of the prior P1 streams.

### Estimated P2 parameters

Three shared biological coordinates are prospectively estimable:

| Parameter | Search domain | Scale |
| --- | --- | --- |
| `sigma_field_mm` | 2–32 mm | log |
| `kappa_trail_per_s` | 0–16 s⁻¹ | linear |
| `p_lapse` | 0–1 | linear |

The full `p_lapse` probability domain is used deliberately.

The 0.20 literature/reachability anchor is **not** used to narrow the range because it was explicitly frozen as an engineering value rather than a Poissonnier-assay estimate.

There are zero nuisance parameters.

The same sigma, kappa, and p_lapse must apply to:

- both path histories;
- all six colonies;
- both treatment strata.

No colony-, path-, treatment-, direction-, or experience-specific response parameters are permitted.

### Exact canonical null

The exact null anchor is:

- sigma = 8 mm
- kappa = 0 s⁻¹
- p_lapse = 0.20 bookkeeping value

Under `kappa=0`, sigma and p_lapse are inert because the P2 runtime exact-bypasses the response before field evaluation or response-RNG draw.

DCM `A=0` is likewise an exact canonical bypass for every candidate.

### Nested no-lapse benchmark

P2 must demonstrate that the new transient-lapse structure itself adds predictive value.

For every 3D P2 Halton candidate, a projected benchmark candidate is defined using:

- the same sigma;
- the same kappa;
- `p_lapse=0`.

Those projected candidates form a separately ranked no-lapse submodel panel.

Because `p_lapse=0` is the frozen always-engaged endpoint, this benchmark is bit-identical to the local P1 steering kernel for the same sigma/kappa/seed—but it is evaluated through the P2 development procedure and does **not** reopen P1-v1.

### Search panels

P2 panel:

- 999 positive Halton candidates
- 1 exact canonical null
- total: 1000 candidates/fold

Halton dimensions:

- prime 2 → sigma, log [2,32]
- prime 3 → kappa, linear [0,16]
- prime 5 → p_lapse, linear [0,1]

Nested no-lapse benchmark:

- the 999 matching sigma/kappa projections with `p_lapse=0`
- the same exact canonical null as slot 1000

Both panels use the exact same primary objective and frozen trial seeds.

### Fresh simulation seeds

LOCO training:

- root: `4210000`
- fold: `4210000 + fold_index * 10000`

Heldout evaluation:

- root: `4810000`
- fold: `4810000 + fold_index * 10000`

Final all-data fit:

- `5210000`

Independent final check:

- `5610000`

Short and long path strata retain offsets 0 and 1000.

Within a trial seed, DCM and pheromone are paired by common random numbers.

For P2 candidates, the dedicated response RNG also uses common random numbers: the same trial seed/ant id produces the same underlying response `U` for every candidate. Candidate `p_lapse` changes only the threshold `U >= p_lapse`.

### Dual survival requirement

P2-v1 must pass **both** prospective heldout guards.

#### Canonical-null guard

Across six heldout colonies:

- P2 must have lower primary loss than exact canonical null in at least **5/6** folds;
- median relative improvement versus null must be **strictly positive**.

#### Structural-increment guard

Independently:

- P2 must have lower primary loss than the separately training-selected no-lapse benchmark in at least **5/6** folds;
- median relative improvement versus no-lapse must be **strictly positive**.

P2 does not survive development simply by beating canonical locomotion if the new lapse structure does not improve on the best no-lapse nested model.

Failure of either guard closes P2-v1 without retuning.

### Final fit and identifiability

Only if both LOCO guards pass:

- rank the same frozen P2 panel on all six colonies;
- separately rank the same frozen no-lapse benchmark panel;
- use 120 trials/treatment × path × candidate;
- select by primary objective only;
- run selected P2, selected no-lapse, and exact null on independent 240-trial final-check seeds.

The independent final-check primary loss for P2 must be strictly lower than both comparators.

The P2 near-best set uses:

`loss <= best_loss + max(0.0004, 0.05 * best_loss)`

Parameter promotion additionally requires:

- exact null not near-best;
- the best no-lapse benchmark lies outside that same P2 near-best tolerance;
- selected sigma, kappa, and p_lapse each at least 0.02 from an active bound;
- near-best normalized span <=0.60 for each of the three parameters;
- all four independent final secondary standardized errors <=1.

### Estimator remains locked

At v0.3.3l:

- P2 estimator: **absent**
- high-resolution P2 search: **not authorized**
- response-target semantic loading: **not authorized**
- P1 official result semantic loading: **not authorized**
- Candidate B transduction: **not authorized**
- canonical update: **not authorized**
- Y-maze: **locked**

A later estimator qualification gate must implement and prove this policy reference-free before a separate authorization can permit one frozen high-resolution P2 search.
