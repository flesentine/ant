'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const preregRel='hypotheses/p4_external_validation_new_dataset_preregistration_v1.json';
const discoveryRel='hypotheses/p4_external_validation_source_discovery_v1.json';
const criteriaRel='hypotheses/p4_external_validation_source_selection_criteria_v1.json';
const stageARel='reports/p4_ymaze_consistency_simulation_v1.json';
const stageAFreezeRel='hypotheses/p4_Y_maze_consistency_stage_A_result_freeze_v1.json';
const protocolRel='hypotheses/p4_cross_apparatus_Y_maze_consistency_protocol_v1.json';
const leftAppRel='apparatus/poissonnier2026_y_maze_p4_left_v1.json';
const rightAppRel='apparatus/poissonnier2026_y_maze_p4_right_v1.json';
const scoringRel='scoring/y_maze_endpoint_engineering_v1.json';

assert.strictEqual(blob(preregRel),'f7f57127d7ab0307d8cc6f49e852543702d07cdd','external-validation preregistration blob drift');
assert.strictEqual(blob(discoveryRel),'a98e7ec2d11ede680aab2d6bf04b0ebcd905fe44','qualified discovery blob drift');
assert.strictEqual(blob(criteriaRel),'61af25d95595dcb2b27c33797cd5de01b818ac47','source-selection criteria blob drift');
assert.strictEqual(blob(stageARel),'a7b3e33ce613254c182360947641c5ff03f5af23','frozen Stage-A prediction blob drift');
assert.strictEqual(blob(stageAFreezeRel),'7651b5c50b7d0c752cc85a2af3225c1b5592a4fc','Stage-A result-freeze blob drift');
assert.strictEqual(blob(protocolRel),'22515a3fe0945c0f19b6fb2166923f027bbf1b54','Y-maze protocol blob drift');
assert.strictEqual(blob(leftAppRel),'219d42036c13463e8cae5045b8fdba6d5bd24454','left-marked apparatus blob drift');
assert.strictEqual(blob(rightAppRel),'bfcba7e34eed4b4f79e67d6fc22c60af993f5386','right-marked apparatus blob drift');
assert.strictEqual(blob(scoringRel),'8235e511b8ef4159671f670b944129c82f7358cb','Y-maze scoring blob drift');

const p=read(preregRel),stageA=read(stageARel),left=read(leftAppRel),right=read(rightAppRel),scoring=read(scoringRel);
assert.strictEqual(p.id,'P4_external_validation_new_dataset_preregistration_v1');
assert.strictEqual(p.status,'prospective_independent_replication_preregistration_frozen_before_biological_collection_or_outcome_access');
assert.strictEqual(p.qualified_lineage.qualified_discovery_main_commit,'91a7fb1863035113a5f8e219607a98365569125b');
assert.strictEqual(p.qualified_lineage.qualified_discovery_main_run_id,34912296490);
assert.strictEqual(p.qualified_lineage.qualified_discovery_test_job_id,104202244634);
assert.strictEqual(p.qualified_lineage.qualified_discovery_deploy_job_id,104202444821);

assert.strictEqual(p.dataset_identity.route_id,'P4_external_validation_replication_dataset_v1');
assert.strictEqual(p.dataset_identity.species,'Lasius niger');
assert.strictEqual(p.dataset_identity.independent_from_poissonnier2026_data,true);
assert.strictEqual(p.dataset_identity.independent_from_P4_development_data,true);
assert.strictEqual(p.dataset_identity.biological_collection_started_at_preregistration_freeze,false);
assert.strictEqual(p.dataset_identity.new_biological_outcomes_exist_at_preregistration_freeze,false);
assert.strictEqual(p.dataset_identity.new_biological_outcome_access_authorized_at_this_gate,false);

assert.strictEqual(p.frozen_model_prediction.candidate_index,307);
assert.strictEqual(p.frozen_model_prediction.sigma_field_mm,18.319554310908863);
assert.strictEqual(p.frozen_model_prediction.kappa_trail_per_s,6.342935528120713);
assert.strictEqual(p.frozen_model_prediction.theta_detect,0.9184);
assert.strictEqual(p.frozen_model_prediction.primary_predicted_marked_arm_choice_probability,stageA.predeclared_fields.side_balanced_marked_arm_choice_fraction);
assert.strictEqual(p.frozen_model_prediction.left_marked_prediction,stageA.left_marked.marked_arm_choice_fraction_among_choices);
assert.strictEqual(p.frozen_model_prediction.right_marked_prediction,stageA.right_marked.marked_arm_choice_fraction_among_choices);
assert.strictEqual(p.frozen_model_prediction.prediction_rerun_authorized,false);
assert.strictEqual(p.frozen_model_prediction.prediction_reselection_authorized,false);
assert.strictEqual(p.frozen_model_prediction.candidate_parameter_change_authorized,false);

