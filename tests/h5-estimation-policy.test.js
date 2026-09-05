'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const root=path.resolve(__dirname,'..');
const readJson=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const policy=readJson('hypotheses/h5_parameter_estimation_v1.json');
const freeze=readJson('hypotheses/h5_transient_entry_heading_restoration_v1.json');
const model=readJson('models/lasius_niger_locomotion_h5_v1.json');
const decision=readJson('hypotheses/open_arena_locomotion_context_v1.json');

assert.strictEqual(blob('hypotheses/h5_parameter_estimation_v1.json'),'ead45bacff89bf626deaaf3238a5c363b74279d1','H5 estimation policy blob drifted after freeze');
assert.strictEqual(blob('hypotheses/h5_transient_entry_heading_restoration_v1.json'),'d6fe2300db09b18d2a4426d6ef7ce6324b615f94');
assert.strictEqual(blob('src/h5.js'),'b43f8e9fcaa4b2cc9981ed4f2922a833cc1a3177');
assert.strictEqual(blob('models/lasius_niger_locomotion_h5_v1.json'),'ee2e5570f6d43cd91317fd38299b70bde32f191a');
assert.strictEqual(blob('src/integrity.js'),'f23c68a6955832b70eeb3bd3e6893d71a3759018');
assert.strictEqual(blob('src/sim-core.js'),'24777aac3577d442893e4779d70aee4e27761fe8');
assert.strictEqual(blob('src/measurement.js'),'8845726e02360655c605851662256bc729277b21');
assert.strictEqual(blob('tools/run-h4-estimation.js'),'d417c62a4ef4f97c338a1da2f1ff10f49e18c175');
assert.strictEqual(blob('reference/poissonnier2026_h2_estimation_targets.json'),'07e2b8cf2dddbfcb152f0bd6d3031d473e0901b3');
assert.strictEqual(blob('reports/h2_parameter_estimation_500x60_v1.json'),'342f7a5af7c1ed71a8bdb7ff14becf38d24daa88');
assert.strictEqual(blob('reports/h3_parameter_estimation_500x60_v1.json'),'1d5c1b88ca9b425e927d761bc3ff1e5bad5bd5f3');
assert.strictEqual(blob('reports/h4_parameter_estimation_500x60_v1.json'),'8619b96bb3a02e78b905320ac96585bec08b2918');

assert.strictEqual(policy.id,'H5_parameter_estimation_v1');
assert.strictEqual(policy.status,'development_estimation_policy_frozen_before_estimator_implementation_or_parameter_search');
assert.strictEqual(policy.model_candidate,'lasius_niger_locomotion_h5_v1');
assert.strictEqual(policy.mechanism_freeze_git_blob_sha,'d6fe2300db09b18d2a4426d6ef7ce6324b615f94');

assert.deepStrictEqual(policy.estimated_parameters.angular_sigma_rad_sqrt_s.bounds,[0.7,2.4]);
assert.deepStrictEqual(policy.estimated_parameters.entry_orientation_retention_q.bounds,[0,1]);
assert.deepStrictEqual(policy.estimated_parameters.lambda_commitment_mm.bounds,[100,3000]);
assert.deepStrictEqual(policy.estimated_parameters.tau_commitment_s.bounds,[0.5,40]);
assert.deepStrictEqual(policy.estimated_parameters.kappa_restore_per_s.bounds,[0,2]);
assert.strictEqual(policy.estimated_parameters.kappa_restore_per_s.nested_null_value,0);
assert.ok(!Object.prototype.hasOwnProperty.call(policy.estimated_parameters,'base_speed_mm_s'),'H5 must not gain a baseline-speed nuisance');
assert.strictEqual(model.movement.base_speed_mm_s,24);

const policyTargets=policy.fit_observables.map(x=>x.name);
assert.deepStrictEqual(policyTargets,freeze.development_estimation_guardrails.threshold_independent_fit_targets_only);
assert.strictEqual(policy.diagnostic_firewall.moving_speed_fit_target,false);
assert.strictEqual(policy.diagnostic_firewall.moving_distance_fit_target,false);
assert.strictEqual(policy.diagnostic_firewall.straightness_fit_target,false);

assert.strictEqual(policy.cross_validation.type,'leave_one_colony_out');
assert.strictEqual(policy.cross_validation.colonies,6);
assert.match(policy.cross_validation.primary_survival_guard,/5 of 6/);
assert.match(policy.cross_validation.best_prior_guard,/4 of 6/);
assert.strictEqual(policy.search_protocol.high_resolution_budget.H5_null_candidates_per_fold,500);
assert.strictEqual(policy.search_protocol.high_resolution_budget.H5_context_candidates_per_fold_total,500);
assert.strictEqual(policy.search_protocol.high_resolution_budget.training_trials_per_condition_per_candidate,60);
assert.strictEqual(policy.search_protocol.high_resolution_budget.heldout_evaluation_trials_per_condition,120);
assert.strictEqual(policy.search_protocol.high_resolution_budget.folds,6);
assert.strictEqual(policy.search_protocol.root_seed,1110000);
assert.strictEqual(policy.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
assert.strictEqual(policy.estimator_implementation_gate.high_resolution_search_authorized,false);
assert.match(policy.holdout_rule,/Y-maze/);

assert.strictEqual(policy.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze','policy must preserve the historical estimator status at freeze time');
if(fs.existsSync(path.join(root,'tools/run-h5-estimation.js'))){
  const estimator=require('../tools/run-h5-estimation.js');
  assert.strictEqual(estimator.POLICY_GIT_BLOB_SHA,'ead45bacff89bf626deaaf3238a5c363b74279d1','implemented estimator must pin the exact frozen policy');
}
const browserHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(!browserHtml.includes('H5 has no frozen estimator policy'),'browser status must not claim the H5 estimator policy is absent');
assert.ok(browserHtml.includes('H5-v1 failed promotion')||browserHtml.includes('H5 high-resolution authorized')||browserHtml.includes('H5 estimator qualified')||browserHtml.includes('H5 estimator policy frozen'),'browser status must reflect the frozen H5 lifecycle state');

const h5=decision.hypotheses.find(x=>x.id==='H5_transient_entry_heading_restoration');
assert.ok(h5);
assert.strictEqual(h5.estimation_policy,'h5_parameter_estimation_v1.json');
assert.strictEqual(h5.estimation_policy_git_blob_sha,'ead45bacff89bf626deaaf3238a5c363b74279d1');
assert.ok(['not_implemented','implemented_pending_qualification','implemented_and_qualified_pending_authorization','implemented_and_qualified_authorized_pending_highres','implemented_and_qualified_highres_complete_failed_closed'].includes(h5.estimator_implementation_status));
if(fs.existsSync(path.join(root,'hypotheses','h5_highres_authorization_v1.json'))){
  const auth=readJson('hypotheses/h5_highres_authorization_v1.json');
  assert.strictEqual(auth.high_resolution_search_authorized,true);
  assert.strictEqual(h5.high_resolution_search_authorized,true);
}else{
  assert.strictEqual(h5.high_resolution_search_authorized,false);
}

console.log('h5-estimation-policy.test.js PASS policy_blob=ead45bacff89bf626deaaf3238a5c363b74279d1');
