'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const p=read('hypotheses/p2_reachability_execution_v1.json');
const a=read('hypotheses/p2_implementation_authorization_v1.json');
assert.strictEqual(blob('hypotheses/p2_reachability_execution_v1.json'),'8431ada87724953128104077f4ce1c11b569b1cf');
assert.strictEqual(blob('hypotheses/p2_implementation_authorization_v1.json'),'462997ea7399d98efca5a6b19a0e38160fbddbaf');
assert.strictEqual(p.id,'P2_reference_free_reachability_execution_v1');
assert.strictEqual(p.status,'execution_policy_frozen_before_P2_runtime_implementation_or_execution');
assert.strictEqual(p.mechanism_freeze.git_blob_sha,'70f51e5cab5db0024947ed71cf760590089f8aea');
assert.strictEqual(p.candidate_class_evidence.git_blob_sha,'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
assert.strictEqual(p.selection_main_checkpoint.commit,'d1084ca3f57439da8581167d983b477e0ca66f9f');
assert.strictEqual(p.selection_main_checkpoint.permanent_main_workflow_run_id,34085099776);
assert.strictEqual(p.selection_main_checkpoint.test_job_id,101627509148);
assert.strictEqual(p.selection_main_checkpoint.deploy_job_id,101627631394);
assert.strictEqual(p.selection_main_checkpoint.conclusion,'success');

assert.strictEqual(p.frozen_inputs.canonical_model_git_blob_sha,'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');
assert.strictEqual(p.frozen_inputs.sim_core_git_blob_sha,'24777aac3577d442893e4779d70aee4e27761fe8');
assert.strictEqual(p.frozen_inputs.integrity_runtime_git_blob_sha,'f23c68a6955832b70eeb3bd3e6893d71a3759018');
assert.strictEqual(p.frozen_inputs.p1_component_runtime_git_blob_sha,'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(p.frozen_inputs.p1_engineering_model_git_blob_sha,'73873fd6763838423ca27648136bb0b9ff062817');
assert.strictEqual(p.frozen_inputs.open_arena_apparatus_git_blob_sha,'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4');

assert.strictEqual(p.frozen_execution.physics_dt_s,0.02);
assert.deepStrictEqual(p.frozen_execution.engineering_values,{
  sigma_field_mm:8,
  kappa_trail_per_s:4,
  p_lapse:0.2,
  sensor_forward_offset_mm:2,
  sensor_lateral_half_separation_mm:1.5
});
assert.deepStrictEqual(p.frozen_execution.exact_identity_panel.seeds,[730001,730002,730003,730004,730005,730006,730007,730008]);
assert.strictEqual(p.frozen_execution.exact_identity_panel.fixed_time_s,8);
assert.deepStrictEqual(p.frozen_execution.exact_identity_panel.cases,[
  'zero_dose_canonical_identity',
  'zero_kappa_canonical_identity',
  'all_lapse_canonical_identity',
  'always_engaged_nested_p1_identity'
]);
assert.strictEqual(p.frozen_execution.stochastic_engagement_panel.trials,400);
assert.strictEqual(p.frozen_execution.stochastic_engagement_panel.first_seed,731000);
assert.strictEqual(p.frozen_execution.stochastic_engagement_panel.last_seed,731399);
assert.strictEqual(p.frozen_execution.stochastic_engagement_panel.p_lapse,0.2);
assert.strictEqual(p.frozen_execution.stochastic_engagement_panel.common_trial_seeds_for_P2_P1_and_canonical,true);

assert.strictEqual(p.reference_firewall.poissonnier2026_pheromone_response_targets_may_be_loaded,false);
assert.strictEqual(p.reference_firewall.any_reference_outcomes_may_be_loaded,false);
assert.strictEqual(p.reference_firewall.P1_official_result_may_be_used_for_tuning,false);
assert.strictEqual(p.reference_firewall.candidate_ranking_or_parameter_search,false);
assert.strictEqual(p.reference_firewall.fit_or_parameter_search,false);
assert.strictEqual(p.reference_firewall.adaptive_refinement,false);
assert.strictEqual(p.reference_firewall.ymaze_may_be_loaded,false);
assert.strictEqual(p.reference_firewall.ymaze_fitting_or_ranking,false);
assert.match(p.implementation_constraints.join(' '),/extend the canonical integrity Simulation directly/i);
assert.match(p.implementation_constraints.join(' '),/must not instantiate P1 Simulation as its base class/i);
assert.match(p.implementation_constraints.join(' '),/No response RNG object or draw is required in exact bypass cases/i);
assert.strictEqual(p.result_rule.parameter_promotion_authorized,false);
assert.strictEqual(p.result_rule.response_estimation_policy_authorized,false);
assert.strictEqual(p.result_rule.canonical_update_authorized,false);
assert.strictEqual(p.result_rule.ymaze_unlock_authorized,false);

assert.strictEqual(a.id,'P2_implementation_authorization_v1');
assert.strictEqual(a.status,'P2_v1_implementation_and_reference_free_reachability_authorized_against_exact_frozen_mechanism_and_execution_policy');
assert.strictEqual(a.mechanism_freeze.git_blob_sha,'70f51e5cab5db0024947ed71cf760590089f8aea');
assert.strictEqual(a.reachability_execution_policy.git_blob_sha,'8431ada87724953128104077f4ce1c11b569b1cf');
assert.strictEqual(a.authorization.create_src_p2_js,true);
assert.strictEqual(a.authorization.run_frozen_400_trial_stochastic_panel,true);
assert.strictEqual(a.still_forbidden.response_target_access,true);
assert.strictEqual(a.still_forbidden.parameter_search_or_ranking,true);
assert.strictEqual(a.still_forbidden.Candidate_B_Weber_transduction,true);
assert.strictEqual(a.still_forbidden.Y_maze_access,true);
assert.strictEqual(a.promotion_rule.biological_fit_claim_authorized,false);
assert.strictEqual(a.promotion_rule.response_estimation_authorized,false);
assert.strictEqual(a.promotion_rule.ymaze_unlock_authorized,false);

console.log('p2-reachability-policy.test.js PASS '+JSON.stringify({
  policy_blob:blob('hypotheses/p2_reachability_execution_v1.json'),
  authorization_blob:blob('hypotheses/p2_implementation_authorization_v1.json'),
  identity_seeds:p.frozen_execution.exact_identity_panel.seeds.length,
  stochastic_trials:p.frozen_execution.stochastic_engagement_panel.trials,
  p_lapse:p.frozen_execution.engineering_values.p_lapse,
  response_target:false,
  ymaze:false
}));
