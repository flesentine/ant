'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const close=(a,b,tol=1e-15)=>assert(Math.abs(a-b)<=tol,`${a} != ${b}`);

const reportRel='reports/p4_response_estimation_2000x60_v1.json';
const provenanceRel='reports/p4_response_estimation_execution_provenance_v1.json';
const freezeRel='hypotheses/p4_response_estimation_result_freeze_v1.json';
const archiveRel='hypotheses/archive/p4_highres_authorization_v1.json';

assert.strictEqual(blob(reportRel),'f3e61db9964c25b95d3bfc55d8aa7d52930a0b7f');
assert.strictEqual(sha256(reportRel),'0092dc672114371d43ae1b75a63ce48e03263e34a32dae12474780b735be191d');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,318152);
assert.strictEqual(blob(provenanceRel),'09078f08b94d4ac01f10a4ca73b03f7e3f9d50a5');
assert.strictEqual(sha256(provenanceRel),'12ea29cbfd7317614b39adcef3d0674e4ccd05737384985ec198549025b3904b');
assert.strictEqual(fs.statSync(path.join(root,provenanceRel)).size,2351);
assert.strictEqual(blob(freezeRel),'73f802be9dd9f21819649ab25323a9b3a92cff04');
assert.strictEqual(blob(archiveRel),'d8088ab94480faf0f5db012ca538bdc4d5a42ccb');
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p4_highres_authorization_v1.json')),'active P4 authorization must be absent after result freeze');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p4-v034g-official-highres.yml')),'official P4 one-shot workflow must be retired after valid execution');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p4-v034h-materialize-result.yml')),'one-time result materializer must be retired before qualification');

const report=readJson(path.join(root,reportRel));
const provenance=readJson(path.join(root,provenanceRel));
const freeze=readJson(path.join(root,freezeRel));

