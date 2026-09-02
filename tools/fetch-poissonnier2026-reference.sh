#!/usr/bin/env bash
set -euo pipefail
out="${1:-reference/materialized/poissonnier2026}"
root="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$out"
base='https://media.springernature.com/original/springer-static/esm/art%3A10.1007%2Fs00040-026-01106-9/MediaObjects'
curl --fail --location --retry 3 --retry-delay 2 "$base/40_2026_1106_MOESM1_ESM.rmd" -o "$out/40_2026_1106_MOESM1_ESM.rmd"
curl --fail --location --retry 3 --retry-delay 2 "$base/40_2026_1106_MOESM2_ESM.xlsx" -o "$out/40_2026_1106_MOESM2_ESM.xlsx"
sha256sum "$out/40_2026_1106_MOESM1_ESM.rmd" "$out/40_2026_1106_MOESM2_ESM.xlsx" | tee "$out/SHA256SUMS"
python3 "$root/tools/inventory-reference.py" "$out/40_2026_1106_MOESM1_ESM.rmd" "$out/40_2026_1106_MOESM2_ESM.xlsx" | tee "$out/inventory.log"
python3 "$root/tools/reconstruct-poissonnier2026.py" "$out/40_2026_1106_MOESM2_ESM.xlsx" "$out/reconstruction.json"
python3 "$root/tools/derive-poissonnier2026-control-effects.py" "$out/40_2026_1106_MOESM2_ESM.xlsx" "$out/control-effects.json" >/dev/null
cmp "$out/control-effects.json" "$root/reference/poissonnier2026_control_effects.json"
echo "Pinned control-effect screening reference reproduced exactly."
