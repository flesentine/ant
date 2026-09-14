'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const comparator=require('../tools/compare-p4-ymaze-consistency.js');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const preRel='hypotheses/p4_Y_maze_consistency_stage_B_execution_precondition_v1.json';
const authRel='hypotheses/p4_Y_maze_consistency_stage_B_prospective_authorization_v1.json';
const runtimeRel='hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json';
const workflowRel='.github/workflows/p4-v034q-ymaze-stage-b.yml';
const reportRel='reports/p4_ymaze_consistency_comparison_v1.json';
const provenanceRel='reports/p4_ymaze_consistency_stage_B_execution_provenance_v1.json';
const preBlob='bc7b0ea3f5838decd90b83325748ad9403c7be1a';
const workflowBlob='b1a85646deaea2c0eac6cb4cea7c156841a3da80';
assert.strictEqual(blob(preRel),preBlob,'Stage-B execution-precondition blob drift');
assert.strictEqual(blob(authRel),'b973ee451687ccb8f6730d6dc11d09eb34d3e54b','prospective authorization blob drift');
assert.strictEqual(blob(workflowRel),workflowBlob,'Stage-B execution-workflow blob drift');
assert.ok(!fs.existsSync(path.join(root,runtimeRel)),'runtime Stage-B authorization must remain absent in committed repository state');
assert.ok(!fs.existsSync(path.join(root,reportRel)),'real Stage-B report must remain absent before one-shot execution');
assert.ok(!fs.existsSync(path.join(root,provenanceRel)),'real Stage-B provenance must remain absent before one-shot execution');

