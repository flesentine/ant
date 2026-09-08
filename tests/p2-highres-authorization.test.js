'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p2-estimation.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p2_highres_authorization_v1.json';
const a=read(rel);

assert.strictEqual(blob(rel),'de361b15b9600bd92a35baf30fa71c2a7c61003c');
assert.strictEqual(a.id,'P2_high_resolution_authorization_v1');
assert.strictEqual(a.status,'qualified_estimator_authorized_for_frozen_high_resolution_response_search');
assert.strictEqual(a.authorization_date_local,'2026-09-07');
assert.strictEqual(a.effective_when_merged_to_main,true);
assert.strictEqual(a.high_resolution_response_search_authorized,true);
assert.strictEqual(a.policy_file,'hypotheses/p2_response_estimation_v1.json');
assert.strictEqual(a.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(a.estimator_file,'tools/run-p2-estimation.js');
assert.strictEqual(a.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');

assert.strictEqual(a.qualification_report.file,'reports/p2_estimator_qualification_v1.json');
assert.strictEqual(a.qualification_report.git_blob_sha,'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(a.qualification_report.sha256,'22cd65ffbf3adbfd88fb3998ba4ab41e142b52b2b19d8aa2460ab2d9c42596a2');
assert.strictEqual(a.qualification_report.bytes,2902);
assert.strictEqual(a.qualification_report.status,'passed');
assert.strictEqual(a.qualification_report.reference_outcomes_accessed,false);
assert.strictEqual(a.qualification_report.response_target_semantics_loaded,false);
assert.strictEqual(a.qualification_report.response_target_hash_verified_only,true);
assert.strictEqual(a.qualification_report.P1_official_result_semantics_loaded,false);
assert.strictEqual(a.qualification_report.ymaze_accessed,false);
assert.strictEqual(a.qualification_report.qualified_checks_passed,20);

assert.strictEqual(a.qualification_result_freeze.git_blob_sha,'1d46b594cb154a93c2e321fb67d399acdd821993');
assert.strictEqual(a.estimator_qualification_audit.first_successful_run_id,34091953598);
assert.strictEqual(a.estimator_qualification_audit.first_successful_job_id,101647130672);
assert.strictEqual(a.estimator_qualification_audit.first_successful_artifact_id,10007145009);
assert.strictEqual(a.estimator_qualification_audit.first_successful_artifact_digest,'sha256:05e0f6a95c0059efc27955c00ebf5e429cd7561fe5412d20c900d4fdc64b9137');
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_run_id,34092227661);
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_job_id,101647956534);
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_artifact_id,10007242762);
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_artifact_digest,'sha256:c4fe52778a33b94df8bb66ebe240ec3a536beb7600d5fa7311b46ec10329c533');
assert.strictEqual(a.estimator_qualification_audit.qualification_checks_passed,20);
assert.strictEqual(a.estimator_qualification_audit.unauthorized_highres_rejected_before_target_parsing,true);
assert.strictEqual(a.estimator_qualification_audit.unauthorized_highres_report_written,false);
assert.strictEqual(a.estimator_qualification_audit.chromium_parity_cases,10);
assert.strictEqual(a.estimator_qualification_audit.response_target_requests,0);
assert.strictEqual(a.estimator_qualification_audit.ymaze_requests,0);

assert.strictEqual(a.merged_estimator_checkpoint.main_commit,'0f105420d5503a974ae42a099ca026276851563a');
assert.strictEqual(a.merged_estimator_checkpoint.permanent_main_workflow_run_id,34092350444);
assert.strictEqual(a.merged_estimator_checkpoint.permanent_main_test_job_id,101648326342);
assert.strictEqual(a.merged_estimator_checkpoint.permanent_main_deploy_job_id,101648482683);
assert.strictEqual(a.merged_estimator_checkpoint.conclusion,'success');

