'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const reportRel='reports/p2_reference_free_reachability_v1.json';
const freezeRel='hypotheses/p2_reachability_result_freeze_v1.json';
const report=read(reportRel),freeze=read(freezeRel);

assert.strictEqual(blob(reportRel),'78a5e0ac4a3dd536a0e2d06ece2e9e37cdb2aefa');
assert.strictEqual(sha256(reportRel),'de481a25ad36d6124bb51cb644bb55199fa655471fbadc082f7d3f04cb2ac37b');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,5765);
assert.strictEqual(blob(freezeRel),'8dddaf083d4af046051fc1b7412b9f22cda8618a');

assert.strictEqual(report.id,'P2_reference_free_reachability_result_v1');
assert.strictEqual(report.status,'reference_free_reachability_passed');
assert.strictEqual(report.mechanism_id,'P2_trial_level_transient_trail_engagement_v1');
assert.strictEqual(report.execution_repo_commit,'e92484e909ddf9968071bda29d19b6a332c1486c');
assert.strictEqual(report.mechanism_freeze_git_blob_sha,'70f51e5cab5db0024947ed71cf760590089f8aea');
assert.strictEqual(report.reachability_execution_policy_git_blob_sha,'8431ada87724953128104077f4ce1c11b569b1cf');
assert.strictEqual(report.implementation_authorization_git_blob_sha,'462997ea7399d98efca5a6b19a0e38160fbddbaf');
assert.strictEqual(report.runtime_git_blob_sha,'f91a2f7ede1b8119acc1fd57ac94a9718d074e15');
assert.strictEqual(report.model_git_blob_sha,'7d3eecc44cb2eaf727249083a6fcfa21986fd475');
assert.strictEqual(report.fit_performed,false);
assert.strictEqual(report.parameter_search_performed,false);
assert.strictEqual(report.candidate_ranking_performed,false);
assert.strictEqual(report.reference_targets_accessed,false);
assert.strictEqual(report.reference_outcomes_accessed,false);
assert.strictEqual(report.p1_official_result_used_for_tuning,false);
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.canonical_model_updated,false);
assert.strictEqual(report.candidate_B_implemented,false);

assert.deepStrictEqual(report.engineering_values,{
  sigma_field_mm:8,
  kappa_trail_per_s:4,
  p_lapse:0.2,
  sensor_forward_offset_mm:2,
  sensor_lateral_half_separation_mm:1.5
});
assert.strictEqual(report.identity_panel.rows.length,8);
for(const row of report.identity_panel.rows){
  assert.strictEqual(row.zero_dose_canonical_identity,true);
  assert.strictEqual(row.zero_kappa_canonical_identity,true);
  assert.strictEqual(row.all_lapse_canonical_identity,true);
  assert.strictEqual(row.always_engaged_nested_p1_identity,true);
}
assert.strictEqual(report.stochastic_engagement_panel.trials,400);
assert.strictEqual(report.stochastic_engagement_panel.lapses,75);
assert.strictEqual(report.stochastic_engagement_panel.engaged,325);
assert.strictEqual(report.stochastic_engagement_panel.observed_lapse_fraction,0.1875);
assert.strictEqual(report.stochastic_engagement_panel.all_trials_exact_component_identity,true);
assert.strictEqual(report.stochastic_engagement_panel.all_trials_exactly_one_response_draw,true);
assert.strictEqual(report.stochastic_engagement_panel.all_trials_engagement_state_fixed,true);
assert.strictEqual(report.stochastic_engagement_panel.response_seed_namespace_unique_for_ant_ids_0_to_7,true);
assert.strictEqual(report.stochastic_engagement_panel.mean_central_zone_fraction,0.3105365527822391);
assert.strictEqual(report.stochastic_engagement_panel.trail_axis_exit_rate,0.4825);
assert.strictEqual(report.stochastic_engagement_panel.mean_moving_speed_mm_s,23.628478016068925);
assert.strictEqual(report.stochastic_engagement_panel.mean_time_to_exit_s,9.353299999999999);
assert.strictEqual(report.stochastic_engagement_panel.mean_steering_samples,381.61);
assert.strictEqual(report.structural_checks.overall_pass,true);
for(const[k,v]of Object.entries(report.structural_checks))assert.strictEqual(v,true,k+' must remain true');

