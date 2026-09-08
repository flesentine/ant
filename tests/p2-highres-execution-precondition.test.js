'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const pre=read('hypotheses/p2_highres_execution_precondition_v1.json');
const auth=read('hypotheses/p2_highres_authorization_v1.json');
const workflowRel='.github/workflows/p2-v033o-official-highres.yml';
const workflow=fs.readFileSync(path.join(root,workflowRel),'utf8');

assert.strictEqual(blob('hypotheses/p2_highres_execution_precondition_v1.json'),'15f45456934c102b412fa83ea39b424b9a3b3979');
assert.strictEqual(blob(workflowRel),'89bd53ec3142cc248cc93313ac1b75f472b7029d');
assert.strictEqual(blob('hypotheses/p2_highres_authorization_v1.json'),'de361b15b9600bd92a35baf30fa71c2a7c61003c');
assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(blob('tools/run-p2-estimation.js'),'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(blob('reports/p2_estimator_qualification_v1.json'),'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(blob('hypotheses/p2_estimator_qualification_result_freeze_v1.json'),'1d46b594cb154a93c2e321fb67d399acdd821993');

assert.strictEqual(pre.id,'P2_high_resolution_execution_precondition_v1');
assert.strictEqual(pre.status,'authorization_merged_and_permanent_main_ci_green_before_official_execution');
assert.strictEqual(pre.freeze_date_local,'2026-09-07');
assert.strictEqual(pre.authorization_main_commit,'a2f5c3dc2a10aad30e796c3f866a382b31cc6210');
assert.strictEqual(pre.authorization_git_blob_sha,'de361b15b9600bd92a35baf30fa71c2a7c61003c');
assert.strictEqual(pre.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(pre.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(pre.qualification_report_git_blob_sha,'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(pre.qualification_result_freeze_git_blob_sha,'1d46b594cb154a93c2e321fb67d399acdd821993');
assert.strictEqual(pre.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(pre.execution_workflow_file,workflowRel);
assert.strictEqual(pre.execution_workflow_git_blob_sha,'89bd53ec3142cc248cc93313ac1b75f472b7029d');

assert.strictEqual(pre.permanent_main_workflow.name,'Test and deploy ANTLAB');
assert.strictEqual(pre.permanent_main_workflow.main_commit,'a2f5c3dc2a10aad30e796c3f866a382b31cc6210');
assert.strictEqual(pre.permanent_main_workflow.run_id,34189072667);
assert.strictEqual(pre.permanent_main_workflow.run_number,140);
assert.strictEqual(pre.permanent_main_workflow.event,'push');
assert.strictEqual(pre.permanent_main_workflow.conclusion,'success');
assert.strictEqual(pre.permanent_main_workflow.test_job_id,101943216663);
assert.strictEqual(pre.permanent_main_workflow.test_job_conclusion,'success');
assert.strictEqual(pre.permanent_main_workflow.deploy_job_id,101943352041);
assert.strictEqual(pre.permanent_main_workflow.deploy_job_conclusion,'success');

assert.strictEqual(pre.official_execution_still_unrun_at_freeze,true);
assert.strictEqual(pre.authorized_command_exact,'node tools/run-p2-estimation.js --mode highres --out reports/p2_response_estimation_1000x60_v1.json');
assert.deepStrictEqual(pre.cli_parameter_overrides,[]);
assert.strictEqual(pre.official_output_artifact_name,'p2-v033o-official-highres');
assert.strictEqual(pre.official_report_filename,'p2_response_estimation_1000x60_v1.json');
assert.strictEqual(pre.official_provenance_filename,'p2_response_estimation_execution_provenance_v1.json');
assert.strictEqual(pre.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(pre.candidate_B_authorized,false);
assert.strictEqual(pre.canonical_promotion_authorized,false);
assert.strictEqual(pre.ymaze_access_authorized,false);
assert.strictEqual(pre.invalidated_preexecution_attempt.record_file,'hypotheses/p2_highres_execution_attempt1_invalidation_v1.json');
assert.strictEqual(pre.invalidated_preexecution_attempt.record_git_blob_sha,'fb96cc76ee07541290cfcf6e9c10645a87686a12');
assert.strictEqual(pre.invalidated_preexecution_attempt.workflow_run_id,34189985353);
assert.strictEqual(pre.invalidated_preexecution_attempt.workflow_job_id,101945889831);
assert.strictEqual(pre.invalidated_preexecution_attempt.head_sha,'c219890bef7dcd97f560bd26d3d0b504bcd7b202');
assert.strictEqual(pre.invalidated_preexecution_attempt.official_high_resolution_step_started,false);
assert.strictEqual(pre.invalidated_preexecution_attempt.response_target_semantics_loaded,false);
assert.strictEqual(pre.invalidated_preexecution_attempt.official_report_generated,false);
assert.strictEqual(pre.invalidated_preexecution_attempt.workflow_artifacts_uploaded,0);
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.main_commit,'c219890bef7dcd97f560bd26d3d0b504bcd7b202');
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.permanent_main_workflow_run_id,34189985287);
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.permanent_main_workflow_run_number,141);
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.conclusion,'success');
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.test_job_id,101945889690);
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.test_job_conclusion,'success');
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.deploy_job_id,101946056177);
assert.strictEqual(pre.retry_execution_gate_main_checkpoint.deploy_job_conclusion,'success');
assert.strictEqual(pre.authorized_next_valid_attempt_number,2);
const invalid=read('hypotheses/p2_highres_execution_attempt1_invalidation_v1.json');
assert.strictEqual(blob('hypotheses/p2_highres_execution_attempt1_invalidation_v1.json'),'fb96cc76ee07541290cfcf6e9c10645a87686a12');
assert.strictEqual(invalid.status,'official_attempt_1_invalidated_before_scientific_execution');
assert.strictEqual(invalid.workflow.run_id,34189985353);
assert.strictEqual(invalid.failure_point.official_high_resolution_step_started,false);
assert.strictEqual(invalid.evidence.response_target_semantics_loaded,false);
assert.strictEqual(invalid.evidence.candidate_search_started,false);
assert.strictEqual(invalid.evidence.official_report_generated,false);
assert.strictEqual(invalid.evidence.workflow_artifacts_uploaded,0);
assert.strictEqual(invalid.rerun_authorization.authorized,true);
assert.strictEqual(invalid.rerun_authorization.scientific_changes_allowed,false);

