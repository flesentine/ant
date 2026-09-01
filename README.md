# ANTLAB v0.1 — Boring Ant Laboratory

**Live laboratory:** https://flesentine.github.io/ant/

A deliberately small experimental substrate for building a biologically constrained ant simulator.

## What this build contains

- continuous 2D ant positions in **millimetres**
- simulation time in **seconds**
- fixed 20 ms biological physics step, decoupled from rendering
- deterministic world seed + independent RNG stream per worker
- dt-safe stochastic pauses using real-time hazard rates
- correlated random-walk locomotion
- reflecting physical arena boundaries
- local ant-ant contacts through a spatial hash
- very crude food pickup / nest return loop
- per-worker identity and inspection
- basic experiment metrics
- no global colony controller
- no A* or navmesh pathfinding
- no pheromone yet

## Run it locally

From this directory:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

On macOS you can also run `./start.command`.

## Why it is intentionally boring

This is **Build 0 / early Build 1**. The goal is to make locomotion, time, identity, spatial contacts, instrumentation, and experimental reproducibility trustworthy before adding pheromone recruitment.

## Next build

1. add benchmark runner and CSV export
2. add locomotion convergence tests (5/10/30 Hz statistical equivalence)
3. add explicit sensory sectors
4. add sucrose volume / crop volume conservation
5. add pheromone only after the substrate passes those tests

## Headless laboratory

The browser and command-line benchmark use the **same `src/sim-core.js`** model.

Run 20 trials of 5 simulated minutes:

```bash
node tools/run-benchmark.js --trials 20 --seconds 300 --workers 120 --seed 928491
```

This writes `benchmark-results.json` with per-trial and aggregate measurements.

Run the current reference tests:

```bash
./tests/run-tests.sh
```

These currently verify deterministic reproduction for identical seeds and the real-time hazard probability implementation.

## Remote deployment

GitHub Pages is configured for this repository. Every push to `main` runs the reference tests and, when they pass, deploys the browser laboratory to https://flesentine.github.io/ant/ through `.github/workflows/pages.yml`.
