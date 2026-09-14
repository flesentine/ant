'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync,spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_Y_maze_consistency_official_execution_authorization_v1.json';
const authBlob='8cf7ddb3218836aec1e18eaf7f3ea0c3c2a92a6b';
assert.strictEqual(blob(rel),authBlob,'prospective Stage A authorization blob drift');
const a=read(rel);
assert.strictEqual(a.id,'P4_Y_maze_consistency_official_execution_authorization_v1');
assert.strictEqual(a.status,'prospective_official_stage_A_authorization_frozen_pending_merge_and_permanent_main_green_stage_B_locked');
assert.strictEqual(a.freeze_date_local,'2026-09-13');

// Every committed repository state stays mechanically locked; activation is allowed only inside
// the separately reviewed main-only one-shot workflow's ephemeral working copy.
assert.strictEqual(a.official_stage_A_execution_authorized,false);
assert.strictEqual(a.official_stage_A_execution.prospective_official_stage_A_execution_authorized,true);
assert.strictEqual(a.official_stage_A_execution.official_stage_A_execution_authorized,false);
assert.strictEqual(a.official_stage_A_execution.activation_requires_separate_post_merge_precondition_freeze,true);
assert.strictEqual(a.official_stage_A_execution.official_execution_may_run_on_review_branch,false);
assert.strictEqual(a.execution_precondition.repository_authorization_flag_must_remain_false,true);
assert.strictEqual(a.execution_precondition.activation_mode,'ephemeral_working_copy_only_after_exact_precondition_verification');
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

// Complete transitive official Stage-A execution/load surface.
const expectedSurface={
  stage_A_runner:['tools/run-p4-ymaze-consistency.js','fe3bff285290d0d612a5b9ab665e887c728e3d2e'],
  bundle_loader:['tools/load-bundle.js','235067f10ed85eeeaebcfe6fef0963940d516b6b'],
  runtime_p4:['src/p4.js','bf7d5781bd69ec4568450ebbd3bdc284897b6f61'],
  runtime_p1_helper:['src/p1.js','f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca'],
  runtime_sim_core:['src/sim-core.js','24777aac3577d442893e4779d70aee4e27761fe8'],
  runtime_integrity:['src/integrity.js','f23c68a6955832b70eeb3bd3e6893d71a3759018'],
  runtime_measurement:['src/measurement.js','8845726e02360655c605851662256bc729277b21'],
  runtime_h3:['src/h3.js','9bb8fc966a5aa4d4173f9bda2020c6d9cd9368f1'],
  fitted_model:['models/lasius_niger_painted_trail_p4_fitted_v1.json','e23b022279d463442bdd4e16d4cf56e0212d2b11'],
  left_marked_apparatus:['apparatus/poissonnier2026_y_maze_p4_left_v1.json','219d42036c13463e8cae5045b8fdba6d5bd24454'],
  right_marked_apparatus:['apparatus/poissonnier2026_y_maze_p4_right_v1.json','bfcba7e34eed4b4f79e67d6fc22c60af993f5386'],
  left_experiment:['experiments/y_maze_p4_left_consistency_v1.json','08edc2d3ef9899820c04e900154f1b4bee2a5104'],
  right_experiment:['experiments/y_maze_p4_right_consistency_v1.json','217f94ec4ba61a61c7956baeac34abd19cf5eec8'],
  neutral_experiment:['experiments/y_maze_p4_neutral_consistency_v1.json','e58cf3f4f5c51168f2dc267af7a820bc5b875b90'],
  state_profile:['states/naive_outbound_v1.json','d3db29a83eed68bc28f771c147dd33966764d535'],
  observation_profile:['observations/engineering_25fps.json','3ba85f0ae7994e4fe2245ca4732ce39a7b1a7ca8'],
  scoring_profile:['scoring/y_maze_endpoint_engineering_v1.json','8235e511b8ef4159671f670b944129c82f7358cb'],
  stage_B_comparator:['tools/compare-p4-ymaze-consistency.js','75cf0ae6075695784e7c67c1473a50e0daaa98cc']
};
assert.deepStrictEqual(Object.keys(a.frozen_execution_surface),Object.keys(expectedSurface));
for(const [key,[file,sha]] of Object.entries(expectedSurface)){
  assert.deepStrictEqual(a.frozen_execution_surface[key],{file,git_blob_sha:sha},key+' frozen spec drift');
  assert.strictEqual(blob(file),sha,file+' blob drift');
}
const dc=a.stage_A_dependency_closure;
assert.strictEqual(dc.complete_transitive_non_builtin_runtime_dependencies_pinned,true);
assert.strictEqual(dc.complete_bundle_loaded_model_apparatus_state_observation_scoring_inputs_pinned,true);
assert.deepStrictEqual(dc.external_npm_runtime_dependencies,[]);
assert.strictEqual(dc.future_one_shot_node_version_must_equal,'22.23.2');

assert.deepStrictEqual(a.frozen_candidate,{candidate_index:307,sigma_field_mm:18.319554310908863,kappa_trail_per_s:6.342935528120713,theta_detect:0.9184,parameter_change_authorized:false,refit_authorized:false,retuning_authorized:false});
const x=a.official_stage_A_execution;
assert.strictEqual(x.authorized_command_exact,'node tools/run-p4-ymaze-consistency.js --official --out reports/p4_ymaze_consistency_simulation_v1.json');
assert.deepStrictEqual(x.cli_parameter_overrides,[]);
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

