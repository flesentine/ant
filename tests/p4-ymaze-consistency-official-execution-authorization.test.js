'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync,spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_Y_maze_consistency_official_execution_authorization_v1.json';
const prospectiveBlob='4fe46a0cd007175deaa004bfbd70f3387b8e9f4c';
assert.strictEqual(blob(rel),prospectiveBlob,'prospective Stage A authorization blob drift');
const a=read(rel);
assert.strictEqual(a.id,'P4_Y_maze_consistency_official_execution_authorization_v1');
assert.strictEqual(a.status,'prospective_official_stage_A_authorization_frozen_pending_merge_and_permanent_main_green_stage_B_locked');
assert.strictEqual(a.freeze_date_local,'2026-09-13');

// The already-qualified Stage-A runner reads this top-level flag. It must remain false in every
// committed repository state; only the future main-only one-shot workflow may activate a verified
// working copy ephemerally after the separate post-merge precondition is frozen.
assert.strictEqual(a.official_stage_A_execution_authorized,false);
assert.strictEqual(a.official_stage_A_execution.prospective_official_stage_A_execution_authorized,true);
assert.strictEqual(a.official_stage_A_execution.official_stage_A_execution_authorized,false);
assert.strictEqual(a.official_stage_A_execution.activation_requires_separate_post_merge_precondition_freeze,true);
assert.strictEqual(a.official_stage_A_execution.official_execution_may_run_on_review_branch,false);
assert.strictEqual(a.execution_precondition.repository_authorization_flag_must_remain_false,true);
assert.strictEqual(a.execution_precondition.activation_mode,'ephemeral_working_copy_only_after_exact_precondition_verification');
assert.strictEqual(a.execution_precondition.future_one_shot_workflow_may_ephemerally_set_top_level_official_stage_A_execution_authorized_true,true);
assert.strictEqual(a.execution_precondition.future_one_shot_workflow_may_ephemerally_set_nested_lifecycle_mirror_true,true);
assert.strictEqual(a.execution_precondition.ephemeral_activation_must_not_be_committed,true);

const q=a.qualification_lineage;
assert.strictEqual(q.implementation_authorization_git_blob_sha,'db64b72830c3715b3dd26d5ad3422655e50e8828');
assert.strictEqual(blob(q.implementation_authorization_file),q.implementation_authorization_git_blob_sha);
assert.strictEqual(q.protocol_git_blob_sha,'22515a3fe0945c0f19b6fb2166923f027bbf1b54');
assert.strictEqual(blob(q.protocol_file),q.protocol_git_blob_sha);
assert.strictEqual(q.source_design_git_blob_sha,'740bedc5d552036c2d8adcac7529b64b2da6de0c');
assert.strictEqual(blob(q.source_design_file),q.source_design_git_blob_sha);
assert.strictEqual(q.development_result_freeze_git_blob_sha,'73f802be9dd9f21819649ab25323a9b3a92cff04');
assert.strictEqual(blob(q.development_result_freeze_file),q.development_result_freeze_git_blob_sha);
assert.strictEqual(q.implementation_qualification_git_blob_sha,'184e1dc5d50a14fd10615f95db412dc414cf45d5');
assert.strictEqual(blob(q.implementation_qualification_file),q.implementation_qualification_git_blob_sha);
assert.strictEqual(q.qualified_main_checkpoint,'1225ca9e19d56f827fba50016713d472ad753073');
assert.strictEqual(q.qualified_main_workflow_run_id,34790515736);
assert.strictEqual(q.qualified_main_test_job_id,103813736804);
assert.strictEqual(q.qualified_main_test_job_conclusion,'success');
assert.strictEqual(q.qualified_main_deploy_job_id,103813840518);
assert.strictEqual(q.qualified_main_deploy_job_conclusion,'success');

for(const spec of Object.values(a.frozen_execution_surface)){
  assert.ok(fs.existsSync(path.join(root,spec.file)),spec.file+' missing');
  assert.strictEqual(blob(spec.file),spec.git_blob_sha,spec.file+' blob drift');
}
assert.strictEqual(a.frozen_execution_surface.stage_A_runner.git_blob_sha,'fe3bff285290d0d612a5b9ab665e887c728e3d2e');
assert.strictEqual(a.frozen_execution_surface.stage_B_comparator.git_blob_sha,'75cf0ae6075695784e7c67c1473a50e0daaa98cc');

assert.deepStrictEqual(a.frozen_candidate,{
  candidate_index:307,
  sigma_field_mm:18.319554310908863,
  kappa_trail_per_s:6.342935528120713,
  theta_detect:0.9184,
  parameter_change_authorized:false,
  refit_authorized:false,
  retuning_authorized:false
});
const x=a.official_stage_A_execution;
assert.strictEqual(x.authorized_command_exact,'node tools/run-p4-ymaze-consistency.js --official --out reports/p4_ymaze_consistency_simulation_v1.json');
assert.deepStrictEqual(x.cli_parameter_overrides,[]);
assert.strictEqual(x.output_file,'reports/p4_ymaze_consistency_simulation_v1.json');
assert.strictEqual(x.left_marked_seed_root,8210000);
assert.strictEqual(x.right_marked_seed_root,8210000);
assert.strictEqual(x.marked_trials_per_side,1000);
assert.strictEqual(x.paired_left_right_common_random_numbers,true);
assert.strictEqual(x.neutral_seed_root,8310000);
assert.strictEqual(x.neutral_trials,1000);
assert.strictEqual(x.total_trials,3000);
assert.strictEqual(x.duration_s,90);
assert.strictEqual(x.workers,1);
assert.strictEqual(x.adaptive_trial_budget_authorized,false);
assert.strictEqual(x.seed_change_authorized,false);
assert.strictEqual(x.precision_driven_rerun_authorized,false);
assert.strictEqual(x.discrepancy_driven_rerun_authorized,false);

