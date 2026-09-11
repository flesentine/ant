'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const freezePath='hypotheses/p4_reachability_result_freeze_v1.json';
const reportPath='reports/p4_reference_free_reachability_v1.json';
const f=read(freezePath),r=read(reportPath);
assert.strictEqual(blob(freezePath),'f2074ae3157f22208ff98ebc620c00006549cab6');
assert.strictEqual(blob(reportPath),'f6e77596eb25cc7bca3bf0dde1da712511a1d0d0');
assert.strictEqual(sha256(reportPath),'7105d70ddb80d1d8f91f19fcba8a992560dfb22c5989c1c6d11c5479bd946713');
assert.strictEqual(fs.statSync(path.join(root,reportPath)).size,5763);

const pins={
  'hypotheses/p4_painted_trail_candidate_class_evidence_v1.json':'262f332062f271bbf111d0572f83b2faaf2cfd74',
  'hypotheses/p4_painted_trail_candidate_class_decision_v1.json':'ad7295ba6d466549c60c8ecac37e39d30006ec1c',
  'hypotheses/p4_painted_trail_mechanism_v1.json':'609551836e540c341365db9cc987d2ca340cc053',
  'hypotheses/p4_reachability_execution_v1.json':'0d452f9c0d548ec962e0a6d9826648bf5e14a4ef',
  'hypotheses/p4_implementation_authorization_v1.json':'42f8d51b06a20c0c6001a42b6021a134f2694e0d',
  'src/p4.js':'bf7d5781bd69ec4568450ebbd3bdc284897b6f61',
  'models/lasius_niger_painted_trail_p4_v1.json':'3d8460b6916a90d06e70768f696ee3f0d48fccf4',
  'experiments/open_arena_p4_zero_dose_reachability.json':'a0ce8285448adacd18feebb3e82e76092e102eec',
  'experiments/open_arena_p4_low_dose_reachability.json':'3d21c82250b7c27a382606fb45b247d4eef20fb7',
  'experiments/open_arena_p4_nominal_dose_reachability.json':'d7605792f6f0eb871d7b3999940e08f750784b64',
  'tools/run-p4-reachability.js':'ba4e067a7f686933ed3271a64da2f79f0a558ab0'
};
for(const[p,s]of Object.entries(pins))assert.strictEqual(blob(p),s,p);

assert.strictEqual(f.id,'P4_reference_free_reachability_result_freeze_v1');
assert.match(f.status,/implementation_and_reference_free_reachability_qualified/);
assert.strictEqual(f.starting_main_checkpoint.commit,'b73c97b4c3fd70e67cf22c050cf695a5f07771c8');
assert.strictEqual(f.starting_main_checkpoint.permanent_main_workflow_run_id,34452510140);
assert.strictEqual(f.starting_main_checkpoint.test_job_id,102791233581);
assert.strictEqual(f.starting_main_checkpoint.deploy_job_id,102791465602);
assert.strictEqual(f.starting_main_checkpoint.conclusion,'success');

assert.strictEqual(f.qualification_history.first_attempt.workflow_run_id,34517441563);
assert.strictEqual(f.qualification_history.first_attempt.job_id,103006286920);
assert.strictEqual(f.qualification_history.first_attempt.workflow_git_blob_sha,'1452def40721fe4b2ea6bb032a7dfe296fa7301e');
assert.strictEqual(f.qualification_history.first_attempt.chromium_audit,'failure');
assert.strictEqual(f.qualification_history.first_attempt.frozen_reachability_execution,'success');
assert.strictEqual(f.qualification_history.first_attempt.scientific_or_mechanism_change_after_attempt,false);
assert.match(f.qualification_history.first_attempt.cause,/omitted src\/measurement\.js and src\/h3\.js/);
assert.strictEqual(f.qualification_history.successful_attempt.workflow_run_id,34517794416);
assert.strictEqual(f.qualification_history.successful_attempt.job_id,103007498050);
assert.strictEqual(f.qualification_history.successful_attempt.execution_head_sha,'a4efbdd04da136224cfd7bb66a71d18b77147cc0');
assert.strictEqual(f.qualification_history.successful_attempt.workflow_git_blob_sha,'f06c5c0cae651f34a21da2bb63515eb1c71a0c1c');
assert.strictEqual(f.qualification_history.successful_attempt.report_materialization_commit,'933362fc955df543eabdb98c7b5979a4816cff83');
assert.strictEqual(f.qualification_history.successful_attempt.conclusion,'success');

