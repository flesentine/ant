'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p1-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const reportRel='reports/p1_response_estimation_500x60_v1.json';
const provenanceRel='reports/p1_response_estimation_execution_provenance_v1.json';
const freezeRel='hypotheses/p1_response_estimation_result_freeze_v1.json';
const archiveRel='hypotheses/archive/p1_highres_authorization_v1.json';

assert.strictEqual(blob(reportRel),'561aca4a14346ebb4f062f30d0438d3115784172');
assert.strictEqual(sha256(reportRel),'4e3de4c1fb35465a877fbc78b8ce178763b5bcb968af05d66085186a93a3facf');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,174770);
assert.strictEqual(blob(provenanceRel),'6afe2727a88b7294d2bd09b8704755a5a355826a');
assert.strictEqual(sha256(provenanceRel),'96b86db1070c221a0e5040b2f05ebab40303c7ee3a0b486133a181f56e4d5e93');
assert.strictEqual(blob(freezeRel),'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(blob(archiveRel),'7e77c5b1b9a6de9d665ff2be55c0780cc7d24d9c');

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p1_highres_authorization_v1.json')),'active P1 authorization must be absent after result freeze');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p1-v033g-official-highres.yml')),'official P1 highres workflow must be retired after valid execution');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p1-v033h-materialize-result.yml')),'one-time result materializer must be retired');

const report=readJson(path.join(root,reportRel));
const provenance=readJson(path.join(root,provenanceRel));
const freeze=readJson(path.join(root,freezeRel));

assert.strictEqual(report.status,'development_response_estimation_failed_primary_survival_guard');
assert.strictEqual(report.execution_class,'frozen_high_resolution_response_search');
assert.strictEqual(report.scientific_evidence,true);
assert.strictEqual(report.reference_outcomes_accessed,true);
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.canonical_locomotion_updated,false);
assert.strictEqual(report.H2_H3_H4_H5_refit,false);
assert.strictEqual(report.nuisance_parameters_estimated,false);
assert.strictEqual(report.internal_cv.P1_wins_vs_exact_null,4);
assert.strictEqual(report.internal_cv.total_folds,6);
assert.strictEqual(report.internal_cv.P1_survival_guard_passed,false);
assert.strictEqual(report.internal_cv.canonical_promotion,false);
assert(Math.abs(report.internal_cv.median_relative_improvement_vs_exact_null-0.26132694328143546)<1e-15);
assert.strictEqual(report.final_all_data_fit,null,'frozen policy forbids final all-data fit after primary survival failure');
assert.strictEqual(report.promotion.mechanism_survives_internal_development,false);
assert.strictEqual(report.promotion.fixed_parameter_pair_eligible_for_future_v0_4_freeze,false);
assert.strictEqual(report.promotion.reason,'failed_primary_survival_guard');

assert.strictEqual(provenance.id,'P1_official_high_resolution_execution_provenance_v1');
assert.strictEqual(provenance.status,'official_execution_completed');
assert.strictEqual(provenance.repo_commit,'4da2101267093ead0e3f2569b28940f49f89a552');
assert.strictEqual(provenance.github_run_id,34081980126);
assert.strictEqual(provenance.github_run_attempt,1);
assert.strictEqual(provenance.report_sha256,'4e3de4c1fb35465a877fbc78b8ce178763b5bcb968af05d66085186a93a3facf');
assert.strictEqual(provenance.report_bytes,174770);
assert.strictEqual(provenance.report_status,report.status);
assert.strictEqual(provenance.ymaze_accessed,false);
assert.strictEqual(provenance.canonical_locomotion_updated,false);

assert.strictEqual(freeze.id,'P1_response_estimation_result_freeze_v1');
assert.strictEqual(freeze.status,'official_development_response_estimation_failed_primary_survival_guard_frozen_p1_v1_closed');
assert.strictEqual(freeze.official_execution.github_run_id,34081980126);
assert.strictEqual(freeze.official_execution.github_job_id,101618864436);
assert.strictEqual(freeze.official_execution.github_run_attempt,1);
assert.strictEqual(freeze.official_execution.artifact_id,10004082907);
assert.strictEqual(freeze.official_execution.artifact_digest,'sha256:e8ad929fca97a5c2d7b74147434ee81ef5ba8fd3b0ab1f44609e566f1769f3c7');
assert.strictEqual(freeze.official_execution.report_git_blob_sha,'561aca4a14346ebb4f062f30d0438d3115784172');
assert.strictEqual(freeze.official_execution.report_sha256,'4e3de4c1fb35465a877fbc78b8ce178763b5bcb968af05d66085186a93a3facf');
assert.strictEqual(freeze.primary_survival_result.heldout_wins_vs_exact_null,4);
assert.strictEqual(freeze.primary_survival_result.required_minimum_wins,5);
assert.strictEqual(freeze.primary_survival_result.primary_survival_guard_passed,false);
assert.strictEqual(freeze.primary_survival_result.decision,'FAIL');
assert.strictEqual(freeze.downstream_frozen_consequences.final_all_data_fit_executed,false);
assert.strictEqual(freeze.downstream_frozen_consequences.identifiability_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.final_secondary_promotion_guards_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.mechanism_survives_internal_development,false);
assert.strictEqual(freeze.downstream_frozen_consequences.fixed_parameter_pair_eligible_for_future_v0_4_freeze,false);
assert.strictEqual(freeze.downstream_frozen_consequences.canonical_locomotion_update_authorized,false);
assert.strictEqual(freeze.downstream_frozen_consequences.ymaze_unlock_authorized,false);
assert.strictEqual(freeze.rerun_authorized,false);
assert.strictEqual(freeze.canonical_locomotion_changed,false);
assert.strictEqual(freeze.ymaze_accessed,false);
assert.match(freeze.closure_rule,/P1-v1 response estimation is closed/);

assert.throws(()=>est.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);

console.log('p1-response-estimation-result-freeze.test.js PASS '+JSON.stringify({
  freeze_blob:blob(freezeRel),
  report_blob:blob(reportRel),
  report_sha256:sha256(reportRel),
  official_run:provenance.github_run_id,
  wins_vs_null:report.internal_cv.P1_wins_vs_exact_null,
  median_relative_improvement:report.internal_cv.median_relative_improvement_vs_exact_null,
  survival:false,
  rerun_authorized:false,
  ymaze_accessed:false
}));