assert.strictEqual(report.status,'development_response_estimation_passed_and_parameter_triplet_eligible_for_future_freeze');
assert.strictEqual(report.execution_class,'frozen_high_resolution_response_search');
assert.strictEqual(report.scientific_evidence,true);
assert.strictEqual(report.reference_outcomes_accessed,true);
assert.strictEqual(report.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(report.P1_official_result_semantics_loaded,false);
assert.strictEqual(report.P2_official_result_semantics_loaded,false);
assert.strictEqual(report.P3_official_result_semantics_loaded,false);
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.canonical_locomotion_updated,false);
assert.strictEqual(report.H2_H3_H4_H5_refit,false);
assert.strictEqual(report.nuisance_parameters_estimated,false);
assert.strictEqual(report.search.P4_candidates_per_fold_total,2000);
assert.strictEqual(report.search.positive_P4_halton_candidates,1999);
assert.strictEqual(report.search.ungated_benchmark_candidates_per_fold_total,2000);
assert.strictEqual(report.search.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(report.search.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(report.search.folds,6);
assert.strictEqual(report.search.root_fit_seed,8210000);
assert.strictEqual(report.search.root_evaluation_seed,8810000);
assert.strictEqual(report.search.common_random_numbers,true);
assert.strictEqual(report.search.response_rng,'none');

assert.strictEqual(report.internal_cv.P4_wins_vs_exact_null,5);
assert.strictEqual(report.internal_cv.P4_wins_vs_selected_ungated_benchmark,5);
assert.strictEqual(report.internal_cv.total_folds,6);
assert.strictEqual(report.internal_cv.canonical_null_survival_guard_passed,true);
assert.strictEqual(report.internal_cv.structural_increment_survival_guard_passed,true);
assert.strictEqual(report.internal_cv.P4_dual_survival_guard_passed,true);
close(report.internal_cv.median_relative_improvement_vs_exact_null,0.38539021396028006);
close(report.internal_cv.median_relative_improvement_vs_ungated_benchmark,0.4048332663477944);

const expectedFolds=[
  [0,0.013655943726163243,0.030385114084009124,0.028194375663801723,0.5156500754263598,0.5505712537920006,true,true],
  [7,0.25366189871036027,0.30384552154333133,0.409731937626747,0.3809076730029321,0.16516163403716447,true,true],
  [16,0.04551148071579462,0.038175860099492115,0.07230578220593327,0.37056927776296106,-0.19215338167063575,true,false],
  [20,0.0152359934054379,0.054516151743751386,0.0949545802651772,0.8395444078327898,0.7205233143187836,true,true],
  [21,0.034031392116614656,0.0607735430066589,0.05577753229495619,0.38987275491762796,0.440029485974088,true,true],
  [27,0.0865193772695865,0.13725327102362497,0.05080229510642097,-0.7030604048172463,0.3696370467215008,false,true]
];
assert.strictEqual(report.folds.length,6);
for(let i=0;i<expectedFolds.length;i++){
  const [col,p4Loss,ungatedLoss,nullLoss,relNull,relUngated,winNull,winUngated]=expectedFolds[i];
  const f=report.folds[i];
  assert.strictEqual(f.held_out_colony,col);
  close(f.heldout_selected_P4.primary_loss,p4Loss);
  close(f.heldout_selected_ungated_benchmark.primary_loss,ungatedLoss);
  close(f.heldout_exact_null.primary_loss,nullLoss);
  close(f.heldout_relative_improvement_vs_exact_null,relNull);
  close(f.heldout_relative_improvement_vs_ungated_benchmark,relUngated);
  assert.strictEqual(f.heldout_selected_P4.primary_loss<f.heldout_exact_null.primary_loss,winNull);
  assert.strictEqual(f.heldout_selected_P4.primary_loss<f.heldout_selected_ungated_benchmark.primary_loss,winUngated);
}

const fit=report.final_all_data_fit;
assert.ok(fit,'dual survival pass must produce final all-data fit');
assert.strictEqual(fit.selected_P4_training_fit.candidate_index,307);
assert.strictEqual(fit.selected_P4_training_fit.source,'halton_P4');
close(fit.selected_P4_training_fit.candidate.sigma_field_mm,18.319554310908863);
close(fit.selected_P4_training_fit.candidate.kappa_trail_per_s,6.342935528120713);
close(fit.selected_P4_training_fit.candidate.theta_detect,0.9184);
close(fit.selected_P4_training_fit.loss,0.0004571615051027154);
assert.strictEqual(fit.identifiability.passed,true);
assert.strictEqual(fit.identifiability.exact_canonical_null_in_near_best_set,false);
assert.strictEqual(fit.identifiability.best_ungated_benchmark_outside_P4_near_best_tolerance,true);
close(fit.independent_final_check.selected_P4.primary_loss,0.006594757914079803);
close(fit.independent_final_check.selected_ungated_benchmark.primary_loss,0.025229600836192963);
close(fit.independent_final_check.exact_null.primary_loss,0.061743601665493385);
assert(fit.independent_final_check.selected_P4.primary_loss<fit.independent_final_check.selected_ungated_benchmark.primary_loss);
assert(fit.independent_final_check.selected_P4.primary_loss<fit.independent_final_check.exact_null.primary_loss);
assert.strictEqual(fit.independent_final_check.selected_P4.secondary_guard.passed,true);
for(const c of fit.independent_final_check.selected_P4.secondary_guard.components){assert(c.absolute_standardized_error<=1&&c.passed===true);}
assert.strictEqual(report.promotion.mechanism_survives_internal_development,true);
assert.strictEqual(report.promotion.fixed_parameter_triplet_eligible_for_future_freeze,true);
assert.strictEqual(report.promotion.reason,'all_frozen_internal_guards_passed');
assert.strictEqual(report.promotion.canonical_promotion,false);
assert.strictEqual(report.promotion.ymaze_unlock,false);

assert.strictEqual(provenance.id,'P4_official_high_resolution_execution_provenance_v1');
assert.strictEqual(provenance.status,'official_execution_completed_result_uninterpreted_at_provenance_write');
assert.strictEqual(provenance.github.run_id,34724113310);
assert.strictEqual(provenance.github.run_number,1);
assert.strictEqual(provenance.github.run_attempt,1);
assert.strictEqual(provenance.github.sha,'55ad9d1d7c794216c917012a94f4abe78a79d588');
assert.strictEqual(provenance.report.git_blob_sha,'f3e61db9964c25b95d3bfc55d8aa7d52930a0b7f');
assert.strictEqual(provenance.report.sha256,'0092dc672114371d43ae1b75a63ce48e03263e34a32dae12474780b735be191d');
assert.strictEqual(provenance.report.bytes,318152);
assert.strictEqual(provenance.report.status,report.status);
assert.deepStrictEqual(provenance.cli_parameter_overrides,[]);
assert.strictEqual(provenance.firewalls.P1_official_result_semantics_loaded,false);
assert.strictEqual(provenance.firewalls.P2_official_result_semantics_loaded,false);
assert.strictEqual(provenance.firewalls.P3_official_result_semantics_loaded,false);
assert.strictEqual(provenance.firewalls.ymaze_accessed,false);
assert.strictEqual(provenance.firewalls.canonical_locomotion_updated,false);
assert.strictEqual(provenance.firewalls.nuisance_parameters_estimated,false);
assert.strictEqual(provenance.firewalls.H2_H3_H4_H5_refit,false);
assert.strictEqual(provenance.interpretation_deferred,true);

assert.strictEqual(freeze.id,'P4_response_estimation_result_freeze_v1');
assert.strictEqual(freeze.status,'official_development_response_estimation_passed_all_internal_guards_parameter_triplet_frozen_for_future_independent_validation');
assert.strictEqual(freeze.official_execution.github_run_id,34724113310);
assert.strictEqual(freeze.official_execution.github_job_id,103635116514);
assert.strictEqual(freeze.official_execution.artifact_id,10309441871);
assert.strictEqual(freeze.official_execution.artifact_digest,'sha256:9f0d4c98a4bd7d3c0ebbb9b0beda8a46622868b79215fb9d427ad0c2bab3d400');
assert.strictEqual(freeze.materialization.workflow_run_id,34777225062);
assert.strictEqual(freeze.materialization.workflow_job_id,103777443484);
assert.strictEqual(freeze.materialization.branch_commit_after_materialization,'159346680e7cc5cc1ec5a9d7dcdb2fbd31d21e56');
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.workflow_run_id,34724113314);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.workflow_run_number,162);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.test_job_id,103635116564);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.deploy_job_id,103635191580);
assert.strictEqual(freeze.dual_primary_survival_result.canonical_null_guard.heldout_wins,5);
assert.strictEqual(freeze.dual_primary_survival_result.ungated_P3_structural_increment_guard.heldout_wins,5);
assert.strictEqual(freeze.dual_primary_survival_result.dual_survival_guard_passed,true);
assert.strictEqual(freeze.dual_primary_survival_result.decision,'PASS');
assert.strictEqual(freeze.frozen_parameter_triplet.candidate_index,307);
close(freeze.frozen_parameter_triplet.sigma_field_mm,18.319554310908863);
close(freeze.frozen_parameter_triplet.kappa_trail_per_s,6.342935528120713);
close(freeze.frozen_parameter_triplet.theta_detect,0.9184);
assert.strictEqual(freeze.identifiability_result.passed,true);
assert.strictEqual(freeze.independent_final_check.P4_strictly_better_than_both_primary_comparators,true);
assert.strictEqual(freeze.independent_final_check.P4_secondary_guard_passed,true);
assert.strictEqual(freeze.downstream_frozen_consequences.mechanism_survives_internal_development,true);
assert.strictEqual(freeze.downstream_frozen_consequences.fixed_parameter_triplet_is_frozen_by_this_record,true);
assert.strictEqual(freeze.downstream_frozen_consequences.future_target_ranked_refit_or_rescue_authorized,false);
assert.strictEqual(freeze.downstream_frozen_consequences.canonical_locomotion_update_authorized,false);
assert.strictEqual(freeze.downstream_frozen_consequences.cross_apparatus_validation_authorized,false);
assert.strictEqual(freeze.downstream_frozen_consequences.Y_maze_unlock_authorized,false);
assert.strictEqual(freeze.rerun_authorized,false);
assert.strictEqual(freeze.canonical_locomotion_changed,false);
assert.strictEqual(freeze.Y_maze_accessed,false);
assert.match(freeze.closure_rule,/permanently closed to rerun, rescue, retuning/i);
assert.match(freeze.closure_rule,/separately preregistered independent-validation stage/i);

console.log('p4-response-estimation-result-freeze.test.js PASS '+JSON.stringify({freeze_blob:blob(freezeRel),report_blob:blob(reportRel),report_sha256:sha256(reportRel),official_run:34724113310,wins_vs_null:5,wins_vs_ungated:5,candidate_index:307,sigma:fit.selected_P4_training_fit.candidate.sigma_field_mm,kappa:fit.selected_P4_training_fit.candidate.kappa_trail_per_s,theta:fit.selected_P4_training_fit.candidate.theta_detect,final_primary_loss:fit.independent_final_check.selected_P4.primary_loss,rerun_authorized:false,ymaze:false}));
