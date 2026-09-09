'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const reportRel='reports/p3_response_estimation_1000x60_v1.json';
const provenanceRel='reports/p3_response_estimation_execution_provenance_v1.json';
const freezeRel='hypotheses/p3_response_estimation_result_freeze_v1.json';
const archiveRel='hypotheses/archive/p3_highres_authorization_v1.json';

assert.strictEqual(blob(reportRel),'264d822c7e6180dc0c9a3da1b8045df3f0e2a03d');
assert.strictEqual(sha256(reportRel),'55bffcd30c85e1a891879fd712f8332f119d191d5930fa4c4710ae9589c8e73b');
assert.strictEqual(fs.statSync(path.join(root,reportRel)).size,317685);
assert.strictEqual(blob(provenanceRel),'cd397bc5f7cd0f62ed12a0d741750d6700dbef10');
assert.strictEqual(sha256(provenanceRel),'668706dcd7de505fe956ed8de2db57b37753c5198fd281a66f92ea8ce8c65bed');
assert.strictEqual(fs.statSync(path.join(root,provenanceRel)).size,2533);
assert.strictEqual(blob(freezeRel),'aa69afda6d80cc9d4ea0b563470cffdf0762b941');
assert.strictEqual(blob(archiveRel),'04d2c7b454143fd7073b274bff0ec9b355ec058d');

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p3_highres_authorization_v1.json')),'active P3 authorization must be absent after result freeze');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p3-v033w-official-highres.yml')),'official P3 highres workflow must be retired after valid execution');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p3-v033x-materialize-result.yml')),'P3 result materializer must be retired before result-freeze qualification');

const report=readJson(path.join(root,reportRel));
const provenance=readJson(path.join(root,provenanceRel));
const freeze=readJson(path.join(root,freezeRel));

