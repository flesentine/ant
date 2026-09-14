'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync,spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const preRel='hypotheses/p4_Y_maze_consistency_official_execution_precondition_v1.json';
const workflowRel='.github/workflows/p4-v034n-ymaze-official-stage-a.yml';
const authRel='hypotheses/p4_Y_maze_consistency_official_execution_authorization_v1.json';
const preBlob='8552c987319fa8688d92cf823ca198db7e17785f';
const workflowBlob='076619733a3403bfdd19e160aca7f017c95e92f2';
const authBlob='8cf7ddb3218836aec1e18eaf7f3ea0c3c2a92a6b';

assert.strictEqual(blob(preRel),preBlob,'execution precondition blob drift');
assert.strictEqual(blob(workflowRel),workflowBlob,'one-shot workflow blob drift');
assert.strictEqual(blob(authRel),authBlob,'prospective authorization blob drift');

const p=read(preRel),a=read(authRel),workflow=fs.readFileSync(path.join(root,workflowRel),'utf8');
assert.strictEqual(p.id,'P4_Y_maze_consistency_official_execution_precondition_v1');
assert.strictEqual(p.status,'authorization_merged_and_permanent_main_ci_green_before_official_stage_A_execution');
assert.strictEqual(p.freeze_date_local,'2026-09-13');
assert.strictEqual(p.authorization_pr_number,48);
assert.strictEqual(p.authorization_review_head,'7b12d6383fa031d9e462ce8131427d8a84be369c');
assert.strictEqual(p.authorization_main_commit,'71ef3857e775d11269246990b907994e3442e3b2');
assert.strictEqual(p.authorization_git_blob_sha,authBlob);
assert.deepStrictEqual(p.permanent_main_workflow,{
  name:'Test and deploy ANTLAB',
  workflow_file:'.github/workflows/pages.yml',
  main_commit:'71ef3857e775d11269246990b907994e3442e3b2',
  run_id:34795850404,
  run_number:168,
  event:'push',
  conclusion:'success',
  test_job_id:103828674565,
  test_job_conclusion:'success',
  deploy_job_id:103828787871,
  deploy_job_conclusion:'success'
});
assert.strictEqual(p.execution_workflow_file,workflowRel);
assert.strictEqual(p.execution_workflow_git_blob_sha,workflowBlob);
assert.deepStrictEqual(p.execution_trigger,{
  event:'push',branch:'main',path:workflowRel,pull_request_enabled:false,workflow_dispatch_enabled:false,later_unrelated_main_push_may_rerun:false
});
assert.match(p.execution_trigger_rule,/only on a push to main/i);
assert.match(p.execution_trigger_rule,/no pull_request or workflow_dispatch/i);
assert.strictEqual(p.activation_mode,'ephemeral_working_copy_only');
assert.strictEqual(p.committed_authorization_flag_must_remain_false,true);
assert.deepStrictEqual(p.ephemeral_fields_permitted_to_change,[
  'official_stage_A_execution_authorized',
  'official_stage_A_execution.official_stage_A_execution_authorized'
]);
assert.strictEqual(p.ephemeral_activation_must_not_be_committed,true);
assert.strictEqual(p.verify_every_authorization_surface_blob_before_activation,true);
assert.strictEqual(p.frozen_execution_surface_entry_count,18);
assert.strictEqual(p.exact_node_version,'22.23.2');
assert.strictEqual(p.runner_label,'ubuntu-24.04');
assert.strictEqual(p.official_execution_still_unrun_at_freeze,true);
assert.strictEqual(p.authorized_command_exact,'node tools/run-p4-ymaze-consistency.js --official --out reports/p4_ymaze_consistency_simulation_v1.json');
assert.deepStrictEqual(p.cli_parameter_overrides,[]);
assert.strictEqual(p.official_output_artifact_name,'p4-v034n-ymaze-official-stage-a');
assert.strictEqual(p.official_report_filename,'p4_ymaze_consistency_simulation_v1.json');
assert.strictEqual(p.official_provenance_filename,'p4_ymaze_consistency_stage_A_execution_provenance_v1.json');
assert.deepStrictEqual(p.official_execution_contract,{
  candidate_index:307,
  sigma_field_mm:18.319554310908863,
  kappa_trail_per_s:6.342935528120713,
  theta_detect:0.9184,
  left_marked_seed_root:8210000,
  right_marked_seed_root:8210000,
  marked_trials_per_side:1000,
  paired_left_right_common_random_numbers:true,
  neutral_seed_root:8310000,
  neutral_trials:1000,
  total_trials:3000,
  duration_s:90,
  workers:1,
  adaptive_trial_budget_authorized:false,
  seed_change_authorized:false,
  valid_result_rerun_authorized:false
});
assert.deepStrictEqual(p.stage_A_result_contract,{
  report_id:'P4_Y_maze_consistency_stage_A_simulation_v1',
  mode:'official',
  scientific_evidence:false,
  interpretation:'posthoc_same_study_cross_apparatus_descriptive_consistency_only',
  validation_pass_fail_threshold:null,
  promotion_rule:null,
  canonical_update_authorized:false,
  result_must_be_accepted_exactly_as_produced:true,
  report_and_provenance_must_be_frozen_in_separate_post_execution_gate_before_stage_B:true
});
assert.strictEqual(p.biological_Y_maze_summary_access_authorized_during_stage_A,false);
assert.strictEqual(p.raw_Y_maze_choice_access_authorized_during_stage_A,false);
assert.strictEqual(p.colony_level_Y_maze_outcome_access_authorized_during_stage_A,false);
assert.strictEqual(p.real_stage_B_execution_authorized,false);
assert.strictEqual(p.stage_B_authorized,false);
assert.strictEqual(p.P4_parameter_change_authorized,false);
assert.strictEqual(p.P4_runtime_change_authorized,false);
assert.strictEqual(p.P4_refit_or_retuning_authorized,false);
assert.strictEqual(p.canonical_promotion_authorized,false);
assert.strictEqual(p.next_gate.id,'P4_Y_maze_consistency_stage_A_result_freeze_v1');
assert.strictEqual(p.next_gate.may_access_biological_Y_maze_summary_values_before_stage_A_result_freeze,false);
assert.strictEqual(p.next_gate.may_run_stage_B_before_stage_A_result_freeze,false);
assert.strictEqual(p.next_gate.may_change_candidate_or_protocol,false);

