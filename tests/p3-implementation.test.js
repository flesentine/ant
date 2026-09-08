'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const policy=read('hypotheses/p3_reachability_execution_v1.json');
const auth=read('hypotheses/p3_implementation_authorization_v1.json');

assert.strictEqual(blob('hypotheses/p3_reachability_execution_v1.json'),'55494a3190964d24ded2ae0d1faf3b355cc7835f');
assert.strictEqual(blob('hypotheses/p3_implementation_authorization_v1.json'),'128afcbdb10d3254240c5074e1e997cee7d7fe51');
assert.strictEqual(blob('hypotheses/p3_painted_trail_mechanism_v1.json'),'5d00ce0058ff388c9f57d7dce56ce465d82c5765');
assert.strictEqual(blob('src/p3.js'),'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p3_v1.json'),'9107de0c71641c4037bbedbb498b9fa868c1ef00');
assert.strictEqual(blob('experiments/open_arena_p3_zero_dose_reachability.json'),'f2a97691e604bbb086216221da1c776cc74e9dbb');
assert.strictEqual(blob('experiments/open_arena_p3_nominal_dose_reachability.json'),'e3c3d7c4c58c885b99654e8797b8570ef91f7cde');
assert.strictEqual(blob('tools/run-p3-reachability.js'),'0e1795b7bbb3a568fbbd241cc809d600e1f8ca67');

assert.strictEqual(policy.id,'P3_reference_free_reachability_execution_v1');
assert.strictEqual(policy.status,'execution_policy_frozen_before_P3_runtime_implementation_or_execution');
assert.strictEqual(policy.mechanism_freeze.git_blob_sha,'5d00ce0058ff388c9f57d7dce56ce465d82c5765');
assert.strictEqual(policy.candidate_class_decision.git_blob_sha,'e8da07f6f73934e0120fd41d4668ae4039108336');
assert.strictEqual(policy.selection_main_checkpoint.commit,'e30a4462cce7a9594d248f328370a214b20cedc0');
assert.strictEqual(policy.selection_main_checkpoint.permanent_main_workflow_run_id,34254197826);
assert.strictEqual(policy.selection_main_checkpoint.test_job_id,102155754688);
assert.strictEqual(policy.selection_main_checkpoint.deploy_job_id,102156006262);
assert.strictEqual(policy.selection_main_checkpoint.conclusion,'success');

assert.deepStrictEqual(policy.frozen_execution.engineering_values,{
  sigma_field_mm:8,kappa_trail_per_s:4,sector_radius_mm:10,radial_bins:4,angular_bins_per_sector:8,samples_per_sector:32
});
assert.deepStrictEqual(policy.frozen_execution.exact_identity_panel.seeds,[740001,740002,740003,740004,740005,740006,740007,740008]);
assert.strictEqual(policy.frozen_execution.exact_identity_panel.fixed_time_s,8);
assert.strictEqual(policy.frozen_execution.nominal_reachability_panel.trials,400);
assert.strictEqual(policy.frozen_execution.nominal_reachability_panel.first_seed,741000);
assert.strictEqual(policy.frozen_execution.nominal_reachability_panel.last_seed,741399);
assert.strictEqual(policy.reference_firewall.poissonnier2026_pheromone_response_targets_may_be_loaded,false);
assert.strictEqual(policy.reference_firewall.P1_official_result_semantics_may_be_loaded,false);
assert.strictEqual(policy.reference_firewall.P2_official_result_semantics_may_be_loaded,false);
assert.strictEqual(policy.reference_firewall.fit_or_parameter_search,false);
assert.strictEqual(policy.reference_firewall.ymaze_may_be_loaded,false);

assert.strictEqual(auth.id,'P3_implementation_authorization_v1');
assert.strictEqual(auth.status,'P3_v1_implementation_and_reference_free_reachability_authorized_against_exact_frozen_mechanism_and_execution_policy');
assert.strictEqual(auth.mechanism_freeze.git_blob_sha,'5d00ce0058ff388c9f57d7dce56ce465d82c5765');
assert.strictEqual(auth.reachability_execution_policy.git_blob_sha,'55494a3190964d24ded2ae0d1faf3b355cc7835f');
assert.strictEqual(auth.selection_checkpoint.main_commit,'e30a4462cce7a9594d248f328370a214b20cedc0');
assert.strictEqual(auth.authorization.create_src_p3_js,true);
assert.strictEqual(auth.authorization.run_frozen_400_trial_nominal_panel,true);
assert.strictEqual(auth.authorization.run_node_chromium_parity_and_firewall,true);
assert.strictEqual(auth.still_forbidden.response_target_access,true);
assert.strictEqual(auth.still_forbidden.P1_official_result_semantic_access,true);
assert.strictEqual(auth.still_forbidden.P2_official_result_semantic_access,true);
assert.strictEqual(auth.still_forbidden.parameter_search_or_ranking,true);
assert.strictEqual(auth.still_forbidden.P3_response_estimation_policy,true);
assert.strictEqual(auth.still_forbidden.Y_maze_access,true);
assert.strictEqual(auth.promotion_rule.biological_fit_claim_authorized,false);
assert.strictEqual(auth.promotion_rule.response_estimation_policy_authorized,false);
assert.strictEqual(auth.promotion_rule.canonical_locomotion_update_authorized,false);
assert.strictEqual(auth.promotion_rule.Y_maze_unlock_authorized,false);

const laterPolicyRel='hypotheses/p3_response_estimation_v1.json';
const laterPolicyPresent=fs.existsSync(path.join(root,laterPolicyRel));
if(laterPolicyPresent){
  assert.strictEqual(blob(laterPolicyRel),'d86eb9936e993d188f2a28faab838ba158c40f3b');
  const p3policy=read(laterPolicyRel);
  assert.strictEqual(p3policy.frozen_inputs.implementation_authorization.git_blob_sha,'128afcbdb10d3254240c5074e1e997cee7d7fe51');
  assert.strictEqual(p3policy.frozen_inputs.p3_runtime.git_blob_sha,'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
  assert.strictEqual(p3policy.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
  assert.strictEqual(p3policy.global_firewalls.response_target_semantic_access_during_this_policy_freeze,false);
  assert.strictEqual(p3policy.global_firewalls.Y_maze_access,false);
}
for(const p of ['tools/run-p3-estimation.js','hypotheses/p3_highres_authorization_v1.json'])
  assert.ok(!fs.existsSync(path.join(root,p)),p+' must remain absent');

console.log('p3-implementation.test.js PASS '+JSON.stringify({
  policy_blob:blob('hypotheses/p3_reachability_execution_v1.json'),
  authorization_blob:blob('hypotheses/p3_implementation_authorization_v1.json'),
  runtime_blob:blob('src/p3.js'),
  model_blob:blob('models/lasius_niger_painted_trail_p3_v1.json'),
  runner_blob:blob('tools/run-p3-reachability.js'),
  trials:policy.frozen_execution.nominal_reachability_panel.trials,
  later_policy_present:laterPolicyPresent,
  target_access:false,
  ymaze:false
}));
