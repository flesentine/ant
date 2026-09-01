# ANTLAB v0.3 — Boring Ant Laboratory

**Live lab:** https://flesentine.github.io/ant/

ANTLAB is a falsifiable ant-simulation substrate built one experimentally testable capability at a time. v0.3 is the **Scientific Integrity** release.

## Six-layer experiment architecture

ANTLAB now separates:

1. `models/` — species capabilities and biological parameters
2. `states/` — factual state of an individual at assay entry
3. `apparatus/` — physical geometry only
4. experiment `protocol` — what the researcher did
5. `observations/` — how behavior is sampled/measured
6. `scoring/` — how behavior becomes an outcome

Experiments cannot override biological model parameters. Protocol may establish state facts such as recent travel distance, fed/unfed status or travel direction, but cannot directly change speed, turning, sensing or other capabilities.

## Reproducibility

Every headless result records hashes for model, state, apparatus, protocol, observation, scoring and experiment. Protocol, treatment, observation and biology use independent deterministic RNG streams so adding measurement noise cannot change the simulated ant's behavior.

## Current assays

The Poissonnier 2026 open arena is represented as a 297 × 210 mm A4 arena with center entry, 25-fps observation and first-border scoring. Separate 20 cm and 100 cm DCM-control protocols use the exact same species model and state profile, with recent travel recorded as state rather than hidden parameter changes.

The neutral Y-maze remains an **engineering control**, not a biological replication. Its endpoint scoring is explicitly separated from the apparatus and marked provisional until the exact 2026 choice criterion is inventoried from supplementary materials/code.

## Run

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Tests

```bash
./tests/run-tests.sh
```

## Headless

```bash
node tools/run-benchmark.js --experiment open_arena_short_control.json --trials 100 --seed 928491
```

Next: **v0.3.1 reference-data ingestion and baseline locomotion calibration**, only after the published open-arena dataset fields and AnimalTA measurement settings are inventoried.
