'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_cross_apparatus_validation_source_design_v1.json';
assert.strictEqual(blob(rel),'740bedc5d552036c2d8adcac7529b64b2da6de0c');
const d=read(rel);
assert.strictEqual(d.id,'P4_cross_apparatus_validation_source_design_v1');
assert.strictEqual(d.status,'same_study_Y_maze_reclassified_as_posthoc_cross_apparatus_consistency_audit_existing_outcomes_acknowledged');
assert.strictEqual(d.freeze_date_local,'2026-09-13');

const lineage=d.development_result_lineage;
assert.strictEqual(lineage.result_freeze_git_blob_sha,'73f802be9dd9f21819649ab25323a9b3a92cff04');
assert.strictEqual(blob(lineage.result_freeze_file),lineage.result_freeze_git_blob_sha);
assert.strictEqual(lineage.development_report_git_blob_sha,'f3e61db9964c25b95d3bfc55d8aa7d52930a0b7f');
assert.strictEqual(blob(lineage.development_report_file),lineage.development_report_git_blob_sha);
assert.strictEqual(lineage.development_execution_provenance_git_blob_sha,'09078f08b94d4ac01f10a4ca73b03f7e3f9d50a5');
assert.strictEqual(blob('reports/p4_response_estimation_execution_provenance_v1.json'),lineage.development_execution_provenance_git_blob_sha);
assert.strictEqual(lineage.development_policy_git_blob_sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(blob(lineage.development_policy_file),lineage.development_policy_git_blob_sha);
assert.match(lineage.development_policy_scope,/Experiment 1 open-arena only/i);
assert.match(lineage.development_policy_scope,/Y-maze access not authorized/i);
assert.match(lineage.development_policy_scope,/poissonnier2026_pheromone_response_targets\.json/);
assert.strictEqual(lineage.permanent_main_checkpoint,'91d4a585a2ac96815cb5fcd6c177932b2a715652');
assert.strictEqual(lineage.permanent_main_workflow_run_id,34777850933);
assert.strictEqual(lineage.permanent_main_test_job_id,103779142694);
assert.strictEqual(lineage.permanent_main_test_job_conclusion,'success');
assert.strictEqual(lineage.permanent_main_deploy_job_id,103779236035);
assert.strictEqual(lineage.permanent_main_deploy_job_conclusion,'success');

const t=d.frozen_P4_triplet;
assert.strictEqual(t.candidate_index,307);
assert.strictEqual(t.sigma_field_mm,18.319554310908863);
assert.strictEqual(t.kappa_trail_per_s,6.342935528120713);
assert.strictEqual(t.theta_detect,0.9184);
assert.strictEqual(t.refit_authorized,false);
assert.strictEqual(t.retuning_authorized,false);
assert.strictEqual(t.context_specific_modifiers_authorized,false);

const s=d.selected_cross_apparatus_source;
assert.strictEqual(s.doi,'10.1007/s00040-026-01106-9');
assert.strictEqual(s.experiment,'Experiment 2 binary Y-maze');
assert.strictEqual(s.classification,'same_study_cross_apparatus_posthoc_consistency_audit');
assert.strictEqual(s.separate_experiment_from_open_arena_development_data,true);
assert.strictEqual(s.separate_apparatus_from_open_arena_development_data,true);
assert.strictEqual(s.separate_collection_period_and_ant_dataset_from_experiment_1,true);
assert.strictEqual(s.fully_external_replication,false);
assert.strictEqual(s.blind_holdout,false);
assert.strictEqual(s.preregistered_predictive_holdout,false);
assert.strictEqual(s.promotion_grade_independent_validation,false);
assert.strictEqual(blob(s.repository_apparatus_file),'eca7a0e66aed9546e5fc26c08f7abaa37bb3cbc8');
assert.strictEqual(s.repository_apparatus_contents_loaded_at_this_gate,false);
assert.strictEqual(blob(s.repository_neutral_engineering_experiment_file),'e61793266a7716587ef11fc96e0959f86103931c');
assert.strictEqual(blob(s.repository_engineering_scoring_file),'8235e511b8ef4159671f670b944129c82f7358cb');

assert.strictEqual(d.preexisting_Y_maze_outcome_artifacts.length,2);
const pubSpec=d.preexisting_Y_maze_outcome_artifacts.find(x=>x.file==='reference/poissonnier2026_published_targets.json');
const invSpec=d.preexisting_Y_maze_outcome_artifacts.find(x=>x.file==='reference/poissonnier2026_inventory.json');
assert.ok(pubSpec&&invSpec);
assert.strictEqual(pubSpec.git_blob_sha,'5836b5011d765043f94683fa761f3016e86643dc');
assert.strictEqual(invSpec.git_blob_sha,'2ff7d9dcd27cf7609ce77b0f655a6520597c2432');
assert.strictEqual(blob(pubSpec.file),pubSpec.git_blob_sha);
assert.strictEqual(blob(invSpec.file),invSpec.git_blob_sha);
const published=read(pubSpec.file);
const inventory=read(invSpec.file);
assert.ok(published.y_maze,'published target artifact must explicitly contain Y-maze outcomes');
assert.strictEqual(Object.keys(published.y_maze.condition_results).length,4);
assert.ok(inventory.experiment_2,'inventory artifact must explicitly contain Experiment 2 outcomes');
assert.strictEqual(Object.keys(inventory.experiment_2.condition_counts).length,4);
assert.ok(inventory.experiment_2.pheromone_side_counts.Left);
assert.ok(inventory.experiment_2.pheromone_side_counts.Right);
assert.ok(inventory.experiment_2.overall);

const m=d.apparatus_and_methods_metadata;
assert.strictEqual(m.primary_behavioral_form,'binary choice of pheromone-marked arm versus DCM arm');
assert.deepStrictEqual(m.conditions,['outwards_naive','outwards_experienced','return_experienced','return_naive']);
assert.strictEqual(m.pheromone_side_balanced_left_right,true);
assert.strictEqual(m.natural_model_output_for_consistency_audit,'probability_of_choosing_pheromone_marked_arm');
assert.strictEqual(m.exact_consistency_metric_selected_at_this_gate,false);
assert.strictEqual(m.validation_pass_threshold_selected_at_this_gate,false);
assert.match(m.reason_no_validation_threshold,/already known\/materialized/i);

const b=d.blinding_and_contamination_record;
assert.strictEqual(b.preexisting_repository_Y_maze_outcome_artifacts_present_before_gate,true);
assert.strictEqual(b.repository_Y_maze_outcome_summaries_loaded_during_PR44_correction,true);
assert.strictEqual(b.aggregate_Y_maze_outcome_loaded,true);
assert.strictEqual(b.condition_level_Y_maze_outcomes_loaded,true);
assert.strictEqual(b.pheromone_side_Y_maze_outcomes_loaded,true);
assert.strictEqual(b.colony_ids_loaded,true);
assert.strictEqual(b.colony_level_Y_maze_outcomes_loaded,false);
assert.strictEqual(b.raw_Y_maze_choices_loaded,false);
assert.strictEqual(b.fully_blind_holdout_claim_permitted,false);
assert.strictEqual(b.preregistered_predictive_holdout_claim_permitted,false);
assert.strictEqual(b.promotion_grade_validation_claim_permitted,false);
assert.strictEqual(b.outcome_use_for_metric_cherry_picking_permitted,false);
assert.strictEqual(b.outcome_use_for_pass_threshold_setting_permitted,false);
assert.strictEqual(b.outcome_use_for_parameter_change_or_model_selection_permitted,false);
assert.match(b.contamination_consequence,/post-hoc cross-apparatus consistency audit/i);
assert.match(b.contamination_consequence,/must not be described as blind validation/i);

const h=d.cross_apparatus_consistency_hypothesis;
assert.match(h.model_under_test,/candidate-307 parameters unchanged/i);
assert.match(h.directional_expectation,/more model choices than the symmetric DCM arm/i);
assert.match(h.directional_expectation,/does not introduce.*direction-.*experience-.*colony-.*side-.*path-specific response parameters/i);
assert.match(h.neutral_reference,/0\.5 arm-choice probability/);
assert.match(h.interpretation,/descriptive consistency only/i);
assert.strictEqual(h.no_fit,true);
assert.strictEqual(h.no_parameter_update,true);
assert.strictEqual(h.no_context_specific_response_parameters,true);

for(const [k,v] of Object.entries(d.firewalls)) assert.strictEqual(v,false,`${k} must remain false at corrected source-design freeze`);
assert.strictEqual(d.next_gate.id,'P4_cross_apparatus_Y_maze_consistency_protocol_freeze_v1');
assert.strictEqual(d.next_gate.may_load_repository_Y_maze_apparatus_geometry,true);
assert.strictEqual(d.next_gate.may_load_additional_Y_maze_biological_outcomes_for_protocol_tuning,false);
assert.strictEqual(d.next_gate.may_run_reference_free_Y_maze_engineering_simulations,false);
assert.strictEqual(d.next_gate.may_change_P4_parameters,false);
assert.strictEqual(d.next_gate.may_define_validation_pass_fail_threshold,false);
assert.strictEqual(d.promotion_grade_next_gate.id,'P4_external_validation_source_discovery_v1');
assert.strictEqual(d.promotion_grade_next_gate.required_before_canonical_promotion,true);
assert.match(d.future_promotion_requirement,/cannot establish external validity or authorize canonical promotion/i);

// Historical v0.3.4i truth: no runner/report/protocol existed at that gate. In later lifecycle
// states the exact protocol may exist, but it must point back to this immutable source-design blob
// and must still leave execution/report surfaces absent until their own authorization gate.
for(const file of [
  'tools/run-p4-ymaze-consistency.js',
  'reports/p4_ymaze_consistency_v1.json',
  'reports/p4_ymaze_consistency_simulation_v1.json',
  'reports/p4_ymaze_consistency_comparison_v1.json'
]) assert.ok(!fs.existsSync(path.join(root,file)),`${file} must remain absent before implementation/execution authorization`);
const laterProtocol='hypotheses/p4_cross_apparatus_Y_maze_consistency_protocol_v1.json';
if(fs.existsSync(path.join(root,laterProtocol))){
  assert.strictEqual(blob(laterProtocol),'22515a3fe0945c0f19b6fb2166923f027bbf1b54');
  const lp=read(laterProtocol);
  assert.strictEqual(lp.lineage.source_design_file,rel);
  assert.strictEqual(lp.lineage.source_design_git_blob_sha,'740bedc5d552036c2d8adcac7529b64b2da6de0c');
  assert.strictEqual(lp.simulation_design.new_simulation_authorized_at_this_protocol_gate,false);
  assert.strictEqual(lp.predeclared_stage_B_comparison_reporting.validation_pass_fail_threshold,null);
}

assert.strictEqual(blob('src/p4.js'),'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p4_v1.json'),'3d8460b6916a90d06e70768f696ee3f0d48fccf4');
assert.strictEqual(blob('tools/p4-estimation-core.js'),'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
assert.strictEqual(blob('tools/run-p4-estimation.js'),'e57b554c0ad56a0034f4f79ec8090d3e863e3d11');
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p4_highres_authorization_v1.json')),'development high-res authorization must remain retired');

console.log('p4-cross-apparatus-validation-source-design.test.js PASS '+JSON.stringify({design_blob:blob(rel),classification:s.classification,triplet:{sigma:t.sigma_field_mm,kappa:t.kappa_trail_per_s,theta:t.theta_detect},preexisting_outcome_artifacts:d.preexisting_Y_maze_outcome_artifacts.length,raw_choices_loaded:false,later_protocol_present:fs.existsSync(path.join(root,laterProtocol)),simulation_authorized:false,promotion_authorized:false}));