assert.strictEqual(freeze.id,'P2_reference_free_reachability_result_freeze_v1');
assert.strictEqual(freeze.status,'reference_free_reachability_passed_frozen_P2_v1_implementation_qualified_only');
assert.strictEqual(freeze.execution_audit.tested_head,'e92484e909ddf9968071bda29d19b6a332c1486c');
assert.strictEqual(freeze.execution_audit.github_run_id,34089553046);
assert.strictEqual(freeze.execution_audit.github_job_id,101640096955);
assert.strictEqual(freeze.execution_audit.github_run_attempt,1);
assert.strictEqual(freeze.execution_audit.artifact_id,10006342916);
assert.strictEqual(freeze.execution_audit.artifact_digest,'sha256:1712b4b9a5ccfcc87659f90c44a5211c5bbaa23a5748d810f610e7363b97b4ee');
assert.strictEqual(freeze.official_report.git_blob_sha,'78a5e0ac4a3dd536a0e2d06ece2e9e37cdb2aefa');
assert.strictEqual(freeze.official_report.sha256,'de481a25ad36d6124bb51cb644bb55199fa655471fbadc082f7d3f04cb2ac37b');
assert.strictEqual(freeze.official_report.bytes,5765);
assert.strictEqual(freeze.audit_sidecars.chromium_parity_cases,6);
assert.strictEqual(freeze.audit_sidecars.browser_exceptions,0);
assert.strictEqual(freeze.audit_sidecars.browser_console_errors,0);
assert.strictEqual(freeze.audit_sidecars.browser_response_target_requests,0);
assert.strictEqual(freeze.audit_sidecars.browser_ymaze_requests,0);
assert.strictEqual(freeze.audit_sidecars.browser_p2_estimation_surface_requests,0);
assert.strictEqual(freeze.frozen_implementation_chain.reachability_runner_git_blob_sha,'88f4a3ee0459ff2e1b33db0195635d1c5c46ca23');
assert.strictEqual(freeze.exact_identity_result.zero_dose_canonical_identity,true);
assert.strictEqual(freeze.exact_identity_result.zero_kappa_canonical_identity,true);
assert.strictEqual(freeze.exact_identity_result.all_lapse_canonical_identity,true);
assert.strictEqual(freeze.exact_identity_result.always_engaged_nested_P1_identity,true);
assert.strictEqual(freeze.exact_identity_result.canonical_biology_rng_identity,true);
assert.strictEqual(freeze.stochastic_panel_result.lapses,75);
assert.strictEqual(freeze.stochastic_panel_result.engaged,325);
assert.strictEqual(freeze.stochastic_panel_result.observed_lapse_fraction,0.1875);
assert.match(freeze.stochastic_panel_result.interpretation,/not fitting targets/i);
assert.strictEqual(freeze.firewall_result.fit_performed,false);
assert.strictEqual(freeze.firewall_result.parameter_search_performed,false);
assert.strictEqual(freeze.firewall_result.response_targets_accessed,false);
assert.strictEqual(freeze.firewall_result.Y_maze_accessed,false);
assert.strictEqual(freeze.promotion_consequence.P2_v1_implementation_qualified,true);
assert.strictEqual(freeze.promotion_consequence.reference_free_reachability_passed,true);
assert.strictEqual(freeze.promotion_consequence.biological_fit_claim_authorized,false);
assert.strictEqual(freeze.promotion_consequence.fixed_P2_parameter_set_promoted,false);
assert.strictEqual(freeze.promotion_consequence.P2_response_estimation_policy_authorized_by_this_result,false);
assert.strictEqual(freeze.promotion_consequence.P2_parameter_search_authorized,false);
assert.strictEqual(freeze.promotion_consequence.canonical_locomotion_update_authorized,false);
assert.strictEqual(freeze.promotion_consequence.Y_maze_unlock_authorized,false);
assert.match(freeze.retuning_rule,/Do not alter sigma, kappa, p_lapse/);
assert.match(freeze.next_gate,/freeze a separate prospective P2 response-estimation policy/i);

const laterPolicyPath=path.join(root,'hypotheses','p2_response_estimation_v1.json');
const laterPolicyPresent=fs.existsSync(laterPolicyPath);
if(laterPolicyPresent){
  assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
  const p=read('hypotheses/p2_response_estimation_v1.json');
  assert.strictEqual(p.frozen_inputs.reachability_result_freeze.git_blob_sha,'8dddaf083d4af046051fc1b7412b9f22cda8618a');
  assert.strictEqual(p.frozen_inputs.reachability_report.git_blob_sha,'78a5e0ac4a3dd536a0e2d06ece2e9e37cdb2aefa');
  assert.strictEqual(p.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
  assert.strictEqual(p.estimator_implementation_gate.response_target_semantic_access_authorized,false);
}
const laterEstimatorPath=path.join(root,'tools','run-p2-estimation.js');
const laterEstimatorPresent=fs.existsSync(laterEstimatorPath);
if(laterEstimatorPresent){
  assert.strictEqual(blob('tools/run-p2-estimation.js'),'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
  assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
}
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p2_highres_authorization_v1.json')),'P2 highres authorization must remain absent before later authorization gate');

console.log('p2-reachability-result.test.js PASS '+JSON.stringify({
  freeze_blob:blob(freezeRel),
  report_blob:blob(reportRel),
  report_sha256:sha256(reportRel),
  official_run:freeze.execution_audit.github_run_id,
  lapses:report.stochastic_engagement_panel.lapses,
  engaged:report.stochastic_engagement_panel.engaged,
  lapse_fraction:report.stochastic_engagement_panel.observed_lapse_fraction,
  chromium_cases:freeze.audit_sidecars.chromium_parity_cases,
  implementation_qualified:true,
  biological_fit:false,
  later_response_policy_present:laterPolicyPresent,
  later_estimator_present:laterEstimatorPresent,
  ymaze:false
}));