assert.strictEqual(report.status,'development_response_estimation_failed_dual_primary_survival_guard');
assert.strictEqual(report.execution_class,'frozen_high_resolution_response_search');
assert.strictEqual(report.scientific_evidence,true);
assert.strictEqual(report.reference_outcomes_accessed,true);
assert.strictEqual(report.response_target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(report.P1_official_result_semantics_loaded,false);
assert.strictEqual(report.P2_official_result_semantics_loaded,false);
assert.strictEqual(report.ymaze_accessed,false);
assert.strictEqual(report.canonical_locomotion_updated,false);
assert.strictEqual(report.H2_H3_H4_H5_refit,false);
assert.strictEqual(report.nuisance_parameters_estimated,false);

assert.strictEqual(report.search.P3_candidates_per_fold_total,1000);
assert.strictEqual(report.search.positive_P3_halton_candidates,999);
assert.strictEqual(report.search.absolute_benchmark_candidates_per_fold_total,1000);
assert.strictEqual(report.search.absolute_benchmark_positive_candidates,999);
assert.strictEqual(report.search.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(report.search.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(report.search.folds,6);
assert.strictEqual(report.search.root_fit_seed,6210000);
assert.strictEqual(report.search.root_evaluation_seed,6810000);
assert.strictEqual(report.search.common_random_numbers,true);
assert.strictEqual(report.search.response_rng,'none');

assert.strictEqual(report.internal_cv.P3_wins_vs_exact_null,4);
assert.strictEqual(report.internal_cv.P3_wins_vs_selected_absolute_benchmark,2);
assert.strictEqual(report.internal_cv.total_folds,6);
assert.strictEqual(report.internal_cv.canonical_null_survival_guard_passed,false);
assert.strictEqual(report.internal_cv.structural_increment_survival_guard_passed,false);
assert.strictEqual(report.internal_cv.P3_dual_survival_guard_passed,false);
assert(Math.abs(report.internal_cv.median_relative_improvement_vs_exact_null-0.2096536795073778)<1e-15);
assert(Math.abs(report.internal_cv.median_relative_improvement_vs_absolute_benchmark-(-1.0090708050960875))<1e-15);
assert.strictEqual(report.final_all_data_fit,null,'frozen policy forbids final all-data fit after dual survival failure');
assert.strictEqual(report.promotion.mechanism_survives_internal_development,false);
assert.strictEqual(report.promotion.fixed_parameter_pair_eligible_for_future_freeze,false);
assert.strictEqual(report.promotion.reason,'failed_dual_primary_survival_guard');
assert.strictEqual(report.promotion.canonical_promotion,false);
assert.strictEqual(report.promotion.ymaze_unlock,false);

const expectedFolds=[
  [0,0.0314004351087724,0.006409138732902495,0.028194375663801723,-0.11371273062403295,-3.8993221113427423,false,false],
  [7,0.24929899921720966,0.3186614691917888,0.409731937626747,0.39155585317268266,0.2176682049150812,true,true],
  [16,0.039988991802023685,0.04984574847556099,0.07230578220593327,0.446946142037002,0.19774518339051525,true,true],
  [20,0.07340642210998409,0.03123753307361924,0.0949545802651772,0.22693121379733472,-1.3499429976427098,true,false],
  [21,0.04504726564231232,0.018098224475209475,0.05577753229495619,0.19237614521742083,-1.4890433701945187,true,false],
  [27,0.2225809543607769,0.1334259318323087,0.05080229510642097,-3.381316904964882,-0.6681986125494653,false,false]
];
assert.strictEqual(report.folds.length,6);
for(let i=0;i<expectedFolds.length;i++){
  const [col,p3Loss,absLoss,nullLoss,relNull,relAbs,winNull,winAbs]=expectedFolds[i];
  const f=report.folds[i];
  assert.strictEqual(f.held_out_colony,col);
  assert(Math.abs(f.heldout_selected_P3.primary_loss-p3Loss)<1e-15);
  assert(Math.abs(f.heldout_selected_absolute_benchmark.primary_loss-absLoss)<1e-15);
  assert(Math.abs(f.heldout_exact_null.primary_loss-nullLoss)<1e-15);
  assert(Math.abs(f.heldout_relative_improvement_vs_exact_null-relNull)<1e-15);
  assert(Math.abs(f.heldout_relative_improvement_vs_absolute_benchmark-relAbs)<1e-15);
  assert.strictEqual(f.heldout_selected_P3.primary_loss<f.heldout_exact_null.primary_loss,winNull);
  assert.strictEqual(f.heldout_selected_P3.primary_loss<f.heldout_selected_absolute_benchmark.primary_loss,winAbs);
}

assert.strictEqual(provenance.id,'P3_official_high_resolution_execution_provenance_v1');
assert.strictEqual(provenance.status,'official_execution_completed_result_uninterpreted_at_provenance_write');
assert.strictEqual(provenance.github.run_id,34375376968);
assert.strictEqual(provenance.github.run_number,1);
assert.strictEqual(provenance.github.run_attempt,1);
assert.strictEqual(provenance.github.sha,'3ba8debdd6fe0c2b84a4f7c00a8d5a11f1fd614f');
assert.strictEqual(provenance.report.git_blob_sha,'264d822c7e6180dc0c9a3da1b8045df3f0e2a03d');
assert.strictEqual(provenance.report.sha256,'55bffcd30c85e1a891879fd712f8332f119d191d5930fa4c4710ae9589c8e73b');
assert.strictEqual(provenance.report.bytes,317685);
assert.strictEqual(provenance.report.status,report.status);
assert.deepStrictEqual(provenance.cli_parameter_overrides,[]);
assert.strictEqual(provenance.frozen_outcome_summary.P3_wins_vs_exact_null,4);
assert.strictEqual(provenance.frozen_outcome_summary.P3_wins_vs_selected_absolute_benchmark,2);
assert.strictEqual(provenance.frozen_outcome_summary.dual_survival_guard_passed,false);
assert.strictEqual(provenance.frozen_outcome_summary.fixed_parameter_pair_eligible_for_future_freeze,false);
assert.strictEqual(provenance.firewalls.P1_official_result_semantics_loaded,false);
assert.strictEqual(provenance.firewalls.P2_official_result_semantics_loaded,false);
assert.strictEqual(provenance.firewalls.ymaze_accessed,false);
assert.strictEqual(provenance.firewalls.canonical_locomotion_updated,false);
assert.strictEqual(provenance.firewalls.nuisance_parameters_estimated,false);
assert.strictEqual(provenance.firewalls.H2_H3_H4_H5_refit,false);
assert.strictEqual(provenance.interpretation_performed,false);
assert.strictEqual(provenance.canonical_promotion_performed,false);
assert.strictEqual(provenance.ymaze_unlock_performed,false);

assert.strictEqual(freeze.id,'P3_response_estimation_result_freeze_v1');
assert.strictEqual(freeze.status,'official_development_response_estimation_failed_dual_primary_survival_guard_frozen_p3_v1_closed');
assert.strictEqual(freeze.official_execution.github_run_id,34375376968);
assert.strictEqual(freeze.official_execution.github_run_number,1);
assert.strictEqual(freeze.official_execution.github_job_id,102546729771);
assert.strictEqual(freeze.official_execution.github_run_attempt,1);
assert.strictEqual(freeze.official_execution.artifact_id,10116473125);
assert.strictEqual(freeze.official_execution.artifact_digest,'sha256:03c55fbdef17515bbc48b2bb8561db8168c72c802f29d9ffc172869b9f305233');
assert.strictEqual(freeze.materialization.workflow_run_id,34394877521);
assert.strictEqual(freeze.materialization.workflow_job_id,102611978007);
assert.strictEqual(freeze.materialization.branch_commit_after_materialization,'589a71451ddf3ac88b54de717abb001c6d1a1246');
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.workflow_run_id,34375376751);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.workflow_run_number,150);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.conclusion,'success');
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.test_job_id,102546728256);
assert.strictEqual(freeze.permanent_main_checkpoint_of_valid_execution_commit.deploy_job_id,102547017012);
assert.strictEqual(freeze.dual_primary_survival_result.canonical_null_guard.heldout_wins,4);
assert.strictEqual(freeze.dual_primary_survival_result.structural_increment_absolute_benchmark_guard.heldout_wins,2);
assert.strictEqual(freeze.dual_primary_survival_result.required_minimum_wins_per_guard,5);
assert.strictEqual(freeze.dual_primary_survival_result.canonical_null_guard.guard_passed,false);
assert.strictEqual(freeze.dual_primary_survival_result.structural_increment_absolute_benchmark_guard.guard_passed,false);
assert.strictEqual(freeze.dual_primary_survival_result.dual_survival_guard_passed,false);
assert.strictEqual(freeze.dual_primary_survival_result.decision,'FAIL');
assert.strictEqual(freeze.downstream_frozen_consequences.final_all_data_fit_executed,false);
assert.strictEqual(freeze.downstream_frozen_consequences.identifiability_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.final_primary_increment_guard_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.final_secondary_promotion_guards_evaluated,false);
assert.strictEqual(freeze.downstream_frozen_consequences.mechanism_survives_internal_development,false);
assert.strictEqual(freeze.downstream_frozen_consequences.fixed_parameter_pair_eligible_for_future_freeze,false);
assert.strictEqual(freeze.downstream_frozen_consequences.canonical_locomotion_update_authorized,false);
assert.strictEqual(freeze.downstream_frozen_consequences.Y_maze_unlock_authorized,false);
assert.strictEqual(freeze.rerun_authorized,false);
assert.strictEqual(freeze.canonical_locomotion_changed,false);
assert.strictEqual(freeze.Y_maze_accessed,false);
assert.match(freeze.closure_rule,/P3-v1 response estimation is permanently closed/);
assert.match(freeze.closure_rule,/may not be rerun or rescued/);
assert.match(freeze.closure_rule,/new mechanism with a new pre-search policy/);

console.log('P3 response-estimation result freeze tests: PASS');
