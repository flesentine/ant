'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const PRE='hypotheses/p3_highres_execution_precondition_v1.json';
const AUTH='hypotheses/p3_highres_authorization_v1.json';
const WF='.github/workflows/p3-v033w-official-highres.yml';
const p=read(PRE),a=read(AUTH),w=text(WF);

assert.strictEqual(blob(PRE),'9204d206c454891febdf64a94af48e4235cee326');
assert.strictEqual(blob(AUTH),'04d2c7b454143fd7073b274bff0ec9b355ec058d');
assert.strictEqual(blob(WF),'2f84786d5780f0fe4dce7cafdbe92ae399ccd768');

assert.strictEqual(p.id,'P3_high_resolution_execution_precondition_v1');
assert.strictEqual(p.status,'authorization_merged_and_permanent_main_ci_green_before_official_execution');
assert.strictEqual(p.authorization_main_commit,'747866d75fb433baf1423552274417ae9445e917');
assert.strictEqual(p.authorization_git_blob_sha,blob(AUTH));
assert.strictEqual(p.policy_git_blob_sha,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(p.estimator_git_blob_sha,'5bf27bf439dca18629cdfd36f56fe767a23062ff');
assert.strictEqual(p.estimator_core_git_blob_sha,'410ef81dfe761e3c218d072ca311632329ac1617');
assert.strictEqual(p.qualification_report_git_blob_sha,'63e1d7360bc1ef4b232bbf37f347b9fa27e7d461');
assert.strictEqual(p.qualification_result_freeze_git_blob_sha,'32d90d05add5b4e45dd69c711b416ed3378d15ab');
assert.strictEqual(p.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(p.p3_runtime_git_blob_sha,'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(p.p3_model_git_blob_sha,'9107de0c71641c4037bbedbb498b9fa868c1ef00');
assert.strictEqual(p.p1_structural_comparator_runtime_git_blob_sha,'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(p.apparatus_git_blob_sha,'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4');
assert.strictEqual(p.p3_zero_experiment_git_blob_sha,'f2a97691e604bbb086216221da1c776cc74e9dbb');
assert.strictEqual(p.p3_nominal_experiment_git_blob_sha,'e3c3d7c4c58c885b99654e8797b8570ef91f7cde');
assert.strictEqual(p.canonical_locomotion_git_blob_sha,'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');
assert.strictEqual(p.sim_core_git_blob_sha,'24777aac3577d442893e4779d70aee4e27761fe8');
assert.strictEqual(p.integrity_runtime_git_blob_sha,'f23c68a6955832b70eeb3bd3e6893d71a3759018');
assert.strictEqual(p.load_bundle_git_blob_sha,'235067f10ed85eeeaebcfe6fef0963940d516b6b');
assert.strictEqual(p.execution_workflow_file,WF);
assert.strictEqual(p.execution_workflow_git_blob_sha,blob(WF));

assert.strictEqual(p.permanent_main_workflow.main_commit,p.authorization_main_commit);
assert.strictEqual(p.permanent_main_workflow.run_id,34299582530);
assert.strictEqual(p.permanent_main_workflow.run_number,149);
assert.strictEqual(p.permanent_main_workflow.conclusion,'success');
assert.strictEqual(p.permanent_main_workflow.test_job_id,102303449269);
assert.strictEqual(p.permanent_main_workflow.test_job_conclusion,'success');
assert.strictEqual(p.permanent_main_workflow.deploy_job_id,102303617940);
assert.strictEqual(p.permanent_main_workflow.deploy_job_conclusion,'success');

assert.strictEqual(a.id,'P3_high_resolution_authorization_v1');
assert.strictEqual(a.effective_when_merged_to_main,true);
assert.strictEqual(a.high_resolution_response_search_authorized,true);
assert.strictEqual(a.response_target_semantic_access_authorized,true);
assert.strictEqual(a.P1_runtime_structural_comparator_access_authorized,true);
assert.strictEqual(a.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(a.P2_official_result_semantic_access_authorized,false);
assert.strictEqual(a.P2_lapse_structure_authorized,false);
assert.strictEqual(a.canonical_promotion_authorized,false);
assert.strictEqual(a.H2_H3_H4_H5_refit_or_combination_authorized,false);
assert.strictEqual(a.ymaze_access_authorized,false);

assert.strictEqual(p.official_execution_still_unrun_at_freeze,true);
assert.strictEqual(p.authorized_command_exact,'node tools/run-p3-estimation.js --mode highres --out reports/p3_response_estimation_1000x60_v1.json');
assert.deepStrictEqual(p.cli_parameter_overrides,[]);
assert.deepStrictEqual(p.frozen_search.colonies,[0,7,16,20,21,27]);
assert.strictEqual(p.frozen_search.folds,6);
assert.strictEqual(p.frozen_search.P3_candidates_per_fold_total,1000);
assert.strictEqual(p.frozen_search.positive_P3_halton_candidates_per_fold,999);
assert.strictEqual(p.frozen_search.exact_canonical_null_candidates_per_fold,1);
assert.strictEqual(p.frozen_search.absolute_benchmark_candidates_per_fold_total,1000);
assert.strictEqual(p.frozen_search.positive_absolute_benchmark_candidates_per_fold,999);
assert.strictEqual(p.frozen_search.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(p.frozen_search.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(p.frozen_search.root_fit_seed,6210000);
assert.strictEqual(p.frozen_search.root_evaluation_seed,6810000);
assert.strictEqual(p.frozen_search.final_all_data_training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(p.frozen_search.final_all_data_fit_seed,7210000);
assert.strictEqual(p.frozen_search.final_check_trials_per_treatment_path,240);
assert.strictEqual(p.frozen_search.final_check_seed,7610000);
assert.strictEqual(p.frozen_search.physics_dt_s,0.02);
assert.strictEqual(p.frozen_search.common_random_numbers,true);
assert.strictEqual(p.frozen_search.response_rng,'none');

assert.strictEqual(p.P1_runtime_structural_comparator_access_authorized,true);
assert.strictEqual(p.response_target_semantic_access_authorized,true);
assert.strictEqual(p.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(p.P2_official_result_semantic_access_authorized,false);
assert.strictEqual(p.P2_lapse_structure_authorized,false);
assert.strictEqual(p.canonical_promotion_authorized,false);
assert.strictEqual(p.H2_H3_H4_H5_refit_or_combination_authorized,false);
assert.strictEqual(p.ymaze_access_authorized,false);

assert.match(w,/^on:\n  push:\n    branches: \[main\]\n    paths:\n      - '\.github\/workflows\/p3-v033w-official-highres\.yml'/m);
assert.ok(!/^\s*pull_request\s*:/m.test(w),'official workflow must not run on pull_request');
assert.ok(!/^\s*workflow_dispatch\s*:/m.test(w),'official workflow must not have manual dispatch');
assert.ok(!/^\s*schedule\s*:/m.test(w),'official workflow must not be scheduled');
assert.match(w,/test "\$\{GITHUB_REF\}" = "refs\/heads\/main"/);
assert.match(w,/test "\$\{GITHUB_REF_NAME\}" = "main"/);
assert.ok(w.includes('git merge-base --is-ancestor 747866d75fb433baf1423552274417ae9445e917 HEAD'));
assert.ok(w.includes('node tools/run-p3-estimation.js --mode highres --out reports/p3_response_estimation_1000x60_v1.json'));
for(const forbidden of ['--candidates','--trials','--eval-trials','--seed','--final-trials','--final-seed','--dt']){
  assert.ok(!w.includes(' '+forbidden+' '),'official workflow contains forbidden CLI override '+forbidden);
}
assert.ok(!fs.existsSync(path.join(root,'reports','p3_response_estimation_1000x60_v1.json')),'official P3 result must not exist before one-shot execution');

const runner=require('../tools/run-p3-estimation.js');
let blocked=false;
try{runner.assertHighResolutionAuthorized(root,null,{branchName:'v0.3.3w-p3-official-highres-execution'});}
catch(e){blocked=/not effective until merged to main/.test(String(e));}
assert.strictEqual(blocked,true,'review branch must not make highres authorization effective');

console.log('p3-highres-execution-precondition.test.js PASS '+JSON.stringify({
  precondition_blob:blob(PRE),
  execution_workflow_blob:blob(WF),
  authorization_main:p.authorization_main_commit,
  permanent_main_run:p.permanent_main_workflow.run_id,
  main_only:true,
  manual_dispatch:false,
  pull_request_trigger:false,
  official_execution_started:false
}));
