'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p3-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const activeRel='hypotheses/p3_highres_authorization_v1.json';
const archiveRel='hypotheses/archive/p3_highres_authorization_v1.json';
assert.ok(!fs.existsSync(path.join(root,activeRel)),'active P3 authorization must be retired after valid official result');
assert.strictEqual(blob(archiveRel),'04d2c7b454143fd7073b274bff0ec9b355ec058d');

const a=readJson(path.join(root,archiveRel));
assert.strictEqual(a.id,'P3_high_resolution_authorization_v1');
assert.strictEqual(a.status,'qualified_estimator_authorized_for_frozen_high_resolution_response_search');
assert.strictEqual(a.authorization_date_local,'2026-09-08');
assert.strictEqual(a.effective_when_merged_to_main,true);
assert.strictEqual(a.high_resolution_response_search_authorized,true,'archive must preserve historical authorization truth');
assert.strictEqual(a.policy_git_blob_sha,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(a.estimator_git_blob_sha,'5bf27bf439dca18629cdfd36f56fe767a23062ff');
assert.strictEqual(a.estimator_core_git_blob_sha,'410ef81dfe761e3c218d072ca311632329ac1617');
assert.strictEqual(a.qualification_report.git_blob_sha,'63e1d7360bc1ef4b232bbf37f347b9fa27e7d461');
assert.strictEqual(a.qualification_result_freeze.git_blob_sha,'32d90d05add5b4e45dd69c711b416ed3378d15ab');
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

assert.strictEqual(blob('hypotheses/p3_response_estimation_v1.json'),'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(blob('tools/run-p3-estimation.js'),'5bf27bf439dca18629cdfd36f56fe767a23062ff');
assert.strictEqual(blob('tools/p3-estimation-core.js'),'410ef81dfe761e3c218d072ca311632329ac1617');
assert.strictEqual(blob('reports/p3_estimator_qualification_v1.json'),'63e1d7360bc1ef4b232bbf37f347b9fa27e7d461');
assert.strictEqual(blob('hypotheses/p3_estimator_qualification_result_freeze_v1.json'),'32d90d05add5b4e45dd69c711b416ed3378d15ab');
assert.strictEqual(blob('reports/p3_response_estimation_1000x60_v1.json'),'264d822c7e6180dc0c9a3da1b8045df3f0e2a03d');
assert.strictEqual(blob('reports/p3_response_estimation_execution_provenance_v1.json'),'cd397bc5f7cd0f62ed12a0d741750d6700dbef10');
assert.strictEqual(blob('hypotheses/p3_response_estimation_result_freeze_v1.json'),'aa69afda6d80cc9d4ea0b563470cffdf0762b941');

assert.throws(()=>est.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);
const policy=readJson(path.join(root,'hypotheses','p3_response_estimation_v1.json'));
assert.throws(()=>est.loadReferenceTarget(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/);

console.log('p3-highres-authorization.test.js PASS '+JSON.stringify({
  archived_authorization_blob:blob(archiveRel),
  active_authorization:false,
  historical_highres_authorized:a.high_resolution_response_search_authorized,
  official_result_materialized:true,
  P1_runtime_structural_comparator:true,
  P1_result_semantics:false,
  P2_result_semantics:false,
  canonical_promotion:false,
  ymaze:false
}));
