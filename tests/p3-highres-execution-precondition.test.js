'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
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
assert.strictEqual(p.execution_workflow_file,'.github/workflows/p3-v033w-official-highres.yml');
assert.strictEqual(p.execution_workflow_git_blob_sha,'edadbf0756023423235c38992303a716d4d4985c');

assert.strictEqual(p.permanent_main_workflow.run_id,34299582530);
assert.strictEqual(p.permanent_main_workflow.run_number,149);
assert.strictEqual(p.permanent_main_workflow.conclusion,'success');
assert.strictEqual(p.official_execution_still_unrun_at_freeze,true,'historical pre-execution record must remain unchanged');
assert.strictEqual(p.authorized_command_exact,'node tools/run-p3-estimation.js --mode highres --out reports/p3_response_estimation_1000x60_v1.json');
assert.deepStrictEqual(p.cli_parameter_overrides,[]);
assert.match(p.outcome_handling_rule,/Failure of either heldout 5\/6 survival guard closes P3-v1/);
assert.match(p.rerun_policy,/No rerun is authorized after a valid scientific result/);

const archiveRel='hypotheses/archive/p3_highres_authorization_v1.json';
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p3_highres_authorization_v1.json')),'active P3 authorization must be retired after official execution');
assert.strictEqual(blob(archiveRel),p.authorization_git_blob_sha);
assert.strictEqual(blob('hypotheses/p3_response_estimation_v1.json'),p.policy_git_blob_sha);
assert.strictEqual(blob('tools/run-p3-estimation.js'),p.estimator_git_blob_sha);
assert.strictEqual(blob('tools/p3-estimation-core.js'),p.estimator_core_git_blob_sha);
assert.strictEqual(blob('reference/poissonnier2026_pheromone_response_targets.json'),p.response_target_git_blob_sha);

assert.ok(!fs.existsSync(path.join(root,p.execution_workflow_file)),'official P3 one-shot workflow must be retired after valid execution');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p3-v033x-materialize-result.yml')),'one-time P3 result materializer must be retired');
assert.strictEqual(blob('reports/p3_response_estimation_1000x60_v1.json'),'264d822c7e6180dc0c9a3da1b8045df3f0e2a03d');
assert.strictEqual(blob('reports/p3_response_estimation_execution_provenance_v1.json'),'cd397bc5f7cd0f62ed12a0d741750d6700dbef10');
assert.strictEqual(blob('hypotheses/p3_response_estimation_result_freeze_v1.json'),'aa69afda6d80cc9d4ea0b563470cffdf0762b941');

const report=read('reports/p3_response_estimation_1000x60_v1.json');
assert.strictEqual(report.status,'development_response_estimation_failed_dual_primary_survival_guard');
assert.strictEqual(report.internal_cv.P3_wins_vs_exact_null,4);
assert.strictEqual(report.internal_cv.P3_wins_vs_selected_absolute_benchmark,2);
assert.strictEqual(report.internal_cv.P3_dual_survival_guard_passed,false);
assert.strictEqual(report.final_all_data_fit,null);

console.log('p3-highres-execution-precondition.test.js PASS '+JSON.stringify({
  precondition_blob:blob(rel),
  execution_workflow_retired:true,
  materializer_retired:true,
  valid_attempt_run:34375376968,
  official_result_materialized:true,
  active_authorization:false,
  dual_survival:false
}));
