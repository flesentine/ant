'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const h5e=require('../tools/run-h5-estimation.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const policy=read('hypotheses/h5_parameter_estimation_v1.json');
const auth=read('hypotheses/h5_highres_authorization_v1.json');

assert.strictEqual(blob('hypotheses/h5_highres_authorization_v1.json'),'8741ebfff852d85b319ded5dd45f282d06f2c45e','H5 high-resolution authorization blob drifted');
assert.strictEqual(auth.id,'H5_high_resolution_authorization_v1');
assert.strictEqual(auth.status,'qualified_estimator_authorized_for_frozen_high_resolution_search');
assert.strictEqual(auth.high_resolution_search_authorized,true);
assert.strictEqual(auth.effective_when_merged_to_main,true);
assert.strictEqual(auth.policy_git_blob_sha,'ead45bacff89bf626deaaf3238a5c363b74279d1');
assert.strictEqual(auth.estimator_git_blob_sha,'7d4a68f024c09c111a38088be2c943b7de74b464');
assert.strictEqual(auth.qualified_estimator_merge_commit,'5c99c9e339582594597b21c2f34d1421e5802a21');
assert.strictEqual(auth.qualification_report.git_blob_sha,'da5afe375fccb54e38b9bf3ef6d9879e2e03270d');
assert.strictEqual(auth.qualification_report.status,'passed');
assert.strictEqual(auth.qualification_report.reference_outcomes_accessed,false);
assert.strictEqual(auth.qualification_report.ymaze_accessed,false);
assert.strictEqual(auth.merged_main_verification.run_id,33946221387);
assert.strictEqual(auth.merged_main_verification.test_job_conclusion,'success');

assert.strictEqual(auth.chromium_qualification_audits.length,2);
assert.deepStrictEqual(auth.chromium_qualification_audits.map(x=>x.attempt),[1,2]);
for(const a of auth.chromium_qualification_audits){
  assert.strictEqual(a.parity_cases,8);
  assert.strictEqual(a.exceptions,0);
  assert.strictEqual(a.console_errors,0);
  assert.strictEqual(a.ymaze_requests,0);
}
assert.strictEqual(auth.chromium_qualification_audits[1].artifact_digest,'sha256:c75cd14ea8d44e7165e5ba29e31224b083bcdeebc7c0e4d9cc8cf64ae28834a2');

const x=auth.authorized_frozen_execution;
assert.strictEqual(x.physics_dt_s,0.02);
assert.strictEqual(x.folds,6);
assert.strictEqual(x.H5_null_candidates_per_fold,500);
assert.strictEqual(x.H5_context_candidates_per_fold_total,500);
assert.strictEqual(x.context_halton_candidates_per_fold,499);
assert.strictEqual(x.exact_null_anchor_per_fold,1);
assert.strictEqual(x.training_trials_per_condition_per_candidate,60);
assert.strictEqual(x.heldout_evaluation_trials_per_condition,120);
assert.strictEqual(x.root_seed,1110000);
assert.deepStrictEqual(x.fit_targets,['time_to_exit_s','middle_zone_fraction','beeline_mm','exit_edge']);

assert.strictEqual(policy.estimator_implementation_gate.high_resolution_search_authorized,false,'historical frozen policy must remain unchanged');
assert.strictEqual(auth.canonical_promotion_authorized,false);
assert.strictEqual(auth.ymaze_access_authorized,false);
assert.ok(!fs.existsSync(path.join(root,'reports','h5_parameter_estimation_500x60_v1.json')),'authorization checkpoint must precede the official H5 high-resolution result');

assert.throws(()=>h5e.assertHighResolutionAuthorized(root),/not effective until merged to main/);
const verified=h5e.assertHighResolutionAuthorized(root,null,{branchName:'main'});
assert.strictEqual(verified.estimator_git_blob_sha,auth.estimator_git_blob_sha);
assert.strictEqual(auth.authorization_gate_hardening.main_branch_required,true);
assert.strictEqual(verified.high_resolution_search_authorized,true);

console.log('h5-highres-authorization.test.js PASS authorization_blob=d3d2d61dab1337c321e9a3bf0eaae704ef152706');
