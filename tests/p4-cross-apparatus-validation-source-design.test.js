'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_cross_apparatus_validation_source_design_v1.json';
assert.strictEqual(blob(rel),'c0a81bace8070d3266d8c50bd4d21e35ebd127d8');
const d=read(rel);
assert.strictEqual(d.id,'P4_cross_apparatus_validation_source_design_v1');
assert.strictEqual(d.status,'reserved_same_study_Y_maze_selected_for_predictive_transfer_blind_promotion_validation_not_claimed');
assert.strictEqual(d.freeze_date_local,'2026-09-13');

const lineage=d.development_result_lineage;
assert.strictEqual(lineage.result_freeze_git_blob_sha,'73f802be9dd9f21819649ab25323a9b3a92cff04');
assert.strictEqual(blob(lineage.result_freeze_file),lineage.result_freeze_git_blob_sha);
assert.strictEqual(lineage.development_report_git_blob_sha,'f3e61db9964c25b95d3bfc55d8aa7d52930a0b7f');
assert.strictEqual(blob(lineage.development_report_file),lineage.development_report_git_blob_sha);
assert.strictEqual(lineage.development_execution_provenance_git_blob_sha,'09078f08b94d4ac01f10a4ca73b03f7e3f9d50a5');
assert.strictEqual(blob('reports/p4_response_estimation_execution_provenance_v1.json'),lineage.development_execution_provenance_git_blob_sha);
assert.strictEqual(lineage.permanent_main_checkpoint,'91d4a585a2ac96815cb5fcd6c177932b2a715652');
assert.strictEqual(lineage.permanent_main_workflow_run_id,34777850933);
assert.strictEqual(lineage.permanent_main_workflow_run_number,163);
assert.strictEqual(lineage.permanent_main_test_job_id,103779142694);
assert.strictEqual(lineage.permanent_main_test_job_conclusion,'success');
assert.strictEqual(lineage.permanent_main_deploy_job_id,103779236035);
assert.strictEqual(lineage.permanent_main_deploy_job_conclusion,'success');

const t=d.frozen_P4_triplet;
assert.strictEqual(t.candidate_index,307);
assert.strictEqual(t.source,'halton_P4');
assert.strictEqual(t.sigma_field_mm,18.319554310908863);
assert.strictEqual(t.kappa_trail_per_s,6.342935528120713);
assert.strictEqual(t.theta_detect,0.9184);
assert.strictEqual(t.refit_authorized,false);
assert.strictEqual(t.retuning_authorized,false);
assert.strictEqual(t.context_specific_modifiers_authorized,false);

const s=d.selected_transfer_source;
assert.strictEqual(s.doi,'10.1007/s00040-026-01106-9');
assert.strictEqual(s.experiment,'Experiment 2 binary Y-maze');
assert.strictEqual(s.classification,'reserved_cross_apparatus_same_study_holdout_for_predictive_transfer');
assert.strictEqual(s.same_publication_as_development_data,true);
assert.strictEqual(s.separate_experiment_from_open_arena_development_data,true);
assert.strictEqual(s.separate_apparatus_from_open_arena_development_data,true);
assert.strictEqual(s.separate_collection_period_and_ant_dataset_from_experiment_1,true);
assert.strictEqual(s.fully_external_replication,false);
assert.strictEqual(s.promotion_grade_blind_independent_validation,false);
assert.strictEqual(s.repository_apparatus_file,'apparatus/poissonnier2026_y_maze.json');
assert.strictEqual(blob(s.repository_apparatus_file),'eca7a0e66aed9546e5fc26c08f7abaa37bb3cbc8');
assert.strictEqual(s.repository_apparatus_git_blob_sha_identity_only,'eca7a0e66aed9546e5fc26c08f7abaa37bb3cbc8');
assert.strictEqual(s.repository_apparatus_contents_loaded_at_this_gate,false);
assert.strictEqual(blob(s.repository_neutral_engineering_experiment_file),'e61793266a7716587ef11fc96e0959f86103931c');
assert.strictEqual(blob(s.repository_engineering_scoring_file),'8235e511b8ef4159671f670b944129c82f7358cb');
assert.strictEqual(s.repository_Y_maze_biological_target_file_present_at_freeze,false);

