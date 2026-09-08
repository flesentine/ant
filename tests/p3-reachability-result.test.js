'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const reportRel='reports/p3_reference_free_reachability_v1.json';
const freezeRel='hypotheses/p3_reachability_result_freeze_v1.json';
const report=read(reportRel),freeze=read(freezeRel);

assert.strictEqual(blob(reportRel),'a18d5cd360be79bf1a05d3fe3e2c26fd1d6c86f6');
assert.strictEqual(sha256(reportRel),'6f5fb55db24015e8822ebc6bdad0c8e76d00d19514e77e0e4af58a4157634887');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,5114);
assert.strictEqual(blob(freezeRel),'b3fa56386f71b0cea1dd8cfec032148c42af1b6d');

assert.strictEqual(report.id,'P3_reference_free_reachability_result_v1');
assert.strictEqual(report.status,'reference_free_reachability_passed');
assert.strictEqual(report.mechanism_id,'P3_local_sector_weber_steering_v1');
assert.strictEqual(report.execution_repo_commit,'4a2e5e9abd7ba930c56e44e6d26d8ff5e03f0c49');
assert.strictEqual(report.mechanism_freeze_git_blob_sha,'5d00ce0058ff388c9f57d7dce56ce465d82c5765');
assert.strictEqual(report.reachability_execution_policy_git_blob_sha,'55494a3190964d24ded2ae0d1faf3b355cc7835f');
assert.strictEqual(report.implementation_authorization_git_blob_sha,'128afcbdb10d3254240c5074e1e997cee7d7fe51');
assert.strictEqual(report.runtime_git_blob_sha,'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(report.model_git_blob_sha,'9107de0c71641c4037bbedbb498b9fa868c1ef00');
assert.strictEqual(report.zero_experiment_git_blob_sha,'f2a97691e604bbb086216221da1c776cc74e9dbb');
assert.strictEqual(report.nominal_experiment_git_blob_sha,'e3c3d7c4c58c885b99654e8797b8570ef91f7cde');
assert.strictEqual(report.fit_performed,false);
assert.strictEqual(report.parameter_search_performed,false);
assert.strictEqual(report.candidate_ranking_performed,false);
assert.strictEqual(report.reference_targets_accessed,false);
assert.strictEqual(report.reference_outcomes_accessed,false);
assert.strictEqual(report.p1_official_result_semantics_loaded,false);
assert.strictEqual(report.p2_official_result_semantics_loaded,false);
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.canonical_model_updated,false);
assert.strictEqual(report.p2_lapse_implemented,false);
assert.strictEqual(report.response_rng_present,false);

assert.deepStrictEqual(report.engineering_values,{
  sigma_field_mm:8,kappa_trail_per_s:4,sector_radius_mm:10,radial_bins:4,angular_bins_per_sector:8,samples_per_sector:32
});
assert.strictEqual(report.identity_panel.rows.length,8);
for(const row of report.identity_panel.rows){
  assert.strictEqual(row.zero_dose_canonical_identity,true);
  assert.strictEqual(row.zero_kappa_canonical_identity,true);
}
for(const[k,v]of Object.entries(report.invariance_panel))assert.strictEqual(v,true,k+' invariance');
assert.strictEqual(report.nominal_reachability_panel.trials,400);
assert.strictEqual(report.nominal_reachability_panel.all_trials_finite,true);
assert.strictEqual(report.nominal_reachability_panel.any_trial_with_steering,true);
assert.strictEqual(report.nominal_reachability_panel.biology_rng_identical_at_construction,true);
assert.strictEqual(report.nominal_reachability_panel.mean_central_zone_fraction,0.9027742126801778);
assert.strictEqual(report.nominal_reachability_panel.trail_axis_exit_rate,1);
assert.strictEqual(report.nominal_reachability_panel.mean_moving_speed_mm_s,23.969301623687233);
assert.strictEqual(report.nominal_reachability_panel.mean_time_to_exit_s,10.221499999999999);
assert.strictEqual(report.nominal_reachability_panel.mean_steering_samples,507.475);
assert.strictEqual(report.nominal_reachability_panel.mean_last_relative_signal,0.010356385952279626);
assert.strictEqual(report.structural_checks.overall_pass,true);
for(const[k,v]of Object.entries(report.structural_checks))assert.strictEqual(v,true,k+' structural check');

