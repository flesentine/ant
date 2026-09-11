'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_response_estimation_v1.json';
const p=read(rel);
assert.strictEqual(blob(rel),'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(p.id,'P4_response_estimation_v1');
assert.strictEqual(p.status,'development_response_estimation_policy_frozen_before_estimator_implementation_or_response_target_semantic_access');

assert.strictEqual(blob(p.frozen_inputs.candidate_class_evidence.file),'262f332062f271bbf111d0572f83b2faaf2cfd74');
assert.strictEqual(blob(p.frozen_inputs.candidate_class_decision.file),'ad7295ba6d466549c60c8ecac37e39d30006ec1c');
assert.strictEqual(blob(p.frozen_inputs.mechanism_freeze.file),'609551836e540c341365db9cc987d2ca340cc053');
assert.strictEqual(blob(p.frozen_inputs.reachability_execution_policy.file),'0d452f9c0d548ec962e0a6d9826648bf5e14a4ef');
assert.strictEqual(blob(p.frozen_inputs.implementation_authorization.file),'42f8d51b06a20c0c6001a42b6021a134f2694e0d');
assert.strictEqual(blob(p.frozen_inputs.reachability_result_freeze.file),'f2074ae3157f22208ff98ebc620c00006549cab6');
assert.strictEqual(blob(p.frozen_inputs.reachability_report.file),'f6e77596eb25cc7bca3bf0dde1da712511a1d0d0');
assert.strictEqual(blob(p.frozen_inputs.p4_runtime.file),'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
assert.strictEqual(blob(p.frozen_inputs.p4_engineering_model.file),'3d8460b6916a90d06e70768f696ee3f0d48fccf4');
assert.strictEqual(blob(p.frozen_inputs.ungated_weber_benchmark_runtime.file),'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(blob(p.frozen_inputs.response_target.file),'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(p.frozen_inputs.response_target.rows,102);
assert.match(p.frozen_inputs.response_target.use_rule,/may not be parsed here/i);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.commit,'a2fbb130b37eac155f5753287cf402321c38ec3b');
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.permanent_main_workflow_run_id,34519217847);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.permanent_main_workflow_run_number,156);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.test_job_id,103012229824);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.deploy_job_id,103012503539);

assert.deepStrictEqual(p.response_parameter_surface.estimated_parameter_names_exact,['sigma_field_mm','kappa_trail_per_s','theta_detect']);
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameters.sigma_field_mm.bounds,[2,32]);
assert.strictEqual(p.response_parameter_surface.estimated_parameters.sigma_field_mm.scale,'log');
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.bounds,[0,16]);
assert.strictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.scale,'linear');
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameters.theta_detect.bounds,[0,2]);
assert.strictEqual(p.response_parameter_surface.estimated_parameters.theta_detect.scale,'linear');
assert.strictEqual(p.response_parameter_surface.estimated_parameters.theta_detect.nested_ungated_value,0);
assert.match(p.response_parameter_surface.estimated_parameters.theta_detect.provenance,/complete physically reachable range \[0,2\]/);
assert.deepStrictEqual(p.response_parameter_surface.nuisance_parameters,[]);

assert.strictEqual(p.nested_models_and_comparators.exact_canonical_null.anchor.kappa_trail_per_s,0);
assert.strictEqual(p.nested_models_and_comparators.ungated_P3_structural_benchmark.P3_official_result_semantics_loaded,false);
assert.strictEqual(p.nested_models_and_comparators.ungated_P3_structural_benchmark.P3_official_fold_selections_reused,false);
assert.strictEqual(p.nested_models_and_comparators.excluded_posthoc_comparator.P1_absolute_transduction_benchmark_included,false);
assert.match(p.nested_models_and_comparators.excluded_posthoc_comparator.reason,/prior target-ranked outcomes/i);

assert.strictEqual(p.reference_partition.type,'leave_one_colony_out');
assert.deepStrictEqual(p.reference_partition.colonies,[0,7,16,20,21,27]);
assert.strictEqual(p.reference_partition.folds,6);
assert.deepStrictEqual(p.primary_fit_observables.map(x=>x.name),['middle_zone_fraction','trail_axis_exit']);
assert.strictEqual(p.primary_objective.candidate_ranking_uses_only_primary_objective,true);
assert.strictEqual(p.primary_objective.same_objective_for_P4_and_ungated_benchmark,true);
assert.deepStrictEqual(p.secondary_guard_observables,['time_to_exit_s','beeline_mm']);
assert.strictEqual(p.secondary_guard_policy.ranking_use,false);
assert.strictEqual(p.secondary_guard_policy.selection_use,false);
assert.strictEqual(p.secondary_guard_policy.sample_sd_denominator,'n-1');

