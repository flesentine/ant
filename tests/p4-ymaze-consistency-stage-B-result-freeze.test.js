'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const comparator=require('../tools/compare-p4-ymaze-consistency.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const freezeRel='hypotheses/p4_Y_maze_consistency_stage_B_result_freeze_v1.json';
const reportRel='reports/frozen/p4_ymaze_consistency_comparison_v1.json';
const provenanceRel='reports/frozen/p4_ymaze_consistency_stage_B_execution_provenance_v1.json';
const transientReport='reports/p4_ymaze_consistency_comparison_v1.json';
const transientProvenance='reports/p4_ymaze_consistency_stage_B_execution_provenance_v1.json';
const runtimeAuth='hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json';

assert.strictEqual(blob(freezeRel),'0a17dd6d536e3ccc9487afe44ec3daeb24454b94','Stage-B result-freeze record blob drift');
assert.strictEqual(blob(reportRel),'afaf2603bbd4a02f19bfe5aebc5f932a1e0c1615','frozen Stage-B report blob drift');
assert.strictEqual(blob(provenanceRel),'55e7894b71b064fdaf5ee5b7812d632231eb29dc','frozen Stage-B provenance blob drift');
assert.strictEqual(sha256(reportRel),'c4b7f32f51c171a38c8a73e26dc73d803a197cc26799d9652a36eec8a255ca10','frozen Stage-B report SHA-256 drift');
assert.strictEqual(sha256(provenanceRel),'8d90a6df874b3ac90dfc503f750b69fbc1f7733d987c70996bfe48085da1385a','frozen Stage-B provenance SHA-256 drift');

assert.ok(!fs.existsSync(path.join(root,transientReport)),'transient Stage-B execution report path must remain absent from committed state');
assert.ok(!fs.existsSync(path.join(root,transientProvenance)),'transient Stage-B provenance path must remain absent from committed state');
assert.ok(!fs.existsSync(path.join(root,runtimeAuth)),'runtime Stage-B authorization must remain absent from committed state');
assert.throws(()=>comparator.requireRealAuthorization(),/locked|authorization file is absent|authorization/i,'real Stage-B comparator must remain locked after freeze');

const f=read(freezeRel),r=read(reportRel),p=read(provenanceRel);
assert.strictEqual(f.id,'P4_Y_maze_consistency_stage_B_result_freeze_v1');
assert.strictEqual(f.status,'official_stage_B_artifact_frozen_interpretation_and_canonical_promotion_locked');
assert.strictEqual(f.execution_gate.execution_main_commit,'f768c0fcf935be5e8f7122e0be2185ee6a7d4205');
assert.strictEqual(f.execution_gate.workflow_run_id,34895676785);
assert.strictEqual(f.execution_gate.workflow_run_number,1);
assert.strictEqual(f.execution_gate.workflow_attempt,1);
assert.strictEqual(f.execution_gate.execution_job_id,104148916963);
assert.strictEqual(f.execution_gate.execution_job_conclusion,'success');
assert.strictEqual(f.execution_gate.workflow_event_before,'7ab56e3e4bfe1fc68659d6bad5bf13ebb716d66a');
assert.strictEqual(f.execution_gate.node_version,'22.23.2');
assert.strictEqual(f.execution_gate.prospective_authorization_git_blob_sha,'b973ee451687ccb8f6730d6dc11d09eb34d3e54b');
assert.strictEqual(f.execution_gate.execution_precondition_git_blob_sha,'bc7b0ea3f5838decd90b83325748ad9403c7be1a');
assert.strictEqual(f.execution_gate.execution_workflow_git_blob_sha,'b1a85646deaea2c0eac6cb4cea7c156841a3da80');

assert.strictEqual(f.permanent_main_qualification.run_id,34895676790);
assert.strictEqual(f.permanent_main_qualification.run_number,172);
assert.strictEqual(f.permanent_main_qualification.conclusion,'success');
assert.strictEqual(f.permanent_main_qualification.test_job_id,104148917222);
assert.strictEqual(f.permanent_main_qualification.test_job_conclusion,'success');
assert.strictEqual(f.permanent_main_qualification.deploy_job_id,104149178815);
assert.strictEqual(f.permanent_main_qualification.deploy_job_conclusion,'success');

assert.strictEqual(f.uploaded_artifact.artifact_id,10368431263);
assert.strictEqual(f.uploaded_artifact.name,'p4-v034q-ymaze-stage-b');
assert.strictEqual(f.uploaded_artifact.size_in_bytes,1949);
assert.strictEqual(f.uploaded_artifact.digest,'sha256:f2af43fd1b5fb36110783c067afc7bd8ab96470a36f451ac4c6fec7a27fb0cc2');
assert.strictEqual(f.uploaded_artifact.workflow_run_id,34895676785);
assert.strictEqual(f.uploaded_artifact.workflow_head_sha,'f768c0fcf935be5e8f7122e0be2185ee6a7d4205');

assert.strictEqual(f.frozen_stage_B_report.execution_output_file,transientReport);
assert.strictEqual(f.frozen_stage_B_report.file,reportRel);
assert.strictEqual(f.frozen_stage_B_report.git_blob_sha,blob(reportRel));
assert.strictEqual(f.frozen_stage_B_report.sha256,sha256(reportRel));
assert.strictEqual(f.frozen_execution_provenance.execution_output_file,transientProvenance);
assert.strictEqual(f.frozen_execution_provenance.file,provenanceRel);
assert.strictEqual(f.frozen_execution_provenance.git_blob_sha,blob(provenanceRel));
assert.strictEqual(f.frozen_execution_provenance.sha256,sha256(provenanceRel));

