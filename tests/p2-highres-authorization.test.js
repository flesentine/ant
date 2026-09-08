'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p2-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const activeRel='hypotheses/p2_highres_authorization_v1.json';
const archiveRel='hypotheses/archive/p2_highres_authorization_v1.json';
assert.ok(!fs.existsSync(path.join(root,activeRel)),'active P2 authorization must be retired after valid official result');
assert.strictEqual(blob(archiveRel),'de361b15b9600bd92a35baf30fa71c2a7c61003c');

const a=readJson(path.join(root,archiveRel));
assert.strictEqual(a.id,'P2_high_resolution_authorization_v1');
assert.strictEqual(a.status,'qualified_estimator_authorized_for_frozen_high_resolution_response_search');
assert.strictEqual(a.authorization_date_local,'2026-09-07');
assert.strictEqual(a.effective_when_merged_to_main,true);
assert.strictEqual(a.high_resolution_response_search_authorized,true,'archive must preserve historical authorization truth');
assert.strictEqual(a.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(a.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(a.qualification_report.git_blob_sha,'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(a.qualification_result_freeze.git_blob_sha,'1d46b594cb154a93c2e321fb67d399acdd821993');
assert.strictEqual(a.response_target_semantic_access_authorized,true);
assert.strictEqual(a.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(a.canonical_promotion_authorized,false);
assert.strictEqual(a.Candidate_B_authorized,false);
assert.strictEqual(a.ymaze_access_authorized,false);
assert.match(a.official_execution_rule,/exactly one official execution/i);
assert.match(a.post_result_rule,/Freeze and record the complete P2 result/i);

assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(blob('tools/run-p2-estimation.js'),'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(blob('reports/p2_estimator_qualification_v1.json'),'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(blob('hypotheses/p2_estimator_qualification_result_freeze_v1.json'),'1d46b594cb154a93c2e321fb67d399acdd821993');
assert.strictEqual(blob('reports/p2_response_estimation_1000x60_v1.json'),'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(blob('hypotheses/p2_response_estimation_result_freeze_v1.json'),'088316e1746594f9b3f700cb277a83eb53fdd9f6');

assert.throws(()=>est.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);
const policy=readJson(path.join(root,'hypotheses','p2_response_estimation_v1.json'));
assert.throws(()=>est.loadReferenceTarget(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/);

console.log('p2-highres-authorization.test.js PASS '+JSON.stringify({
  archived_authorization_blob:blob(archiveRel),
  active_authorization:false,
  historical_highres_authorized:a.high_resolution_response_search_authorized,
  official_result_materialized:true,
  canonical_promotion:false,
  candidate_B:false,
  ymaze:false
}));
