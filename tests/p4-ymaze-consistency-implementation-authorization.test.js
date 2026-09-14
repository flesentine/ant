'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const rel='hypotheses/p4_Y_maze_consistency_implementation_authorization_v1.json';
assert.strictEqual(blob(rel),'db64b72830c3715b3dd26d5ad3422655e50e8828');
const a=read(rel);
assert.strictEqual(a.id,'P4_Y_maze_consistency_implementation_authorization_v1');
assert.strictEqual(a.status,'implementation_and_reference_free_qualification_authorized_official_stage_A_execution_not_authorized');
assert.strictEqual(a.protocol_lineage.protocol_git_blob_sha,'22515a3fe0945c0f19b6fb2166923f027bbf1b54');
assert.strictEqual(blob(a.protocol_lineage.protocol_file),a.protocol_lineage.protocol_git_blob_sha);
assert.strictEqual(a.protocol_lineage.source_design_git_blob_sha,'740bedc5d552036c2d8adcac7529b64b2da6de0c');
assert.strictEqual(a.protocol_lineage.result_freeze_git_blob_sha,'73f802be9dd9f21819649ab25323a9b3a92cff04');
assert.strictEqual(a.protocol_lineage.main_checkpoint,'93d5740da97a2eb839b86fa065b58e7797026707');
assert.strictEqual(a.protocol_lineage.main_workflow_run_id,34782707587);
assert.strictEqual(a.protocol_lineage.main_workflow_run_number,165);
assert.strictEqual(a.protocol_lineage.main_test_job_id,103792504006);
assert.strictEqual(a.protocol_lineage.main_test_job_conclusion,'success');
assert.strictEqual(a.protocol_lineage.main_deploy_job_id,103792602723);
assert.strictEqual(a.protocol_lineage.main_deploy_job_conclusion,'success');
const s=a.authorized_implementation_surface;
for(const p of Object.values(s))assert.ok(typeof p==='string'&&p.length>0);
const m=a.exact_model_contract;
assert.strictEqual(blob(m.source_engineering_model),m.source_engineering_model_git_blob_sha);
assert.strictEqual(blob(m.runtime_file),m.runtime_git_blob_sha);
assert.strictEqual(blob(m.p1_helper_file),m.p1_helper_git_blob_sha);
assert.strictEqual(m.candidate_index,307);
assert.strictEqual(m.sigma_field_mm,18.319554310908863);
assert.strictEqual(m.kappa_trail_per_s,6.342935528120713);
assert.strictEqual(m.theta_detect,0.9184);
assert.match(m.rule,/change only field\.sigma_field_mm, steering\.kappa_trail_per_s, absolute_detection\.theta_detect/i);
const ap=a.exact_apparatus_contract;
assert.strictEqual(blob(ap.base_file),ap.base_git_blob_sha);
assert.deepStrictEqual(ap.left_segment_mm,{x1:140,y1:120,x2:190,y2:33.3975});
assert.deepStrictEqual(ap.right_segment_mm,{x1:140,y1:120,x2:190,y2:206.6025});
assert.strictEqual(ap.nominal_dose_hindgut_equivalents_per_cm,0.0048);
const e=a.exact_experiment_contract;
assert.strictEqual(blob(e.neutral_fixture_provenance),e.neutral_fixture_git_blob_sha);
assert.strictEqual(blob(e.scoring_file),e.scoring_git_blob_sha);
assert.strictEqual(e.duration_s,90);
assert.strictEqual(e.workers,1);
assert.strictEqual(e.entry_point,'stem');
assert.strictEqual(e.position_jitter_mm,0.4);
assert.strictEqual(e.heading_jitter_rad,0.05);
assert.strictEqual(e.applied_hindgut_equivalents_per_cm,0.0048);
assert.strictEqual(e.neutral_applied_hindgut_equivalents_per_cm,0);
assert.strictEqual(a.stage_A_firewall.runner_must_not_import_or_parse_forbidden_inputs,true);
assert.strictEqual(a.stage_A_firewall.official_seed_root_8210000_may_be_executed_during_implementation,false);
assert.strictEqual(a.stage_A_firewall.official_neutral_seed_root_8310000_may_be_executed_during_implementation,false);
assert.strictEqual(a.stage_A_firewall.official_report_may_be_created_during_implementation,false);
assert.strictEqual(a.stage_B_implementation_firewall.real_biological_comparison_execution_authorized,false);
assert.strictEqual(a.stage_B_implementation_firewall.comparator_may_be_implemented,true);
assert.strictEqual(a.stage_B_implementation_firewall.qualification_must_use_synthetic_summary_fixture_only,true);
const q=a.reference_free_qualification;
assert.strictEqual(q.authorized,true);
assert.strictEqual(q.left_right_seed_root,8410000);
assert.strictEqual(q.left_right_seed_count,12);
assert.strictEqual(q.neutral_seed_root,8510000);
assert.strictEqual(q.neutral_seed_count,12);
assert.strictEqual(q.official_seed_overlap_forbidden,true);
assert.ok(q.required_checks.some(x=>/Chromium parity/i.test(x)));
assert.ok(q.required_checks.some(x=>/zero requests.*biological Y-maze outcome/i.test(x)));
for(const [k,v] of Object.entries(a.firewalls))assert.strictEqual(v,false,k+' must remain false');
assert.strictEqual(a.next_gate.id,'P4_Y_maze_consistency_implementation_qualification_v1');
assert.strictEqual(a.next_gate.official_execution_remains_locked,true);

