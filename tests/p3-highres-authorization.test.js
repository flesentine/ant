'use strict';

const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const run=require('../tools/run-p3-estimation.js');
const {readJson}=require('../tools/load-bundle.js');

const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const rel='hypotheses/p3_highres_authorization_v1.json';
const a=readJson(path.join(root,rel));

assert.strictEqual(blob(rel),'04d2c7b454143fd7073b274bff0ec9b355ec058d');
assert.strictEqual(a.id,'P3_high_resolution_authorization_v1');
assert.strictEqual(a.status,'qualified_estimator_authorized_for_frozen_high_resolution_response_search');
assert.strictEqual(a.authorization_date_local,'2026-09-08');
assert.strictEqual(a.effective_when_merged_to_main,true);
assert.strictEqual(a.high_resolution_response_search_authorized,true);

assert.strictEqual(a.policy_file,'hypotheses/p3_response_estimation_v1.json');
assert.strictEqual(a.policy_git_blob_sha,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(a.estimator_file,'tools/run-p3-estimation.js');
assert.strictEqual(a.estimator_git_blob_sha,'5bf27bf439dca18629cdfd36f56fe767a23062ff');
assert.strictEqual(a.estimator_core_file,'tools/p3-estimation-core.js');
assert.strictEqual(a.estimator_core_git_blob_sha,'410ef81dfe761e3c218d072ca311632329ac1617');

assert.strictEqual(a.qualification_report.git_blob_sha,'63e1d7360bc1ef4b232bbf37f347b9fa27e7d461');
assert.strictEqual(a.qualification_report.sha256,'4912618de22e74d67197529bb6625c850bfa8912bcf55e99280732dbcc64e604');
assert.strictEqual(a.qualification_report.bytes,3508);
assert.strictEqual(a.qualification_report.status,'passed');
assert.strictEqual(a.qualification_report.scientific_evidence,false);
assert.strictEqual(a.qualification_report.reference_outcomes_accessed,false);
assert.strictEqual(a.qualification_report.response_target_semantics_loaded,false);
assert.strictEqual(a.qualification_report.response_target_hash_verified_only,true);
assert.strictEqual(a.qualification_report.P1_official_result_semantics_loaded,false);
assert.strictEqual(a.qualification_report.P2_official_result_semantics_loaded,false);
assert.strictEqual(a.qualification_report.ymaze_accessed,false);
assert.strictEqual(a.qualification_report.qualified_checks_passed,22);
assert.strictEqual(a.qualification_result_freeze.git_blob_sha,'32d90d05add5b4e45dd69c711b416ed3378d15ab');

assert.strictEqual(a.estimator_qualification_audit.first_successful_run_id,34289538716);
assert.strictEqual(a.estimator_qualification_audit.first_successful_job_id,102272761530);
assert.strictEqual(a.estimator_qualification_audit.first_successful_tested_head,'7dae80bff4cab045c4f9277f2c3c4c75d370d7f0');
assert.strictEqual(a.estimator_qualification_audit.first_successful_artifact_id,10080797145);
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_run_id,34289781728);
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_job_id,102273536066);
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_tested_head,'d45c0dfa529f738db7b73a34f8176e9e6de58f87');
assert.strictEqual(a.estimator_qualification_audit.final_freeze_aware_artifact_id,10080885990);
assert.strictEqual(a.estimator_qualification_audit.full_regression_suite,'passed');
assert.strictEqual(a.estimator_qualification_audit.standalone_reference_free_qualification,'passed');
assert.strictEqual(a.estimator_qualification_audit.qualification_checks_passed,22);
assert.strictEqual(a.estimator_qualification_audit.unauthorized_highres_rejected_before_target_parsing,true);
assert.strictEqual(a.estimator_qualification_audit.chromium_parity_cases,10);
for(const k of ['browser_exceptions','console_errors','response_target_requests','P1_official_result_requests','P2_official_result_requests','ymaze_requests','authorization_requests'])
  assert.strictEqual(a.estimator_qualification_audit[k],0,k+' must remain zero');

assert.deepStrictEqual(a.merged_estimator_checkpoint,{
  main_commit:'b7553cf64b1ebe1a3ee4895ce4cf63b9c579a635',
  permanent_main_workflow_run_id:34289965059,
  permanent_main_workflow_run_number:148,
  permanent_main_test_job_id:102274091654,
  permanent_main_test_job_conclusion:'success',
  permanent_main_deploy_job_id:102274263257,
  permanent_main_deploy_job_conclusion:'success',
  conclusion:'success'
});

assert.strictEqual(blob('hypotheses/p3_response_estimation_v1.json'),a.policy_git_blob_sha);
assert.strictEqual(blob('tools/run-p3-estimation.js'),a.estimator_git_blob_sha);
assert.strictEqual(blob('tools/p3-estimation-core.js'),a.estimator_core_git_blob_sha);
assert.strictEqual(blob('reports/p3_estimator_qualification_v1.json'),a.qualification_report.git_blob_sha);
assert.strictEqual(blob('hypotheses/p3_estimator_qualification_result_freeze_v1.json'),a.qualification_result_freeze.git_blob_sha);
assert.strictEqual(blob('src/p3.js'),a.frozen_input_chain.p3_runtime_git_blob_sha);
assert.strictEqual(blob('models/lasius_niger_painted_trail_p3_v1.json'),a.frozen_input_chain.p3_engineering_model_git_blob_sha);
assert.strictEqual(blob('src/p1.js'),a.frozen_input_chain.p1_structural_comparator_runtime_git_blob_sha);
assert.strictEqual(blob('hypotheses/p1_response_estimation_result_freeze_v1.json'),a.frozen_input_chain.p1_official_result_freeze_git_blob_sha_hash_only);
assert.strictEqual(blob('hypotheses/p2_response_estimation_result_freeze_v1.json'),a.frozen_input_chain.p2_official_result_freeze_git_blob_sha_hash_only);
assert.strictEqual(blob('reference/poissonnier2026_pheromone_response_targets.json'),a.frozen_input_chain.response_target_git_blob_sha);

