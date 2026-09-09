'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p3_highres_execution_precondition_v1.json';
const p=read(rel);
assert.strictEqual(blob(rel),'79d58ca1aa734ea6fd2f1e6694c958fa899a6a5f');
assert.strictEqual(p.id,'P3_high_resolution_execution_precondition_v1');
assert.strictEqual(p.status,'authorization_merged_and_permanent_main_ci_green_before_official_execution');
assert.strictEqual(p.freeze_date_local,'2026-09-09');
assert.strictEqual(p.authorization_pr_number,30);
assert.strictEqual(p.authorization_main_commit,'747866d75fb433baf1423552274417ae9445e917');
assert.strictEqual(p.authorization_git_blob_sha,'04d2c7b454143fd7073b274bff0ec9b355ec058d');
assert.strictEqual(p.policy_git_blob_sha,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(p.estimator_git_blob_sha,'5bf27bf439dca18629cdfd36f56fe767a23062ff');
assert.strictEqual(p.estimator_core_git_blob_sha,'410ef81dfe761e3c218d072ca311632329ac1617');
assert.strictEqual(p.qualification_report_git_blob_sha,'63e1d7360bc1ef4b232bbf37f347b9fa27e7d461');
assert.strictEqual(p.qualification_result_freeze_git_blob_sha,'32d90d05add5b4e45dd69c711b416ed3378d15ab');
assert.strictEqual(p.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');

assert.strictEqual(blob('hypotheses/p3_highres_authorization_v1.json'),p.authorization_git_blob_sha);
assert.strictEqual(blob('hypotheses/p3_response_estimation_v1.json'),p.policy_git_blob_sha);
assert.strictEqual(blob('tools/run-p3-estimation.js'),p.estimator_git_blob_sha);
assert.strictEqual(blob('tools/p3-estimation-core.js'),p.estimator_core_git_blob_sha);
assert.strictEqual(blob('reports/p3_estimator_qualification_v1.json'),p.qualification_report_git_blob_sha);
assert.strictEqual(blob('hypotheses/p3_estimator_qualification_result_freeze_v1.json'),p.qualification_result_freeze_git_blob_sha);
assert.strictEqual(blob('reference/poissonnier2026_pheromone_response_targets.json'),p.response_target_git_blob_sha);
assert.strictEqual(blob('src/p3.js'),p.p3_runtime_git_blob_sha);
assert.strictEqual(blob('models/lasius_niger_painted_trail_p3_v1.json'),p.p3_model_git_blob_sha);
assert.strictEqual(blob('src/p1.js'),p.p1_structural_comparator_runtime_git_blob_sha);
assert.strictEqual(blob('models/lasius_niger_locomotion_v1.json'),p.canonical_locomotion_git_blob_sha);
assert.strictEqual(blob('src/sim-core.js'),p.sim_core_git_blob_sha);
assert.strictEqual(blob('src/integrity.js'),p.integrity_runtime_git_blob_sha);

assert.deepStrictEqual(p.permanent_main_workflow,{
  name:'Test and deploy ANTLAB',
  workflow_file:'.github/workflows/pages.yml',
  main_commit:'747866d75fb433baf1423552274417ae9445e917',
  run_id:34299582530,
  run_number:149,
  event:'push',
  conclusion:'success',
  test_job_id:102303449269,
  test_job_conclusion:'success',
  deploy_job_id:102303617940,
  deploy_job_conclusion:'success'
});

assert.strictEqual(p.execution_workflow_file,'.github/workflows/p3-v033w-official-highres.yml');
assert.strictEqual(blob(p.execution_workflow_file),'edadbf0756023423235c38992303a716d4d4985c');
assert.strictEqual(p.execution_workflow_git_blob_sha,'edadbf0756023423235c38992303a716d4d4985c');
assert.strictEqual(p.official_execution_still_unrun_at_freeze,true);
assert.strictEqual(p.authorized_command_exact,'node tools/run-p3-estimation.js --mode highres --out reports/p3_response_estimation_1000x60_v1.json');
assert.deepStrictEqual(p.cli_parameter_overrides,[]);
assert.strictEqual(p.official_output_artifact_name,'p3-v033w-official-highres');
assert.strictEqual(p.official_report_filename,'p3_response_estimation_1000x60_v1.json');
assert.strictEqual(p.official_provenance_filename,'p3_response_estimation_execution_provenance_v1.json');

const e=p.execution_contract;
assert.strictEqual(e.folds,6);
assert.deepStrictEqual(e.colonies,[0,7,16,20,21,27]);
assert.strictEqual(e.P3_candidates_per_fold_total,1000);
assert.strictEqual(e.positive_P3_halton_candidates,999);
assert.strictEqual(e.exact_canonical_null_candidates,1);
assert.strictEqual(e.absolute_benchmark_candidates_per_fold_total,1000);
assert.strictEqual(e.absolute_benchmark_positive_candidates,999);
assert.strictEqual(e.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(e.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(e.root_fit_seed,6210000);
assert.strictEqual(e.root_evaluation_seed,6810000);
assert.strictEqual(e.final_all_data_training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(e.final_all_data_fit_seed,7210000);
assert.strictEqual(e.final_check_trials_per_treatment_path,240);
assert.strictEqual(e.final_check_seed,7610000);
assert.strictEqual(e.physics_dt_s,0.02);
assert.strictEqual(e.common_random_numbers,true);
assert.strictEqual(e.response_rng,'none');
assert.deepStrictEqual(e.estimated_parameters,['sigma_field_mm','kappa_trail_per_s']);
assert.deepStrictEqual(e.parameter_bounds,{sigma_field_mm:[2,32],kappa_trail_per_s:[0,16]});

assert.match(p.execution_trigger_rule,/push to main/);
assert.match(p.execution_trigger_rule,/no pull_request or workflow_dispatch trigger/);
assert.match(p.outcome_handling_rule,/Failure of either heldout 5\/6 survival guard closes P3-v1/);
assert.match(p.rerun_policy,/No rerun is authorized after a valid scientific result/);
assert.strictEqual(p.P1_runtime_structural_comparator_access_authorized,true);
assert.strictEqual(p.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(p.P2_official_result_semantic_access_authorized,false);
assert.strictEqual(p.P2_lapse_structure_authorized,false);
assert.strictEqual(p.canonical_promotion_authorized,false);
assert.strictEqual(p.H2_H3_H4_H5_refit_or_combination_authorized,false);
assert.strictEqual(p.ymaze_access_authorized,false);

const workflow=text(p.execution_workflow_file);
assert.match(workflow,/^on:\n  push:\n    branches: \[main\]\n    paths:\n      - '\.github\/workflows\/p3-v033w-official-highres\.yml'/m);
assert.ok(!/^\s*pull_request:/m.test(workflow),'official execution workflow must not have pull_request trigger');
assert.ok(!/^\s*workflow_dispatch:/m.test(workflow),'official execution workflow must not have workflow_dispatch trigger');
assert.ok(workflow.includes('test "${GITHUB_REF}" = "refs/heads/main"'),'workflow must use literal runtime GITHUB_REF expansion');
assert.ok(!workflow.includes('test "\\${GITHUB_REF}"'),'workflow must not repeat the P2 escaped-GITHUB_REF defect');
assert.ok(workflow.includes('test "${GITHUB_EVENT_NAME}" = "push"'),'workflow must require push event at runtime');
assert.ok(workflow.includes('git merge-base --is-ancestor 747866d75fb433baf1423552274417ae9445e917 HEAD'));
assert.ok(workflow.includes(p.authorized_command_exact));
assert.ok(!workflow.includes('--candidates'));
assert.ok(!workflow.includes('--trials'));
assert.ok(!workflow.includes('--eval-trials'));
assert.ok(!workflow.includes('--seed'));
assert.ok(!workflow.includes('--final-trials'));
assert.ok(!workflow.includes('--final-seed'));
assert.ok(!workflow.includes('--dt'));

assert.ok(!fs.existsSync(path.join(root,'reports','p3_response_estimation_1000x60_v1.json')),'official P3 result must remain unrun during execution-gate review');
assert.ok(!fs.existsSync(path.join(root,'reports','p3_response_estimation_execution_provenance_v1.json')),'official P3 provenance must remain absent before execution');

console.log('p3-highres-execution-precondition.test.js PASS '+JSON.stringify({
  precondition_blob:blob(rel),
  workflow_blob:blob(p.execution_workflow_file),
  authorization_main:p.authorization_main_commit,
  permanent_main_run:p.permanent_main_workflow.run_id,
  main_only:true,
  manual_dispatch:false,
  pull_request:false,
  corrected_GITHUB_REF:true,
  official_execution_started:false
}));
