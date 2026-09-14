'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const criteriaRel='hypotheses/p4_external_validation_source_selection_criteria_v1.json';
const discoveryRel='hypotheses/p4_external_validation_source_discovery_v1.json';
assert.strictEqual(blob(criteriaRel),'61af25d95595dcb2b27c33797cd5de01b818ac47','external-validation source-selection criteria blob drift');
assert.strictEqual(blob(discoveryRel),'be4afc88e54d6d2667489ad4b62654b791215170','external-validation source-discovery blob drift');

const c=read(criteriaRel),d=read(discoveryRel);
assert.strictEqual(c.id,'P4_external_validation_source_selection_criteria_v1');
assert.strictEqual(c.status,'prospective_source_selection_criteria_frozen_before_external_literature_search');
assert.strictEqual(c.lineage.qualified_interpretation_main_commit,'31b293afd615bde9a9f2341a3966eac1b4dd8edf');
assert.strictEqual(c.lineage.qualified_interpretation_main_run_id,34906439220);
assert.strictEqual(c.lineage.qualified_interpretation_test_job_id,104184076531);
assert.strictEqual(c.lineage.qualified_interpretation_deploy_job_id,104184296008);
assert.strictEqual(c.lineage.frozen_candidate_index,307);
assert.strictEqual(c.lineage.candidate_parameters_may_change_during_source_discovery,false);
assert.strictEqual(c.source_ranking_rule.outcome_agreement_with_candidate_307,'forbidden_ranking_feature');
assert.strictEqual(c.outcome_blinding_policy.numerical_outcome_values_access_authorized,false);
assert.strictEqual(c.outcome_blinding_policy.result_tables_figures_supplementary_outcome_data_access_authorized,false);
assert.strictEqual(c.outcome_blinding_policy.candidate_307_prediction_may_not_be_compared_to_any_candidate_source_outcome_during_discovery,true);
for(const v of Object.values(c.firewalls))assert.strictEqual(v,false,'source-selection firewall must remain false');

assert.strictEqual(d.id,'P4_external_validation_source_discovery_v1');
assert.strictEqual(d.status,'targeted_published_source_screen_complete_no_uncontaminated_promotion_grade_holdout_found_new_prospective_dataset_route_selected');
assert.strictEqual(d.criteria_lineage.file,criteriaRel);
assert.strictEqual(d.criteria_lineage.git_blob_sha,blob(criteriaRel));
assert.strictEqual(d.criteria_lineage.criteria_frozen_before_external_literature_search,true);
assert.strictEqual(d.candidate_307_lineage.interpretation_main_commit,'31b293afd615bde9a9f2341a3966eac1b4dd8edf');
assert.strictEqual(d.candidate_307_lineage.candidate_index,307);
assert.strictEqual(d.candidate_307_lineage.parameters_changed_during_discovery,false);
assert.strictEqual(d.search_scope.search_classification,'targeted_high_relevance_screen_not_exhaustive_systematic_review');
assert.strictEqual(d.search_scope.targeted_publication_screen_completed,true);
assert.strictEqual(d.search_scope.minimum_candidates_required_if_available,3);
assert.strictEqual(d.search_scope.candidates_screened,5);
assert.strictEqual(d.screened_candidates.length,5);
assert.strictEqual(d.search_scope.candidate_ranking_used_candidate_307_outcome_agreement,false);
assert.strictEqual(d.search_scope.candidate_307_predictions_compared_to_candidate_source_outcomes,false);