const e=a.authorized_frozen_execution;
assert.strictEqual(e.mode,'highres');
assert.strictEqual(e.required_cli,'node tools/run-p3-estimation.js --mode highres --out reports/p3_response_estimation_1000x60_v1.json');
assert.strictEqual(e.output_file,'reports/p3_response_estimation_1000x60_v1.json');
assert.strictEqual(e.physics_dt_s,0.02);
assert.strictEqual(e.folds,6);
assert.deepStrictEqual(e.colonies,[0,7,16,20,21,27]);
assert.strictEqual(e.P3_candidate_budget_per_fold_total,1000);
assert.strictEqual(e.positive_P3_halton_candidates_per_fold,999);
assert.strictEqual(e.exact_canonical_null_candidates_per_fold,1);
assert.strictEqual(e.absolute_transduction_benchmark_candidate_budget_per_fold_total,1000);
assert.strictEqual(e.positive_absolute_transduction_candidates_per_fold,999);
assert.strictEqual(e.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(e.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(e.root_fit_seed,6210000);
assert.strictEqual(e.root_evaluation_seed,6810000);
assert.strictEqual(e.final_all_data_training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(e.final_all_data_fit_seed,7210000);
assert.strictEqual(e.final_check_trials_per_treatment_path,240);
assert.strictEqual(e.final_check_seed,7610000);
assert.strictEqual(e.short_path_seed_offset,0);
assert.strictEqual(e.long_path_seed_offset,1000);
assert.strictEqual(e.common_random_numbers,true);
assert.strictEqual(e.response_rng,'none');
assert.deepStrictEqual(e.estimated_parameters,['sigma_field_mm','kappa_trail_per_s']);
assert.deepStrictEqual(e.parameter_bounds,{sigma_field_mm:[2,32],kappa_trail_per_s:[0,16]});
assert.deepStrictEqual(e.exact_canonical_null,{sigma_field_mm:8,kappa_trail_per_s:0});
assert.match(e.absolute_transduction_benchmark_rule,/same sigma_field_mm and kappa_trail_per_s coordinates/);
assert.match(e.absolute_transduction_benchmark_rule,/structural comparator, not a P1 rerun/);
assert.match(e.canonical_null_survival_guard,/at least 5 of 6/);
assert.match(e.structural_increment_survival_guard,/at least 5 of 6/);
assert.match(e.dual_survival_rule,/Both heldout survival guards must pass/);
assert.match(e.identifiability_rule,/0\.02/);
assert.match(e.identifiability_rule,/0\.60/);
assert.match(e.final_increment_rule,/both selected absolute-transduction benchmark primary loss and exact canonical-null primary loss/);

assert.strictEqual(a.response_target_semantic_access_authorized,true);
assert.strictEqual(a.P1_runtime_structural_comparator_access_authorized,true);
assert.strictEqual(a.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(a.P2_official_result_semantic_access_authorized,false);
assert.strictEqual(a.P2_lapse_structure_authorized,false);
assert.strictEqual(a.canonical_promotion_authorized,false);
assert.strictEqual(a.H2_H3_H4_H5_refit_or_combination_authorized,false);
assert.strictEqual(a.ymaze_access_authorized,false);
assert.match(a.official_execution_rule,/exactly one official execution/i);
assert.match(a.post_result_rule,/Freeze and record the complete P3 result/i);

assert.throws(()=>run.assertHighResolutionAuthorized(root,null,{branchName:'v0.3.3v-p3-highres-authorization'}),/not effective until merged to main/);
assert.throws(()=>run.loadReferenceTarget(root,readJson(path.join(root,'hypotheses','p3_response_estimation_v1.json')),{branchName:'authorization-review'}),/not effective until merged to main/);
const effective=run.assertHighResolutionAuthorized(root,null,{branchName:'main'});
assert.strictEqual(effective.id,a.id);

assert.ok(!fs.existsSync(path.join(root,'reports','p3_response_estimation_1000x60_v1.json')),'authorization PR must not execute or materialize the high-resolution result');

console.log('p3-highres-authorization.test.js PASS '+JSON.stringify({
  authorization_blob:blob(rel),
  estimator_blob:a.estimator_git_blob_sha,
  core_blob:a.estimator_core_git_blob_sha,
  merged_estimator_main:a.merged_estimator_checkpoint.main_commit,
  permanent_main_run:a.merged_estimator_checkpoint.permanent_main_workflow_run_id,
  review_branch_effective:false,
  response_target_semantics_authorized_after_main_gate:true,
  P1_runtime_structural_comparator:true,
  P1_result_semantics:false,
  P2_result_semantics:false,
  canonical_promotion:false,
  ymaze:false,
  official_execution_started:false
}));
