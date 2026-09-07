'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p1-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const auth=readJson(path.join(root,'hypotheses','p1_highres_authorization_v1.json'));
const qualification=readJson(path.join(root,'reports','p1_estimator_qualification_v1.json'));

assert.strictEqual(blob('hypotheses/p1_highres_authorization_v1.json'),'7e77c5b1b9a6de9d665ff2be55c0780cc7d24d9c');
assert.strictEqual(blob('reports/p1_estimator_qualification_v1.json'),'2f737a1e7059f023fa8acfa2a1f1bbc1e688ddb3');
assert.strictEqual(blob('tools/run-p1-estimation.js'),'a307e74e8ba2366e2546eebe1a7cccac69a3ff9a');
assert.strictEqual(blob('hypotheses/p1_response_estimation_v1.json'),'628d17f6eb69fd11216aff33d1356d184365aedd');

assert.strictEqual(auth.id,'P1_high_resolution_authorization_v1');
assert.strictEqual(auth.status,'qualified_estimator_authorized_for_frozen_high_resolution_response_search');
assert.strictEqual(auth.effective_when_merged_to_main,true);
assert.strictEqual(auth.high_resolution_response_search_authorized,true);
assert.strictEqual(auth.policy_git_blob_sha,'628d17f6eb69fd11216aff33d1356d184365aedd');
assert.strictEqual(auth.estimator_git_blob_sha,'a307e74e8ba2366e2546eebe1a7cccac69a3ff9a');
assert.strictEqual(auth.qualification_report.git_blob_sha,'2f737a1e7059f023fa8acfa2a1f1bbc1e688ddb3');
assert.strictEqual(auth.qualification_report.sha256,'6620ebc25729d540bef489bbf7748f2859f5eb4e3fb153428f428fb6ff1c779e');
assert.strictEqual(auth.qualification_report.status,'passed');
assert.strictEqual(auth.qualification_report.reference_outcomes_accessed,false);
assert.strictEqual(auth.qualification_report.response_target_semantics_loaded,false);
assert.strictEqual(auth.qualification_report.ymaze_accessed,false);

assert.strictEqual(qualification.status,'passed');
assert.strictEqual(qualification.scientific_evidence,false);
assert.strictEqual(qualification.reference_outcomes_accessed,false);
assert.strictEqual(qualification.response_target_semantics_loaded,false);
assert.strictEqual(qualification.response_target_hash_verified_only,true);
assert.strictEqual(qualification.ymaze_accessed,false);
assert.strictEqual(qualification.policy_git_blob_sha,auth.policy_git_blob_sha);
assert.strictEqual(qualification.estimator_git_blob_sha,auth.estimator_git_blob_sha);

const audit=auth.estimator_qualification_audit;
assert.strictEqual(audit.run_id,34058735013);
assert.strictEqual(audit.job_id,101555308225);
assert.strictEqual(audit.tested_head,'f733fede7cbd5bd0e9ee2d26f6d2914e438b0990');
assert.strictEqual(audit.clean_pr_head,'93b27f6aa684a4de5d07a0861bc4b786e1b6b9bf');
assert.strictEqual(audit.merged_main_commit,'143e2bd469a0e68b96d8c5f7ba6705e924fe353b');
assert.strictEqual(audit.artifact_id,9996776691);
assert.strictEqual(audit.artifact_digest,'sha256:75cbf626a1ed579aabfa1c9726612c1f27c85ba5fb5134e798116e8edb81a756');
assert.strictEqual(audit.chromium_parity_cases,8);
assert.strictEqual(audit.browser_exceptions,0);
assert.strictEqual(audit.console_errors,0);
assert.strictEqual(audit.response_target_requests,0);
assert.strictEqual(audit.ymaze_requests,0);
assert.strictEqual(audit.high_resolution_authorized_during_qualification,false);

const x=auth.authorized_frozen_execution;
assert.strictEqual(x.mode,'highres');
assert.strictEqual(x.output_file,'reports/p1_response_estimation_500x60_v1.json');
assert.strictEqual(x.physics_dt_s,0.02);
assert.strictEqual(x.folds,6);
assert.strictEqual(x.candidate_budget_per_fold_total,500);
assert.strictEqual(x.positive_halton_candidates_per_fold,499);
assert.strictEqual(x.exact_null_anchor_candidates_per_fold,1);
assert.strictEqual(x.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(x.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(x.root_fit_seed,2210000);
assert.strictEqual(x.root_evaluation_seed,2810000);
assert.strictEqual(x.final_all_data_training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(x.final_all_data_fit_seed,3210000);
assert.strictEqual(x.final_check_trials_per_treatment_path,240);
assert.strictEqual(x.final_check_seed,3610000);
assert.strictEqual(x.common_random_numbers,true);
assert.deepStrictEqual(x.primary_fit_observables,['middle_zone_fraction','trail_axis_exit']);
assert.deepStrictEqual(x.secondary_guard_observables,['time_to_exit_s','beeline_mm']);

assert.strictEqual(auth.canonical_promotion_authorized,false);
assert.strictEqual(auth.ymaze_access_authorized,false);
assert.strictEqual(auth.authorization_gate_hardening.main_branch_required,true);
assert.match(auth.official_execution_rule,/exactly one official execution/i);
assert.match(auth.post_result_rule,/Failure cannot be rescued/i);
assert.match(auth.post_merge_execution_precondition,/permanent main test\/deploy workflow succeeds/);

assert.throws(()=>est.assertHighResolutionAuthorized(root,null,{branchName:'v0.3.3f-p1-highres-authorization'}),/not effective until merged to main/);
const active=est.assertHighResolutionAuthorized(root,null,{branchName:'main'});
assert.strictEqual(active.id,auth.id);

const source=fs.readFileSync(path.join(root,'tools','run-p1-estimation.js'),'utf8');
const preflightPos=source.indexOf('const preflight=highResolutionPreflight');
const targetLoadPos=source.indexOf('const target=loadReferenceTarget');
assert(preflightPos>=0&&targetLoadPos>preflightPos,'authorization must be checked before target semantics are loaded');

console.log('p1-highres-authorization.test.js PASS '+JSON.stringify({
  authorization_blob:blob('hypotheses/p1_highres_authorization_v1.json'),
  qualification_blob:blob('reports/p1_estimator_qualification_v1.json'),
  estimator_blob:blob('tools/run-p1-estimation.js'),
  branch_effective:false,
  main_effective:true,
  canonical_promotion:false,
  ymaze_access:false
}));
