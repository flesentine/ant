'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p2-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const reportRel='reports/p2_response_estimation_1000x60_v1.json';
const provenanceRel='reports/p2_response_estimation_execution_provenance_v1.json';
const freezeRel='hypotheses/p2_response_estimation_result_freeze_v1.json';
const archiveRel='hypotheses/archive/p2_highres_authorization_v1.json';

assert.strictEqual(blob(reportRel),'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(sha256(reportRel),'bb11e17b1f0919682a57cdc4a396adde807239476216953c2f06e99cf61688c4');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,332793);
assert.strictEqual(blob(provenanceRel),'4a9a705c0ab8e9b64534a35f90f1017bf70c4a06');
assert.strictEqual(sha256(provenanceRel),'e3a4106aa6c82b439640aa196182141513d4179798b0a03e97534bec28ef3cbd');
assert.strictEqual(fs.statSync(path.join(root,provenanceRel)).size,2000);
assert.strictEqual(blob(freezeRel),'088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(blob(archiveRel),'de361b15b9600bd92a35baf30fa71c2a7c61003c');

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p2_highres_authorization_v1.json')),'active P2 authorization must be absent after result freeze');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p2-v033o-official-highres.yml')),'official P2 highres workflow must be retired after valid execution');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p2-v033p-materialize-result.yml')),'P2 result materializer must be retired');

const report=readJson(path.join(root,reportRel));
const provenance=readJson(path.join(root,provenanceRel));
const freeze=readJson(path.join(root,freezeRel));

assert.strictEqual(report.status,'development_response_estimation_failed_dual_primary_survival_guard');
assert.strictEqual(report.execution_class,'frozen_high_resolution_response_search');
assert.strictEqual(report.scientific_evidence,true);
assert.strictEqual(report.reference_outcomes_accessed,true);
assert.strictEqual(report.P1_official_result_semantics_loaded,false);
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.canonical_locomotion_updated,false);
assert.strictEqual(report.H2_H3_H4_H5_refit,false);
assert.strictEqual(report.Candidate_B_implemented,false);
assert.strictEqual(report.nuisance_parameters_estimated,false);
assert.strictEqual(report.internal_cv.P2_wins_vs_exact_null,4);
assert.strictEqual(report.internal_cv.P2_wins_vs_selected_no_lapse,4);
assert.strictEqual(report.internal_cv.total_folds,6);
assert.strictEqual(report.internal_cv.canonical_null_survival_guard_passed,false);
assert.strictEqual(report.internal_cv.structural_increment_survival_guard_passed,false);
assert.strictEqual(report.internal_cv.P2_dual_survival_guard_passed,false);
assert.strictEqual(report.internal_cv.canonical_promotion,false);
assert(Math.abs(report.internal_cv.median_relative_improvement_vs_exact_null-0.38010077026652644)<1e-15);
assert(Math.abs(report.internal_cv.median_relative_improvement_vs_no_lapse-0.09289481727992745)<1e-15);
assert.strictEqual(report.final_all_data_fit,null,'frozen policy forbids final all-data fit after dual survival failure');
assert.strictEqual(report.promotion.mechanism_survives_internal_development,false);
assert.strictEqual(report.promotion.fixed_parameter_triple_eligible_for_future_freeze,false);
assert.strictEqual(report.promotion.reason,'failed_dual_primary_survival_guard');
assert.strictEqual(report.promotion.canonical_promotion,false);
assert.strictEqual(report.promotion.ymaze_unlock,false);

const expectedFolds=[
  [0,-1.0716372422770974,-1.7154756752849618],
  [7,0.4477889980179716,0.18425168496691216],
  [16,0.5816518497443287,0.43895090077311233],
  [20,0.5835237047504988,0.0015379495929427362],
  [21,0.3124125425150812,-0.16151158837863555],
  [27,-0.3622816385807032,0.4471615555520731]
];
assert.strictEqual(report.folds.length,6);
for(let i=0;i<expectedFolds.length;i++){
  const [col,relNull,relNl]=expectedFolds[i],f=report.folds[i];
  assert.strictEqual(f.held_out_colony,col);
  assert(Math.abs(f.heldout_relative_improvement_vs_exact_null-relNull)<1e-15);
  assert(Math.abs(f.heldout_relative_improvement_vs_no_lapse-relNl)<1e-15);
}

