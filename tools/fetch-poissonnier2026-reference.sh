#!/usr/bin/env bash
set -euo pipefail
out="${1:-reference/materialized/poissonnier2026}"
mkdir -p "$out"
base='https://media.springernature.com/original/springer-static/esm/art%3A10.1007%2Fs00040-026-01106-9/MediaObjects'
curl --fail --location --retry 3 --retry-delay 2 "$base/40_2026_1106_MOESM1_ESM.rmd" -o "$out/40_2026_1106_MOESM1_ESM.rmd"
curl --fail --location --retry 3 --retry-delay 2 "$base/40_2026_1106_MOESM2_ESM.xlsx" -o "$out/40_2026_1106_MOESM2_ESM.xlsx"
sha256sum "$out/40_2026_1106_MOESM1_ESM.rmd" "$out/40_2026_1106_MOESM2_ESM.xlsx"
python3 "$(dirname "$0")/inventory-reference.py" "$out/40_2026_1106_MOESM1_ESM.rmd" "$out/40_2026_1106_MOESM2_ESM.xlsx"
