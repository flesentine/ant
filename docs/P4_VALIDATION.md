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

A future Y-maze consistency protocol must report the frozen model transparently without pretending that a newly selected threshold is prospective.

## Current gate

`P4_cross_apparatus_validation_source_design_v1` now does three things:

1. preserves the successful Experiment 1 development lineage and immutable candidate-307 triplet;
2. explicitly records the pre-existing Y-maze outcome artifacts and the subsequent PR #44 outcome exposure;
3. reclassifies Experiment 2 as a descriptive cross-apparatus consistency audit only.

The repo's reserved Y-maze apparatus, neutral engineering fixture, and engineering scoring files remain pinned. Their contents are not yet adopted as a P4 consistency protocol.

## Next Y-maze gate

`P4_cross_apparatus_Y_maze_consistency_protocol_freeze_v1` may inspect and freeze the Y-maze apparatus geometry and define an outcome-nonadaptive simulation/audit procedure. It must specify initialization, trail-field mapping, binary-choice endpoint, neutral comparator, simulation budget, RNG/seeds, and comprehensive reporting fields with the frozen P4 triplet unchanged.

Because the biological outcome summaries are already known, this gate must **not** create a promotion or validation pass/fail threshold.

## Promotion-grade validation

A separate `P4_external_validation_source_discovery_v1` gate is required to identify a genuinely independent `Lasius niger` trail-following source or new dataset whose outcome surface was not used in P4 development and whose protocol can be frozen before outcome access.

The same-study Y-maze can add useful cross-apparatus consistency evidence, but it cannot establish external validity or authorize canonical promotion.
