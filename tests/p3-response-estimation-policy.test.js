'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p3_response_estimation_v1.json';
const p=read(rel);
assert.strictEqual(blob(rel),'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(p.id,'P3_response_estimation_v1');
assert.strictEqual(p.status,'development_response_estimation_policy_frozen_before_estimator_implementation_or_response_target_semantic_access');
assert.strictEqual(p.freeze_date_local,'2026-09-08');

const pins={
  'hypotheses/p3_painted_trail_candidate_class_decision_v1.json':'e8da07f6f73934e0120fd41d4668ae4039108336',
  'hypotheses/p3_painted_trail_mechanism_v1.json':'5d00ce0058ff388c9f57d7dce56ce465d82c5765',
  'hypotheses/p3_reachability_execution_v1.json':'55494a3190964d24ded2ae0d1faf3b355cc7835f',
  'hypotheses/p3_implementation_authorization_v1.json':'128afcbdb10d3254240c5074e1e997cee7d7fe51',
  'hypotheses/p3_reachability_result_freeze_v1.json':'b3fa56386f71b0cea1dd8cfec032148c42af1b6d',
  'reports/p3_reference_free_reachability_v1.json':'a18d5cd360be79bf1a05d3fe3e2c26fd1d6c86f6',
  'src/p3.js':'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8',
  'models/lasius_niger_painted_trail_p3_v1.json':'9107de0c71641c4037bbedbb498b9fa868c1ef00',
  'src/p1.js':'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca',
  'hypotheses/p1_response_estimation_result_freeze_v1.json':'1d99ebfaa378aeb1b98963f63b3a513a616a6617',
  'hypotheses/p2_response_estimation_result_freeze_v1.json':'088316e1746594f9b3f700cb277a83eb53fdd9f6',
  'reference/poissonnier2026_pheromone_response_targets.json':'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed',
  'models/lasius_niger_locomotion_v1.json':'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d',
  'src/sim-core.js':'24777aac3577d442893e4779d70aee4e27761fe8',
  'src/integrity.js':'f23c68a6955832b70eeb3bd3e6893d71a3759018'
};
for(const[relPath,sha]of Object.entries(pins))assert.strictEqual(blob(relPath),sha,relPath+' pin');

assert.strictEqual(p.frozen_inputs.candidate_class_decision.git_blob_sha,pins['hypotheses/p3_painted_trail_candidate_class_decision_v1.json']);
assert.strictEqual(p.frozen_inputs.mechanism_freeze.git_blob_sha,pins['hypotheses/p3_painted_trail_mechanism_v1.json']);
assert.strictEqual(p.frozen_inputs.reachability_execution_policy.git_blob_sha,pins['hypotheses/p3_reachability_execution_v1.json']);
assert.strictEqual(p.frozen_inputs.implementation_authorization.git_blob_sha,pins['hypotheses/p3_implementation_authorization_v1.json']);
assert.strictEqual(p.frozen_inputs.reachability_result_freeze.git_blob_sha,pins['hypotheses/p3_reachability_result_freeze_v1.json']);
assert.strictEqual(p.frozen_inputs.reachability_report.git_blob_sha,pins['reports/p3_reference_free_reachability_v1.json']);
assert.strictEqual(p.frozen_inputs.reachability_report.sha256,'6f5fb55db24015e8822ebc6bdad0c8e76d00d19514e77e0e4af58a4157634887');
assert.strictEqual(p.frozen_inputs.reachability_report.bytes,5114);
assert.strictEqual(p.frozen_inputs.p3_runtime.git_blob_sha,pins['src/p3.js']);
assert.strictEqual(p.frozen_inputs.absolute_transduction_benchmark_runtime.git_blob_sha,pins['src/p1.js']);
assert.strictEqual(p.frozen_inputs.p1_closure.p1_v1_closed,true);
assert.strictEqual(p.frozen_inputs.p1_closure.p1_rerun_authorized,false);
assert.strictEqual(p.frozen_inputs.p2_closure.p2_v1_closed,true);
assert.strictEqual(p.frozen_inputs.p2_closure.p2_rerun_authorized,false);
assert.strictEqual(p.frozen_inputs.response_target.git_blob_sha,pins['reference/poissonnier2026_pheromone_response_targets.json']);
assert.strictEqual(p.frozen_inputs.response_target.rows,102);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.commit,'fd52e93ca3215d1417616a726d6a0d84e5a771b2');
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.permanent_main_workflow_run_id,34257926135);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.permanent_main_workflow_run_number,146);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.test_job_id,102168317285);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.deploy_job_id,102168597615);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.conclusion,'success');

