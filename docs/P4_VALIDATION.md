# P4 validation

## Development status

P4-v1 development fitting is closed. The successful open-arena result is frozen in `hypotheses/p4_response_estimation_result_freeze_v1.json`, including Halton candidate 307:

- `sigma_field_mm = 18.319554310908863`
- `kappa_trail_per_s = 6.342935528120713`
- `theta_detect = 0.9184`

Those values may not be refit, retuned, rescued, or changed using the Poissonnier 2026 open-arena target surface.

The frozen P4 estimation policy was scoped to Experiment 1 open-arena data only. It explicitly did not authorize Y-maze access, and the semantic response target was `reference/poissonnier2026_pheromone_response_targets.json`. The Y-maze source-design correction therefore does not reopen or invalidate the development fit.

## Corrected status of Experiment 2

Poissonnier et al. 2026 Experiment 2 is a separate Y-maze experiment, apparatus, collection period, and ant dataset from the Experiment 1 open-arena data used for P4 development. That makes it useful for checking whether the frozen mechanism behaves consistently in a different apparatus.

However, PR #44 review identified that Y-maze biological outcome summaries were already present on `main` before this source-design gate inside two generic reference artifacts:

- `reference/poissonnier2026_published_targets.json` (blob `5836b5011d765043f94683fa761f3016e86643dc`) contains overall and four-condition Y-maze outcomes;
- `reference/poissonnier2026_inventory.json` (blob `2ff7d9dcd27cf7609ce77b0f655a6520597c2432`) contains Experiment 2 condition, pheromone-side, and overall summaries.

Those summaries were explicitly loaded while correcting the P1 review finding. Raw choices and colony-level outcome summaries were not loaded.

Therefore Experiment 2 is **not** a blind holdout, **not** a preregistered predictive validation, and **not** promotion-grade independent evidence. It is reclassified as a **post-hoc same-study cross-apparatus consistency audit**.

## Integrity consequences

The already-known Y-maze outcomes may not be used to:

- refit or retune candidate 307;
- change sensor geometry, detection gating, or Weber transduction;
- add direction-, experience-, colony-, pheromone-side-, or path-specific response parameters;
- choose a favorable metric subset;
- set a validation/pass threshold;
- select a different model after seeing the Y-maze summaries;
- authorize canonical promotion.

## Frozen Y-maze consistency protocol

`P4_cross_apparatus_Y_maze_consistency_protocol_v1` freezes the descriptive audit before any new Y-maze simulation.

The future execution must use candidate 307 unchanged. Two derived apparatus variants will preserve the base Y-maze geometry exactly and add only the already-supported undirected line-segment painted-trail field. For the left-marked condition the field is the left-arm centerline `(140,120) -> (190,33.3975)`; for the right-marked condition it is `(140,120) -> (190,206.6025)`. The opposite DCM arm has no active scalar field. The nominal applied dose remains `0.0048` hindgut equivalents/cm.

Initialization is inherited unchanged from the neutral engineering fixture: stem entry `(30,120)`, heading `0`, position jitter `0.4 mm`, heading jitter `0.05 rad`, one worker, and `90 s` duration. The endpoint remains the explicitly engineering-only first-entry scoring circles at the two branch endpoints; because the exact biological decision line is unavailable, the result must not be described as an exact Experiment 2 scoring reconstruction.

The simulation budget is frozen at:

- 1,000 left-marked trials;
- 1,000 right-marked trials;
- paired marked-side seeds `8210000..8210999`;
- 1,000 neutral diagnostic trials using seeds `8310000..8310999`.

The marked-side runs use common random numbers across left/right field placement. Overall marked-arm choice gives equal simulation weight to the two marked-side conditions. Timeouts are always reported explicitly. Wilson 95% intervals are descriptive only.

P4 has no direction-, experience-, colony-, or side-specific response parameter, so the same side-balanced model prediction is projected to all four published direction/experience conditions. No condition-specific fit or parameter is allowed.

### Two-stage outcome firewall

The consistency audit must execute in two stages:

1. **Stage A — simulation only.** Generate and freeze `reports/p4_ymaze_consistency_simulation_v1.json` without parsing or receiving any biological Y-maze outcome values. Its bytes, hashes, runner/model/apparatus blobs, seed contract, and execution provenance must be frozen first.
2. **Stage B — descriptive comparison.** Only after Stage A is immutable may a separate comparison step read the two already-known pinned Y-maze summary artifacts. It must report all predeclared comparisons: overall choice, all four direction/experience conditions, left-phero side, and right-phero side. Signed and absolute discrepancies are reported for all of them; no best-subset selection, inferential significance test, pass/fail threshold, refit, rerun, or promotion decision is allowed.

No Y-maze simulation is authorized by the protocol-freeze gate itself. A separate implementation-authorization gate must first create and qualify the exact fitted model, paired apparatus variants, fixed experiments, and two-stage runner.

## Promotion-grade validation

A separate `P4_external_validation_source_discovery_v1` gate is required to identify a genuinely independent `Lasius niger` trail-following source or new dataset whose outcome surface was not used in P4 development and whose protocol can be frozen before outcome access.

The same-study Y-maze can add useful cross-apparatus consistency evidence, but it cannot establish external validity or authorize canonical promotion.