assert.strictEqual(f.exact_report.git_blob_sha,blob(reportPath));
assert.strictEqual(f.exact_report.sha256,sha256(reportPath));
assert.strictEqual(f.exact_report.bytes,fs.statSync(path.join(root,reportPath)).size);
assert.strictEqual(f.exact_report.embedded_pre_self_hash_sha256,r.report_content_sha256);
assert.strictEqual(f.exact_report.generated_from_git_head,r.generated_from_git_head);
assert.strictEqual(r.generated_from_git_head,'a4efbdd04da136224cfd7bb66a71d18b77147cc0');
assert.strictEqual(r.status,'reference_free_reachability_passed');
assert.strictEqual(r.scientific_claim,'implementation_and_reference_free_reachability_only_not_biological_fit');

assert.strictEqual(f.qualification_artifact.artifact_id,10168383473);
assert.strictEqual(f.qualification_artifact.zip_size_bytes,6912);
assert.strictEqual(f.qualification_artifact.digest,'sha256:89faa80894fb75b40a6ce024c0c630d5d4be994eecc1a58dca5593463c46ef24');
assert.strictEqual(f.chromium_qualification.browser,'Google Chrome 152.0.7977.82');
assert.strictEqual(f.chromium_qualification.p4_browser_parity,true);
assert.strictEqual(f.chromium_qualification.threshold_boundary_off,true);
assert.strictEqual(f.chromium_qualification.global_positive_scale_invariance,false);
assert.strictEqual(f.chromium_qualification.canonical_app_smoke,true);
assert.strictEqual(f.chromium_qualification.p4_runtime_requested_by_canonical_app,false);
assert.strictEqual(f.chromium_qualification.forbidden_requests,0);
for(const k of ['response_target_request_detected','P2_runtime_request_detected','P3_runtime_request_detected','P4_response_estimation_request_detected','P4_estimator_request_detected','P1_P2_P3_P4_report_request_detected','reserved_ymaze_request_detected']) assert.strictEqual(f.chromium_qualification[k],false,k);

assert.deepStrictEqual(r.engineering_values,{sigma_field_mm:8,kappa_trail_per_s:4,theta_detect:0.25,sector_radius_mm:10,radial_bins:4,angular_bins_per_sector:8,samples_per_sector:32});
assert.strictEqual(f.engineering_values.parameter_status,'engineering_only_not_fitted_not_biological_estimates_not_promoted');
assert.strictEqual(r.identity_panel.length,8);
for(const row of r.identity_panel){assert.strictEqual(row.zero_dose_canonical_identity,true);assert.strictEqual(row.zero_kappa_canonical_identity,true);assert.strictEqual(row.global_subthreshold_canonical_identity,true);assert(row.low_dose_evaluations>0);}
assert.deepStrictEqual(f.identity_result.low_dose_evaluations_by_seed,Object.fromEntries(r.identity_panel.map(x=>[String(x.seed),x.low_dose_evaluations])));
for(const v of Object.values(r.invariance_panel))assert.strictEqual(v,true);
for(const v of Object.values(r.checks))assert.strictEqual(v,true);
assert.strictEqual(r.nominal_panel.trials,400);
assert.strictEqual(r.nominal_panel.all_trials_finite,true);
assert.strictEqual(r.nominal_panel.any_trial_with_detected_response,true);
assert.strictEqual(r.nominal_panel.any_trial_with_subthreshold_evaluation,true);
assert.strictEqual(r.nominal_panel.biology_rng_identical_at_construction,true);
for(const key of ['mean_central_zone_fraction','trail_axis_exit_rate','mean_moving_speed_mm_s','mean_time_to_exit_s','mean_evaluation_samples','mean_detected_samples','mean_subthreshold_samples','mean_nonzero_steering_samples'])assert.strictEqual(f.nominal_reference_free_result[key],r.nominal_panel[key],key);