assert.strictEqual(p.apparatus_and_stimulus.design_basis_frozen_before_external_source_screen,true);
assert.strictEqual(p.apparatus_and_stimulus.contaminated_published_candidate_outcomes_used_to_choose_apparatus,false);
assert.strictEqual(p.apparatus_and_stimulus.left_marked_apparatus_git_blob_sha,blob(leftAppRel));
assert.strictEqual(p.apparatus_and_stimulus.right_marked_apparatus_git_blob_sha,blob(rightAppRel));
assert.strictEqual(p.apparatus_and_stimulus.marked_arm_nominal_dose_hindgut_equivalents_per_cm,left.external_fields.painted_trail.nominal_dose_hindgut_equivalents_per_cm);
assert.strictEqual(p.apparatus_and_stimulus.marked_arm_nominal_dose_hindgut_equivalents_per_cm,right.external_fields.painted_trail.nominal_dose_hindgut_equivalents_per_cm);
assert.strictEqual(p.apparatus_and_stimulus.apparatus_or_dose_change_after_collection_starts_authorized,false);

assert.strictEqual(p.biological_sampling.planned_colonies,12);
assert.strictEqual(p.biological_sampling.unique_worker_ants_per_colony,40);
assert.strictEqual(p.biological_sampling.planned_total_unique_worker_ants,p.biological_sampling.planned_colonies*p.biological_sampling.unique_worker_ants_per_colony);
assert.strictEqual(p.biological_sampling.left_marked_trials_per_colony+p.biological_sampling.right_marked_trials_per_colony,p.biological_sampling.unique_worker_ants_per_colony);
assert.strictEqual(p.biological_sampling.trials_per_ant,1);
assert.strictEqual(p.biological_sampling.individual_ant_reuse_authorized,false);
assert.strictEqual(p.biological_sampling.colony_is_biological_replicate,true);
assert.strictEqual(p.biological_sampling.power_or_sample_size_inputs_from_contaminated_published_outcomes_used,false);

assert.strictEqual(p.randomization_and_blinding.balance_constraint,'exactly_20_left_marked_and_20_right_marked_per_colony');
assert.strictEqual(p.randomization_and_blinding.schedule_must_be_frozen_before_collection,true);
assert.strictEqual(p.randomization_and_blinding.outcome_scorer_blinded_to_marked_side_code,true);
assert.strictEqual(p.randomization_and_blinding.outcome_scorer_blinded_to_candidate_307_prediction,true);
assert.strictEqual(p.randomization_and_blinding.independent_data_collector_required_for_promotion_grade,true);
assert.strictEqual(p.randomization_and_blinding.protocol_change_based_on_interim_outcomes_authorized,false);
assert.strictEqual(p.randomization_and_blinding.interim_outcome_monitoring_authorized,false);

assert.strictEqual(p.endpoint.scoring_profile_git_blob_sha,blob(scoringRel));
assert.strictEqual(p.endpoint.primary_endpoint_type,scoring.type);
assert.strictEqual(p.endpoint.left_terminal_region.x_mm,scoring.regions[0].shape.x);
assert.strictEqual(p.endpoint.left_terminal_region.y_mm,scoring.regions[0].shape.y);
assert.strictEqual(p.endpoint.left_terminal_region.radius_mm,scoring.regions[0].shape.radius);
assert.strictEqual(p.endpoint.right_terminal_region.x_mm,scoring.regions[1].shape.x);
assert.strictEqual(p.endpoint.right_terminal_region.y_mm,scoring.regions[1].shape.y);
assert.strictEqual(p.endpoint.right_terminal_region.radius_mm,scoring.regions[1].shape.radius);
assert.strictEqual(p.endpoint.endpoint_change_after_collection_starts_authorized,false);

