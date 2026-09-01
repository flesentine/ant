#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
node tests/determinism.test.js
node tests/hazard.test.js
node tests/experiment-definition.test.js
node tests/timestep-convergence.test.js
node tests/neutral-y-maze.test.js
node --check src/sim-core.js
node --check src/app.js
node --check tools/run-benchmark.js
echo "All ANTLAB v0.2 tests PASS"