const expected={
  forster2014_bifurcation_asymmetry:'10.1111/eth.12248',
  czaczkes2017_task_state:'10.1111/phen.12174',
  oberhauser2020_concentration_attraction:'10.3389/fpsyg.2020.555576',
  chalissery2019_circular_trail:'10.3390/insects10110383',
  koch2021_repeat_following:'10.1111/een.12995'
};
assert.deepStrictEqual(Object.fromEntries(d.screened_candidates.map(x=>[x.id,x.doi])),expected);
for(const x of d.screened_candidates){
  assert.strictEqual(x.species_match,true,x.id+' species mismatch');
  assert.strictEqual(x.direct_trail_following_endpoint,true,x.id+' endpoint mismatch');
  assert.strictEqual(x.independent_dataset_from_poissonnier2026,true,x.id+' independence mismatch');
  assert.strictEqual(x.promotion_grade_blinding_survived,false,x.id+' must be contamination-locked');
  assert.strictEqual(x.selected,false,x.id+' must not be selected');
  assert.ok(typeof x.contamination==='string'&&x.contamination.length>20,x.id+' contamination record missing');
}
assert.ok(d.screened_candidates.some(x=>x.independent_research_group_from_poissonnier2026===true),'screen must include an independent-research-group candidate');

assert.strictEqual(d.discovery_conclusion.eligible_existing_published_source_count_found_in_targeted_screen_after_blinding_filter,0);
assert.strictEqual(d.discovery_conclusion.selected_existing_published_source_count,0);
assert.strictEqual(d.discovery_conclusion.forced_selection_of_contaminated_source_authorized,false);
assert.strictEqual(d.discovery_conclusion.exhaustive_claim_that_no_other_eligible_published_source_exists,false);
assert.strictEqual(d.discovery_conclusion.prospective_new_dataset_route_selected,true);
assert.strictEqual(d.discovery_conclusion.selected_route_id,'P4_external_validation_replication_dataset_v1');
assert.strictEqual(d.discovery_conclusion.selected_route_classification,'new_prospectively_preregistered_independent_replication_dataset_not_yet_collected');
assert.strictEqual(d.discovery_conclusion.outcome_exists_at_discovery_gate,false);
assert.strictEqual(d.discovery_conclusion.canonical_promotion_authorized,false);
assert.strictEqual(d.criteria_contract_resolution.requested_selected_source_count,1);
assert.strictEqual(d.criteria_contract_resolution.actual_existing_source_count_selected,0);
assert.strictEqual(d.criteria_contract_resolution.resolution,'fail_closed_no_eligible_source_found_in_targeted_screen_instead_of_forcing_an_ineligible_selection');

for(const key of ['preregister_before_any_outcome_exists','independent_data_collection_from_P4_development_data','Lasius_niger_required','trail_following_endpoint_required','apparatus_and_stimulus_frozen_before_data_collection','model_prediction_frozen_before_data_collection','primary_endpoint_and_analysis_frozen_before_data_collection','pass_fail_or_promotion_rule_if_any_frozen_before_data_collection','candidate_307_parameters_locked','no_discrepancy_driven_retuning','raw_or_trial_level_data_preservation_required','colony_or_biological_replicate_identity_preservation_required'])assert.strictEqual(d.new_dataset_requirements[key],true,key+' requirement must remain true');
for(const v of Object.values(d.firewalls))assert.strictEqual(v,false,'source-discovery firewall must remain false');
assert.strictEqual(d.next_gate.id,'P4_external_validation_new_dataset_preregistration_v1');
assert.strictEqual(d.next_gate.may_use_contaminated_published_outcomes_to_tune_protocol,false);
assert.strictEqual(d.next_gate.may_change_candidate_307,false);
assert.strictEqual(d.next_gate.may_collect_or_view_new_outcomes_before_preregistration_freeze,false);

const serialized=JSON.stringify(d);
for(const forbidden of ['observed_rate','model_prediction','signed_difference_model_minus_observed','absolute_difference'])assert.ok(!serialized.includes('"'+forbidden+'"'),'discovery record must not embed candidate outcome comparison field '+forbidden);

console.log('p4-external-validation-source-discovery.test.js PASS '+JSON.stringify({criteria_blob:blob(criteriaRel),discovery_blob:blob(discoveryRel),search_scope:d.search_scope.search_classification,candidates_screened:d.search_scope.candidates_screened,eligible_existing_sources_found:0,new_dataset_route:true,outcome_exists:false,candidate_307_changed:false,canonical_promotion:false,next_gate:d.next_gate.id}));
