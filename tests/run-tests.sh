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
node tests/h2-persistence.test.js
node tests/h2-estimation.test.js
node tests/h3-reorientation.test.js
node tests/h3-observation-convergence.test.js
node tests/h3-estimation.test.js
node tests/h4-locomotor-activation.test.js
node tests/h4-estimation.test.js
node tests/h5-heading-restoration.test.js
node tests/h5-estimation-policy.test.js
node tests/h5-highres-authorization.test.js
node tests/h5-estimation.test.js
node tests/h5-result-freeze.test.js
node tests/p1-painted-trail-evidence.test.js
node tests/p1-painted-trail-mechanism-policy.test.js
node tests/p1-reachability-policy.test.js
node tests/p1-runtime.test.js
node tests/p1-reachability-result.test.js
node tests/p1-response-estimation-policy.test.js
node tests/p1-estimation.test.js
node tests/p1-highres-authorization.test.js
node tests/p1-highres-execution-precondition.test.js
node tests/p1-response-estimation-result-freeze.test.js
node tests/p1-post-failure-characterization.test.js
node tests/p2-candidate-class-evidence.test.js
node tests/p2-mechanism-selection.test.js
node tests/p2-reachability-policy.test.js
node tests/p2-runtime.test.js
node tests/p2-reachability-result.test.js
node tests/p2-response-estimation-policy.test.js
node tests/p2-estimation.test.js
node tests/p2-estimator-qualification-result.test.js
node tests/p2-highres-authorization.test.js
node tests/p2-highres-execution-precondition.test.js
node tests/p2-response-estimation-result-freeze.test.js
node tests/p3-candidate-class-decision.test.js
node tests/p3-mechanism-selection.test.js
node tests/p3-implementation.test.js
node tests/p3-reachability-result.test.js
node tests/p3-response-estimation-policy.test.js
node tests/p3-estimation.test.js
node tests/p3-estimator-qualification-result.test.js
node tests/p3-highres-authorization.test.js
node tests/p3-highres-execution-precondition.test.js
node tests/p3-response-estimation-result-freeze.test.js
node tests/p3-post-failure-characterization.test.js
node tests/p4-candidate-class-evidence.test.js
node tests/p4-candidate-class-decision.test.js
node tests/p4-mechanism-selection.test.js
node tests/p4-implementation.test.js
node tests/p4-reachability-result.test.js
node tests/p4-response-estimation-policy.test.js
node tests/p4-estimation.test.js
node tests/p4-estimator-qualification-result.test.js
node tests/p4-highres-authorization.test.js
node tests/p4-highres-execution-precondition.test.js
node tests/p4-response-estimation-result-freeze.test.js
node tests/p4-cross-apparatus-validation-source-design.test.js
node tests/p4-ymaze-consistency-protocol.test.js
node tests/p4-ymaze-consistency-implementation-authorization.test.js
node tests/p4-ymaze-consistency-implementation.test.js
node tests/p4-ymaze-consistency-implementation-qualification-result.test.js
node tests/p4-ymaze-consistency-official-execution-authorization.test.js
node tests/p4-ymaze-consistency-official-execution-precondition.test.js
node tests/p4-ymaze-consistency-stage-A-result-freeze.test.js
node tests/p4-ymaze-consistency-stage-B-authorization.test.js
node tests/p4-ymaze-consistency-stage-B-execution-precondition.test.js
node tests/p4-ymaze-consistency-stage-B-result-freeze.test.js
node tests/p4-ymaze-consistency-stage-B-interpretation.test.js
node tests/p4-external-validation-source-discovery.test.js
node tests/p4-external-validation-preregistration.test.js
node tests/p4-external-validation-collection-authorization.test.js
node tests/p4-external-validation-activation-preflight.test.js
node tests/p4-visual-simulator.test.js
node tests/p3-runtime.test.js
node --check src/sim-core.js
node --check src/measurement.js
node --check src/h3.js
node --check src/integrity.js
node --check src/h5.js
node --check src/p1.js
node --check src/p2.js
node --check src/p4.js
node --check src/app.js
node --check tests/p4-visual-simulator.test.js
node --check tests/p4-external-validation-activation-preflight.test.js
node --check tools/check-p4-external-validation-activation.js
node --check tools/run-benchmark.js
node --check tools/run-model-competition.js
node --check tools/run-h2-mechanism.js
node --check tools/run-h2-estimation.js
node --check tools/run-h3-mechanism.js
node --check tools/run-h3-estimation.js
node --check tools/run-h4-mechanism.js
node --check tools/run-h4-estimation.js
node --check tools/run-h5-mechanism.js
node --check tools/run-h5-estimation.js
node --check tools/run-p1-reachability.js
node --check tools/run-p2-reachability.js
node --check tools/run-p4-reachability.js
node --check tools/run-p1-estimation.js
node --check tools/run-p2-estimation.js
node --check tools/p3-estimation-core.js
node --check tools/run-p3-estimation.js
node --check tools/p4-estimation-core.js
node --check tools/run-p4-estimation.js
node --check tools/run-p4-ymaze-consistency.js
node --check tools/compare-p4-ymaze-consistency.js
node --check tools/load-bundle.js
python3 -m py_compile tools/inventory-reference.py tools/reconstruct-poissonnier2026.py tools/derive-poissonnier2026-control-effects.py tools/derive-h2-estimation-targets.py tools/derive-pheromone-response-targets.py
echo "All ANTLAB H0-H5 + P1/P2/P3 implementation + P4 development-closure + corrected cross-apparatus source-design + Y-maze consistency-protocol + implementation-authorization + implementation + qualification-result + prospective official Stage-A authorization + official Stage-A execution-precondition + Stage-A result-freeze + prospective Stage-B authorization + Stage-B execution-precondition + Stage-B result-freeze + Stage-B interpretation + external-validation source-discovery + external-validation preregistration + collection-preauthorization tests PASS"
