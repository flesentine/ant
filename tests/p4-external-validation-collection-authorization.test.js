'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const preregRel='hypotheses/p4_external_validation_new_dataset_preregistration_v1.json';
const authRel='hypotheses/p4_external_validation_collection_authorization_v1.json';
const sideRel='experiments/p4_external_validation_replication_randomization_v1.json';
const poseManifestRel='experiments/p4_external_validation_replication_release_pose_schedule_v1.json';
const chemicalRel='hypotheses/p4_external_validation_chemical_batch_record_template_v1.json';
const husbandryRel='hypotheses/p4_external_validation_colony_husbandry_record_template_v1.json';
const videoRel='hypotheses/p4_external_validation_video_calibration_record_template_v1.json';
const trialRel='hypotheses/p4_external_validation_trial_record_schema_v1.json';
const collectorRel='hypotheses/p4_external_validation_collector_independence_record_v1.json';
const checklistRel='hypotheses/p4_external_validation_collection_activation_checklist_v1.json';
const simCoreRel='src/sim-core.js';
const neutralRel='experiments/neutral_y_maze.json';

for(const [rel,sha] of [
  [preregRel,'b8a683e0199e6564a1fedc6f54391a535c32e0e4'],
  [authRel,'0df255fe204b17ce9fdb0252ebf9d3fa7c5e2a5a'],
  [sideRel,'9ffd7ef45a611c93eac35626399632b4f822225a'],
  [poseManifestRel,'ee5f1b46bbca780196117d554f8b708b3f2ed34e'],
  [chemicalRel,'c74dd24db1fad3d64f0a7dc49c2f9be2d2eedeb6'],
  [husbandryRel,'aa7b62ec10aed4899b6c60071dea9e608524a407'],
  [videoRel,'472fcb5708c9b279f94cdbd2bc56a8e7eca6abed'],
  [trialRel,'da0cfd39a0bbe592833be0a56576d8c2ac7347b7'],
  [collectorRel,'02289bed5ef4785bbadc584ef5077b633779d089'],
  [checklistRel,'b843b1522ca0e9619b695579f0a15007ceb11aa3'],
  [simCoreRel,'24777aac3577d442893e4779d70aee4e27761fe8'],
  [neutralRel,'e61793266a7716587ef11fc96e0959f86103931c']
]) assert.strictEqual(blob(rel),sha,rel+' blob drift');

const prereg=read(preregRel),auth=read(authRel),side=read(sideRel),manifest=read(poseManifestRel),chemical=read(chemicalRel),husbandry=read(husbandryRel),video=read(videoRel),trial=read(trialRel),collector=read(collectorRel),checklist=read(checklistRel);
assert.strictEqual(auth.status,'preauthorization_frozen_pending_collector_identity_and_colony_husbandry_records');
assert.strictEqual(auth.collection_authorized,false);
assert.strictEqual(auth.qualified_preregistration.git_blob_sha,blob(preregRel));
assert.strictEqual(auth.qualified_preregistration.qualified_main_commit,'913a0e7e93092779059e6b9967dc97c503e4c9e7');
assert.strictEqual(auth.qualified_preregistration.qualified_main_run_id,34934333396);
assert.strictEqual(auth.qualified_preregistration.qualified_test_job_id,104268917214);
assert.strictEqual(auth.qualified_preregistration.qualified_deploy_job_id,104269108607);
for(const [fileKey,shaKey,rel] of [
  ['marked_side_schedule_file','marked_side_schedule_git_blob_sha',sideRel],
  ['release_pose_schedule_manifest_file','release_pose_schedule_manifest_git_blob_sha',poseManifestRel],
  ['chemical_batch_record_template_file','chemical_batch_record_template_git_blob_sha',chemicalRel],
  ['colony_husbandry_record_template_file','colony_husbandry_record_template_git_blob_sha',husbandryRel],
  ['video_calibration_record_template_file','video_calibration_record_template_git_blob_sha',videoRel],
  ['trial_record_schema_file','trial_record_schema_git_blob_sha',trialRel],
  ['collector_independence_record_file','collector_independence_record_git_blob_sha',collectorRel],
  ['collection_activation_checklist_file','collection_activation_checklist_git_blob_sha',checklistRel]
]){
  assert.strictEqual(auth.frozen_collection_inputs[fileKey],rel);
  assert.strictEqual(auth.frozen_collection_inputs[shaKey],blob(rel));
}