assert.strictEqual(provenance.id,'P2_official_high_resolution_execution_provenance_v1');
assert.strictEqual(provenance.status,'official_execution_completed_result_uninterpreted_at_provenance_write');
assert.strictEqual(provenance.github.run_id,34190528101);
assert.strictEqual(provenance.github.run_number,2);
assert.strictEqual(provenance.github.run_attempt,1);
assert.strictEqual(provenance.github.sha,'23ab4e76f4db825262e4390ff725f789e4c50b41');
assert.strictEqual(provenance.report.git_blob_sha,'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(provenance.report.sha256,'bb11e17b1f0919682a57cdc4a396adde807239476216953c2f06e99cf61688c4');
assert.strictEqual(provenance.report.bytes,332793);
assert.strictEqual(provenance.report.status,report.status);
assert.deepStrictEqual(provenance.cli_parameter_overrides,[]);
assert.strictEqual(provenance.firewalls.P1_official_result_semantics_loaded,false);
assert.strictEqual(provenance.firewalls.ymaze_accessed,false);
assert.strictEqual(provenance.firewalls.Candidate_B_implemented,false);
assert.strictEqual(provenance.firewalls.canonical_locomotion_updated,false);
assert.strictEqual(provenance.firewalls.nuisance_parameters_estimated,false);
assert.strictEqual(provenance.firewalls.H2_H3_H4_H5_refit,false);
assert.strictEqual(provenance.interpretation_performed,false);
assert.strictEqual(provenance.canonical_promotion_performed,false);
assert.strictEqual(provenance.ymaze_unlock_performed,false);

assert.strictEqual(freeze.id,'P2_response_estimation_result_freeze_v1');
assert.strictEqual(freeze.status,'official_development_response_estimation_failed_dual_primary_survival_guard_frozen_p2_v1_closed');
assert.strictEqual(freeze.official_execution.github_run_id,34190528101);
assert.strictEqual(freeze.official_execution.github_run_number,2);
assert.strictEqual(freeze.official_execution.github_job_id,101947484122);
assert.strictEqual(freeze.official_execution.github_run_attempt,1);
assert.strictEqual(freeze.official_execution.artifact_id,10042834346);
assert.strictEqual(freeze.official_execution.artifact_digest,'sha256:228f3ff98dde77b7a0083bbe20a06c6827c033bdee662bfb044ca7d2136334a4');
assert.strictEqual(freeze.official_execution.report_git_blob_sha,'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(freeze.official_execution.report_sha256,'bb11e17b1f0919682a57cdc4a396adde807239476216953c2f06e99cf61688c4');
assert.strictEqual(freeze.official_execution.execution_provenance_git_blob_sha,'4a9a705c0ab8e9b64534a35f90f1017bf70c4a06');
assert.strictEqual(freeze.invalidated_preexecution_attempt.github_run_id,34189985353);
assert.strictEqual(freeze.invalidated_preexecution_attempt.scientific_execution_started,false);
assert.strictEqual(freeze.invalidated_preexecution_attempt.response_target_semantics_loaded,false);
assert.strictEqual(freeze.invalidated_preexecution_attempt.candidate_search_started,false);
assert.strictEqual(freeze.invalidated_preexecution_attempt.artifacts_uploaded,0);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.workflow_run_id,34190528147);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.workflow_run_number,142);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.conclusion,'success');
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.test_job_id,101947484681);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.deploy_job_id,101947626365);
assert.strictEqual(freeze.dual_primary_survival_result.canonical_null_guard.heldout_wins,4);
assert.strictEqual(freeze.dual_primary_survival_result.structural_increment_no_lapse_guard.heldout_wins,4);
assert.strictEqual(freeze.dual_primary_survival_result.required_minimum_wins_per_guard,5);
assert.strictEqual(freeze.dual_primary_survival_result.canonical_null_guard.guard_passed,false);
assert.strictEqual(freeze.dual_primary_survival_result.structural_increment_no_lapse_guard.guard_passed,false);
assert.strictEqual(freeze.dual_primary_survival_result.dual_survival_guard_passed,false);
assert.strictEqual(freeze.dual_primary_survival_result.decision,'FAIL');
assert.strictEqual(freeze.downstream_frozen_consequences.final_all_data_fit_executed,false);
assert.strictEqual(freeze.downstream_frozen_consequences.identifiability_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.final_primary_increment_guard_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.final_secondary_promotion_guards_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.mechanism_survives_internal_development,false);
assert.strictEqual(freeze.downstream_frozen_consequences.fixed_parameter_triple_eligible_for_future_freeze,false);
assert.strictEqual(freeze.downstream_frozen_consequences.canonical_locomotion_update_authorized,false);
assert.strictEqual(freeze.downstream_frozen_consequences.Candidate_B_authorized,false);
assert.strictEqual(freeze.downstream_frozen_consequences.Y_maze_unlock_authorized,false);
assert.strictEqual(freeze.rerun_authorized,false);
assert.strictEqual(freeze.canonical_locomotion_changed,false);
assert.strictEqual(freeze.Candidate_B_implemented,false);
assert.strictEqual(freeze.Y_maze_accessed,false);
assert.match(freeze.closure_rule,/P2-v1 response estimation is permanently closed/);
assert.match(freeze.closure_rule,/may not be retuned/);

assert.throws(()=>est.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);

console.log('p2-response-estimation-result-freeze.test.js PASS '+JSON.stringify({
  freeze_blob:blob(freezeRel),
  report_blob:blob(reportRel),
  report_sha256:sha256(reportRel),
  official_run:provenance.github.run_id,
  wins_vs_null:report.internal_cv.P2_wins_vs_exact_null,
  wins_vs_no_lapse:report.internal_cv.P2_wins_vs_selected_no_lapse,
  median_vs_null:report.internal_cv.median_relative_improvement_vs_exact_null,
  median_vs_no_lapse:report.internal_cv.median_relative_improvement_vs_no_lapse,
  dual_survival:false,
  rerun_authorized:false,
  candidate_B:false,
  ymaze:false
}));