assert.strictEqual(auth.effective_when_merged_to_main,true);
assert.strictEqual(auth.high_resolution_response_search_authorized,true);
assert.strictEqual(auth.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(auth.Candidate_B_authorized,false);
assert.strictEqual(auth.canonical_promotion_authorized,false);
assert.strictEqual(auth.ymaze_access_authorized,false);

assert.match(workflow,/^name: P2 v0\.3\.3o official high-resolution response execution/m);
assert.match(workflow,/on:\n  push:\n    branches: \[main\]\n    paths:\n      - '\.github\/workflows\/p2-v033o-official-highres\.yml'/);
assert.ok(!/\bpull_request\s*:/.test(workflow),'official workflow must not have pull_request trigger');
assert.ok(!/\bworkflow_dispatch\s*:/.test(workflow),'official workflow must not have workflow_dispatch trigger');
assert.match(workflow,/node tools\/run-p2-estimation\.js --mode highres --out reports\/p2_response_estimation_1000x60_v1\.json/);
assert.match(workflow,/git merge-base --is-ancestor a2f5c3dc2a10aad30e796c3f866a382b31cc6210 HEAD/);
assert.match(workflow,/test "\$\{GITHUB_REF\}" = "refs\/heads\/main"/);
assert.match(workflow,/Run permanent regression suite before official search/);
assert.match(workflow,/p2-v033o-official-highres/);

for(const bad of ['--candidates','--trials','--eval-trials','--seed','--final-trials','--final-seed','--dt']){
  const officialLine='node tools/run-p2-estimation.js --mode highres --out reports/p2_response_estimation_1000x60_v1.json';
  assert.ok(officialLine&&!officialLine.includes(bad),bad+' override must not appear in official command');
}

assert.ok(!fs.existsSync(path.join(root,'reports','p2_response_estimation_1000x60_v1.json')),'official P2 result must not exist before one-shot workflow runs');
assert.ok(!fs.existsSync(path.join(root,'reports','p2_response_estimation_execution_provenance_v1.json')),'official P2 provenance must not exist before one-shot workflow runs');

console.log('p2-highres-execution-precondition.test.js PASS '+JSON.stringify({
  precondition_blob:blob('hypotheses/p2_highres_execution_precondition_v1.json'),
  workflow_blob:blob(workflowRel),
  authorization_main_commit:pre.authorization_main_commit,
  authorization_ci_run:pre.permanent_main_workflow.run_id,
  invalidated_attempt_run:pre.invalidated_preexecution_attempt.workflow_run_id,
  retry_main_ci_run:pre.retry_execution_gate_main_checkpoint.permanent_main_workflow_run_id,
  authorized_next_attempt:pre.authorized_next_valid_attempt_number,
  main_only:true,
  manual_trigger:false,
  pull_request_trigger:false,
  official_search_executed:false,
  ymaze:false
}));