class RNG{
  constructor(seed){this.state=seed>>>0||1;}
  next(){let t=this.state+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
  normal(){const u=Math.max(this.next(),1e-12),v=this.next();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
}
assert.strictEqual(side.seed_root,prereg.randomization_and_blinding.randomization_seed_root);
assert.strictEqual(side.colony_schedules.length,12);
for(let c=0;c<12;c++){
  const rng=new RNG(side.seed_root+c),arr=Array(20).fill('L').concat(Array(20).fill('R'));
  for(let i=39;i>0;i--){const j=Math.floor(rng.next()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  const expected=arr.join('');
  assert.strictEqual(side.colony_schedules[c],expected,'marked-side schedule mismatch colony '+(c+1));
  assert.strictEqual([...expected].filter(x=>x==='L').length,20);
  assert.strictEqual([...expected].filter(x=>x==='R').length,20);
}
assert.strictEqual(side.firewall.outcomes_used,false);
assert.strictEqual(side.firewall.rerandomization_after_collection_starts,false);

assert.strictEqual(manifest.seed,prereg.biological_release_contract.release_pose_schedule_seed_root);
assert.strictEqual(manifest.rng_git_blob_sha,blob(simCoreRel));
assert.strictEqual(manifest.simulation_initialization_git_blob_sha,blob(neutralRel));
assert.strictEqual(manifest.parts.length,12);
const releaseRng=new RNG(manifest.seed); let globalCount=0;
for(let c=0;c<12;c++){
  const meta=manifest.parts[c],part=read(meta.file);
  assert.strictEqual(blob(meta.file),meta.git_blob_sha,'release-pose part blob drift colony '+(c+1));
  assert.strictEqual(part.poses.length,40);
  for(let t=0;t<40;t++){
    const row=part.poses[t],angle=2*Math.PI*releaseRng.next(),radius=.4*Math.sqrt(releaseRng.next());
    const x=30+radius*Math.cos(angle),y=120+radius*Math.sin(angle),heading=.05*releaseRng.normal();
    assert.ok(Math.abs(row[1]-x)<1e-12&&Math.abs(row[2]-y)<1e-12&&Math.abs(row[3]-heading)<1e-12,'release pose mismatch '+(c+1)+'/'+(t+1));
    assert.ok(Math.hypot(row[1]-30,row[2]-120)<=.4+1e-12,'release outside disk'); globalCount++;
  }
}
assert.strictEqual(globalCount,480);
assert.strictEqual(manifest.firewall.biological_outcomes_used_to_generate_or_select_schedule,false);

assert.strictEqual(chemical.required_fields.master_stock_total_hindguts,'integer exactly 32');
assert.strictEqual(chemical.required_fields.master_stock_dcm_ml,'number exactly 8.000');
assert.ok(chemical.session_use_required_fields.batch_id.includes('parent master-stock batch_id'),'chemical session must carry parent batch ID');
assert.ok(chemical.session_use_required_fields.aliquot_id.includes('same parent batch_id'),'aliquot must belong to the same batch');
assert.strictEqual(chemical.session_use_required_fields.marked_arm_total_volume_ul,'number exactly 12');
assert.strictEqual(chemical.session_use_required_fields.control_arm_dcm_total_volume_ul,'number exactly 12');
assert.ok(chemical.validation_rules.join('\n').includes('session-use batch_id must exactly equal the parent master-stock batch_id'),'chemical batch join rule missing');
assert.strictEqual(chemical.firewall.behavioral_outcomes_may_change_recipe,false);

assert.strictEqual(husbandry.record_scope,'one record for each of the 12 test colonies');
assert.ok(husbandry.required_fields.colony_id.includes('C01 through C12'));
assert.ok(husbandry.required_fields.source_nest_id.includes('all 12 test colonies must have distinct source_nest_id values'));
assert.ok(husbandry.required_fields.lab_acclimation_days_before_first_trial.includes('>= 7'));
assert.strictEqual(husbandry.required_fields.pre_deprivation_sucrose_molarity_M,'number exactly 0.5');
assert.strictEqual(husbandry.required_fields.pre_deprivation_sucrose_ad_libitum,'boolean true');
assert.strictEqual(husbandry.required_fields.pre_deprivation_chopped_cockroach_feedings_per_week,'number exactly 3');
assert.ok(husbandry.required_fields.food_deprivation_hours_before_first_trial.includes('[94,98]'));
assert.strictEqual(husbandry.required_fields.water_ad_libitum_during_deprivation,'boolean true');
assert.strictEqual(husbandry.required_fields.light_dark_cycle_hours,'exact string 12:12');
assert.ok(husbandry.required_fields.test_date_local.includes('all 40 trial_start_timestamp values'));
assert.strictEqual(husbandry.required_fields.all_trials_within_2_to_10_hours_after_lights_on,'boolean true and mechanically verified against all 40 trial_start_timestamp values');
assert.strictEqual(husbandry.required_fields.no_food_reward_present_in_test_maze,'boolean true');
const husbandryRules=husbandry.validation_rules.join('\n');
assert.ok(husbandryRules.includes('all source_nest_id values must be distinct'));
assert.ok(husbandryRules.includes('at least 7 days'));
assert.ok(husbandryRules.includes('96 plus or minus 2 hours with water ad libitum'));
assert.ok(husbandryRules.includes('2 through 10 hours after test_day_lights_on_timestamp_local'));
assert.strictEqual(husbandry.firewall.behavioral_outcomes_may_change_husbandry,false);
assert.strictEqual(husbandry.firewall.behavioral_outcomes_may_change_test_environment,false);

assert.strictEqual(video.required_fields.video_nominal_fps,'number exactly 100');
assert.ok(video.required_fields.video_capture_status.includes('usable or failed'));
assert.ok(video.required_fields.actual_frame_timestamps_available.includes('false permitted only for failed capture'));
assert.ok(video.required_fields.video_file_id.includes('null permitted only for failed capture'));
assert.ok(video.required_fields.video_file_sha256.includes('null permitted only for failed capture'));
const videoRules=video.consistency_rules.join('\n');
assert.ok(videoRules.includes('video_capture_status=usable')&&videoRules.includes('actual_frame_timestamps_available must be true'),'usable video provenance must be complete');
assert.ok(videoRules.includes('video_capture_status=failed')&&videoRules.includes('never fabricate file identifiers, hashes, or timestamps'),'failed video provenance must allow honest nulls');
assert.ok(videoRules.includes('affected trial must use the preregistered verified_video_or_tracking_failure_preventing_endpoint_determination technical exclusion'),'failed capture must force exact exclusion');
assert.strictEqual(video.endpoint_processing_contract.actual_frame_timestamps_required_for_usable_endpoint_scoring,true);
assert.strictEqual(video.endpoint_processing_contract.maximum_interpolation_gap_s,.05);
assert.strictEqual(video.endpoint_processing_contract.timeout_s,90);
assert.strictEqual(video.firewall.fabricated_video_provenance_authorized,false);

assert.strictEqual(trial.one_record_per_planned_trial,true);
for(const field of prereg.raw_data_and_provenance.required_trial_fields) assert.ok(trial.required_fields.includes(field),'missing prereg field '+field);
for(const field of ['session_id','video_file_id','scorer_identity','release_occurred','t0_pose_measurement_available']) assert.ok(trial.required_fields.includes(field),'missing provenance field '+field);
assert.ok(trial.field_contracts.colony_id.includes('exactly match one frozen colony-husbandry record'),'colony must join husbandry record');
assert.ok(trial.field_contracts.trial_start_timestamp.includes('fall 2 through 10 hours after'),'trial timestamp must enforce lights-on window');
assert.ok(trial.field_contracts.pheromone_batch_id.includes('must exactly equal batch_id on the unique chemical session-use record'),'trial batch must bind chemical session');
assert.ok(trial.field_contracts.video_file_id.includes('null only when that session has video_capture_status=failed'));
assert.ok(trial.required_fields.includes('worker_assay_naive_before_trial'),'worker naivety field missing');
assert.ok(trial.required_fields.includes('substrate_piece_id'),'substrate piece provenance missing');
assert.ok(trial.required_fields.includes('fresh_substrate_installed_for_trial'),'fresh substrate compliance missing');
assert.ok(trial.required_fields.includes('reusable_maze_base_cleaned_with_70_percent_ethanol_before_trial'),'ethanol cleaning compliance missing');
assert.ok(trial.required_fields.includes('reusable_maze_base_fully_dry_before_fresh_substrate_installation'),'base drying compliance missing');
assert.ok(trial.field_contracts.worker_assay_naive_before_trial.includes('must be true for promotion-grade execution'),'naivety contract missing');
assert.ok(trial.field_contracts.substrate_piece_id.includes('unique across all non-null planned trial records'),'substrate uniqueness contract missing');
assert.ok(trial.field_contracts.substrate_piece_id.includes('null only when no paper overlay was installed'),'pre-installation substrate null exception missing');
assert.deepStrictEqual(trial.allowed_exclusion_reasons,prereg.predeclared_exclusions_and_quality.allowed_trial_exclusion_reasons);
const rules=trial.consistency_rules.join('\n');
assert.ok(rules.includes('colony_id must exactly equal the C## colony prefix encoded by trial_id'));
assert.ok(rules.includes('colony_id must join exactly one frozen colony-husbandry record'),'husbandry join rule missing');
assert.ok(rules.includes('wild-source, distinct-source-nest, acclimation, feeding, 96 plus or minus 2 hour deprivation, water, 12:12 light cycle, lights-on test-window, and no-food-reward contracts'),'husbandry contract coverage missing');
assert.ok(rules.includes('local YYYY-MM-DD date parsed from trial_start_timestamp must be identical across all 40 planned trial records'),'one-test-day rule missing');
assert.ok(rules.includes('every trial_start_timestamp must be at least 2 hours and at most 10 hours after'),'lights-on window rule missing');
assert.ok(rules.includes('pheromone_batch_id must exactly equal the batch_id stored on the unique chemical session-use record joined by session_id'),'chemical batch binding rule missing');
assert.ok(rules.includes('video_capture_status=usable')&&rules.includes('video_file_id must be nonempty'));
assert.ok(rules.includes('video_capture_status=failed')&&rules.includes('video_file_id may be null only when exclusion_flag=true'));
assert.ok(rules.includes('worker_assay_naive_before_trial must be true for a promotion-grade conforming trial'),'worker-naivety rule missing');
assert.ok(rules.includes('every non-null substrate_piece_id must be unique across all planned trial records'),'unique substrate rule missing');
assert.ok(rules.includes('substrate_piece_id may be null only when fresh_substrate_installed_for_trial=false'),'pre-installation substrate null rule missing');
assert.ok(rules.includes('if fresh_substrate_installed_for_trial=true then substrate_piece_id must be nonempty'),'installed substrate must retain ID');
assert.ok(rules.includes('fresh_substrate_installed_for_trial')&&rules.includes('reusable_maze_base_cleaned_with_70_percent_ethanol_before_trial')&&rules.includes('reusable_maze_base_fully_dry_before_fresh_substrate_installation'),'cleaning/substrate compliance rule missing');
assert.ok(rules.includes('both terminal first-entry times are null')&&rules.includes('timeout must be true'));
assert.ok(rules.includes('exactly one terminal first-entry time is non-null')&&rules.includes('scored_choice must equal that terminal side'));
assert.ok(rules.includes('both terminal first-entry times are non-null')&&rules.includes('strictly earlier first-entry time'));
assert.ok(rules.includes('null/null is a timeout state'));
assert.ok(rules.includes('if release_occurred=false')&&rules.includes('must all be null'));
assert.ok(rules.includes('if t0_pose_measurement_available=false')&&rules.includes('never fabricate unavailable measurements'));
assert.ok(rules.includes('release_position_error_mm is numeric')&&rules.includes('exclusion_flag must be true'));
assert.ok(rules.includes('preserve the observed ant_id even when it duplicates'));
assert.strictEqual(trial.firewall.interim_outcome_monitoring_authorized,false);
assert.strictEqual(trial.firewall.outcome_dependent_schema_change_authorized,false);
assert.strictEqual(trial.firewall.best_subset_reporting_authorized,false);

assert.strictEqual(collector.status,'identity_pending_collection_not_authorized');
assert.strictEqual(collector.collector_identity,null);
assert.strictEqual(collector.collector_team_or_affiliation,null);
assert.strictEqual(collector.identity_frozen,false);
assert.ok(Object.prototype.hasOwnProperty.call(collector.required_attestations_before_authorization,'will_not_participate_in_this_dataset_outcome_analysis'));
assert.strictEqual(collector.required_attestations_before_authorization.will_not_participate_in_dataset_outcome_analysis_before_raw_dataset_hash_freeze,undefined);
for(const v of Object.values(collector.required_attestations_before_authorization)) assert.strictEqual(v,null);
assert.strictEqual(collector.firewall.collector_participation_in_this_dataset_outcome_analysis_authorized,false);
assert.strictEqual(collector.firewall.candidate_prediction_disclosure_to_collector_before_dataset_hash_freeze_authorized,false);

assert.strictEqual(checklist.status,'frozen_before_biological_collection');
for(const required of ['collector_identity_is_real_nonempty_and_frozen','all_collector_independence_attestations_are_true','all_12_colony_husbandry_records_are_complete_and_valid','all_12_colony_source_nest_ids_are_distinct','marked_side_schedule_blob_is_unchanged','release_pose_schedule_manifest_and_all_part_blobs_are_unchanged','chemical_batch_template_blob_is_unchanged','colony_husbandry_template_blob_is_unchanged','chemical_session_batch_binding_is_enforced','fresh_codex_review_is_clean_on_exact_head','activation_commit_is_qualified_on_permanent_main']) assert.ok(checklist.must_all_be_true_before_first_trial.includes(required),required+' missing from activation checklist');
assert.ok(checklist.activation_may_change.includes('prospective_colony_husbandry_records_from_absent_to_complete'));
for(const required of ['worker_assay_naivety_field_and_enforcement_are_frozen','per_trial_fresh_substrate_and_cleaning_fields_and_enforcement_are_frozen']) assert.ok(checklist.must_all_be_true_before_first_trial.includes(required),required+' missing from activation checklist');
assert.ok(!checklist.must_all_be_true_before_first_trial.includes('worker_assay_naivety_is_verified_before_every_trial'),'future naivety evidence cannot be prefilled at activation');
assert.ok(!checklist.must_all_be_true_before_first_trial.includes('fresh_unique_substrate_and_between_trial_cleaning_provenance_is_complete_for_every_trial'),'future cleaning evidence cannot be prefilled at activation');
for(const frozen of ['preregistration','Candidate_307_parameters_or_prediction','marked_side_schedule','release_pose_schedule','environment_or_husbandry_contract','statistical_comparison_or_promotion_rule']) assert.ok(checklist.activation_may_not_change.includes(frozen));

assert.strictEqual(auth.activation_rule.requires_collector_exclusion_from_this_dataset_outcome_analysis,true);
assert.strictEqual(auth.activation_rule.requires_complete_valid_12_colony_husbandry_records,true);
assert.strictEqual(auth.activation_rule.requires_chemical_session_batch_binding,true);
assert.strictEqual(auth.activation_rule.requires_failed_video_provenance_without_fabrication,true);
assert.strictEqual(auth.activation_rule.requires_one_local_test_day_per_colony,true);
assert.strictEqual(auth.activation_rule.requires_worker_assay_naivety_field_and_enforcement_frozen_at_activation,true);
assert.strictEqual(auth.activation_rule.requires_per_trial_fresh_substrate_and_cleaning_fields_and_enforcement_frozen_at_activation,true);
assert.strictEqual(auth.activation_rule.requires_per_trial_naivety_substrate_and_cleaning_evidence_recorded_prospectively_during_collection,true);
assert.strictEqual(auth.gate_checks.collector_identity_frozen,false);
assert.strictEqual(auth.gate_checks.collector_independence_attestations_all_true,false);
assert.strictEqual(auth.gate_checks.all_12_colony_husbandry_records_complete_and_valid,false);
assert.strictEqual(auth.gate_checks.new_biological_outcomes_known_to_exist_at_gate,false);
assert.strictEqual(auth.gate_checks.new_biological_outcome_access_authorized_at_gate,false);
assert.ok(auth.authorization_blocker.includes('12 prospective colony husbandry/source records'));
for(const v of Object.values(auth.semantic_firewall)) assert.strictEqual(v,false);

console.log('p4-external-validation-collection-authorization.test.js PASS '+JSON.stringify({authorization_blob:blob(authRel),chemical_blob:blob(chemicalRel),husbandry_blob:blob(husbandryRel),video_blob:blob(videoRel),trial_schema_blob:blob(trialRel),release_poses:globalCount,collection_authorized:auth.collection_authorized,blocker:'collector_identity_and_colony_husbandry_records'}));
