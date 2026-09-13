'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='reports/p4_ymaze_consistency_implementation_qualification_v1.json';
assert.strictEqual(blob(rel),'ac44324c1e7619a7e9d43f338c19951b661e8a14');
const r=read(rel);
assert.strictEqual(r.id,'P4_Y_maze_consistency_implementation_qualification_v1');
assert.strictEqual(r.status,'passed_reference_free_implementation_qualification');
assert.strictEqual(r.scientific_evidence,false);
assert.strictEqual(r.lineage.implementation_authorization_git_blob_sha,'db64b72830c3715b3dd26d5ad3422655e50e8828');
assert.strictEqual(blob(r.lineage.implementation_authorization_file),r.lineage.implementation_authorization_git_blob_sha);
assert.strictEqual(r.lineage.protocol_git_blob_sha,'22515a3fe0945c0f19b6fb2166923f027bbf1b54');
assert.strictEqual(blob(r.lineage.protocol_file),r.lineage.protocol_git_blob_sha);
assert.strictEqual(r.lineage.result_freeze_git_blob_sha,'73f802be9dd9f21819649ab25323a9b3a92cff04');
assert.strictEqual(blob(r.lineage.result_freeze_file),r.lineage.result_freeze_git_blob_sha);
assert.strictEqual(r.lineage.permanent_main_checkpoint_before_implementation,'4a2c6a0f40f9d07c57ac7eb2ad6eec58aa0cd6e6');
assert.strictEqual(r.lineage.permanent_main_workflow_run_id,34782980429);
assert.strictEqual(r.lineage.permanent_main_test_job_id,103793242428);
assert.strictEqual(r.lineage.permanent_main_deploy_job_id,103793368453);

assert.deepStrictEqual(r.frozen_candidate,{candidate_index:307,sigma_field_mm:18.319554310908863,kappa_trail_per_s:6.342935528120713,theta_detect:0.9184});
for(const spec of Object.values(r.qualified_implementation_blobs)){
  assert.ok(fs.existsSync(path.join(root,spec.file)),spec.file+' missing');
  assert.strictEqual(blob(spec.file),spec.git_blob_sha,spec.file+' blob drift');
}
assert.strictEqual(r.qualified_implementation_blobs.runtime_p4.changed_in_this_gate,false);
assert.strictEqual(r.qualified_implementation_blobs.runtime_p1_helper.changed_in_this_gate,false);

const n=r.node_qualification;
assert.strictEqual(n.status,'success');
assert.strictEqual(n.workflow_run_id,34784211214);
assert.strictEqual(n.job_id,103796617359);
assert.strictEqual(n.qualified_head_sha,'b142cd7e6be3be4a8adf291c3d3930968c9e19fc');
for(const k of ['scope_and_frozen_runtime_check','syntax_checks','historical_lifecycle_regressions','implementation_regression','qualification_stage_A_nonofficial_execution','official_stage_A_lockout','complete_permanent_regression_suite','zero_dose_behavior_rng_lifecycle_identity'])assert.strictEqual(n[k],true,k+' must pass');
assert.strictEqual(n.official_or_biological_comparison_artifacts_created,false);
assert.deepStrictEqual(n.qualification_seed_contract,{left_root:8410000,right_root:8410000,marked_trials_per_side:12,neutral_root:8510000,neutral_trials:12,total_trials:36,official_seed_overlap:false});
assert.strictEqual(n.synthetic_stage_B_row_count,7);
assert.strictEqual(n.synthetic_stage_B_decision_semantics_present,false);

