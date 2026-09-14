'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const comparator=require('../tools/compare-p4-ymaze-consistency.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const prospectiveRel='hypotheses/p4_Y_maze_consistency_stage_B_prospective_authorization_v1.json';
const runtimeRel='hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json';
const authBlob='b973ee451687ccb8f6730d6dc11d09eb34d3e54b';
const freezeRel='hypotheses/p4_Y_maze_consistency_stage_A_result_freeze_v1.json';
const reportRel='reports/p4_ymaze_consistency_simulation_v1.json';
const provenanceRel='reports/p4_ymaze_consistency_stage_A_execution_provenance_v1.json';
const comparatorRel='tools/compare-p4-ymaze-consistency.js';
assert.strictEqual(blob(prospectiveRel),authBlob,'prospective Stage-B authorization blob drift');
assert.ok(!fs.existsSync(path.join(root,runtimeRel)),'runtime Stage-B authorization file must remain absent in committed repository state');
assert.strictEqual(blob(freezeRel),'7651b5c50b7d0c752cc85a2af3225c1b5592a4fc');
assert.strictEqual(blob(reportRel),'a7b3e33ce613254c182360947641c5ff03f5af23');
assert.strictEqual(blob(provenanceRel),'566801802fe434afbd27d48876caa2735a9442ac');
assert.strictEqual(blob(comparatorRel),'75cf0ae6075695784e7c67c1473a50e0daaa98cc');

const a=read(prospectiveRel);
assert.strictEqual(a.id,'P4_Y_maze_consistency_stage_B_authorization_v1');
assert.strictEqual(a.status,'prospective_stage_B_authorization_frozen_runtime_authorization_file_absent_execution_locked');
assert.strictEqual(a.freeze_date_local,'2026-09-14');
assert.strictEqual(a.prospective_authorization_file,prospectiveRel);
assert.strictEqual(a.runtime_authorization_file,runtimeRel);
assert.strictEqual(a.official_stage_B_comparison_authorized,false);
assert.strictEqual(a.prospective_official_stage_B_comparison_authorized,true);
assert.strictEqual(a.stage_A_result_lineage.result_freeze_git_blob_sha,'7651b5c50b7d0c752cc85a2af3225c1b5592a4fc');
assert.strictEqual(a.stage_A_result_lineage.official_report_git_blob_sha,'a7b3e33ce613254c182360947641c5ff03f5af23');
assert.strictEqual(a.stage_A_result_lineage.execution_provenance_git_blob_sha,'566801802fe434afbd27d48876caa2735a9442ac');
assert.strictEqual(a.stage_A_result_lineage.qualified_main_commit,'0be957edc5d82294fd96635c7df852823bee7944');
assert.strictEqual(a.stage_A_result_lineage.qualified_main_workflow_run_id,34864086374);
assert.strictEqual(a.stage_A_result_lineage.qualified_main_workflow_run_number,170);
assert.strictEqual(a.stage_A_result_lineage.qualified_main_test_job_id,104043436487);
assert.strictEqual(a.stage_A_result_lineage.qualified_main_test_job_conclusion,'success');
assert.strictEqual(a.stage_A_result_lineage.qualified_main_deploy_job_id,104043729799);
assert.strictEqual(a.stage_A_result_lineage.qualified_main_deploy_job_conclusion,'success');
assert.deepStrictEqual(a.frozen_stage_A_artifact,{file:reportRel,git_blob_sha:'a7b3e33ce613254c182360947641c5ff03f5af23'});
assert.deepStrictEqual(a.frozen_stage_A_execution_provenance,{file:provenanceRel,git_blob_sha:'566801802fe434afbd27d48876caa2735a9442ac'});
assert.deepStrictEqual(a.stage_B_comparator,{file:comparatorRel,git_blob_sha:'75cf0ae6075695784e7c67c1473a50e0daaa98cc'});
assert.deepStrictEqual(a.frozen_observed_sources,[
  {file:'reference/poissonnier2026_published_targets.json',git_blob_sha:'5836b5011d765043f94683fa761f3016e86643dc'},
  {file:'reference/poissonnier2026_inventory.json',git_blob_sha:'2ff7d9dcd27cf7609ce77b0f655a6520597c2432'}
]);
// Authorization verifies source identity by hashes only; it does not parse observed biological rates.
for(const s of a.frozen_observed_sources)assert.strictEqual(blob(s.file),s.git_blob_sha,s.file+' source blob drift');
assert.strictEqual(comparator.PUBLISHED_FILE,a.frozen_observed_sources[0].file);
assert.strictEqual(comparator.PUBLISHED_BLOB,a.frozen_observed_sources[0].git_blob_sha);
assert.strictEqual(comparator.INVENTORY_FILE,a.frozen_observed_sources[1].file);
assert.strictEqual(comparator.INVENTORY_BLOB,a.frozen_observed_sources[1].git_blob_sha);
assert.strictEqual(comparator.OFFICIAL_STAGE_A_FILE,reportRel);

