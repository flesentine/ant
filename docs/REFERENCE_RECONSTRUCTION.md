# Poissonnier 2026 reference reconstruction

ANTLAB v0.3.1 verified the final-version supplementary files for doi:10.1007/s00040-026-01106-9 on 2026-09-01 using GitHub Actions.

## Checksums

- `40_2026_1106_MOESM1_ESM.rmd`: `098b3e9af67f17084ee89673a98ac4f5d17f581ad6fcc0dcaffbe293ef0270fa`
- `40_2026_1106_MOESM2_ESM.xlsx`: `b311d5fdc89eac56724bb5195743cf4bb52a6cff4040b18704353091e1fe6318`

## Experiment 1

The XLSX contains 102 analyzed ants, six colonies, and four groups of 25 or 26 ants. It contains per-ant AnimalTA-derived summary metrics, start/end coordinates and arena calibration fields. It does **not** contain the frame-by-frame coordinate CSVs.

The supplied R Markdown explicitly loads detailed coordinates for Figure 4 from a separate local path matching `Detailed_data_exp1/<Video>/Arena_0Ind0.csv`. Those files are not present in the downloaded XLSX supplement.

Control means derived directly from the checksummed XLSX:

| Control | n | Moving speed mm/s | Moving distance mm | Exit time s | Straightness | Middle-zone fraction |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 cm approach | 25 | 23.8264 | 439.0052 | 19.9024 | 0.36147 | 0.23722 |
| 100 cm approach | 26 | 27.1565 | 265.7465 | 11.1292 | 0.54054 | 0.23179 |

The `Details` sheet states that movement status is based on an AnimalTA threshold, but the threshold/settings themselves are not supplied. `Straightness = Beeline / Traveled_Dist_Moving` is exactly reproduced for every row.

The article reports 143 attempted ants, 34 falling off the path and two other pre-arena exclusions. That leaves 107, while the XLSX contains 102 analyzed ants. The five-ant difference is recorded as unresolved rather than assigned an invented exclusion reason.

## Experiment 2

The XLSX contains exactly 398 Y-maze decisions across eight colonies:

| Treatment | n | Followed pheromone | Rate |
| --- | ---: | ---: | ---: |
| Outwards Experienced | 100 | 88 | 0.8800 |
| Outwards Naive | 100 | 88 | 0.8800 |
| Return Experienced | 99 | 88 | 0.8889 |
| Return Naive | 99 | 84 | 0.8485 |

Overall: **348 / 398 = 0.87437**.

The dataset records pheromone side, ant decision side and `correct`; every `correct` value equals whether `decision == phero_side`. However, neither the final article nor the supplied Rmd/XLSX specifies the exact spatial decision line/operational criterion used to declare left versus right.

## Consequence for ANTLAB

The supplement is sufficient to reconstruct and validate the published **per-ant summary dataset**, but not sufficient to reconstruct the complete AnimalTA frame-level measurement transformation from raw coordinates. Therefore:

- the current 25-fps ANTLAB observation/measurement pipeline remains explicit and testable;
- its AnimalTA classifier remains provisional;
- open-arena biological fitting stays locked;
- Y-maze remains a separate locked validation dataset;
- no missing thresholds, raw trajectories, entry headings or choice lines are guessed.

See `reference/poissonnier2026_inventory.json` for machine-readable details.
