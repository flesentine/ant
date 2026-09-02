# Reference evidence

ANTLAB keeps published evidence separate from simulation output.

## Poissonnier et al. 2026

`poissonnier2026_source_manifest.json` pins the final version of record and the two Springer supplementary files. Raw binary supplements are not committed by default. `tools/fetch-poissonnier2026-reference.sh` materializes them locally and `tools/inventory-reference.py` records checksums, workbook structure, headers and relevant R-analysis snippets.

`poissonnier2026_published_targets.json` contains only article-level targets used to verify reconstruction. It is not a substitute for the published dataset.

The open-arena dataset remains **locked against biological fitting** until the measurement-reconstruction gate passes. The Y-maze remains a separate locked holdout.