assert.strictEqual(p.predeclared_exclusions_and_quality.behavior_based_trial_exclusion_authorized,false);
assert.strictEqual(p.predeclared_exclusions_and_quality.timeout_exclusion_from_attempt_count_authorized,false);
assert.strictEqual(p.predeclared_exclusions_and_quality.technical_exclusions_are_removed_from_choice_denominator_but_never_hidden,true);
assert.strictEqual(p.predeclared_exclusions_and_quality.minimum_nonexcluded_attempts_per_marked_side_per_colony_for_promotion,18);
assert.strictEqual(p.predeclared_exclusions_and_quality.promotion_inconclusive_if_any_colony_side_has_fewer_than_minimum_nonexcluded_attempts,true);
assert.strictEqual(p.predeclared_exclusions_and_quality.overall_timeout_fraction_inconclusive_if_greater_than,0.2);
assert.strictEqual(p.predeclared_exclusions_and_quality.per_colony_timeout_fraction_inconclusive_if_greater_than,0.3);
assert.strictEqual(p.predeclared_exclusions_and_quality.quality_thresholds_selected_from_published_candidate_outcomes,false);
assert.strictEqual(p.predeclared_exclusions_and_quality.adaptive_replacement_of_failed_or_timeout_trials_authorized,false);

assert.strictEqual(p.primary_estimand.name,'equal_colony_weighted_side_balanced_marked_arm_choice_probability');
assert.strictEqual(p.statistical_comparison.primary_prediction,stageA.predeclared_fields.side_balanced_marked_arm_choice_fraction);
assert.strictEqual(p.statistical_comparison.predictive_equivalence_margin_absolute_probability,0.1);
assert.strictEqual(p.statistical_comparison.equivalence_margin_lower,-0.1);
assert.strictEqual(p.statistical_comparison.equivalence_margin_upper,0.1);
assert.strictEqual(p.statistical_comparison.best_subset_reporting_authorized,false);
assert.strictEqual(p.statistical_comparison.post_outcome_margin_change_authorized,false);
assert.strictEqual(p.statistical_comparison.post_outcome_analysis_family_change_authorized,false);
assert.deepStrictEqual(p.future_promotion_rule.promotion_grade_external_validation_pass_requires_all,[
  'exact_preregistered_apparatus_stimulus_endpoint_and_sampling_contract_used',
  '12_independent_colonies_attempted_with_40_unique_workers_each',
  'independent_data_collector_requirement_satisfied',
  'no_interim_outcome_adaptation_or_discrepancy_driven_retuning',
  'at_least_18_nonexcluded_attempts_on_each_marked_side_in_every_colony',
  'overall_timeout_fraction_not_greater_than_0.2',
  'no_colony_timeout_fraction_greater_than_0.3',
  'entire_90_percent_primary_discrepancy_interval_within_minus_0.1_to_plus_0.1',
  'lower_bound_of_95_percent_direction_interval_strictly_greater_than_0.5'
]);
assert.strictEqual(p.future_promotion_rule.pass_at_this_preregistration_gate,false);
assert.strictEqual(p.future_promotion_rule.canonical_promotion_authorized_at_this_preregistration_gate,false);
assert.strictEqual(p.future_promotion_rule.future_result_must_be_frozen_before_any_promotion_decision,true);

for(const key of ['raw_trial_level_data_required','raw_video_or_tracking_record_required','dataset_hash_required_before_unblinding_model_comparison','randomization_schedule_hash_required_before_collection','all_protocol_deviations_must_be_preserved','colony_level_results_must_be_reported_comprehensively'])assert.strictEqual(p.raw_data_and_provenance[key],true,key+' must remain required');
for(const v of Object.values(p.semantic_firewall))assert.strictEqual(v,false,'preregistration semantic firewall must remain false');
assert.strictEqual(p.next_gate.id,'P4_external_validation_collection_authorization_v1');
assert.strictEqual(p.next_gate.may_change_preregistration,false);
assert.strictEqual(p.next_gate.may_change_candidate_307,false);
assert.strictEqual(p.next_gate.may_rerun_model_prediction,false);
assert.strictEqual(p.next_gate.may_access_new_biological_outcomes_before_authorization,false);
assert.strictEqual(p.next_gate.may_authorize_canonical_promotion,false);

console.log('p4-external-validation-preregistration.test.js PASS '+JSON.stringify({prereg_blob:blob(preregRel),candidate:307,prediction:p.statistical_comparison.primary_prediction,colonies:p.biological_sampling.planned_colonies,ants:p.biological_sampling.planned_total_unique_worker_ants,equivalence_margin:p.statistical_comparison.predictive_equivalence_margin_absolute_probability,min_nonexcluded_per_side:p.predeclared_exclusions_and_quality.minimum_nonexcluded_attempts_per_marked_side_per_colony_for_promotion,collection_authorized:false,canonical_promotion:false,next_gate:p.next_gate.id}));
