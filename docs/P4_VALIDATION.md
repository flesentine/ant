# P4 validation

## Development status

P4-v1 development fitting is closed. The successful open-arena result is frozen in `hypotheses/p4_response_estimation_result_freeze_v1.json`, including Halton candidate 307:

- `sigma_field_mm = 18.319554310908863`
- `kappa_trail_per_s = 6.342935528120713`
- `theta_detect = 0.9184`

Those values may not be refit, retuned, rescued, or changed using the Poissonnier 2026 open-arena target surface.

## Selected next transfer source

The next apparatus selected in principle is Poissonnier et al. 2026 Experiment 2, the binary Y-maze. It is a separate experiment, apparatus, collection period, and ant dataset from the Experiment 1 open-arena data used for P4 development. It is therefore useful for testing **cross-apparatus predictive transfer**.

It is not treated as a fully external replication: it comes from the same publication, and qualitative context-invariance evidence from that publication already informed earlier P4 design constraints.

## Blinding limitation

During methods scouting, a public article response exposed the published aggregate Y-maze result. No repository Y-maze biological target file was opened or materialized, and no condition-level, colony-level, or raw-choice outcomes were used. Nevertheless, the Y-maze can no longer be described as a pristine blinded holdout.

The exposed aggregate result is forbidden from influencing metric selection, pass thresholds, parameter values, simulation budgets, model selection, or interpretation rules.

## Current gate

`P4_cross_apparatus_validation_source_design_v1` selects only the validation source and scientific classification. It does **not** authorize:

- loading Y-maze biological outcomes;
- running a P4 Y-maze simulation;
- choosing or executing a validation score;
- changing P4 parameters or mechanism structure;
- adding direction-, experience-, colony-, side-, or path-specific response parameters;
- canonical promotion.

The repo's reserved Y-maze apparatus, neutral engineering fixture, and engineering scoring files are pinned by identity only at this gate; their contents are not adopted as the P4 validation protocol here.

## Next gate

The next gate must freeze the exact Y-maze validation protocol **before any biological Y-maze outcome file is materialized or parsed**. It must specify apparatus interpretation, initialization, trail-field mapping, binary-choice endpoint, neutral comparator, simulation budget, RNG/seeds, aggregation, uncertainty, and pass/fail rule with the frozen P4 triplet unchanged.

A successful same-study Y-maze transfer test can support cross-apparatus predictive transfer, but it cannot alone establish external validity or authorize canonical promotion. A separate promotion-grade independent-validation source remains required.
