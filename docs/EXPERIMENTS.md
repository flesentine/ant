# Experiments and reference assays

## Open arena — Poissonnier et al. 2026
- A4 arena: 297 × 210 mm
- entry: center via the experimental central hole
- approach conditions: 200 mm and 1000 mm, represented as protocol metadata
- current treatment: DCM control
- observation: 25 fps
- termination: first arena-border contact
- safety timeout: 120 s

The exact post-toothpick entry heading distribution is intentionally provisional until the published reference data are materialized and inspected. ANTLAB does not invent a seamless runway-to-arena transition.

## Neutral Y-maze
An engineering control before pheromone response exists. It uses the same `lasius_niger_locomotion_v1` model as the open arena. CI runs 600 seeds and rejects persistent left/right bias.

## Data policy
`reference/calibration_manifest.json` registers the open-arena dataset for future fitting and the Y-maze as a locked holdout. `tools/calibration-policy.js` rejects fitting attempts against a locked dataset.