const p=read(preRel),a=read(authRel),workflow=fs.readFileSync(path.join(root,workflowRel),'utf8');
assert.strictEqual(p.id,'P4_Y_maze_consistency_stage_B_execution_precondition_v1');
assert.strictEqual(p.status,'prospective_stage_B_authorization_merged_and_permanent_main_ci_green_before_one_shot_execution');
assert.strictEqual(p.authorization_pr_number,51);
assert.strictEqual(p.authorization_review_head,'b11aea060dcd7a32ea6c1d9cca6155f6324f325b');
assert.strictEqual(p.authorization_main_commit,'7ab56e3e4bfe1fc68659d6bad5bf13ebb716d66a');
assert.strictEqual(p.prospective_authorization_file,authRel);
assert.strictEqual(p.prospective_authorization_git_blob_sha,'b973ee451687ccb8f6730d6dc11d09eb34d3e54b');
assert.strictEqual(p.permanent_main_workflow.run_id,34893683401);
assert.strictEqual(p.permanent_main_workflow.run_number,171);
assert.strictEqual(p.permanent_main_workflow.conclusion,'success');
assert.strictEqual(p.permanent_main_workflow.test_job_id,104142262355);
assert.strictEqual(p.permanent_main_workflow.test_job_conclusion,'success');
assert.strictEqual(p.permanent_main_workflow.deploy_job_id,104142562658);
assert.strictEqual(p.permanent_main_workflow.deploy_job_conclusion,'success');
assert.strictEqual(p.execution_workflow_file,workflowRel);
assert.strictEqual(p.execution_workflow_git_blob_sha,workflowBlob);
assert.deepStrictEqual(p.execution_trigger,{event:'push',branch:'main',path:workflowRel,expected_before_commit:'7ab56e3e4bfe1fc68659d6bad5bf13ebb716d66a',pull_request_enabled:false,workflow_dispatch_enabled:false,workflow_run_rerun_enabled:false,later_unrelated_main_push_may_rerun:false});
assert.match(p.execution_trigger_rule,/PR #52/i);
assert.match(p.execution_trigger_rule,/paths filter.*not trusted/i);
assert.match(p.execution_trigger_rule,/GITHUB_RUN_ATTEMPT.*1/i);
assert.match(p.execution_trigger_rule,/workflow-run history/i);
assert.match(p.execution_trigger_rule,/force-reset/i);

assert.deepStrictEqual(p.reviewed_merge_binding,{
  execution_pr_number:52,
  require_pr_merged:true,
  require_github_sha_equals_pr_merge_commit_sha:true,
  require_second_parent_equals_pr_head_sha:true,
  binding_source:'GitHub pull request metadata queried at runtime'
});
assert.deepStrictEqual(p.durable_consumed_state_guard,{
  backend:'github_actions_workflow_run_history',
  workflow_file:workflowRel,
  no_prior_run_other_than_current_required:true,
  prior_run_conclusion_irrelevant:true,
  survives_main_history_rewrite:true,
  guard_rechecked_immediately_before_activation:true,
  invalid_first_run_requires_new_gate:true
});

assert.strictEqual(p.activation_mode,'ephemeral_runtime_authorization_file_only');
assert.strictEqual(p.committed_runtime_authorization_file_must_remain_absent,true);
assert.strictEqual(p.runtime_authorization_file,runtimeRel);
assert.deepStrictEqual(p.ephemeral_fields_permitted_to_change,['official_stage_B_comparison_authorized']);
assert.strictEqual(p.ephemeral_activation_must_not_be_committed,true);
assert.strictEqual(p.runtime_authorization_must_be_removed_before_provenance,true);
assert.strictEqual(p.verify_every_frozen_surface_blob_before_activation,true);
assert.strictEqual(p.frozen_execution_surface_entry_count,7);
assert.strictEqual(Object.keys(p.frozen_execution_surface).length,7);
for(const spec of Object.values(p.frozen_execution_surface)){
  assert.ok(fs.existsSync(path.join(root,spec.file)),spec.file+' missing');
  assert.strictEqual(blob(spec.file),spec.git_blob_sha,spec.file+' blob drift');
}
assert.strictEqual(p.exact_node_version,'22.23.2');
assert.strictEqual(p.runner_label,'ubuntu-24.04');
assert.strictEqual(p.real_stage_B_still_unrun_at_freeze,true);
assert.strictEqual(p.authorized_command_exact,'node tools/compare-p4-ymaze-consistency.js --out reports/p4_ymaze_consistency_comparison_v1.json');
assert.deepStrictEqual(p.cli_parameter_overrides,[]);
assert.strictEqual(p.official_output_artifact_name,'p4-v034q-ymaze-stage-b');
assert.strictEqual(p.comparison_contract.report_id,'P4_Y_maze_consistency_descriptive_comparison_v1');
assert.strictEqual(p.comparison_contract.comparison_scope,'comprehensive_descriptive_only');
assert.strictEqual(p.comparison_contract.required_row_count,7);
assert.deepStrictEqual(p.comparison_contract.required_rows,['overall','outwards_naive','outwards_experienced','return_experienced','return_naive','pheromone_left','pheromone_right']);
assert.strictEqual(p.comparison_contract.all_predeclared_comparisons_must_be_reported,true);
assert.strictEqual(p.comparison_contract.validation_pass_fail_threshold,null);
assert.strictEqual(p.comparison_contract.promotion_rule,null);
assert.strictEqual(p.comparison_contract.inferential_significance_test_authorized,false);
assert.strictEqual(p.comparison_contract.best_subset_reporting_authorized,false);
assert.strictEqual(p.comparison_contract.canonical_update_authorized,false);
assert.strictEqual(p.biological_Y_maze_summary_access_authorized_during_review_gate,false);
assert.strictEqual(p.biological_Y_maze_summary_access_authorized_during_stage_B_execution,true);
for(const k of ['raw_Y_maze_choice_access_authorized','colony_level_Y_maze_outcome_access_authorized','stage_A_rerun_or_modification_authorized','P4_parameter_change_authorized','P4_runtime_change_authorized','protocol_change_authorized','canonical_promotion_authorized','external_validation_claim_authorized'])assert.strictEqual(p[k],false,k+' must remain false');
assert.strictEqual(p.next_gate.id,'P4_Y_maze_consistency_stage_B_result_freeze_v1');
assert.strictEqual(p.next_gate.may_rerun_stage_B_before_result_freeze,false);
assert.match(p.rerun_policy,/any Stage-B workflow run/i);
assert.match(p.rerun_policy,/newly reviewed execution gate/i);

assert.strictEqual(a.official_stage_B_comparison_authorized,false);
assert.strictEqual(a.prospective_official_stage_B_comparison_authorized,true);
assert.strictEqual(a.runtime_authorization_file,runtimeRel);
assert.strictEqual(a.comparison_contract.authorized_command_exact,p.authorized_command_exact);
assert.throws(()=>comparator.requireRealAuthorization(),/locked|authorization file is absent/i);
assert.throws(()=>comparator.main([]),/locked|authorization file is absent/i);

for(const required of [
  'actions: read',
  'pull-requests: read',
  '/pulls/52',
  '/actions/workflows/p4-v034q-ymaze-stage-b.yml/runs?per_page=100',
  "pr.merge_commit_sha!==process.env.GITHUB_SHA",
  "pr.head?.sha!==secondParent",
  "prior.length!==0",
  'Run permanent regression suite before Stage B',
  'Ephemerally materialize active Stage B authorization',
  'Run exact frozen P4 Y-maze Stage B comparison',
  'Remove ephemeral runtime authorization',
  'Upload immutable Stage B artifact'
]) assert.ok(workflow.includes(required),'workflow missing hardening marker: '+required);
assert.ok((workflow.match(/\/pulls\/52/g)||[]).length>=2,'reviewed PR binding must be checked initially and immediately before activation');
assert.ok((workflow.match(/\/actions\/workflows\/p4-v034q-ymaze-stage-b\.yml\/runs\?per_page=100/g)||[]).length>=2,'durable consumed-state guard must be checked initially and immediately before activation');
assert.ok((workflow.match(/prior\.length!==0/g)||[]).length>=2,'prior-run rejection must be enforced twice');
assert.ok(workflow.includes('test "${GITHUB_RUN_ATTEMPT}" = \'1\''),'workflow must reject GitHub rerun attempts');
assert.ok(workflow.includes("test \"${EVENT_BEFORE}\" = '7ab56e3e4bfe1fc68659d6bad5bf13ebb716d66a'"),'workflow must recheck exact parent immediately before activation');
assert.ok(!/^\s*workflow_dispatch:/m.test(workflow),'workflow_dispatch must remain absent');
assert.ok(!/^\s*pull_request:/m.test(workflow),'pull_request trigger must remain absent');

console.log('p4-ymaze-consistency-stage-B-execution-precondition.test.js PASS '+JSON.stringify({precondition_blob:blob(preRel),workflow_blob:blob(workflowRel),authorization_main:p.authorization_main_commit,main_run:p.permanent_main_workflow.run_id,main_test:p.permanent_main_workflow.test_job_id,main_deploy:p.permanent_main_workflow.deploy_job_id,execution_pr:p.reviewed_merge_binding.execution_pr_number,durable_consumed_state:p.durable_consumed_state_guard.backend,frozen_surface_entries:p.frozen_execution_surface_entry_count,runtime_authorization_present:false,real_stage_B_executed:false,canonical_promotion_authorized:false}));