assert.deepStrictEqual(p.response_parameter_surface.estimated_parameter_names_exact,['sigma_field_mm','kappa_trail_per_s']);
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameters.sigma_field_mm.bounds,[2,32]);
assert.strictEqual(p.response_parameter_surface.estimated_parameters.sigma_field_mm.scale,'log');
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.bounds,[0,16]);
assert.strictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.scale,'linear');
assert.strictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.nested_canonical_null_value,0);
assert.deepStrictEqual(p.response_parameter_surface.nuisance_parameters,[]);
assert(p.response_parameter_surface.fixed_structure.includes('sector_radius_mm = 10'));
assert(p.response_parameter_surface.fixed_structure.includes('radial_bins = 4'));
assert(p.response_parameter_surface.fixed_structure.includes('angular_bins_per_sector = 8'));
assert(p.response_parameter_surface.fixed_structure.includes('epsilon_or_regularization = 0'));
assert(p.response_parameter_surface.fixed_structure.includes('no p_lapse or response RNG'));

assert.strictEqual(p.nested_models_and_comparators.exact_canonical_null.anchor.sigma_field_mm,8);
assert.strictEqual(p.nested_models_and_comparators.exact_canonical_null.anchor.kappa_trail_per_s,0);
assert.strictEqual(p.nested_models_and_comparators.exact_canonical_null.required_bit_identity,true);
const bench=p.nested_models_and_comparators.absolute_transduction_structural_benchmark;
assert.match(bench.definition,/forward offset 2 mm/);
assert.match(bench.definition,/T\(C\)=C\/\(1\+C\)/);
assert.strictEqual(bench.not_a_P1_rerun,true);
assert.strictEqual(bench.P1_official_result_semantics_loaded,false);
assert.strictEqual(bench.P1_official_fold_selections_reused,false);

assert.deepStrictEqual(p.reference_partition.colonies,[0,7,16,20,21,27]);
assert.strictEqual(p.reference_partition.folds,6);
assert.match(p.reference_partition.colony_weighting_rule,/1\/5/);
assert.match(p.reference_partition.colony_weighting_rule,/1\/6/);
assert.deepStrictEqual(p.primary_fit_observables.map(x=>x.name),['middle_zone_fraction','trail_axis_exit']);
assert.strictEqual(p.primary_objective.candidate_ranking_uses_only_primary_objective,true);
assert.strictEqual(p.primary_objective.same_objective_for_P3_and_absolute_benchmark,true);
assert.deepStrictEqual(p.secondary_guard_observables,['time_to_exit_s','beeline_mm']);
assert.strictEqual(p.secondary_guard_policy.ranking_use,false);
assert.strictEqual(p.secondary_guard_policy.selection_use,false);
assert.strictEqual(p.secondary_guard_policy.sample_sd_denominator,'n-1');