assert.strictEqual(r.schema_version,1);
assert.strictEqual(r.id,'P4_Y_maze_consistency_descriptive_comparison_v1');
assert.strictEqual(r.comparison_scope,'comprehensive_descriptive_only');
assert.strictEqual(r.row_count,7);
assert.strictEqual(r.rows.length,7);
assert.strictEqual(r.all_predeclared_comparisons_reported,true);
assert.deepStrictEqual(r.rows.map(x=>x.id),['overall','outwards_naive','outwards_experienced','return_experienced','return_naive','pheromone_left','pheromone_right']);
for(const row of r.rows){
  assert.strictEqual(row.signed_difference_model_minus_observed,row.model_prediction-row.observed_rate,row.id+' signed-difference arithmetic drift');
  assert.strictEqual(row.absolute_difference,Math.abs(row.signed_difference_model_minus_observed),row.id+' absolute-difference arithmetic drift');
}
assert.deepStrictEqual(f.frozen_descriptive_rows,r.rows.map(({id,model_prediction,observed_rate,signed_difference_model_minus_observed,absolute_difference})=>({id,model_prediction,observed_rate,signed_difference_model_minus_observed,absolute_difference})),'freeze record must preserve all seven rows exactly');
assert.strictEqual(r.observed_source_provenance.published_targets.git_blob_sha,'5836b5011d765043f94683fa761f3016e86643dc');
assert.strictEqual(r.observed_source_provenance.inventory.git_blob_sha,'2ff7d9dcd27cf7609ce77b0f655a6520597c2432');

assert.strictEqual(p.id,'P4_Y_maze_consistency_stage_B_execution_provenance_v1');
assert.strictEqual(p.workflow_run_id,34895676785);
assert.strictEqual(p.workflow_run_number,1);
assert.strictEqual(p.workflow_attempt,1);
assert.strictEqual(p.workflow_head_sha,'f768c0fcf935be5e8f7122e0be2185ee6a7d4205');
assert.strictEqual(p.official_report_git_blob_sha,blob(reportRel));
assert.strictEqual(p.official_report_sha256,sha256(reportRel));
assert.strictEqual(p.row_count,7);
assert.strictEqual(p.all_predeclared_comparisons_reported,true);
assert.strictEqual(p.runtime_authorization_materialized_ephemerally_only,true);
assert.strictEqual(p.runtime_authorization_removed_before_provenance,true);
assert.strictEqual(p.stage_A_rerun_or_modified,false);
assert.strictEqual(p.canonical_promotion_authorized,false);
assert.strictEqual(p.external_validation_claim_authorized,false);

assert.strictEqual(f.semantic_firewall.comparison_is_comprehensive_descriptive_only,true);
for(const key of ['comparison_is_external_validation','validation_pass_fail_threshold_exists','inferential_significance_test_was_run','best_subset_reporting_was_used','raw_Y_maze_choices_accessed','colony_level_Y_maze_outcomes_accessed','stage_A_was_rerun_or_modified','P4_parameters_changed','transient_stage_B_report_path_committed','transient_stage_B_provenance_path_committed','runtime_authorization_file_committed','canonical_promotion_authorized','external_validation_claim_authorized'])assert.strictEqual(f.semantic_firewall[key],false,key+' must remain false');
assert.strictEqual(f.result_immutability.valid_stage_B_result_must_be_accepted_exactly_as_produced,true);
for(const key of ['valid_stage_B_rerun_authorized','archived_report_bytes_may_change','archived_provenance_bytes_may_change','result_subset_selection_authorized','discrepancy_driven_rerun_authorized','runtime_authorization_file_may_be_committed','transient_execution_output_paths_may_be_committed'])assert.strictEqual(f.result_immutability[key],false,key+' must remain false');
assert.strictEqual(f.next_gate.id,'P4_Y_maze_consistency_stage_B_interpretation_v1');
assert.strictEqual(f.next_gate.may_interpret_only_exact_frozen_stage_B_report,true);
assert.strictEqual(f.next_gate.may_define_retroactive_validation_threshold,false);
assert.strictEqual(f.next_gate.may_select_best_subset,false);
assert.strictEqual(f.next_gate.may_rerun_stage_A_or_stage_B,false);
assert.strictEqual(f.next_gate.may_change_candidate_or_protocol,false);
assert.strictEqual(f.next_gate.may_authorize_canonical_promotion,false);
assert.strictEqual(f.next_gate.external_promotion_grade_validation_still_required,true);

console.log('p4-ymaze-consistency-stage-B-result-freeze.test.js PASS '+JSON.stringify({freeze_blob:blob(freezeRel),report_blob:blob(reportRel),report_sha256:sha256(reportRel),provenance_blob:blob(provenanceRel),provenance_sha256:sha256(provenanceRel),workflow_run:f.execution_gate.workflow_run_id,main_run:f.permanent_main_qualification.run_id,row_count:r.row_count,transient_paths_committed:false,runtime_authorization_committed:false,stage_B_rerun_authorized:false,canonical_promotion_authorized:false}));
