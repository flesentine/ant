#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
node tests/determinism.test.js
node tests/hazard.test.js
node tests/experiment-definition.test.js
node tests/integrity-firewall.test.js
node tests/state-integrity.test.js
node tests/rng-streams.test.js
node tests/measurement.test.js
node tests/boundary-timing.test.js
node tests/open-arena-protocol.test.js
node tests/timestep-convergence.test.js
node tests/observation-convergence.test.js
node tests/neutral-y-maze.test.js
node tests/reference-manifest.test.js
node tests/reference-source.test.js
node tests/calibration-policy.test.js
node tests/model-competition.test.js
node --check src/sim-core.js
node --check src/measurement.js
node --check src/integrity.js
node --check src/app.js
node --check tools/run-benchmark.js
node --check tools/run-model-competition.js
node --check tools/load-bundle.js
python3 -m py_compile tools/inventory-reference.py tools/reconstruct-poissonnier2026.py tools/derive-poissonnier2026-control-effects.py
echo "All ANTLAB v0.3.2a null-model screening tests PASS"