const c=a.comparison_contract;
assert.strictEqual(c.authorized_command_exact,'node tools/compare-p4-ymaze-consistency.js --out reports/p4_ymaze_consistency_comparison_v1.json');
assert.strictEqual(c.output_file,'reports/p4_ymaze_consistency_comparison_v1.json');
assert.strictEqual(c.cli_input_overrides_authorized,false);
assert.strictEqual(c.comparison_scope,'comprehensive_descriptive_only');
assert.strictEqual(c.required_row_count,7);
assert.deepStrictEqual(c.required_rows,['overall','outwards_naive','outwards_experienced','return_experienced','return_naive','pheromone_left','pheromone_right']);
assert.strictEqual(c.all_predeclared_comparisons_must_be_reported,true);
assert.strictEqual(c.signed_difference_model_minus_observed_required,true);
assert.strictEqual(c.absolute_difference_required,true);
assert.strictEqual(c.validation_pass_fail_threshold,null);
assert.strictEqual(c.promotion_rule,null);
assert.strictEqual(c.inferential_significance_test_authorized,false);
assert.strictEqual(c.best_subset_reporting_authorized,false);
assert.strictEqual(c.canonical_update_authorized,false);

const ep=a.execution_precondition;
assert.strictEqual(ep.runtime_authorization_file_must_remain_absent_in_committed_repository,true);
assert.strictEqual(ep.prospective_authorization_may_be_frozen_on_review_branch,true);
assert.strictEqual(ep.real_stage_B_execution_may_run_on_review_branch,false);
assert.strictEqual(ep.activation_mode,'ephemeral_runtime_authorization_file_only_after_separate_post_merge_precondition_verification');
assert.strictEqual(ep.ephemeral_runtime_authorization_file_must_not_be_committed,true);
assert.match(ep.ephemeral_materialization_rule,/change only official_stage_B_comparison_authorized from false to true/i);
assert.strictEqual(ep.future_execution_precondition_file,'hypotheses/p4_Y_maze_consistency_stage_B_execution_precondition_v1.json');
assert.strictEqual(ep.future_execution_workflow_file,'.github/workflows/p4-v034q-ymaze-stage-b.yml');
assert.strictEqual(ep.valid_stage_B_result_rerun_authorized,false);
for(const [k,v] of Object.entries(a.semantic_firewall))assert.strictEqual(v,false,k+' must remain false at prospective Stage-B authorization');
assert.strictEqual(a.next_gate.id,'P4_Y_maze_consistency_stage_B_execution_precondition_v1');
assert.strictEqual(a.next_gate.may_execute_real_stage_B_at_this_review_gate,false);
assert.strictEqual(a.next_gate.may_rerun_or_modify_stage_A,false);
assert.strictEqual(a.next_gate.may_change_candidate_or_protocol,false);
assert.strictEqual(a.next_gate.may_authorize_canonical_promotion,false);

// Mechanical lockout: the comparator's hard-coded runtime authorization path remains absent.
assert.throws(()=>comparator.requireRealAuthorization(),/locked|authorization file is absent/i);
assert.throws(()=>comparator.main([]),/locked|authorization file is absent/i);
for(const args of [['--simulation','x.json'],['--observed','x.json'],['--synthetic']])assert.throws(()=>comparator.parseRealCliArgs(args),/forbidden/i);
assert.ok(!fs.existsSync(path.join(root,c.output_file)),'real Stage-B report must remain absent at prospective authorization');

console.log('p4-ymaze-consistency-stage-B-authorization.test.js PASS '+JSON.stringify({authorization_blob:authBlob,runtime_authorization_file_present:false,stage_A_report:a.frozen_stage_A_artifact.git_blob_sha,comparator:a.stage_B_comparator.git_blob_sha,observed_source_blobs:a.frozen_observed_sources.map(x=>x.git_blob_sha),required_rows:c.required_row_count,real_stage_B_executed:false,canonical_promotion_authorized:false}));
