#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
node tests/determinism.test.js
node tests/hazard.test.js
node --check src/sim-core.js
node --check src/app.js
echo "All ANTLAB v0.1 tests PASS"
