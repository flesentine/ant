'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const h5e=require('../tools/run-h5-estimation.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const report=read('reports/h5_parameter_estimation_500x60_v1.json');
const freeze=read('hypotheses/h5_result_freeze_v1.json');
const decision=read('hypotheses/open_arena_locomotion_context_v1.json');
const h5=decision.hypotheses.find(x=>x.id==='H5_transient_entry_heading_restoration');

assert.strictEqual(blob('reports/h5_parameter_estimation_500x60_v1.json'),'1fcdb357e1755b5ba5cb4be6ee8b69db617e732d','official H5 result blob drifted');
assert.strictEqual(sha256('reports/h5_parameter_estimation_500x60_v1.json'),'28bcbcb4782dac05606f3c204fe661f5503d2a93ecfefa6fc2c27b719e885053','official H5 result SHA-256 drifted');
assert.strictEqual(report.status,'development_estimation_failed_development_preference_guards');
assert.strictEqual(report.execution_class,'frozen_high_resolution');
assert.strictEqual(report.scientific_evidence,true);
assert.strictEqual(report.execution.repo_commit,'6087cc044faae586af826f44297e85212d1941a0');
assert.strictEqual(report.estimator_git_blob_sha,'7d4a68f024c09c111a38088be2c943b7de74b464');
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.canonical_parameters_updated,false);
assert.strictEqual(report.internal_cv.H5_wins_vs_H5_null,3);
assert.strictEqual(report.internal_cv.H5_survival_guard_passed,false);
assert.strictEqual(report.internal_cv.H5_wins_vs_best_prior,2);
assert.strictEqual(report.internal_cv.best_prior_guard_passed,false);
assert.strictEqual(report.internal_cv.development_preferred,false);
assert.strictEqual(report.internal_cv.canonical_promotion,false);
assert(Math.abs(report.internal_cv.median_relative_improvement_vs_H5_null-0.008101077922930614)<1e-15);
assert(Math.abs(report.internal_cv.median_relative_improvement_vs_best_prior+0.07119343908229395)<1e-15);
assert.deepStrictEqual(report.identifiability.null_anchor_selected_folds,[16]);

assert.strictEqual(freeze.status,'official_high_resolution_result_frozen_failed_closed');
assert.strictEqual(freeze.result.git_blob_sha,'1fcdb357e1755b5ba5cb4be6ee8b69db617e732d');
assert.strictEqual(freeze.result.sha256,'28bcbcb4782dac05606f3c204fe661f5503d2a93ecfefa6fc2c27b719e885053');
assert.strictEqual(freeze.official_execution.run_id,33947883644);
assert.strictEqual(freeze.official_execution.attempt,1);
assert.strictEqual(freeze.posthoc_integrity_audit.run_id,33979167192);
assert.strictEqual(freeze.posthoc_integrity_audit.all_six_fold_losses_reproduced_exactly,true);
assert.strictEqual(freeze.posthoc_integrity_audit.chromium_parity_cases,48);
assert.strictEqual(freeze.posthoc_integrity_audit.browser_exceptions,0);
assert.strictEqual(freeze.posthoc_integrity_audit.console_errors,0);
assert.strictEqual(freeze.posthoc_integrity_audit.ymaze_requests,0);
assert.strictEqual(freeze.posthoc_integrity_audit.result_invalidated,false);
assert.strictEqual(freeze.closure.H5_v1_closed,true);
assert.strictEqual(freeze.closure.retuning_authorized,false);
assert.strictEqual(freeze.closure.rerun_authorized,false);
assert.strictEqual(freeze.closure.canonical_promotion_authorized,false);
assert.strictEqual(freeze.closure.ymaze_unlock_authorized,false);

assert.ok(!fs.existsSync(path.join(root,'hypotheses/h5_highres_authorization_v1.json')),'active H5 authorization must be removed after result freeze');
assert.strictEqual(blob('hypotheses/archive/h5_highres_authorization_v1.json'),'24b3c422f40bc4c44437995eff81ecdfd104ca34','archived H5 authorization blob drifted');
assert.ok(!fs.existsSync(path.join(root,'.github/workflows/h5-official-highres.yml')),'official H5 execution workflow must be removed after valid result freeze');
assert.throws(()=>h5e.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);

assert.strictEqual(decision.schema_version,11);
assert.strictEqual(h5.status,'official_high_resolution_failed_frozen_closed');
assert.strictEqual(h5.selection_status,'not_promoted');
assert.strictEqual(h5.high_resolution_search_authorized,false);
assert.strictEqual(h5.closed,true);
assert.strictEqual(h5.result_git_blob_sha,'1fcdb357e1755b5ba5cb4be6ee8b69db617e732d');
assert.strictEqual(h5.result_sha256,'28bcbcb4782dac05606f3c204fe661f5503d2a93ecfefa6fc2c27b719e885053');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(html.includes('H5-v1 failed promotion'));
assert.ok(html.includes('official result frozen'));
assert.ok(html.includes('H5-v1 closed'));
assert.ok(!html.includes('official search not yet run'));

console.log('h5-result-freeze.test.js PASS '+JSON.stringify({result_blob:freeze.result.git_blob_sha,sha256:freeze.result.sha256,H5_wins_vs_null:3,H5_wins_vs_best_prior:2,chromium_cases:48}));
