'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_cross_apparatus_Y_maze_consistency_protocol_v1.json';
assert.strictEqual(blob(rel),'22515a3fe0945c0f19b6fb2166923f027bbf1b54');
const p=read(rel);
assert.strictEqual(p.id,'P4_cross_apparatus_Y_maze_consistency_protocol_v1');
assert.strictEqual(p.status,'descriptive_cross_apparatus_consistency_protocol_frozen_before_new_Y_maze_simulation');
assert.strictEqual(p.freeze_date_local,'2026-09-13');

const l=p.lineage;
assert.strictEqual(l.source_design_git_blob_sha,'740bedc5d552036c2d8adcac7529b64b2da6de0c');
assert.strictEqual(blob(l.source_design_file),l.source_design_git_blob_sha);
assert.strictEqual(l.p4_result_freeze_git_blob_sha,'73f802be9dd9f21819649ab25323a9b3a92cff04');
assert.strictEqual(blob(l.p4_result_freeze_file),l.p4_result_freeze_git_blob_sha);
assert.strictEqual(l.p4_development_policy_git_blob_sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(blob(l.p4_development_policy_file),l.p4_development_policy_git_blob_sha);
assert.strictEqual(l.main_checkpoint_before_protocol,'92cf82051b4cf780721dbb66042d5d373527fff9');
assert.strictEqual(l.main_workflow_run_id,34782153794);
assert.strictEqual(l.main_workflow_run_number,164);
assert.strictEqual(l.main_test_job_id,103790998580);
assert.strictEqual(l.main_test_job_conclusion,'success');
assert.strictEqual(l.main_deploy_job_id,103791098732);
assert.strictEqual(l.main_deploy_job_conclusion,'success');

const m=p.frozen_model_under_audit;
assert.strictEqual(m.candidate_index,307);
assert.strictEqual(m.sigma_field_mm,18.319554310908863);
assert.strictEqual(m.kappa_trail_per_s,6.342935528120713);
assert.strictEqual(m.theta_detect,0.9184);
assert.strictEqual(blob(m.runtime_file),'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
assert.strictEqual(blob(m.p1_field_helper_file),'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(blob(m.canonical_locomotion_model_file),'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');
assert.strictEqual(m.future_execution_model_file,'models/lasius_niger_painted_trail_p4_fitted_v1.json');
assert.match(m.future_execution_model_rule,/replacing only sigma_field_mm, kappa_trail_per_s, and theta_detect/i);
assert.strictEqual(m.parameter_search_authorized,false);
assert.strictEqual(m.refit_authorized,false);
assert.strictEqual(m.retuning_authorized,false);

const a=p.apparatus_interpretation;
assert.strictEqual(blob(a.base_apparatus_file),'eca7a0e66aed9546e5fc26c08f7abaa37bb3cbc8');
assert.deepStrictEqual(a.stem_entry,{x:30,y:120,heading_rad:0});
assert.deepStrictEqual(a.left_arm_centerline_mm,{x1:140,y1:120,x2:190,y2:33.3975,width_mm:10});
assert.deepStrictEqual(a.right_arm_centerline_mm,{x1:140,y1:120,x2:190,y2:206.6025,width_mm:10});
assert.deepStrictEqual(a.left_marked_field_segment_mm,{x1:140,y1:120,x2:190,y2:33.3975});
assert.deepStrictEqual(a.right_marked_field_segment_mm,{x1:140,y1:120,x2:190,y2:206.6025});
assert.strictEqual(a.field_type,'line_segment_scalar_field');
assert.strictEqual(a.field_directionality,'undirected');
assert.strictEqual(a.nominal_dose_hindgut_equivalents_per_cm,0.0048);
assert.strictEqual(blob(a.nominal_dose_provenance_file),'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4');
assert.match(a.opposite_arm_interpretation,/no active painted-trail scalar field/i);
assert.strictEqual(a.special_Y_maze_runtime_logic_authorized,false);

const init=p.initialization;
assert.strictEqual(blob(init.provenance_file),'e61793266a7716587ef11fc96e0959f86103931c');
assert.strictEqual(init.entry_point,'stem');
assert.strictEqual(init.heading_rad,0);
assert.strictEqual(init.position_jitter_mm,0.4);
assert.strictEqual(init.heading_jitter_rad,0.05);
assert.strictEqual(init.duration_s,90);
assert.strictEqual(init.workers,1);
assert.strictEqual(init.condition_specific_entry_distributions_authorized,false);

const s=p.scoring;
assert.strictEqual(blob(s.profile_file),'8235e511b8ef4159671f670b944129c82f7358cb');
assert.strictEqual(s.type,'first_region_entry');
assert.strictEqual(s.irreversible,true);
assert.deepStrictEqual(s.left_region,{shape:'circle',x:190,y:33.3975,radius_mm:7});
assert.deepStrictEqual(s.right_region,{shape:'circle',x:190,y:206.6025,radius_mm:7});
assert.strictEqual(s.biological_replication_status,'engineering_endpoint_only');
assert.strictEqual(s.biological_decision_criterion_available,false);

const d=p.simulation_design;
assert.strictEqual(d.new_simulation_authorized_at_this_protocol_gate,false);
assert.strictEqual(d.execution_requires_later_implementation_authorization,true);
assert.strictEqual(d.applied_hindgut_equivalents_per_cm,0.0048);
assert.strictEqual(d.dose_ratio,1);
assert.deepStrictEqual(d.marked_side_conditions,['left','right']);
assert.strictEqual(d.trials_per_marked_side,1000);
assert.strictEqual(d.total_pheromone_trials,2000);
assert.strictEqual(d.seed_root,8210000);
assert.strictEqual(d.neutral_trials,1000);
assert.strictEqual(d.neutral_seed_root,8310000);
assert.match(d.seed_rule,/seed=8210000\+i.*left-marked apparatus.*right-marked apparatus/i);
assert.match(d.seed_rule,/Paired seeds provide common-random-number side balancing/i);
assert.match(d.side_balance_rule,/exactly equal simulation weight/i);
assert.match(d.study_condition_projection_rule,/same side-balanced model prediction.*all four/i);
assert.strictEqual(d.condition_specific_parameterization_authorized,false);
assert.strictEqual(d.adaptive_budget_authorized,false);
assert.strictEqual(d.rerun_to_reduce_discrepancy_authorized,false);

const f=p.two_stage_outcome_firewall;
assert.strictEqual(f.stage_A_name,'simulation_only');
assert.match(f.stage_A_rule,/without reading, importing, parsing, or receiving semantic values/i);
assert.strictEqual(f.stage_A_required_artifact,'reports/p4_ymaze_consistency_simulation_v1.json');
assert.match(f.stage_A_freeze_requirement,/must be frozen before Stage B/i);
assert.strictEqual(f.stage_B_name,'descriptive_comparison');
assert.match(f.stage_B_rule,/may not alter Stage A, rerun simulations, change parameters/i);
assert.strictEqual(blob(f.known_summary_artifact_1.file),f.known_summary_artifact_1.git_blob_sha);
assert.strictEqual(f.known_summary_artifact_1.git_blob_sha,'5836b5011d765043f94683fa761f3016e86643dc');
assert.strictEqual(blob(f.known_summary_artifact_2.file),f.known_summary_artifact_2.git_blob_sha);
assert.strictEqual(f.known_summary_artifact_2.git_blob_sha,'2ff7d9dcd27cf7609ce77b0f655a6520597c2432');
assert.strictEqual(f.raw_choice_access_authorized,false);
assert.strictEqual(f.colony_level_outcome_access_authorized,false);

const r=p.predeclared_simulation_reporting;
for(const x of ['side_balanced_marked_arm_choice_fraction','neutral_left_fraction_among_choices','left_right_marked_side_difference','P4_detection_diagnostics_by_marked_side'])assert.ok(r.required_fields.includes(x),x+' must be reported');
assert.match(r.uncertainty_rule,/Wilson 95%/);
assert.match(r.timeout_rule,/never silently dropped/i);
assert.strictEqual(r.precision_or_significance_claim_authorized,false);

const c=p.predeclared_stage_B_comparison_reporting;
assert.strictEqual(c.comparison_scope,'comprehensive_descriptive_only');
assert.strictEqual(c.required_biological_summary_comparisons.length,4);
assert.deepStrictEqual(c.required_error_fields,['signed_difference_model_minus_observed','absolute_difference']);
assert.strictEqual(c.all_predeclared_comparisons_must_be_reported,true);
assert.strictEqual(c.best_subset_reporting_authorized,false);
assert.strictEqual(c.inferential_significance_test_authorized,false);
assert.strictEqual(c.validation_pass_fail_threshold,null);
assert.strictEqual(c.promotion_rule,null);
assert.strictEqual(c.canonical_update_authorized,false);

for(const [k,v] of Object.entries(p.firewalls))assert.strictEqual(v,false,k+' must remain false');
assert.strictEqual(p.next_gate.id,'P4_Y_maze_consistency_implementation_authorization_v1');
assert.strictEqual(p.next_gate.may_change_protocol,false);
assert.strictEqual(p.next_gate.may_run_official_consistency_execution,false);
assert.strictEqual(p.next_gate.may_read_known_biological_summaries_in_stage_A,false);
assert.match(p.separate_promotion_grade_track,/external_validation_source_discovery/i);

// Historical v0.3.4j truth: these implementation surfaces were absent at protocol freeze.
// Later they may exist only after the exact v0.3.4k authorization, while official Stage A
// and real Stage B reports remain absent until their own later authorizations.
const implementationAuthorization='hypotheses/p4_Y_maze_consistency_implementation_authorization_v1.json';
if(fs.existsSync(path.join(root,implementationAuthorization))){
  assert.strictEqual(blob(implementationAuthorization),'db64b72830c3715b3dd26d5ad3422655e50e8828');
  const ia=read(implementationAuthorization);
  assert.strictEqual(ia.protocol_lineage.protocol_file,rel);
  assert.strictEqual(ia.protocol_lineage.protocol_git_blob_sha,'22515a3fe0945c0f19b6fb2166923f027bbf1b54');
  for(const [file,sha] of [
    [m.future_execution_model_file,'e23b022279d463442bdd4e16d4cf56e0212d2b11'],
    [a.future_left_marked_apparatus_file,'219d42036c13463e8cae5045b8fdba6d5bd24454'],
    [a.future_right_marked_apparatus_file,'bfcba7e34eed4b4f79e67d6fc22c60af993f5386'],
    [d.future_runner_file,'af0fd2d91f67102c62243bef289bbfe20cf471d7']
  ]){assert.ok(fs.existsSync(path.join(root,file)),file+' should exist only after implementation authorization');assert.strictEqual(blob(file),sha,file+' blob drift');}
}else{
  for(const file of [m.future_execution_model_file,a.future_left_marked_apparatus_file,a.future_right_marked_apparatus_file,d.future_runner_file])assert.ok(!fs.existsSync(path.join(root,file)),file+' must not exist before implementation authorization');
}
for(const file of ['reports/p4_ymaze_consistency_simulation_v1.json','reports/p4_ymaze_consistency_comparison_v1.json'])assert.ok(!fs.existsSync(path.join(root,file)),file+' must remain absent before official execution/comparison authorization');

console.log('p4-ymaze-consistency-protocol.test.js PASS '+JSON.stringify({protocol_blob:blob(rel),candidate:m.candidate_index,trials_per_side:d.trials_per_marked_side,neutral_trials:d.neutral_trials,validation_threshold:c.validation_pass_fail_threshold,implementation_authorization_present:fs.existsSync(path.join(root,implementationAuthorization)),simulation_authorized:false}));