// The committed repository remains locked. The workflow may activate only its ephemeral working copy.
assert.strictEqual(a.official_stage_A_execution_authorized,false);
assert.strictEqual(a.official_stage_A_execution.prospective_official_stage_A_execution_authorized,true);
assert.strictEqual(a.official_stage_A_execution.official_stage_A_execution_authorized,false);
assert.strictEqual(a.execution_precondition.repository_authorization_flag_must_remain_false,true);
assert.strictEqual(a.execution_precondition.activation_mode,'ephemeral_working_copy_only_after_exact_precondition_verification');
assert.strictEqual(Object.keys(a.frozen_execution_surface).length,18);
for(const [name,spec] of Object.entries(a.frozen_execution_surface)){
  assert.ok(fs.existsSync(path.join(root,spec.file)),name+' frozen file missing');
  assert.strictEqual(blob(spec.file),spec.git_blob_sha,name+' frozen blob drift');
}
assert.strictEqual(a.stage_A_dependency_closure.future_one_shot_node_version_must_equal,'22.23.2');

// Static trigger/firewall proof: no review/manual execution surface exists.
assert.match(workflow,/^on:\s*\n\s+push:\s*$/m);
assert.match(workflow,/branches:\s*\[main\]/);
assert.match(workflow,/paths:\s*\n\s+- '\.github\/workflows\/p4-v034n-ymaze-official-stage-a\.yml'/);
assert.doesNotMatch(workflow,/^\s*pull_request\s*:/m);
assert.doesNotMatch(workflow,/^\s*workflow_dispatch\s*:/m);
assert.match(workflow,/node-version:\s*'22\.23\.2'/);
assert.match(workflow,/entries\.length!==18/);
assert.match(workflow,/git hash-object/);
assert.match(workflow,/Ephemerally activate exact official Stage A authorization/);
assert.match(workflow,/node tools\/run-p4-ymaze-consistency\.js --official --out reports\/p4_ymaze_consistency_simulation_v1\.json/);
assert.match(workflow,/Run permanent regression suite before official Stage A/);
assert.match(workflow,/biological_Y_maze_summary_accessed_during_stage_A:false/);
assert.match(workflow,/real_stage_B_executed:false/);

assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_simulation_v1.json')),'official Stage A report must be absent at precondition freeze');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_stage_A_execution_provenance_v1.json')),'official Stage A provenance must be absent at precondition freeze');
assert.ok(!fs.existsSync(path.join(root,'hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json')),'Stage B authorization must remain absent');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_comparison_v1.json')),'real Stage B report must remain absent');

// Behavioral proof that adding the precondition/workflow does not unlock the review branch.
const probeRel='reports/.p4_ymaze_stage_A_precondition_lock_probe.json';
const probe=path.join(root,probeRel);
assert.ok(!fs.existsSync(probe),'precondition lock probe must start absent');
const cli=spawnSync(process.execPath,['tools/run-p4-ymaze-consistency.js','--official','--out',probeRel],{cwd:root,encoding:'utf8'});
assert.notStrictEqual(cli.status,0,'official Stage A must remain locked on the committed precondition branch');
assert.match((cli.stdout||'')+(cli.stderr||''),/authorization is not active|locked/i);
assert.ok(!fs.existsSync(probe),'locked precondition probe must not be written');

console.log('p4-ymaze-consistency-official-execution-precondition.test.js PASS '+JSON.stringify({precondition_blob:preBlob,workflow_blob:workflowBlob,authorization_blob:authBlob,authorization_main_commit:p.authorization_main_commit,permanent_main_run:p.permanent_main_workflow.run_id,frozen_surface_entries:p.frozen_execution_surface_entry_count,node:p.exact_node_version,review_branch_official_execution:false,stage_B_authorized:false}));
