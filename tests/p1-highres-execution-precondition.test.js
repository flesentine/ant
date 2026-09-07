'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const p=read('hypotheses/p1_highres_execution_precondition_v1.json');
assert.strictEqual(blob('hypotheses/p1_highres_execution_precondition_v1.json'),'18f2674ad3ee8da8f0a624a2a93b46f4bf673864');
assert.strictEqual(p.id,'P1_high_resolution_execution_precondition_v1');
assert.strictEqual(p.status,'authorization_merged_and_permanent_main_ci_green_before_official_execution');
assert.strictEqual(p.authorization_main_commit,'a9b57636db9b12cfd88feb2c8560f9eafa84787b');
assert.strictEqual(p.authorization_git_blob_sha,'7e77c5b1b9a6de9d665ff2be55c0780cc7d24d9c');
assert.strictEqual(p.policy_git_blob_sha,'628d17f6eb69fd11216aff33d1356d184365aedd');
assert.strictEqual(p.estimator_git_blob_sha,'a307e74e8ba2366e2546eebe1a7cccac69a3ff9a');
assert.strictEqual(p.qualification_report_git_blob_sha,'2f737a1e7059f023fa8acfa2a1f1bbc1e688ddb3');
assert.strictEqual(p.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(p.p1_runtime_git_blob_sha,'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(p.p1_model_git_blob_sha,'73873fd6763838423ca27648136bb0b9ff062817');
assert.strictEqual(p.canonical_locomotion_git_blob_sha,'2fde196d6c8a9353c1c8c206d4fcef223e92ad1');
assert.strictEqual(p.permanent_main_workflow.run_id,34081603983);
assert.strictEqual(p.permanent_main_workflow.run_number,132);
assert.strictEqual(p.permanent_main_workflow.main_commit,'a9b57636db9b12cfd88feb2c8560f9eafa84787b');
assert.strictEqual(p.permanent_main_workflow.conclusion,'success');
assert.strictEqual(p.permanent_main_workflow.test_job_id,101617791536);
assert.strictEqual(p.permanent_main_workflow.test_job_conclusion,'success');
assert.strictEqual(p.permanent_main_workflow.deploy_job_id,101617919613);
assert.strictEqual(p.permanent_main_workflow.deploy_job_conclusion,'success');
assert.strictEqual(p.official_execution_still_unrun_at_freeze,true);
assert.strictEqual(p.authorized_command_exact,'node tools/run-p1-estimation.js --mode highres --out /tmp/p1-official/p1_response_estimation_500x60_v1.json');
assert.deepStrictEqual(p.cli_parameter_overrides,[]);
assert.strictEqual(p.canonical_promotion_authorized,false);
assert.strictEqual(p.ymaze_access_authorized,false);

const workflowPath=path.join(root,p.execution_workflow_file);
if(fs.existsSync(workflowPath)){
  assert.strictEqual(blob(p.execution_workflow_file),'4e541499e25ccbd58a0cef80e90590e29926c03c');
  assert.strictEqual(p.execution_workflow_git_blob_sha,'4e541499e25ccbd58a0cef80e90590e29926c03c');
  const y=fs.readFileSync(workflowPath,'utf8');
  assert.match(y,/push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(y,/paths:\s*\n\s*-\s*'\.github\/workflows\/p1-v033g-official-highres\.yml'/);
  assert.ok(!/\bpull_request\s*:/.test(y),'official workflow must not run on PR events');
  assert.ok(!/\bworkflow_dispatch\s*:/.test(y),'official workflow must not be manually rerunnable');
  assert.match(y,/cancel-in-progress:\s*false/);
  const highresLines=y.split(/\r?\n/).filter(line=>line.includes('node tools/run-p1-estimation.js --mode highres'));
  assert.deepStrictEqual(highresLines.length,1,'official workflow must contain exactly one highres invocation');
  assert.match(highresLines[0],/node tools\/run-p1-estimation\.js --mode highres --out \/tmp\/p1-official\/p1_response_estimation_500x60_v1\.json/);
  assert.ok(!/--(?:candidates|trials|eval-trials|seed|final-trials|final-seed|dt)\b/.test(highresLines[0]),'official highres invocation must not override frozen execution parameters');
}

assert.strictEqual(blob('hypotheses/p1_highres_authorization_v1.json'),p.authorization_git_blob_sha);
assert.strictEqual(blob('hypotheses/p1_response_estimation_v1.json'),p.policy_git_blob_sha);
assert.strictEqual(blob('tools/run-p1-estimation.js'),p.estimator_git_blob_sha);
assert.strictEqual(blob('reference/poissonnier2026_pheromone_response_targets.json'),p.response_target_git_blob_sha);

console.log('p1-highres-execution-precondition.test.js PASS '+JSON.stringify({
  precondition_blob:blob('hypotheses/p1_highres_execution_precondition_v1.json'),
  workflow_blob:fs.existsSync(workflowPath)?blob(p.execution_workflow_file):null,
  permanent_main_run:p.permanent_main_workflow.run_id,
  main_only:true,
  manual_dispatch:false,
  frozen_cli_overrides:p.cli_parameter_overrides.length
}));
