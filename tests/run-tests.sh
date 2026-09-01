#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
node tests/determinism.test.js
node tests/hazard.test.js
node tests/experiment-definition.test.js
node tests/integrity-firewall.test.js
node tests/open-arena-protocol.test.js
node tests/timestep-convergence.test.js
node tests/neutral-y-maze.test.js
node tests/reference-manifest.test.js
node tests/calibration-policy.test.js
node --check src/sim-core.js
node --check src/app.js
node --check tools/run-benchmark.js
node --check tools/load-bundle.js
echo "All ANTLAB v0.3 tests PASS"
