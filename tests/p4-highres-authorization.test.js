'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const run=require('../tools/run-p4-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_highres_authorization_v1.json';
assert.strictEqual(blob(rel),'d8088ab94480faf0f5db012ca538bdc4d5a42ccb');
const a=readJson(path.join(root,rel));
assert.strictEqual(a.id,'P4_high_resolution_authorization_v1');
assert.strictEqual(a.status,'qualified_estimator_authorized_for_frozen_high_resolution_response_search');
assert.strictEqual(a.authorization_date_local,'2026-09-10');
assert.strictEqual(a.effective_when_merged_to_main,true);
assert.strictEqual(a.high_resolution_response_search_authorized,true);

assert.strictEqual(a.policy_git_blob_sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(a.estimator_git_blob_sha,'e57b554c0ad56a0034f4f79ec8090d3e863e3d11');
assert.strictEqual(a.estimator_core_git_blob_sha,'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
assert.strictEqual(a.estimator_implementation_authorization.git_blob_sha,'e8f26731412d8693a5596da4374de932745b9392');
assert.strictEqual(a.qualification_report.git_blob_sha,'33cf1216ade03b0f25ddf643cdc28fd5c3df0010');
assert.strictEqual(a.qualification_report.sha256,'ab72e961e3ff33c4861cc36dbfe3e486585525fa5ebe6fb0fa16d911b1444890');
assert.strictEqual(a.qualification_report.bytes,3893);
assert.strictEqual(a.qualification_report.qualified_checks_passed,25);
assert.strictEqual(a.browser_firewall_report.git_blob_sha,'8ae7c0f8940502c64e720b5abafde4fc094a255c');
assert.strictEqual(a.browser_firewall_report.sha256,'2fa2b2860d4cd311b68861acd9bebe471100542e0666103483ed841278c2684f');
assert.strictEqual(a.browser_firewall_report.bytes,5517);
assert.strictEqual(a.browser_firewall_report.P4_browser_parity_cases,10);
assert.strictEqual(a.browser_firewall_report.canonical_forbidden_requests,0);
assert.strictEqual(a.qualification_result_freeze.git_blob_sha,'635b64ff1bfe08f6f914e5fd8bef8306ee0b27d5');

assert.strictEqual(blob(a.policy_file),a.policy_git_blob_sha);
assert.strictEqual(blob(a.estimator_file),a.estimator_git_blob_sha);
assert.strictEqual(blob(a.estimator_core_file),a.estimator_core_git_blob_sha);
assert.strictEqual(blob(a.estimator_implementation_authorization.file),a.estimator_implementation_authorization.git_blob_sha);
assert.strictEqual(blob(a.qualification_report.file),a.qualification_report.git_blob_sha);
assert.strictEqual(blob(a.browser_firewall_report.file),a.browser_firewall_report.git_blob_sha);
assert.strictEqual(blob(a.qualification_result_freeze.file),a.qualification_result_freeze.git_blob_sha);

const m=a.merged_estimator_checkpoint;
assert.strictEqual(m.main_commit,'16d519903a17287f88bc3859e6da9a1301d870fd');
assert.strictEqual(m.permanent_main_workflow_run_id,34567621338);
assert.strictEqual(m.permanent_main_workflow_run_number,160);
assert.strictEqual(m.permanent_main_test_job_id,103162857052);
assert.strictEqual(m.permanent_main_test_job_conclusion,'success');
assert.strictEqual(m.permanent_main_deploy_job_id,103162975862);
assert.strictEqual(m.permanent_main_deploy_job_conclusion,'success');

const x=a.authorized_frozen_execution;
assert.strictEqual(x.required_cli,'node tools/run-p4-estimation.js --mode highres --out reports/p4_response_estimation_2000x60_v1.json');
assert.strictEqual(x.output_file,'reports/p4_response_estimation_2000x60_v1.json');
assert.strictEqual(x.physics_dt_s,.02);
assert.strictEqual(x.folds,6);
assert.deepStrictEqual(x.colonies,[0,7,16,20,21,27]);
assert.strictEqual(x.P4_candidate_budget_per_fold_total,2000);
assert.strictEqual(x.positive_P4_halton_candidates_per_fold,1999);
assert.strictEqual(x.exact_canonical_null_candidates_per_fold,1);
assert.strictEqual(x.ungated_P3_structural_benchmark_candidate_budget_per_fold_total,2000);
assert.strictEqual(x.positive_ungated_P3_structural_benchmark_candidates_per_fold,1999);
assert.strictEqual(x.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(x.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(x.root_fit_seed,8210000);
assert.strictEqual(x.root_evaluation_seed,8810000);
assert.strictEqual(x.final_all_data_training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(x.final_all_data_fit_seed,9210000);
assert.strictEqual(x.final_check_trials_per_treatment_path,240);
assert.strictEqual(x.final_check_seed,9610000);
assert.strictEqual(x.short_path_seed_offset,0);
assert.strictEqual(x.long_path_seed_offset,1000);
assert.strictEqual(x.common_random_numbers,true);
assert.strictEqual(x.response_rng,'none');
assert.deepStrictEqual(x.estimated_parameters,['sigma_field_mm','kappa_trail_per_s','theta_detect']);
assert.deepStrictEqual(x.parameter_bounds.sigma_field_mm,[2,32]);
assert.deepStrictEqual(x.parameter_bounds.kappa_trail_per_s,[0,16]);
assert.deepStrictEqual(x.parameter_bounds.theta_detect,[0,2]);
assert.deepStrictEqual(x.halton_mapping.map(v=>v.prime),[2,3,5]);
assert.deepStrictEqual(x.halton_mapping.map(v=>v.parameter),['sigma_field_mm','kappa_trail_per_s','theta_detect']);
assert.deepStrictEqual(x.exact_canonical_null,{sigma_field_mm:8,kappa_trail_per_s:0,theta_detect:.25});
assert.match(x.ungated_P3_structural_benchmark_rule,/same sigma_field_mm and kappa_trail_per_s coordinates/i);
assert.match(x.canonical_null_survival_guard,/at least 5 of 6/i);
assert.match(x.structural_increment_survival_guard,/at least 5 of 6/i);
assert.match(x.dual_survival_rule,/Both held-out survival guards must pass/i);
assert.match(x.identifiability_rule,/sigma, kappa, and theta/i);
assert.match(x.final_increment_rule,/strictly lower than both selected ungated P3 benchmark/i);
assert.match(x.final_fit_rule,/only if both LOCO survival guards pass/i);

assert.deepStrictEqual(a.allowed_terminal_statuses,[
  'development_response_estimation_failed_dual_primary_survival_guard',
  'development_response_estimation_survived_but_parameter_triplet_not_eligible',
  'development_response_estimation_passed_and_parameter_triplet_eligible_for_future_freeze'
]);
assert.match(a.official_execution_rule,/exactly one official execution/i);
assert.match(a.official_execution_rule,/separate one-shot execution-precondition/i);
assert.match(a.post_result_rule,/Freeze and record the complete P4 scientific result/i);
assert.strictEqual(a.response_target_semantic_access_authorized,true);
assert.match(a.response_target_semantic_access_scope,/separate execution-precondition gate/i);
assert.strictEqual(a.P3_runtime_structural_comparator_access_authorized,true);
assert.strictEqual(a.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(a.P2_official_result_semantic_access_authorized,false);
assert.strictEqual(a.P3_official_result_semantic_access_authorized,false);
assert.strictEqual(a.P1_P2_P3_rerun_or_refit_authorized,false);
assert.strictEqual(a.canonical_promotion_authorized,false);
assert.strictEqual(a.H2_H3_H4_H5_refit_or_combination_authorized,false);
assert.strictEqual(a.cross_apparatus_validation_authorized,false);
assert.strictEqual(a.ymaze_access_authorized,false);

const policy=readJson(path.join(root,'hypotheses/p4_response_estimation_v1.json'));
assert.throws(()=>run.assertHighResolutionAuthorized(root,policy,{branchName:'authorization-review'}),/not effective until merged to main/);
assert.throws(()=>run.loadReferenceTarget(root,policy,{branchName:'authorization-review'}),/not effective until merged to main/);
assert.strictEqual(run.assertAuthorizationEffective(a,root,{branchName:'main'}),'main');
const laterExecutionPreconditionPresent=fs.existsSync(path.join(root,'hypotheses/p4_highres_execution_precondition_v1.json'));
if(laterExecutionPreconditionPresent){
  assert.strictEqual(blob('hypotheses/p4_highres_execution_precondition_v1.json'),'313f2892a5627195b1319911a87cdfe7884337ae');
  const p=readJson(path.join(root,'hypotheses/p4_highres_execution_precondition_v1.json'));
  assert.strictEqual(p.authorization_git_blob_sha,'d8088ab94480faf0f5db012ca538bdc4d5a42ccb');
  assert.strictEqual(p.authorization_main_commit,'c5f8f2c7e8e9efbbe5393777aeada695a712a05b');
  assert.strictEqual(p.permanent_main_workflow.run_id,34568453092);
  assert.strictEqual(p.permanent_main_workflow.test_job_id,103165280046);
  assert.strictEqual(p.permanent_main_workflow.deploy_job_id,103165436328);
  assert.strictEqual(p.official_execution_still_unrun_at_freeze,true);
}
assert.strictEqual(fs.existsSync(path.join(root,'reports/p4_response_estimation_2000x60_v1.json')),false,'official P4 scientific result must not exist at authorization/execution-gate stage');

console.log('p4-highres-authorization.test.js PASS '+JSON.stringify({authorization_blob:blob(rel),effective_on_branch:false,effective_when_merged_to_main:true,candidates:2000,benchmark_candidates:2000,target_semantics_scope:'post-main-plus-precondition',later_execution_precondition_present:laterExecutionPreconditionPresent,P1_result_semantics:false,P2_result_semantics:false,P3_result_semantics:false,ymaze:false}));