const m=d.methods_only_public_metadata;
assert.strictEqual(m.primary_behavioral_form,'binary choice of pheromone-marked arm versus DCM arm');
assert.deepStrictEqual(m.conditions,['outwards_naive','outwards_experienced','return_experienced','return_naive']);
assert.strictEqual(m.pheromone_side_balanced_left_right,true);
assert.strictEqual(m.future_primary_predictive_quantity_candidate,'probability_of_choosing_pheromone_marked_arm');
assert.strictEqual(m.exact_validation_metric_selected_at_this_gate,false);
assert.strictEqual(m.exact_pass_threshold_selected_at_this_gate,false);
assert.strictEqual(m.simulation_trial_budget_selected_at_this_gate,false);
assert.strictEqual(m.Y_maze_geometry_frozen_for_P4_execution_at_this_gate,false);

const b=d.blinding_and_contamination_record;
assert.strictEqual(b.repository_Y_maze_outcome_data_loaded,false);
assert.strictEqual(b.repository_Y_maze_outcome_file_materialized,false);
assert.strictEqual(b.condition_level_Y_maze_outcomes_loaded_for_design,false);
assert.strictEqual(b.colony_level_Y_maze_outcomes_loaded_for_design,false);
assert.strictEqual(b.raw_Y_maze_choices_loaded_for_design,false);
assert.strictEqual(b.aggregate_published_Y_maze_result_inadvertently_exposed_during_public_methods_scouting,true);
assert.strictEqual(b.aggregate_result_permitted_for_metric_selection_or_threshold_setting,false);
assert.strictEqual(b.aggregate_result_permitted_for_parameter_change_or_model_selection,false);
assert.strictEqual(b.fully_blind_holdout_claim_permitted,false);
assert.match(b.contamination_consequence,/may not be described as pristine blinded validation/i);
assert.match(b.contamination_consequence,/as sufficient by itself for canonical promotion/i);

const h=d.prospective_transfer_hypothesis;
assert.match(h.model_under_test,/candidate-307 parameters unchanged/i);
assert.match(h.directional_prediction,/above-neutral probability/i);
assert.match(h.directional_prediction,/without direction-, experience-, colony-, side-, or path-specific response parameters/i);
assert.match(h.neutral_reference,/0\.5 arm-choice probability/);
assert.strictEqual(h.no_fit_validation,true);
assert.strictEqual(h.no_parameter_update_after_validation,true);
assert.strictEqual(h.no_context_specific_response_parameters,true);

for(const [k,v] of Object.entries(d.firewalls)) assert.strictEqual(v,false,`${k} must remain false at source-design freeze`);
assert.strictEqual(d.next_gate.id,'P4_cross_apparatus_Y_maze_protocol_freeze_v1');
assert.strictEqual(d.next_gate.may_load_repository_Y_maze_apparatus_geometry,true);
assert.strictEqual(d.next_gate.may_load_Y_maze_biological_outcomes,false);
assert.strictEqual(d.next_gate.may_run_reference_free_Y_maze_engineering_simulations,false);
assert.strictEqual(d.next_gate.may_change_P4_parameters,false);
assert.strictEqual(d.next_gate.may_set_thresholds_using_exposed_aggregate_result,false);
assert.match(d.future_promotion_requirement,/would not alone establish external validity or authorize canonical promotion/i);

const refNames=fs.readdirSync(path.join(root,'reference'));
const yTargetNames=refNames.filter(n=>/y[_-]?maze|maze.*target|target.*maze/i.test(n));
assert.deepStrictEqual(yTargetNames,[],'no Y-maze biological target may be materialized at source-design gate');

for(const p of [
  'tools/run-p4-ymaze-validation.js',
  'tools/run-p4-y-maze-validation.js',
  'reports/p4_ymaze_validation_v1.json',
  'reports/p4_y_maze_validation_v1.json',
  'hypotheses/p4_cross_apparatus_Y_maze_protocol_v1.json'
]) assert.ok(!fs.existsSync(path.join(root,p)),`${p} must not exist at source-design gate`);

assert.strictEqual(blob('src/p4.js'),'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p4_v1.json'),'3d8460b6916a90d06e70768f696ee3f0d48fccf4');
assert.strictEqual(blob('tools/p4-estimation-core.js'),'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
assert.strictEqual(blob('tools/run-p4-estimation.js'),'e57b554c0ad56a0034f4f79ec8090d3e863e3d11');
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p4_highres_authorization_v1.json')),'development high-res authorization must remain retired');

console.log('p4-cross-apparatus-validation-source-design.test.js PASS '+JSON.stringify({design_blob:blob(rel),classification:s.classification,triplet:{sigma:t.sigma_field_mm,kappa:t.kappa_trail_per_s,theta:t.theta_detect},aggregate_contamination_recorded:true,biological_target_files:yTargetNames.length,simulation_authorized:false,promotion_authorized:false}));
