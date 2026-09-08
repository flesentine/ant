'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const reportRel='reports/p3_estimator_qualification_v1.json';
const freezeRel='hypotheses/p3_estimator_qualification_result_freeze_v1.json';
const report=read(reportRel),freeze=read(freezeRel);

assert.strictEqual(blob(reportRel),'63e1d7360bc1ef4b232bbf37f347b9fa27e7d461');
assert.strictEqual(sha256(reportRel),'4912618de22e74d67197529bb6625c850bfa8912bcf55e99280732dbcc64e604');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,3508);
assert.strictEqual(blob(freezeRel),'32d90d05add5b4e45dd69c711b416ed3378d15ab');

assert.strictEqual(report.qualification_id,'P3_estimator_synthetic_qualification_v1');
assert.strictEqual(report.status,'passed');
assert.strictEqual(report.scientific_evidence,false);
assert.strictEqual(report.reference_outcomes_accessed,false);
assert.strictEqual(report.response_target_semantics_loaded,false);
assert.strictEqual(report.response_target_hash_verified_only,true);
assert.strictEqual(report.P1_official_result_semantics_loaded,false);
assert.strictEqual(report.P2_official_result_semantics_loaded,false);
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.policy_git_blob_sha,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(report.estimator_git_blob_sha,'5bf27bf439dca18629cdfd36f56fe767a23062ff');
assert.strictEqual(report.estimator_core_git_blob_sha,'410ef81dfe761e3c218d072ca311632329ac1617');
assert.strictEqual(report.response_target_git_blob_sha_verified,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(report.trials_per_treatment_path,2);
assert.strictEqual(Object.keys(report.checks).length,22);
for(const [k,v] of Object.entries(report.checks))assert.strictEqual(v,true,k+' must remain frozen true');

assert.strictEqual(freeze.id,'P3_estimator_qualification_result_freeze_v1');
assert.strictEqual(freeze.status,'qualified_reference_free_estimator_frozen_high_resolution_not_authorized');
assert.strictEqual(freeze.freeze_date_local,'2026-09-08');
assert.strictEqual(freeze.audit.tested_head,'7dae80bff4cab045c4f9277f2c3c4c75d370d7f0');
assert.strictEqual(freeze.audit.github_run_id,34289538716);
assert.strictEqual(freeze.audit.github_job_id,102272761530);
assert.strictEqual(freeze.audit.github_run_attempt,1);
assert.strictEqual(freeze.audit.artifact_id,10080797145);
assert.strictEqual(freeze.audit.artifact_name,'p3-v033u-estimator-qualification-audit');
assert.strictEqual(freeze.audit.artifact_digest,'sha256:2f1b54a5c6122ae556a0bad6c07d5b0f462f66de299bbb0d247030fbd4f797c7');

assert.deepStrictEqual(freeze.qualification_report,{
  file:reportRel,
  git_blob_sha:'63e1d7360bc1ef4b232bbf37f347b9fa27e7d461',
  sha256:'4912618de22e74d67197529bb6625c850bfa8912bcf55e99280732dbcc64e604',
  bytes:3508,
  status:'passed'
});
assert.strictEqual(freeze.sidecars.browser_git_blob_sha,'a45402a54766ba358d529ee9ac34c260ab152d63');
assert.strictEqual(freeze.sidecars.browser_sha256,'2bfc3d06fcc8822ab577a38722798cfd792b92c61b0d3e07e3ffac9e521936b1');
assert.strictEqual(freeze.sidecars.node_parity_git_blob_sha,'37cf6cb85986af7a91a03182dcb2b1d76d2e27a7');
assert.strictEqual(freeze.sidecars.node_parity_sha256,'3b97516614f96c1cab7dd83195cfbda9e261d9a4c106606397cea5415ab84fef');
assert.strictEqual(freeze.sidecars.chromium_parity_cases,10);
for(const k of [
  'browser_exceptions','browser_console_errors','browser_response_target_requests','browser_ymaze_requests',
  'browser_P1_official_result_requests','browser_P2_official_result_requests','browser_p3_authorization_requests'
]) assert.strictEqual(freeze.sidecars[k],0,k+' must remain zero');

assert.strictEqual(freeze.frozen_chain.policy_git_blob_sha,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(freeze.frozen_chain.estimator_git_blob_sha,'5bf27bf439dca18629cdfd36f56fe767a23062ff');
assert.strictEqual(freeze.frozen_chain.estimator_core_git_blob_sha,'410ef81dfe761e3c218d072ca311632329ac1617');
assert.strictEqual(freeze.frozen_chain.p3_runtime_git_blob_sha,'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(freeze.frozen_chain.p3_model_git_blob_sha,'9107de0c71641c4037bbedbb498b9fa868c1ef00');
assert.strictEqual(freeze.frozen_chain.p1_runtime_structural_comparator_git_blob_sha,'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(freeze.frozen_chain.p1_official_result_freeze_hash_checked_only,'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(freeze.frozen_chain.p2_official_result_freeze_hash_checked_only,'088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(freeze.frozen_chain.response_target_git_blob_sha_verified_only,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');

assert.deepStrictEqual(freeze.qualified_checks,report.checks);
assert.strictEqual(freeze.qualification_consequence.estimator_reference_free_qualified,true);
assert.strictEqual(freeze.qualification_consequence.absolute_transduction_structural_comparator_qualified,true);
for(const k of [
  'response_target_semantic_access_authorized','high_resolution_response_search_authorized',
  'P1_official_result_semantic_access_authorized','P2_official_result_semantic_access_authorized',
  'canonical_update_authorized','H2_H3_H4_H5_refit_or_combination_authorized','Y_maze_access_authorized'
]) assert.strictEqual(freeze.qualification_consequence[k],false,k+' must remain unauthorized');

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p3_highres_authorization_v1.json')));
assert.match(freeze.next_gate,/separate post-qualification P3 high-resolution authorization freeze/i);
assert.match(freeze.next_gate,/merged and effective on main/i);

console.log('p3-estimator-qualification-result.test.js PASS '+JSON.stringify({
  freeze_blob:blob(freezeRel),
  qualification_blob:blob(reportRel),
  qualification_sha256:sha256(reportRel),
  official_run:freeze.audit.github_run_id,
  checks:Object.keys(report.checks).length,
  chromium_cases:freeze.sidecars.chromium_parity_cases,
  highres_authorized:false,
  target_semantics:false,
  P1_results:false,
  P2_results:false,
  ymaze:false
}));