assert.strictEqual(a.frozen_input_chain.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(a.frozen_input_chain.response_target_rows,102);
assert.strictEqual(a.frozen_input_chain.p2_runtime_git_blob_sha,'f91a2f7ede1b8119acc1fd57ac94a9718d074e15');
assert.strictEqual(a.frozen_input_chain.p2_engineering_model_git_blob_sha,'7d3eecc44cb2eaf727249083a6fcfa21986fd475');
assert.strictEqual(a.frozen_input_chain.p1_closure_git_blob_sha,'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(a.frozen_input_chain.canonical_model_git_blob_sha,'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');

const x=a.authorized_frozen_execution;
assert.strictEqual(x.mode,'highres');
assert.strictEqual(x.required_cli,'node tools/run-p2-estimation.js --mode highres --out reports/p2_response_estimation_1000x60_v1.json');
assert.strictEqual(x.output_file,'reports/p2_response_estimation_1000x60_v1.json');
assert.strictEqual(x.physics_dt_s,.02);
assert.strictEqual(x.folds,6);
assert.strictEqual(x.P2_candidate_budget_per_fold_total,1000);
assert.strictEqual(x.positive_P2_halton_candidates_per_fold,999);
assert.strictEqual(x.exact_canonical_null_candidates_per_fold,1);
assert.strictEqual(x.no_lapse_benchmark_candidate_budget_per_fold_total,1000);
assert.strictEqual(x.projected_no_lapse_candidates_per_fold,999);
assert.strictEqual(x.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(x.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(x.root_fit_seed,4210000);
assert.strictEqual(x.root_evaluation_seed,4810000);
assert.strictEqual(x.final_all_data_training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(x.final_all_data_fit_seed,5210000);
assert.strictEqual(x.final_check_trials_per_treatment_path,240);
assert.strictEqual(x.final_check_seed,5610000);
assert.deepStrictEqual(x.estimated_parameters,['sigma_field_mm','kappa_trail_per_s','p_lapse']);
assert.deepStrictEqual(x.parameter_bounds,{sigma_field_mm:[2,32],kappa_trail_per_s:[0,16],p_lapse:[0,1]});
assert.deepStrictEqual(x.halton_mapping.map(v=>[v.prime,v.parameter]),[[2,'sigma_field_mm'],[3,'kappa_trail_per_s'],[5,'p_lapse']]);
assert.deepStrictEqual(x.exact_canonical_null,{sigma_field_mm:8,kappa_trail_per_s:0,p_lapse:.2});
assert.match(x.projected_no_lapse_rule,/force p_lapse=0/);
assert.match(x.canonical_null_survival_guard,/at least 5 of 6/);
assert.match(x.structural_increment_survival_guard,/at least 5 of 6/);
assert.match(x.dual_survival_rule,/Both heldout survival guards must pass/);
assert.match(x.final_increment_rule,/strictly lower than both/);

assert.strictEqual(a.response_target_semantic_access_authorized,true);
assert.match(a.response_target_semantic_access_scope,/exact qualified estimator high-resolution code path/i);
assert.strictEqual(a.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(a.canonical_promotion_authorized,false);
assert.strictEqual(a.Candidate_B_authorized,false);
assert.strictEqual(a.ymaze_access_authorized,false);
assert.strictEqual(a.authorization_gate_hardening.main_branch_required,true);
assert.strictEqual(a.authorization_gate_hardening.review_branch_highres_must_reject,true);
assert.strictEqual(a.authorization_pr_base_main_commit,'0f105420d5503a974ae42a099ca026276851563a');
assert.match(a.post_merge_execution_precondition,/separate one-shot main-only execution gate/i);

assert.strictEqual(est.assertHighResolutionAuthorized(root,null,{branchName:'main'}).id,'P2_high_resolution_authorization_v1');
assert.throws(()=>est.assertHighResolutionAuthorized(root,null,{branchName:'v0.3.3n-p2-highres-authorization'}),/not effective until merged to main/);
assert.throws(()=>est.loadReferenceTarget(root,read('hypotheses/p2_response_estimation_v1.json'),{branchName:'v0.3.3n-p2-highres-authorization'}),/not effective until merged to main/);

for(const forbidden of ['--candidates','--trials','--eval-trials','--seed','--final-trials','--final-seed','--dt'])
  assert(a.execution_firewall.some(v=>v.includes(forbidden)),forbidden+' override firewall missing');

assert.ok(!fs.existsSync(path.join(root,'reports','p2_response_estimation_1000x60_v1.json')),'official P2 highres report must not exist in authorization PR');

console.log('p2-highres-authorization.test.js PASS '+JSON.stringify({
  authorization_blob:blob(rel),
  policy_blob:a.policy_git_blob_sha,
  estimator_blob:a.estimator_git_blob_sha,
  qualification_blob:a.qualification_report.git_blob_sha,
  effective_on_main:true,
  review_branch_rejected:true,
  highres_executed:false,
  P1_result_semantics:false,
  candidate_B:false,
  ymaze:false
}));
