'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const h5e=require('../tools/run-h5-estimation.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

assert.ok(!fs.existsSync(path.join(root,'hypotheses','h5_highres_authorization_v1.json')),'active authorization must not survive a valid frozen result');
const auth=read('hypotheses/archive/h5_highres_authorization_v1.json');
assert.strictEqual(blob('hypotheses/archive/h5_highres_authorization_v1.json'),'24b3c422f40bc4c44437995eff81ecdfd104ca34');
assert.strictEqual(auth.id,'H5_high_resolution_authorization_v1');
assert.strictEqual(auth.high_resolution_search_authorized,true,'archived record must preserve historical authorization truth');
assert.strictEqual(auth.estimator_git_blob_sha,'7d4a68f024c09c111a38088be2c943b7de74b464');
assert.strictEqual(auth.canonical_promotion_authorized,false);
assert.strictEqual(auth.ymaze_access_authorized,false);
assert.throws(()=>h5e.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);
console.log('h5-highres-authorization.test.js PASS archived_authorization_blob=24b3c422f40bc4c44437995eff81ecdfd104ca34 active_authorization=false');