function halton(index,base){
  let f=1,r=0,i=index;
  while(i>0){f/=base;r+=f*(i%base);i=Math.floor(i/base);}
  return r;
}
function sigmaAt(i){return 2*Math.exp(Math.log(16)*halton(i,2));}
function kappaAt(i){return 16*halton(i,3);}
assert.strictEqual(p.search_protocol.method,'deterministic 2D Halton low-discrepancy panel plus exact canonical null');
assert.strictEqual(p.search_protocol.candidate_budget_per_fold_total,1000);
assert.strictEqual(p.search_protocol.positive_P3_candidates,999);
assert.strictEqual(p.search_protocol.exact_canonical_null_candidates,1);
assert.strictEqual(p.search_protocol.halton_mapping[0].prime,2);
assert.strictEqual(p.search_protocol.halton_mapping[0].parameter,'sigma_field_mm');
assert.strictEqual(p.search_protocol.halton_mapping[1].prime,3);
assert.strictEqual(p.search_protocol.halton_mapping[1].parameter,'kappa_trail_per_s');
assert(Math.abs(sigmaAt(1)-8)<1e-12);
assert(Math.abs(kappaAt(1)-16/3)<1e-12);
assert(Math.abs(sigmaAt(2)-4)<1e-12);
assert(Math.abs(kappaAt(2)-32/3)<1e-12);
assert(Math.abs(p.search_protocol.first_candidate_sanity.sigma_field_mm-sigmaAt(1))<1e-12);
assert(Math.abs(p.search_protocol.first_candidate_sanity.kappa_trail_per_s-kappaAt(1))<1e-12);
assert(Math.abs(p.search_protocol.second_candidate_sanity.sigma_field_mm-sigmaAt(2))<1e-12);
assert(Math.abs(p.search_protocol.second_candidate_sanity.kappa_trail_per_s-kappaAt(2))<1e-12);
assert.strictEqual(p.search_protocol.absolute_transduction_benchmark_panel.candidate_budget_per_fold_total,1000);
assert.strictEqual(p.search_protocol.absolute_transduction_benchmark_panel.positive_absolute_candidates,999);
assert.strictEqual(p.search_protocol.absolute_transduction_benchmark_panel.exact_canonical_null_candidates,1);
assert.strictEqual(p.search_protocol.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(p.search_protocol.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(p.search_protocol.physics_dt_s,0.02);
assert.strictEqual(p.search_protocol.root_fit_seed,6210000);
assert.strictEqual(p.search_protocol.root_evaluation_seed,6810000);
assert.strictEqual(p.search_protocol.trial_seed_pairing.short_path_offset,0);
assert.strictEqual(p.search_protocol.trial_seed_pairing.long_path_offset,1000);
assert.strictEqual(p.search_protocol.common_random_numbers,true);
assert.match(p.search_protocol.response_rng,/none in P3/);

const cv=p.cross_validation_and_survival;
assert.strictEqual(cv.canonical_null_survival_guard.minimum_heldout_fold_wins,5);
assert.strictEqual(cv.canonical_null_survival_guard.folds_total,6);
assert.strictEqual(cv.canonical_null_survival_guard.median_relative_improvement_must_be_strictly_positive,true);
assert.strictEqual(cv.structural_increment_survival_guard.minimum_heldout_fold_wins_vs_selected_absolute_benchmark,5);
assert.strictEqual(cv.structural_increment_survival_guard.folds_total,6);
assert.strictEqual(cv.structural_increment_survival_guard.median_relative_improvement_vs_absolute_benchmark_must_be_strictly_positive,true);
assert.match(cv.primary_survival_guard,/Both/);
assert.match(cv.failure_rule,/closes P3-v1 response estimation/);

assert.strictEqual(p.final_all_data_fit.authorized_only_if_both_survival_guards_pass,true);
assert.strictEqual(p.final_all_data_fit.training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(p.final_all_data_fit.fit_seed,7210000);
assert.strictEqual(p.final_all_data_fit.final_check_trials_per_treatment_path,240);
assert.strictEqual(p.final_all_data_fit.final_check_seed,7610000);
assert.match(p.final_all_data_fit.final_primary_increment_guard,/absolute-transduction benchmark/);
assert.match(p.final_all_data_fit.final_primary_increment_guard,/canonical-null/);

assert.match(p.identifiability_guards.near_best_set_definition,/0\.0004/);
assert.match(p.identifiability_guards.near_best_set_definition,/0\.05/);
assert.deepStrictEqual(Object.keys(p.identifiability_guards.normalized_coordinates),['sigma_field_mm','kappa_trail_per_s']);
assert.strictEqual(p.identifiability_guards.requirements_for_parameter_promotion.length,5);
assert(p.identifiability_guards.requirements_for_parameter_promotion.some(x=>/absolute-transduction benchmark/.test(x)));
assert(p.identifiability_guards.requirements_for_parameter_promotion.some(x=>/0\.02/.test(x)));
assert(p.identifiability_guards.requirements_for_parameter_promotion.some(x=>/0\.60/.test(x)));

assert.match(p.promotion_rule.P3_mechanism_survives_internal_development,/5-of-6/);
assert.match(p.promotion_rule.fixed_P3_parameter_pair_eligible_for_future_freeze,/identifiability/);
assert.strictEqual(p.promotion_rule.engineering_sigma_8_kappa_4_promoted_automatically,false);
assert.strictEqual(p.promotion_rule.sector_geometry_promoted_as_anatomical_estimate,false);
assert.strictEqual(p.promotion_rule.canonical_locomotion_update_authorized,false);
assert.strictEqual(p.promotion_rule.P1_or_P2_reopening_authorized,false);
assert.strictEqual(p.promotion_rule.ymaze_unlock_authorized,false);

assert.strictEqual(p.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
assert.strictEqual(p.estimator_implementation_gate.high_resolution_response_search_authorized,false);
assert.strictEqual(p.estimator_implementation_gate.response_target_semantic_access_authorized,false);
assert(p.estimator_implementation_gate.requirements_before_authorization.some(x=>/exact 2D Halton mapping/.test(x)));
assert(p.estimator_implementation_gate.requirements_before_authorization.some(x=>/P1 or P2 official result semantics/.test(x)));
assert(p.estimator_implementation_gate.requirements_before_authorization.some(x=>/real-Chromium parity/.test(x)));

assert.strictEqual(p.global_firewalls.response_target_semantic_access_during_this_policy_freeze,false);
assert.strictEqual(p.global_firewalls.response_target_candidate_search_during_this_policy_freeze,false);
assert.strictEqual(p.global_firewalls.P1_official_result_semantic_access,false);
assert.strictEqual(p.global_firewalls.P2_official_result_semantic_access,false);
assert.strictEqual(p.global_firewalls.P1_rerun_or_rescue,false);
assert.strictEqual(p.global_firewalls.P2_rerun_or_rescue,false);
assert.strictEqual(p.global_firewalls.P3_estimator_implementation_in_this_policy_PR,false);
assert.strictEqual(p.global_firewalls.P3_parameter_search_in_this_policy_PR,false);
assert.strictEqual(p.global_firewalls.P2_lapse_structure,false);
assert.strictEqual(p.global_firewalls.canonical_locomotion_change,false);
assert.strictEqual(p.global_firewalls.H2_H3_H4_H5_refit_or_combination,false);
assert.strictEqual(p.global_firewalls.Y_maze_access,false);
assert.strictEqual(p.global_firewalls.Y_maze_fitting_or_ranking,false);

const laterEstimatorPresent=fs.existsSync(path.join(root,'tools','run-p3-estimation.js'));
if(laterEstimatorPresent){
  assert.strictEqual(blob('tools/run-p3-estimation.js'),'5bf27bf439dca18629cdfd36f56fe767a23062ff');
  assert.strictEqual(blob('tools/p3-estimation-core.js'),'410ef81dfe761e3c218d072ca311632329ac1617');
}
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p3_highres_authorization_v1.json')),'P3 high-resolution authorization must remain absent at estimator qualification');

console.log('p3-response-estimation-policy.test.js PASS '+JSON.stringify({
  policy_blob:blob(rel),
  params:p.response_parameter_surface.estimated_parameter_names_exact,
  P3_candidates:p.search_protocol.candidate_budget_per_fold_total,
  absolute_candidates:p.search_protocol.absolute_transduction_benchmark_panel.candidate_budget_per_fold_total,
  fit_seed:p.search_protocol.root_fit_seed,
  eval_seed:p.search_protocol.root_evaluation_seed,
  dual_survival:true,
  estimator_exists:laterEstimatorPresent,
  target_semantics_authorized:false,
  p1_result_semantics:false,
  p2_result_semantics:false,
  ymaze:false
}));