const c=r.chromium_qualification;
assert.strictEqual(c.status,'success');
assert.strictEqual(c.workflow_run_id,34784428038);
assert.strictEqual(c.job_id,103797205106);
assert.strictEqual(c.qualified_head_sha,'c78b314b2da5a95af02d58d3c337eda8b4f2e458');
assert.strictEqual(c.chrome_version,'Google Chrome 152.0.7977.82');
assert.strictEqual(c.case_count,6);
assert.strictEqual(c.cases.length,6);
assert.deepStrictEqual(c.cases.map(x=>[x.condition,x.seed]),[
  ['left_marked',8410000],['left_marked',8410001],
  ['right_marked',8410000],['right_marked',8410001],
  ['neutral_zero_dose',8510000],['neutral_zero_dose',8510001]
]);
assert.strictEqual(c.exact_discrete_semantic_parity,true);
assert.ok(c.exact_parity_fields.includes('rngState'));
assert.ok(c.exact_parity_fields.includes('p4DetectedSamples'));
assert.strictEqual(c.continuous_state_abs_tolerance,1e-7);
assert.ok(c.max_abs_numeric_difference>=0&&c.max_abs_numeric_difference<=c.continuous_state_abs_tolerance);
assert.strictEqual(c.max_abs_numeric_difference,2.574299173829786e-8);
assert.strictEqual(c.max_difference_case,'right-8410001');
assert.strictEqual(c.max_difference_field,'y');
assert.strictEqual(c.neutral_zero_dose_bypass,true);
assert.strictEqual(c.browser_http_request_count,44);
assert.strictEqual(c.forbidden_biological_ymaze_network_requests,0);
assert.strictEqual(c.known_biological_summary_artifact_requests,0);
assert.strictEqual(c.reference_directory_requests,0);
assert.strictEqual(c.official_stage_A_executed,false);
assert.strictEqual(c.real_stage_B_executed,false);
assert.strictEqual(c.artifact_id,10326087265);
assert.strictEqual(c.artifact_digest,'sha256:aba0d06f801efbf945478f3bce53f3a4ee0aebe69be177d2d52966e8af118b22');

const a=r.stage_A_semantic_firewall;
for(const k of ['known_biological_ymaze_summaries_read_by_runner','known_biological_ymaze_summaries_requested_by_browser','raw_ymaze_choices_accessed','colony_level_ymaze_outcomes_accessed','official_seed_execution_authorized','official_stage_A_report_created'])assert.strictEqual(a[k],false,k+' must remain false');
const b=r.stage_B_semantics;
assert.strictEqual(b.implementation_qualified_with_synthetic_fixture_only,true);
assert.strictEqual(b.real_biological_comparison_executed,false);
assert.strictEqual(b.protocol_predeclared_rows,7);
assert.match(b.row_contract,/1 overall.*4 direction\/experience.*2 pheromone-side/i);
assert.match(b.authorization_wording_discrepancy_note,/all six/i);
assert.match(b.authorization_wording_discrepancy_note,/seven total/i);
assert.strictEqual(b.best_subset_selection_authorized,false);
assert.strictEqual(b.inferential_significance_testing_authorized,false);
assert.strictEqual(b.validation_pass_fail_threshold,null);
assert.strictEqual(b.promotion_rule,null);

const q=r.qualification_conclusion;
assert.strictEqual(q.implementation_qualified,true);
assert.strictEqual(q.reference_free_qualification_only,true);
assert.strictEqual(q.biological_consistency_result_exists,false);
assert.strictEqual(q.official_stage_A_execution_authorized,false);
assert.strictEqual(q.real_stage_B_comparison_authorized,false);
assert.strictEqual(q.canonical_promotion_authorized,false);
assert.strictEqual(q.P4_parameters_may_change,false);
assert.strictEqual(r.next_gate.id,'P4_Y_maze_consistency_official_execution_authorization_v1');
assert.strictEqual(r.next_gate.may_access_biological_ymaze_summary_values,false);
assert.strictEqual(r.next_gate.may_run_stage_B_comparison,false);
assert.strictEqual(r.next_gate.may_change_P4_parameters_or_protocol,false);

assert.ok(!fs.existsSync(path.join(root,'hypotheses/p4_Y_maze_consistency_official_execution_authorization_v1.json')),'official Stage A authorization must not exist yet');
assert.ok(!fs.existsSync(path.join(root,'hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json')),'Stage B authorization must not exist yet');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_simulation_v1.json')),'official Stage A report must not exist yet');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_comparison_v1.json')),'real Stage B report must not exist yet');
console.log('p4-ymaze-consistency-implementation-qualification-result.test.js PASS '+JSON.stringify({report_blob:blob(rel),node_run:n.workflow_run_id,chromium_run:c.workflow_run_id,chrome:c.chrome_version,cases:c.case_count,max_abs_numeric_difference:c.max_abs_numeric_difference,network_forbidden:0,scientific_evidence:false,official_stage_A:false,real_stage_B:false}));