const ep=a.execution_precondition;
assert.strictEqual(ep.future_execution_precondition_file,'hypotheses/p4_Y_maze_consistency_official_execution_precondition_v1.json');
assert.strictEqual(ep.future_execution_workflow_file,'.github/workflows/p4-v034n-ymaze-official-stage-a.yml');
assert.strictEqual(ep.future_execution_workflow_must_be_main_only,true);
assert.strictEqual(ep.future_execution_workflow_must_not_have_pull_request_trigger,true);
assert.strictEqual(ep.future_execution_workflow_must_not_have_workflow_dispatch_trigger,true);
assert.strictEqual(ep.future_execution_workflow_must_verify_every_frozen_execution_surface_blob_before_activation,true);
assert.strictEqual(ep.future_execution_workflow_must_verify_exact_node_version_before_activation,true);

// Historical v0.3.4m truth: the later precondition/workflow were absent at authorization freeze.
// Once v0.3.4n materializes them they must be exactly the reviewed, rerun-locked one-shot gate.
const preRel=ep.future_execution_precondition_file,workflowRel=ep.future_execution_workflow_file;
const prePresent=fs.existsSync(path.join(root,preRel)),workflowPresent=fs.existsSync(path.join(root,workflowRel));
assert.strictEqual(prePresent,workflowPresent,'Stage-A precondition/workflow must materialize together');
if(prePresent){
  assert.strictEqual(blob(preRel),'32d67461218f94ca7519fb0193ebecea922d0158');
  assert.strictEqual(blob(workflowRel),'250da2c81085717a1eda8e4641a2c9bd418f29f1');
  const p=read(preRel),workflow=fs.readFileSync(path.join(root,workflowRel),'utf8');
  assert.strictEqual(p.authorization_git_blob_sha,authBlob);
  assert.strictEqual(p.authorization_main_commit,'71ef3857e775d11269246990b907994e3442e3b2');
  assert.strictEqual(p.official_execution_still_unrun_at_freeze,true);
  assert.strictEqual(p.committed_authorization_flag_must_remain_false,true);
  assert.strictEqual(p.activation_mode,'ephemeral_working_copy_only');
  assert.strictEqual(p.execution_trigger.workflow_run_rerun_enabled,false);
  assert.strictEqual(p.stage_B_authorized,false);
  assert.strictEqual(p.biological_Y_maze_summary_access_authorized_during_stage_A,false);
  assert.match(workflow,/branches:\s*\[main\]/);
  assert.doesNotMatch(workflow,/^\s*pull_request\s*:/m);
  assert.doesNotMatch(workflow,/^\s*workflow_dispatch\s*:/m);
  assert.match(workflow,/test "\$\{GITHUB_RUN_ATTEMPT\}" = '1'/);
}

const sf=a.stage_A_semantic_firewall;
for(const k of ['known_biological_Y_maze_summary_access_authorized','raw_Y_maze_choice_access_authorized','colony_level_Y_maze_outcome_access_authorized','any_derivative_Y_maze_biological_target_access_authorized','stage_A_runner_may_import_or_parse_biological_summary_artifacts','stage_A_report_may_contain_observed_biological_rates'])assert.strictEqual(sf[k],false,k+' must remain false');
for(const [k,v] of Object.entries(a.firewalls))assert.strictEqual(v,false,k+' must remain false');
for(const k of ['official_stage_B_comparison_authorized','stage_B_authorization_file_may_be_created_before_stage_A_report_is_frozen','stage_B_may_rerun_or_modify_stage_A','stage_B_may_change_candidate_307','stage_B_may_change_protocol','validation_pass_fail_threshold_authorized','inferential_significance_test_authorized','best_subset_reporting_authorized','canonical_promotion_authorized','external_validation_claim_authorized'])assert.strictEqual(a.stage_B_and_promotion_firewall[k],false,k+' must remain false');

assert.ok(!fs.existsSync(path.join(root,'hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json')),'Stage B authorization must remain absent');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_simulation_v1.json')),'official Stage A report must remain absent');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_comparison_v1.json')),'real Stage B report must remain absent');

// Behavioral lockout: exact official CLI must fail before trial 1 in every committed state.
const probeRel='reports/.p4_ymaze_stage_A_lock_probe.json',probe=path.join(root,probeRel);
assert.ok(!fs.existsSync(probe));
const cli=spawnSync(process.execPath,['tools/run-p4-ymaze-consistency.js','--official','--out',probeRel],{cwd:root,encoding:'utf8'});
assert.notStrictEqual(cli.status,0,'official Stage A CLI must fail while committed authorization is inactive');
assert.match((cli.stdout||'')+(cli.stderr||''),/authorization is not active|locked/i);
assert.ok(!fs.existsSync(probe),'locked official Stage A CLI must not create probe output');
assert.ok(!fs.existsSync(path.join(root,x.output_file)),'locked official Stage A CLI must not create official report');

console.log('p4-ymaze-consistency-official-execution-authorization.test.js PASS '+JSON.stringify({authorization_blob:authBlob,frozen_stage_A_surface_files:Object.keys(expectedSurface).length,node:dc.future_one_shot_node_version_must_equal,execution_precondition_present:prePresent,workflow_rerun_enabled:false,committed_execution_authorized:false,official_trials_executed:0,stage_B_authorized:false}));