const ep=a.execution_precondition;
assert.strictEqual(ep.authorization_must_merge_to_main_before_activation,true);
assert.strictEqual(ep.permanent_main_ci_for_authorization_commit_must_be_green_before_activation,true);
assert.strictEqual(ep.future_execution_precondition_file,'hypotheses/p4_Y_maze_consistency_official_execution_precondition_v1.json');
assert.strictEqual(ep.future_execution_workflow_file,'.github/workflows/p4-v034n-ymaze-official-stage-a.yml');
assert.strictEqual(ep.future_execution_precondition_and_workflow_must_not_exist_at_this_authorization_gate,true);
assert.strictEqual(ep.future_execution_workflow_must_be_main_only,true);
assert.strictEqual(ep.future_execution_workflow_must_not_have_pull_request_trigger,true);
assert.strictEqual(ep.future_execution_workflow_must_not_have_workflow_dispatch_trigger,true);
assert.strictEqual(ep.official_result_still_unrun_at_authorization_freeze,true);
assert.ok(!fs.existsSync(path.join(root,ep.future_execution_precondition_file)),'post-merge Stage A precondition must not exist at prospective authorization gate');
assert.ok(!fs.existsSync(path.join(root,ep.future_execution_workflow_file)),'one-shot Stage A workflow must not exist at prospective authorization gate');

const sf=a.stage_A_semantic_firewall;
assert.strictEqual(blob(sf.forbidden_biological_source_1.file),sf.forbidden_biological_source_1.git_blob_sha);
assert.strictEqual(blob(sf.forbidden_biological_source_2.file),sf.forbidden_biological_source_2.git_blob_sha);
for(const k of ['known_biological_Y_maze_summary_access_authorized','raw_Y_maze_choice_access_authorized','colony_level_Y_maze_outcome_access_authorized','any_derivative_Y_maze_biological_target_access_authorized','stage_A_runner_may_import_or_parse_biological_summary_artifacts','stage_A_report_may_contain_observed_biological_rates'])assert.strictEqual(sf[k],false,k+' must remain false');
for(const [k,v] of Object.entries(a.firewalls))assert.strictEqual(v,false,k+' must remain false');
for(const k of ['official_stage_B_comparison_authorized','stage_B_authorization_file_may_be_created_before_stage_A_report_is_frozen','stage_B_may_rerun_or_modify_stage_A','stage_B_may_change_candidate_307','stage_B_may_change_protocol','validation_pass_fail_threshold_authorized','inferential_significance_test_authorized','best_subset_reporting_authorized','canonical_promotion_authorized','external_validation_claim_authorized'])assert.strictEqual(a.stage_B_and_promotion_firewall[k],false,k+' must remain false');
assert.strictEqual(a.stage_B_and_promotion_firewall.future_stage_B_authorization_must_pin_stage_A_file,'reports/p4_ymaze_consistency_simulation_v1.json');
assert.strictEqual(a.stage_B_and_promotion_firewall.future_stage_B_authorization_must_pin_stage_A_git_blob_sha,true);
assert.strictEqual(a.stage_B_and_promotion_firewall.future_stage_B_authorization_must_preserve_seven_predeclared_rows,true);
assert.strictEqual(a.next_gate.id,'P4_Y_maze_consistency_official_execution_precondition_v1');
assert.strictEqual(a.next_gate.may_execute_official_stage_A_at_this_review_gate,false);
assert.strictEqual(a.next_gate.may_access_biological_Y_maze_summaries,false);
assert.strictEqual(a.next_gate.may_run_stage_B,false);
assert.strictEqual(a.next_gate.may_change_candidate_or_protocol,false);

assert.ok(!fs.existsSync(path.join(root,'hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json')),'Stage B authorization must remain absent');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_simulation_v1.json')),'official Stage A report must remain absent');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_comparison_v1.json')),'real Stage B report must remain absent');

// Behavioral lockout: exercise the exact official CLI surface. It must fail before trial 1 and
// must not write even a probe report while the committed authorization flag remains false.
const probeRel='reports/.p4_ymaze_stage_A_lock_probe.json';
const probe=path.join(root,probeRel);
assert.ok(!fs.existsSync(probe),'lock probe output must start absent');
const cli=spawnSync(process.execPath,['tools/run-p4-ymaze-consistency.js','--official','--out',probeRel],{cwd:root,encoding:'utf8'});
assert.notStrictEqual(cli.status,0,'official Stage A CLI must fail while prospective authorization is inactive');
assert.match((cli.stdout||'')+(cli.stderr||''),/authorization is not active|locked/i);
assert.ok(!fs.existsSync(probe),'locked official Stage A CLI must not create probe output');
assert.ok(!fs.existsSync(path.join(root,x.output_file)),'locked official Stage A CLI must not create official report');

console.log('p4-ymaze-consistency-official-execution-authorization.test.js PASS '+JSON.stringify({authorization_blob:prospectiveBlob,runner_blob:a.frozen_execution_surface.stage_A_runner.git_blob_sha,committed_execution_authorized:false,prospective_execution_authorized:true,official_trials_executed:0,stage_B_authorized:false,biological_summary_access:false}));
