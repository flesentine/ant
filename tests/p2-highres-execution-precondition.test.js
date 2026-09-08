'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const p=read('hypotheses/p2_highres_execution_precondition_v1.json');
assert.strictEqual(blob('hypotheses/p2_highres_execution_precondition_v1.json'),'15f45456934c102b412fa83ea39b424b9a3b3979');
assert.strictEqual(p.id,'P2_high_resolution_execution_precondition_v1');
assert.strictEqual(p.status,'authorization_merged_and_permanent_main_ci_green_before_official_execution');
assert.strictEqual(p.authorization_main_commit,'a2f5c3dc2a10aad30e796c3f866a382b31cc6210');
assert.strictEqual(p.authorization_git_blob_sha,'de361b15b9600bd92a35baf30fa71c2a7c61003c');
assert.strictEqual(p.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(p.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(p.qualification_report_git_blob_sha,'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(p.qualification_result_freeze_git_blob_sha,'1d46b594cb154a93c2e321fb67d399acdd821993');
assert.strictEqual(p.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(p.execution_workflow_file,'.github/workflows/p2-v033o-official-highres.yml');
assert.strictEqual(p.execution_workflow_git_blob_sha,'89bd53ec3142cc248cc93313ac1b75f472b7029d');

assert.strictEqual(p.permanent_main_workflow.run_id,34189072667);
assert.strictEqual(p.permanent_main_workflow.run_number,140);
assert.strictEqual(p.permanent_main_workflow.conclusion,'success');
assert.strictEqual(p.invalidated_preexecution_attempt.workflow_run_id,34189985353);
assert.strictEqual(p.invalidated_preexecution_attempt.official_high_resolution_step_started,false);
assert.strictEqual(p.invalidated_preexecution_attempt.response_target_semantics_loaded,false);
assert.strictEqual(p.invalidated_preexecution_attempt.official_report_generated,false);
assert.strictEqual(p.invalidated_preexecution_attempt.workflow_artifacts_uploaded,0);
assert.strictEqual(p.retry_execution_gate_main_checkpoint.main_commit,'c219890bef7dcd97f560bd26d3d0b504bcd7b202');
assert.strictEqual(p.retry_execution_gate_main_checkpoint.permanent_main_workflow_run_id,34189985287);
assert.strictEqual(p.retry_execution_gate_main_checkpoint.conclusion,'success');
assert.strictEqual(p.authorized_next_valid_attempt_number,2);
assert.strictEqual(p.official_execution_still_unrun_at_freeze,true,'historical pre-execution record must remain unchanged');

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

const archiveRel='hypotheses/archive/p2_highres_authorization_v1.json';
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p2_highres_authorization_v1.json')),'active P2 authorization must be retired after official execution');
assert.strictEqual(blob(archiveRel),p.authorization_git_blob_sha);
assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),p.policy_git_blob_sha);
assert.strictEqual(blob('tools/run-p2-estimation.js'),p.estimator_git_blob_sha);
assert.strictEqual(blob('reference/poissonnier2026_pheromone_response_targets.json'),p.response_target_git_blob_sha);

const workflowPath=path.join(root,p.execution_workflow_file);
assert.ok(!fs.existsSync(workflowPath),'official P2 one-shot workflow must be retired after valid execution');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p2-v033p-materialize-result.yml')),'one-time P2 result materializer must be retired');
assert.strictEqual(blob('reports/p2_response_estimation_1000x60_v1.json'),'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(blob('reports/p2_response_estimation_execution_provenance_v1.json'),'4a9a705c0ab8e9b64534a35f90f1017bf70c4a06');
assert.strictEqual(blob('hypotheses/p2_response_estimation_result_freeze_v1.json'),'088316e1746594f9b3f700cb277a83eb53fdd9f6');

console.log('p2-highres-execution-precondition.test.js PASS '+JSON.stringify({
  precondition_blob:blob('hypotheses/p2_highres_execution_precondition_v1.json'),
  execution_workflow_retired:true,
  materializer_retired:true,
  invalidated_attempt_run:p.invalidated_preexecution_attempt.workflow_run_id,
  valid_attempt_run:34190528101,
  official_result_materialized:true,
  active_authorization:false
}));