// Historical v0.3.4k truth: no executable surface existed at authorization freeze. Later lifecycle
// states may materialize only this authorized surface while the committed Stage-A runner stays
// locked; the one-shot execution may activate only an ephemeral working copy.
const fixedLaterBlobs=new Map([
  [s.fitted_model,'e23b022279d463442bdd4e16d4cf56e0212d2b11'],
  [s.left_marked_apparatus,'219d42036c13463e8cae5045b8fdba6d5bd24454'],
  [s.right_marked_apparatus,'bfcba7e34eed4b4f79e67d6fc22c60af993f5386'],
  [s.left_experiment,'08edc2d3ef9899820c04e900154f1b4bee2a5104'],
  [s.right_experiment,'217f94ec4ba61a61c7956baeac34abd19cf5eec8'],
  [s.neutral_experiment,'e58cf3f4f5c51168f2dc267af7a820bc5b875b90'],
  [s.stage_A_runner,'fe3bff285290d0d612a5b9ab665e887c728e3d2e'],
  [s.stage_B_comparator,'75cf0ae6075695784e7c67c1473a50e0daaa98cc']
]);
const implementationPresent=fs.existsSync(path.join(root,s.fitted_model));
if(implementationPresent){
  for(const [file,sha] of fixedLaterBlobs){assert.ok(fs.existsSync(path.join(root,file)),file+' missing from authorized later implementation');assert.strictEqual(blob(file),sha,file+' blob drift');}
  assert.ok(fs.existsSync(path.join(root,s.implementation_test)),'authorized implementation regression must exist with later implementation');
}else for(const file of [...fixedLaterBlobs.keys(),s.implementation_test])assert.ok(!fs.existsSync(path.join(root,file)),file+' must not exist before later implementation gate');
const prospective='hypotheses/p4_Y_maze_consistency_official_execution_authorization_v1.json';
if(fs.existsSync(path.join(root,prospective))){
  assert.strictEqual(blob(prospective),'8cf7ddb3218836aec1e18eaf7f3ea0c3c2a92a6b');
  const pa=read(prospective);
  assert.strictEqual(pa.official_stage_A_execution_authorized,false);
  assert.strictEqual(pa.official_stage_A_execution.prospective_official_stage_A_execution_authorized,true);
  assert.strictEqual(pa.official_stage_A_execution.official_stage_A_execution_authorized,false);
  assert.strictEqual(pa.execution_precondition.repository_authorization_flag_must_remain_false,true);
  assert.strictEqual(pa.execution_precondition.activation_mode,'ephemeral_working_copy_only_after_exact_precondition_verification');
  assert.strictEqual(pa.stage_A_dependency_closure.complete_transitive_non_builtin_runtime_dependencies_pinned,true);
  assert.strictEqual(pa.stage_A_dependency_closure.complete_bundle_loaded_model_apparatus_state_observation_scoring_inputs_pinned,true);
  assert.strictEqual(pa.stage_A_dependency_closure.future_one_shot_node_version_must_equal,'22.23.2');
  assert.strictEqual(pa.next_gate.may_execute_official_stage_A_at_this_review_gate,false);
}else assert.ok(!fs.existsSync(path.join(root,prospective)),'prospective authorization absent before its later gate');

// Historical implementation-authorization truth required no official report. After the separately
// reviewed Stage-A result-freeze gate, the report may exist only as the exact immutable frozen bytes.
const resultFreeze='hypotheses/p4_Y_maze_consistency_stage_A_result_freeze_v1.json';
const officialReport='reports/p4_ymaze_consistency_simulation_v1.json';
const executionProvenance='reports/p4_ymaze_consistency_stage_A_execution_provenance_v1.json';
const resultFrozen=fs.existsSync(path.join(root,resultFreeze));
if(resultFrozen){
  assert.strictEqual(blob(resultFreeze),'7651b5c50b7d0c752cc85a2af3225c1b5592a4fc');
  assert.strictEqual(blob(officialReport),'a7b3e33ce613254c182360947641c5ff03f5af23');
  assert.strictEqual(blob(executionProvenance),'566801802fe434afbd27d48876caa2735a9442ac');
  const rf=read(resultFreeze);
  assert.strictEqual(rf.semantic_firewall.stage_B_biological_comparison_authorized,false);
  assert.strictEqual(rf.next_gate.stage_B_may_execute_at_this_result_freeze_gate,false);
}else{
  assert.ok(!fs.existsSync(path.join(root,officialReport)),'official Stage A report must remain absent before result freeze');
  assert.ok(!fs.existsSync(path.join(root,executionProvenance)),'official Stage A provenance must remain absent before result freeze');
}
assert.ok(!fs.existsSync(path.join(root,'hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json')),'real Stage B authorization must remain absent');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_comparison_v1.json')),'real Stage B report must remain absent');

console.log('p4-ymaze-consistency-implementation-authorization.test.js PASS '+JSON.stringify({authorization_blob:blob(rel),candidate:m.candidate_index,qualification_seed_count:q.left_right_seed_count,later_implementation_present:implementationPresent,prospective_stage_A_authorization_present:fs.existsSync(path.join(root,prospective)),stage_A_result_frozen:resultFrozen,committed_official_stage_A:false,chromium_required:true}));