assert.strictEqual(freeze.id,'P3_reference_free_reachability_result_freeze_v1');
assert.strictEqual(freeze.status,'reference_free_reachability_passed_frozen_P3_v1_implementation_qualified_only');
assert.strictEqual(freeze.official_report.git_blob_sha,'a18d5cd360be79bf1a05d3fe3e2c26fd1d6c86f6');
assert.strictEqual(freeze.official_report.sha256,'6f5fb55db24015e8822ebc6bdad0c8e76d00d19514e77e0e4af58a4157634887');
assert.strictEqual(freeze.official_report.bytes,5114);
assert.strictEqual(freeze.successful_execution_audit.github_run_id,34255291743);
assert.strictEqual(freeze.successful_execution_audit.github_job_id,102159425630);
assert.strictEqual(freeze.successful_execution_audit.artifact_id,10067590240);
assert.strictEqual(freeze.successful_execution_audit.artifact_digest,'sha256:65296a0e2f6b729cdab0b3fe7209aea708d8066d6fd1dd36eb2741ac3332e31f');
assert.strictEqual(freeze.successful_execution_audit.node_chromium_numeric_parity,'passed');
assert.strictEqual(freeze.successful_execution_audit.browser_exceptions,0);
assert.strictEqual(freeze.successful_execution_audit.browser_console_errors,0);
assert.strictEqual(freeze.successful_execution_audit.browser_response_target_requests,0);
assert.strictEqual(freeze.successful_execution_audit.browser_ymaze_requests,0);
assert.strictEqual(freeze.successful_execution_audit.browser_p1_result_requests,0);
assert.strictEqual(freeze.successful_execution_audit.browser_p2_result_requests,0);
assert.strictEqual(freeze.preceding_audit_harness_failure.github_run_id,34255139524);
assert.strictEqual(freeze.preceding_audit_harness_failure.reachability_step_passed,true);
assert.strictEqual(freeze.preceding_audit_harness_failure.mechanism_changed_after_failure,false);
assert.strictEqual(freeze.preceding_audit_harness_failure.runtime_changed_after_failure,false);
assert.strictEqual(freeze.preceding_audit_harness_failure.scientific_panel_changed_after_failure,false);
assert.strictEqual(freeze.materialization.workflow_run_id,34255411698);
assert.strictEqual(freeze.materialization.workflow_job_id,102159841422);
assert.strictEqual(freeze.materialization.exact_report_bytes_preserved_without_reserialization,true);
assert.strictEqual(freeze.frozen_implementation_chain.reachability_runner_git_blob_sha,'0e1795b7bbb3a568fbbd241cc809d600e1f8ca67');
assert.strictEqual(freeze.exact_identity_result.zero_dose_canonical_identity,true);
assert.strictEqual(freeze.exact_identity_result.zero_kappa_canonical_identity,true);
assert.strictEqual(freeze.exact_identity_result.canonical_biology_rng_identity,true);
assert.strictEqual(freeze.invariance_result.positive_scale_invariance,true);
assert.strictEqual(freeze.invariance_result.left_right_antisymmetry,true);
assert.strictEqual(freeze.invariance_result.rotation,true);
assert.strictEqual(freeze.nominal_panel_result.trials,400);
assert.strictEqual(freeze.nominal_panel_result.trail_axis_exit_rate,1);
assert.strictEqual(freeze.firewall_result.fit_performed,false);
assert.strictEqual(freeze.firewall_result.parameter_search_performed,false);
assert.strictEqual(freeze.firewall_result.response_targets_accessed,false);
assert.strictEqual(freeze.firewall_result.P1_official_result_semantics_loaded,false);
assert.strictEqual(freeze.firewall_result.P2_official_result_semantics_loaded,false);
assert.strictEqual(freeze.firewall_result.P2_lapse_implemented,false);
assert.strictEqual(freeze.firewall_result.response_rng_present,false);
assert.strictEqual(freeze.firewall_result.Y_maze_accessed,false);
assert.strictEqual(freeze.promotion_consequence.P3_v1_implementation_qualified,true);
assert.strictEqual(freeze.promotion_consequence.reference_free_reachability_passed,true);
assert.strictEqual(freeze.promotion_consequence.biological_fit_claim_authorized,false);
assert.strictEqual(freeze.promotion_consequence.fixed_P3_parameter_set_promoted,false);
assert.strictEqual(freeze.promotion_consequence.P3_response_estimation_policy_authorized_by_this_result,false);
assert.strictEqual(freeze.promotion_consequence.P3_parameter_search_authorized,false);
assert.strictEqual(freeze.promotion_consequence.canonical_locomotion_update_authorized,false);
assert.strictEqual(freeze.promotion_consequence.Y_maze_unlock_authorized,false);
assert.match(freeze.retuning_rule,/Do not alter sigma, kappa, sector radius/);
assert.match(freeze.next_gate,/freeze a separate prospective P3 response-estimation policy/i);

const laterPolicyRel='hypotheses/p3_response_estimation_v1.json';
const laterPolicyPresent=fs.existsSync(path.join(root,laterPolicyRel));
if(laterPolicyPresent){
  assert.strictEqual(blob(laterPolicyRel),'d86eb9936e993d188f2a28faab838ba158c40f3b');
  const p3policy=read(laterPolicyRel);
  assert.strictEqual(p3policy.frozen_inputs.reachability_result_freeze.git_blob_sha,'b3fa56386f71b0cea1dd8cfec032148c42af1b6d');
  assert.strictEqual(p3policy.frozen_inputs.reachability_report.git_blob_sha,'a18d5cd360be79bf1a05d3fe3e2c26fd1d6c86f6');
  assert.strictEqual(p3policy.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
  assert.strictEqual(p3policy.estimator_implementation_gate.high_resolution_response_search_authorized,false);
  assert.strictEqual(p3policy.estimator_implementation_gate.response_target_semantic_access_authorized,false);
}
const laterEstimatorPresent=fs.existsSync(path.join(root,'tools','run-p3-estimation.js'));
if(laterEstimatorPresent){
  assert.strictEqual(blob('tools/run-p3-estimation.js'),'462de97b21f0968b754dc365902ae97a0eba0b18');
  assert.strictEqual(blob('tools/p3-estimation-core.js'),'a661ef821dd6b7e3a34d2dc2fdd7058dd2c2e5d3');
}
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p3_highres_authorization_v1.json')),'P3 high-resolution authorization must remain absent after estimator implementation');

console.log('p3-reachability-result.test.js PASS '+JSON.stringify({
  freeze_blob:blob(freezeRel),report_blob:blob(reportRel),report_sha256:sha256(reportRel),
  official_run:freeze.successful_execution_audit.github_run_id,trials:report.nominal_reachability_panel.trials,
  central_zone:report.nominal_reachability_panel.mean_central_zone_fraction,trail_axis:report.nominal_reachability_panel.trail_axis_exit_rate,
  later_policy_present:laterPolicyPresent,
  chromium_parity:true,implementation_qualified:true,biological_fit:false,ymaze:false
}));