assert.strictEqual(p.search_protocol.method,'deterministic 3D Halton low-discrepancy panel plus exact canonical null');
assert.strictEqual(p.search_protocol.candidate_budget_per_fold_total,2000);
assert.strictEqual(p.search_protocol.positive_P4_candidates,1999);
assert.strictEqual(p.search_protocol.exact_canonical_null_candidates,1);
assert.deepStrictEqual(p.search_protocol.halton_mapping.map(x=>x.prime),[2,3,5]);
assert.deepStrictEqual(p.search_protocol.halton_mapping.map(x=>x.parameter),['sigma_field_mm','kappa_trail_per_s','theta_detect']);
assert.deepStrictEqual(p.search_protocol.first_candidate_sanity,{index:1,sigma_field_mm:8,kappa_trail_per_s:5.333333333333333,theta_detect:0.4});
assert.deepStrictEqual(p.search_protocol.second_candidate_sanity,{index:2,sigma_field_mm:4,kappa_trail_per_s:10.666666666666666,theta_detect:0.8});
assert.strictEqual(p.search_protocol.ungated_benchmark_panel.candidate_budget_per_fold_total,2000);
assert.strictEqual(p.search_protocol.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(p.search_protocol.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(p.search_protocol.physics_dt_s,0.02);
assert.strictEqual(p.search_protocol.root_fit_seed,8210000);
assert.strictEqual(p.search_protocol.root_evaluation_seed,8810000);
assert.strictEqual(p.search_protocol.common_random_numbers,true);
assert.strictEqual(p.search_protocol.response_rng,'none; canonical biology RNG is the only stochastic stream');

assert.strictEqual(p.cross_validation_and_survival.canonical_null_survival_guard.minimum_heldout_fold_wins,5);
assert.strictEqual(p.cross_validation_and_survival.canonical_null_survival_guard.folds_total,6);
assert.strictEqual(p.cross_validation_and_survival.canonical_null_survival_guard.median_relative_improvement_must_be_strictly_positive,true);
assert.strictEqual(p.cross_validation_and_survival.structural_increment_survival_guard.minimum_heldout_fold_wins_vs_selected_ungated_benchmark,5);
assert.strictEqual(p.cross_validation_and_survival.structural_increment_survival_guard.folds_total,6);
assert.strictEqual(p.cross_validation_and_survival.structural_increment_survival_guard.median_relative_improvement_vs_ungated_benchmark_must_be_strictly_positive,true);
assert.match(p.cross_validation_and_survival.failure_rule,/closes P4-v1 without rescue or retuning/i);

assert.strictEqual(p.final_all_data_fit.authorized_only_if_both_survival_guards_pass,true);
assert.strictEqual(p.final_all_data_fit.training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(p.final_all_data_fit.fit_seed,9210000);
assert.strictEqual(p.final_all_data_fit.final_check_trials_per_treatment_path,240);
assert.strictEqual(p.final_all_data_fit.final_check_seed,9610000);
assert.match(p.final_all_data_fit.final_primary_increment_guard,/strictly lower than both selected ungated benchmark and exact null/i);

assert.match(p.identifiability_guards.near_best_set_definition,/max\(0\.0004,0\.05\*best_loss\)/);
assert.strictEqual(p.identifiability_guards.requirements_for_parameter_promotion.length,6);
assert(p.identifiability_guards.requirements_for_parameter_promotion.some(x=>/theta normalized coordinates/.test(x)));
assert(p.identifiability_guards.requirements_for_parameter_promotion.some(x=>/theta\./.test(x)));
assert.strictEqual(p.promotion_rule.engineering_sigma_8_kappa_4_theta_0_25_promoted_automatically,false);
assert.strictEqual(p.promotion_rule.hard_threshold_interpreted_as_anatomical_detection_limit,false);
assert.strictEqual(p.promotion_rule.canonical_locomotion_update_authorized,false);
assert.strictEqual(p.promotion_rule.P1_P2_P3_reopening_authorized,false);
assert.strictEqual(p.promotion_rule.ymaze_unlock_authorized,false);

assert.strictEqual(p.estimator_implementation_gate.P4_estimator_exists_at_this_freeze,false);
assert.strictEqual(p.estimator_implementation_gate.response_target_semantics_accessed_at_this_freeze,false);
assert.strictEqual(p.estimator_implementation_gate.estimator_implementation_authorized_by_this_record,false);
assert.strictEqual(p.estimator_implementation_gate.high_resolution_search_authorized_by_this_record,false);
for(const v of Object.values(p.global_firewall)) assert.strictEqual(v,false);
assert.strictEqual(fs.existsSync(path.join(root,'tools/run-p4-estimation.js')),false);
assert.strictEqual(fs.existsSync(path.join(root,'tools/p4-estimation-core.js')),false);
assert.strictEqual(fs.existsSync(path.join(root,'hypotheses/p4_highres_authorization_v1.json')),false);

console.log('p4-response-estimation-policy.test.js PASS '+JSON.stringify({policy_blob:blob(rel),parameters:p.response_parameter_surface.estimated_parameter_names_exact,candidates:p.search_protocol.candidate_budget_per_fold_total,comparator:'ungated_P3',response_target_semantics:false,estimator_exists:false,ymaze:false}));
