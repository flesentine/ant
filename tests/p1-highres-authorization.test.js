'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p1-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const activePath=path.join(root,'hypotheses','p1_highres_authorization_v1.json');
assert.ok(!fs.existsSync(activePath),'active P1 authorization must be retired after a valid official result');

const archiveRel='hypotheses/archive/p1_highres_authorization_v1.json';
const auth=readJson(path.join(root,archiveRel));
const qualification=readJson(path.join(root,'reports','p1_estimator_qualification_v1.json'));

assert.strictEqual(blob(archiveRel),'7e77c5b1b9a6de9d665ff2be55c0780cc7d24d9c');
assert.strictEqual(blob('reports/p1_estimator_qualification_v1.json'),'2f737a1e7059f023fa8acfa2a1f1bbc1e688ddb3');
assert.strictEqual(blob('tools/run-p1-estimation.js'),'a307e74e8ba2366e2546eebe1a7cccac69a3ff9a');
assert.strictEqual(blob('hypotheses/p1_response_estimation_v1.json'),'628d17f6eb69fd11216aff33d1356d184365aedd');

assert.strictEqual(auth.id,'P1_high_resolution_authorization_v1');
assert.strictEqual(auth.status,'qualified_estimator_authorized_for_frozen_high_resolution_response_search');
assert.strictEqual(auth.effective_when_merged_to_main,true);
assert.strictEqual(auth.high_resolution_response_search_authorized,true,'archived record must preserve historical authorization truth');
assert.strictEqual(auth.policy_git_blob_sha,'628d17f6eb69fd11216aff33d1356d184365aedd');
assert.strictEqual(auth.estimator_git_blob_sha,'a307e74e8ba2366e2546eebe1a7cccac69a3ff9a');
assert.strictEqual(auth.qualification_report.git_blob_sha,'2f737a1e7059f023fa8acfa2a1f1bbc1e688ddb3');
assert.strictEqual(auth.qualification_report.sha256,'6620ebc25729d540bef489bbf7748f2859f5eb4e3fb153428f428fb6ff1c779e');
assert.strictEqual(auth.canonical_promotion_authorized,false);
assert.strictEqual(auth.ymaze_access_authorized,false);
assert.match(auth.official_execution_rule,/exactly one official execution/i);

assert.strictEqual(qualification.status,'passed');
assert.strictEqual(qualification.reference_outcomes_accessed,false);
assert.strictEqual(qualification.response_target_semantics_loaded,false);
assert.strictEqual(qualification.ymaze_accessed,false);

assert.throws(()=>est.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);
const policy=readJson(path.join(root,'hypotheses','p1_response_estimation_v1.json'));
assert.throws(()=>est.loadReferenceTarget(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/);

console.log('p1-highres-authorization.test.js PASS '+JSON.stringify({
  archived_authorization_blob:blob(archiveRel),
  active_authorization:false,
  historical_highres_authorized:auth.high_resolution_response_search_authorized,
  canonical_promotion:false,
  ymaze_access:false
}));
