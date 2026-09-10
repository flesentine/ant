'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const hash = rel => execFileSync('git', ['hash-object', rel], { cwd: root, encoding: 'utf8' }).trim();

const decisionPath = 'hypotheses/p4_painted_trail_candidate_class_decision_v1.json';
const evidencePath = 'hypotheses/p4_painted_trail_candidate_class_evidence_v1.json';
const decision = readJson(decisionPath);
const evidence = readJson(evidencePath);

assert.strictEqual(hash(decisionPath), 'ad7295ba6d466549c60c8ecac37e39d30006ec1c');
assert.strictEqual(hash(evidencePath), '262f332062f271bbf111d0572f83b2faaf2cfd74');
assert.strictEqual(hash('hypotheses/p1_response_estimation_result_freeze_v1.json'), '1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(hash('hypotheses/p2_response_estimation_result_freeze_v1.json'), '088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(hash('hypotheses/p3_response_estimation_result_freeze_v1.json'), 'aa69afda6d80cc9d4ea0b563470cffdf0762b941');
assert.strictEqual(hash('hypotheses/p3_post_failure_characterization_v1.json'), '541259b5f26cc475997b7b1a03d6b6f3cba6a332');

assert.strictEqual(decision.id, 'P4_painted_trail_candidate_class_decision_v1');
assert.strictEqual(decision.status, 'next_independent_candidate_class_selected_no_exact_mechanism_no_implementation_authorized');
assert.strictEqual(decision.starting_checkpoint.main_commit, '152f47f30845f0af91150e9bfe1cbba43e9bfcc7');
assert.strictEqual(decision.starting_checkpoint.permanent_main_workflow_run_id, 34445402328);
assert.strictEqual(decision.starting_checkpoint.test_job_id, 102769004574);
assert.strictEqual(decision.starting_checkpoint.deploy_job_id, 102769165169);
assert.strictEqual(decision.starting_checkpoint.test_job_conclusion, 'success');
assert.strictEqual(decision.starting_checkpoint.deploy_job_conclusion, 'success');

assert.strictEqual(decision.independent_evidence_input.git_blob_sha, '262f332062f271bbf111d0572f83b2faaf2cfd74');
assert.strictEqual(decision.independent_evidence_input.response_target_semantics_used, false);
assert.strictEqual(decision.independent_evidence_input.p3_target_ranked_outcomes_used_to_select_or_parameterize_P4, false);

const selectedId = 'P4_candidate_absolute_signal_dependent_bilateral_response';
assert.strictEqual(decision.selected_next_candidate_class.class_id, selectedId);
const fresh = evidence.fresh_candidate_classes.find(x => x.class_id === selectedId);
assert.ok(fresh, 'selected P4 class must exist in frozen independent evidence');
assert.strictEqual(fresh.status, 'fresh_plausible_class_supported_not_formally_selected');
assert.match(decision.selected_next_candidate_class.selection_strength, /direct_lasius_niger_absolute_concentration_dependence/);
assert.match(decision.selected_next_candidate_class.description, /absolute local pheromone evidence/i);
assert.match(decision.selected_next_candidate_class.description, /bilateral directional information/i);

for (const [key, value] of Object.entries(decision.explicit_nonselections)) {
  assert.strictEqual(value, false, `explicit non-selection ${key} must remain false at the historical decision freeze`);
}
for (const [key, value] of Object.entries(decision.selection_firewall)) {
  assert.strictEqual(value, false, `selection firewall ${key} must remain false at the historical decision freeze`);
}

const requiredUnsetConcepts = [
  'exact absolute-evidence statistic',
  'hard versus smooth versus stochastic expression',
  'exact bilateral directional equation',
  'sensor or antenna geometry',
  'response RNG and its stream ownership',
  'parameter surface and bounds',
  'engineering-only reachability values and seed panel',
  'estimation objective, nuisance handling, folds, seeds, budgets, weights, and promotion rules'
];
for (const item of requiredUnsetConcepts) {
  assert.ok(decision.mechanism_details_deliberately_not_frozen_here.includes(item), `missing deliberately-unset item: ${item}`);
}

// The decision gate itself remains immutable, while the later prospective mechanism freeze may now exist.
const mechanismRel = 'hypotheses/p4_painted_trail_mechanism_v1.json';
const mechanismPresent = fs.existsSync(path.join(root, mechanismRel));
if (mechanismPresent) {
  assert.strictEqual(hash(mechanismRel), '609551836e540c341365db9cc987d2ca340cc053');
  const mechanism = readJson(mechanismRel);
  assert.strictEqual(mechanism.candidate_class_input.decision_git_blob_sha, 'ad7295ba6d466549c60c8ecac37e39d30006ec1c');
  assert.strictEqual(mechanism.candidate_class_input.evidence_git_blob_sha, '262f332062f271bbf111d0572f83b2faaf2cfd74');
  assert.strictEqual(mechanism.candidate_class_input.selected_class_id, selectedId);
  assert.strictEqual(mechanism.implementation_gate.src_p4_exists_at_this_freeze, false);
  assert.strictEqual(mechanism.implementation_gate.p4_model_exists_at_this_freeze, false);
  assert.strictEqual(mechanism.implementation_gate.new_P4_simulation_executed_at_this_freeze, false);
  assert.strictEqual(mechanism.implementation_gate.implementation_authorized_by_this_record, false);
  assert.strictEqual(mechanism.estimation_firewall.response_target_semantic_access_authorized, false);
  assert.strictEqual(mechanism.global_firewall.reserved_Y_maze_access, false);
}

const stillForbiddenFiles = [
  'src/p4.js',
  'models/lasius_niger_painted_trail_p4_v1.json',
  'hypotheses/p4_response_estimation_v1.json',
  'hypotheses/p4_implementation_authorization_v1.json',
  'hypotheses/p4_reachability_execution_v1.json',
  'tools/run-p4-estimation.js',
  'tools/run-p4-reachability.js'
];
for (const rel of stillForbiddenFiles) {
  assert.strictEqual(fs.existsSync(path.join(root, rel)), false, `${rel} must not exist before a later implementation/estimation gate`);
}

assert.match(decision.next_gate, /separate P4 mechanism-selection\/freeze record/i);
assert.match(decision.next_gate, /before any P4 implementation or simulation/i);

console.log('P4 candidate-class decision freeze PASS '+JSON.stringify({
  decision_blob:hash(decisionPath),
  selected_class:selectedId,
  historical_exact_mechanism_selected:false,
  later_mechanism_present:mechanismPresent,
  p4_runtime_present:false,
  response_target_access:false,
  reserved_ymaze_access:false
}));
