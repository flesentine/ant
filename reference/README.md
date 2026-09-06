# Reference evidence

ANTLAB keeps published evidence separate from simulation output.

## Poissonnier et al. 2026

`poissonnier2026_source_manifest.json` pins the final version of record and the two Springer supplementary files. Raw binary supplements are not committed by default. `tools/fetch-poissonnier2026-reference.sh` materializes them locally and `tools/inventory-reference.py` records checksums, workbook structure, headers and relevant R-analysis snippets.

`poissonnier2026_published_targets.json` contains only article-level targets used to verify reconstruction. It is not a substitute for the published dataset.

The open-arena dataset remains **locked against biological fitting** until the measurement-reconstruction gate passes. The Y-maze remains a separate locked holdout.


## Painted-trail response development surface

v0.3.3 uses a separate frozen response target derived from all 102 Experiment 1 open-arena rows:

`poissonnier2026_pheromone_response_targets.json`

Generate it from the checksummed final XLSX with:

```bash
python3 tools/derive-pheromone-response-targets.py 40_2026_1106_MOESM2_ESM.xlsx reference/poissonnier2026_pheromone_response_targets.json
```

This target does **not** unlock canonical biological fitting. It may only support separately frozen painted-trail response parameters. Baseline locomotion and all H2–H5 path-history mechanisms remain fixed; response estimation must use pheromone-vs-DCM contrasts within short and long approach strata. The Y-maze remains locked.