for(const v of Object.values(r.reference_firewall))assert.strictEqual(v,false);
for(const v of Object.values(r.downstream_authorization))assert.strictEqual(v,false);
assert.strictEqual(f.qualification_conclusion.P4_runtime_matches_frozen_mechanism,true);
assert.strictEqual(f.qualification_conclusion.P4_reference_free_reachability_qualified,true);
assert.strictEqual(f.qualification_conclusion.biological_fit_evaluated,false);
assert.strictEqual(f.qualification_conclusion.biological_fit_claim_authorized,false);
assert.strictEqual(f.qualification_conclusion.engineering_parameter_triplet_promoted,false);
assert.strictEqual(f.qualification_conclusion.response_estimation_policy_authorized,false);
assert.strictEqual(f.qualification_conclusion.response_target_semantic_access_authorized,false);
assert.strictEqual(f.qualification_conclusion.reserved_Y_maze_unlock_authorized,false);
assert.strictEqual(f.rerun_and_retuning_rule.successful_result_is_valid,true);
assert.strictEqual(f.rerun_and_retuning_rule.routine_rerun_authorized,false);
assert.strictEqual(f.rerun_and_retuning_rule.retune_mechanism_from_reachability,false);
assert.strictEqual(f.rerun_and_retuning_rule.retune_engineering_values_from_reachability,false);
assert.match(f.next_gate,/separate P4 response-estimation policy/);
assert.match(f.next_gate,/Reserved Y-maze validation remains locked/);

const responsePolicyPresent=fs.existsSync(path.join(root,'hypotheses/p4_response_estimation_v1.json'));
if(responsePolicyPresent){
  assert.strictEqual(blob('hypotheses/p4_response_estimation_v1.json'),'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
  const p=read('hypotheses/p4_response_estimation_v1.json');
  assert.strictEqual(p.frozen_inputs.reachability_result_freeze.git_blob_sha,'f2074ae3157f22208ff98ebc620c00006549cab6');
  assert.strictEqual(p.frozen_inputs.reachability_report.git_blob_sha,'f6e77596eb25cc7bca3bf0dde1da712511a1d0d0');
  assert.strictEqual(p.estimator_implementation_gate.P4_estimator_exists_at_this_freeze,false);
  assert.strictEqual(p.estimator_implementation_gate.response_target_semantics_accessed_at_this_freeze,false);
  assert.strictEqual(p.estimator_implementation_gate.estimator_implementation_authorized_by_this_record,false);
  assert.strictEqual(p.global_firewall.reserved_Y_maze_access,false);
}
assert.strictEqual(fs.existsSync(path.join(root,'tools/run-p4-estimation.js')),false);

console.log('p4-reachability-result.test.js PASS '+JSON.stringify({freeze_blob:blob(freezePath),report_blob:blob(reportPath),report_sha256:sha256(reportPath),report_bytes:fs.statSync(path.join(root,reportPath)).size,official_run:34517794416,artifact:10168383473,chromium:'152.0.7977.82',trials:r.nominal_panel.trials,central_zone:r.nominal_panel.mean_central_zone_fraction,trail_axis:r.nominal_panel.trail_axis_exit_rate,implementation_qualified:true,biological_fit:false,later_response_policy_present:responsePolicyPresent,response_target:false,reserved_ymaze:false}));
