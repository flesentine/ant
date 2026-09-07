'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const reportRel='reports/p2_estimator_qualification_v1.json';
const freezeRel='hypotheses/p2_estimator_qualification_result_freeze_v1.json';
const q=read(reportRel),f=read(freezeRel);

assert.strictEqual(blob(reportRel),'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(sha256(reportRel),'22cd65ffbf3adbfd88fb3998ba4ab41e142b52b2b19d8aa2460ab2d9c42596a2');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,2902);
assert.strictEqual(blob(freezeRel),'1d46b594cb154a93c2e321fb67d399acdd821993');

assert.strictEqual(q.qualification_id,'P2_estimator_synthetic_qualification_v1');
assert.strictEqual(q.status,'passed');
assert.strictEqual(q.scientific_evidence,false);
assert.strictEqual(q.reference_outcomes_accessed,false);
assert.strictEqual(q.response_target_semantics_loaded,false);
assert.strictEqual(q.response_target_hash_verified_only,true);
assert.strictEqual(q.P1_official_result_semantics_loaded,false);
assert.strictEqual(q.ymaze_accessed,false);
assert.strictEqual(q.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(q.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(q.response_target_git_blob_sha_verified,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(q.trials_per_treatment_path,2);
assert.strictEqual(Object.keys(q.checks).length,20);
for(const [k,v] of Object.entries(q.checks))assert.strictEqual(v,true,k+' must remain true');

assert.strictEqual(f.id,'P2_estimator_qualification_result_freeze_v1');
assert.strictEqual(f.status,'qualified_reference_free_estimator_frozen_high_resolution_not_authorized');
assert.strictEqual(f.audit.tested_head,'cdbce7c9254b607012caf12f734256683f34b8f4');
assert.strictEqual(f.audit.github_run_id,34091953598);
assert.strictEqual(f.audit.github_job_id,101647130672);
assert.strictEqual(f.audit.github_run_attempt,1);
assert.strictEqual(f.audit.artifact_id,10007145009);
assert.strictEqual(f.audit.artifact_digest,'sha256:05e0f6a95c0059efc27955c00ebf5e429cd7561fe5412d20c900d4fdc64b9137');
assert.strictEqual(f.qualification_report.git_blob_sha,'9f4d15875b35773b41696987abd1cc4721435bc2');
assert.strictEqual(f.qualification_report.sha256,'22cd65ffbf3adbfd88fb3998ba4ab41e142b52b2b19d8aa2460ab2d9c42596a2');
assert.strictEqual(f.qualification_report.bytes,2902);
assert.strictEqual(f.sidecars.chromium_parity_cases,10);
assert.strictEqual(f.sidecars.browser_exceptions,0);
assert.strictEqual(f.sidecars.browser_console_errors,0);
assert.strictEqual(f.sidecars.browser_response_target_requests,0);
assert.strictEqual(f.sidecars.browser_ymaze_requests,0);
assert.strictEqual(f.sidecars.browser_p2_authorization_requests,0);
assert.strictEqual(f.frozen_chain.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(f.frozen_chain.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(f.frozen_chain.p2_runtime_git_blob_sha,'f91a2f7ede1b8119acc1fd57ac94a9718d074e15');
assert.strictEqual(f.frozen_chain.p2_model_git_blob_sha,'7d3eecc44cb2eaf727249083a6fcfa21986fd475');
assert.strictEqual(f.frozen_chain.reachability_result_freeze_git_blob_sha,'8dddaf083d4af046051fc1b7412b9f22cda8618a');
assert.strictEqual(f.frozen_chain.response_target_git_blob_sha_verified_only,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
for(const [k,v] of Object.entries(f.qualified_checks))assert.strictEqual(v,true,k+' must remain true');
assert.strictEqual(f.qualification_consequence.estimator_reference_free_qualified,true);
assert.strictEqual(f.qualification_consequence.response_target_semantic_access_authorized,false);
assert.strictEqual(f.qualification_consequence.high_resolution_response_search_authorized,false);
assert.strictEqual(f.qualification_consequence.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(f.qualification_consequence.canonical_update_authorized,false);
assert.strictEqual(f.qualification_consequence.Candidate_B_authorized,false);
assert.strictEqual(f.qualification_consequence.Y_maze_access_authorized,false);
assert.match(f.next_gate,/separate post-qualification authorization freeze/i);

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p2_highres_authorization_v1.json')),'P2 highres authorization must remain absent after qualification freeze');

console.log('p2-estimator-qualification-result.test.js PASS '+JSON.stringify({
  freeze_blob:blob(freezeRel),
  qualification_blob:blob(reportRel),
  qualification_sha256:sha256(reportRel),
  official_run:f.audit.github_run_id,
  checks:Object.keys(q.checks).length,
  chromium_cases:f.sidecars.chromium_parity_cases,
  highres_authorized:false,
  target_semantics:false,
  ymaze:false
}));
