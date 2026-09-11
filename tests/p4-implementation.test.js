'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const policy=read('hypotheses/p4_reachability_execution_v1.json');
const auth=read('hypotheses/p4_implementation_authorization_v1.json');
const model=read('models/lasius_niger_painted_trail_p4_v1.json');
const p4=require('../src/p4.js');

assert.strictEqual(blob('hypotheses/p4_painted_trail_mechanism_v1.json'),'609551836e540c341365db9cc987d2ca340cc053');
assert.strictEqual(blob('hypotheses/p4_reachability_execution_v1.json'),'0d452f9c0d548ec962e0a6d9826648bf5e14a4ef');
assert.strictEqual(blob('hypotheses/p4_implementation_authorization_v1.json'),'42f8d51b06a20c0c6001a42b6021a134f2694e0d');
assert.strictEqual(blob('src/p4.js'),'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p4_v1.json'),'3d8460b6916a90d06e70768f696ee3f0d48fccf4');
assert.strictEqual(blob('experiments/open_arena_p4_zero_dose_reachability.json'),'a0ce8285448adacd18feebb3e82e76092e102eec');
assert.strictEqual(blob('experiments/open_arena_p4_low_dose_reachability.json'),'3d21c82250b7c27a382606fb45b247d4eef20fb7');
assert.strictEqual(blob('experiments/open_arena_p4_nominal_dose_reachability.json'),'d7605792f6f0eb871d7b3999940e08f750784b64');
assert.strictEqual(blob('tools/run-p4-reachability.js'),'ba4e067a7f686933ed3271a64da2f79f0a558ab0');
assert.strictEqual(blob('src/p1.js'),'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(blob('models/lasius_niger_locomotion_v1.json'),'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');
assert.strictEqual(blob('src/sim-core.js'),'24777aac3577d442893e4779d70aee4e27761fe8');
assert.strictEqual(blob('src/integrity.js'),'f23c68a6955832b70eeb3bd3e6893d71a3759018');

assert.strictEqual(policy.id,'P4_reference_free_reachability_execution_v1');
assert.strictEqual(policy.status,'execution_policy_frozen_before_P4_runtime_implementation_or_execution');
assert.strictEqual(policy.mechanism_freeze.git_blob_sha,'609551836e540c341365db9cc987d2ca340cc053');
assert.strictEqual(policy.candidate_class_decision.git_blob_sha,'ad7295ba6d466549c60c8ecac37e39d30006ec1c');
assert.strictEqual(policy.independent_evidence.git_blob_sha,'262f332062f271bbf111d0572f83b2faaf2cfd74');
assert.strictEqual(policy.selection_main_checkpoint.commit,'b73c97b4c3fd70e67cf22c050cf695a5f07771c8');
assert.strictEqual(policy.selection_main_checkpoint.permanent_main_workflow_run_id,34452510140);
assert.strictEqual(policy.selection_main_checkpoint.test_job_id,102791233581);
assert.strictEqual(policy.selection_main_checkpoint.deploy_job_id,102791465602);
assert.strictEqual(policy.selection_main_checkpoint.conclusion,'success');

assert.deepStrictEqual(policy.frozen_execution.engineering_values,{sigma_field_mm:8,kappa_trail_per_s:4,theta_detect:0.25,sector_radius_mm:10,radial_bins:4,angular_bins_per_sector:8,samples_per_sector:32});
assert.deepStrictEqual(policy.frozen_execution.exact_identity_panel.seeds,[840001,840002,840003,840004,840005,840006,840007,840008]);
assert.deepStrictEqual(policy.frozen_execution.exact_identity_panel.cases,['zero_dose_canonical_identity','zero_kappa_canonical_identity','global_subthreshold_dose_ratio_0.10_canonical_identity']);
assert.strictEqual(policy.frozen_execution.exact_identity_panel.fixed_time_s,8);
assert.strictEqual(policy.frozen_execution.nominal_reachability_panel.trials,400);
assert.strictEqual(policy.frozen_execution.nominal_reachability_panel.first_seed,841000);
assert.strictEqual(policy.frozen_execution.nominal_reachability_panel.last_seed,841399);
assert.strictEqual(policy.reference_firewall.poissonnier2026_pheromone_response_targets_may_be_loaded,false);
assert.strictEqual(policy.reference_firewall.P1_official_result_semantics_may_be_loaded,false);
assert.strictEqual(policy.reference_firewall.P2_official_result_semantics_may_be_loaded,false);
assert.strictEqual(policy.reference_firewall.P3_official_result_semantics_may_be_loaded,false);
assert.strictEqual(policy.reference_firewall.fit_or_parameter_search,false);
assert.strictEqual(policy.reference_firewall.reserved_ymaze_may_be_loaded,false);

assert.strictEqual(auth.id,'P4_implementation_authorization_v1');
assert.strictEqual(auth.mechanism_freeze.git_blob_sha,'609551836e540c341365db9cc987d2ca340cc053');
assert.strictEqual(auth.reachability_execution_policy.git_blob_sha,'0d452f9c0d548ec962e0a6d9826648bf5e14a4ef');
assert.strictEqual(auth.authorization.create_src_p4_js,true);
assert.strictEqual(auth.authorization.run_frozen_400_trial_nominal_panel,true);
assert.strictEqual(auth.authorization.run_node_chromium_parity_and_firewall,true);
for(const k of ['response_target_access','reference_outcome_access','P1_official_result_semantic_access','P2_official_result_semantic_access','P3_official_result_semantic_access','parameter_search_or_ranking','adaptive_retuning','P4_response_estimation_policy','canonical_locomotion_update','H2_H3_H4_H5_refit_or_combination','reserved_Y_maze_access']) assert.strictEqual(auth.still_forbidden[k],true,k);
assert.strictEqual(auth.promotion_rule.biological_fit_claim_authorized,false);
assert.strictEqual(auth.promotion_rule.fixed_parameter_triplet_promoted,false);
assert.strictEqual(auth.promotion_rule.response_estimation_policy_authorized,false);
assert.strictEqual(auth.promotion_rule.reserved_Y_maze_unlock_authorized,false);

const cfg=p4.paintedTrailResponseConfig(model);
assert.deepStrictEqual({sigma:cfg.sigma,kappa:cfg.kappa,theta:cfg.theta,radius:cfg.radius,radialBins:cfg.radialBins,angularBins:cfg.angularBins,samplesPerSector:cfg.samplesPerSector},{sigma:8,kappa:4,theta:0.25,radius:10,radialBins:4,angularBins:8,samplesPerSector:32});
assert.strictEqual(model.painted_trail_response.absolute_detection.boundary,'off_when_sum_less_than_or_equal_to_theta');
const at=p4.gatedRelativeSignal(.10,.15,.25),above=p4.gatedRelativeSignal(.10,.16,.25),equal=p4.gatedRelativeSignal(.4,.4,.25);
assert.deepStrictEqual(at,{signal:0,detected:false,sum:.25});
assert(above.detected&&above.signal>0);
assert(equal.detected&&equal.signal===0);
assert(Math.abs(p4.gatedRelativeSignal(.1,.4,.25).signal+p4.gatedRelativeSignal(.4,.1,.25).signal)<1e-15);
assert(Math.abs(p4.gatedRelativeSignal(.2,.6,.25).signal-p4.gatedRelativeSignal(.4,1.2,.25).signal)<1e-15);
assert.strictEqual(p4.gatedRelativeSignal(.02,.08,.25).detected,false);
assert.strictEqual(p4.gatedRelativeSignal(.08,.32,.25).detected,true);

const baseModel=read('models/lasius_niger_locomotion_v1.json');
assert.deepStrictEqual(model.movement,baseModel.movement,'P4 movement must remain exactly canonical');
assert.strictEqual(model.contacts.enabled,false);
assert.strictEqual(model.provenance.parameter_status,'ASSUMED_ENGINEERING_REACHABILITY_NOT_FITTED');
assert.strictEqual(model.provenance.runtime_git_blob_sha,'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');

const responsePolicyPresent=fs.existsSync(path.join(root,'hypotheses/p4_response_estimation_v1.json'));
if(responsePolicyPresent){
  assert.strictEqual(blob('hypotheses/p4_response_estimation_v1.json'),'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
  const p=read('hypotheses/p4_response_estimation_v1.json');
  assert.strictEqual(p.frozen_inputs.implementation_authorization.git_blob_sha,'42f8d51b06a20c0c6001a42b6021a134f2694e0d');
  assert.strictEqual(p.frozen_inputs.p4_runtime.git_blob_sha,'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
  assert.strictEqual(p.estimator_implementation_gate.P4_estimator_exists_at_this_freeze,false);
  assert.strictEqual(p.estimator_implementation_gate.response_target_semantics_accessed_at_this_freeze,false);
  assert.strictEqual(p.estimator_implementation_gate.estimator_implementation_authorized_by_this_record,false);
  assert.strictEqual(p.global_firewall.reserved_Y_maze_access,false);
}
const estimatorPresent=fs.existsSync(path.join(root,'tools/run-p4-estimation.js'));
if(estimatorPresent){
  assert.strictEqual(blob('hypotheses/p4_estimator_implementation_authorization_v1.json'),'e8f26731412d8693a5596da4374de932745b9392');
  assert.strictEqual(blob('tools/p4-estimation-core.js'),'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
  assert.strictEqual(blob('tools/run-p4-estimation.js'),'e57b554c0ad56a0034f4f79ec8090d3e863e3d11');
  const estimatorAuth=read('hypotheses/p4_estimator_implementation_authorization_v1.json');
  assert.strictEqual(estimatorAuth.frozen_policy.git_blob_sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
  assert.strictEqual(estimatorAuth.still_forbidden.response_target_semantic_access,true);
  assert.strictEqual(estimatorAuth.still_forbidden.official_high_resolution_search,true);
  assert.strictEqual(estimatorAuth.still_forbidden.reserved_Y_maze_access,true);
}
assert.strictEqual(fs.existsSync(path.join(root,'hypotheses/p4_highres_authorization_v1.json')),false,'P4 high-resolution authorization must remain absent during estimator qualification');

console.log('p4-implementation.test.js PASS '+JSON.stringify({policy_blob:blob('hypotheses/p4_reachability_execution_v1.json'),authorization_blob:blob('hypotheses/p4_implementation_authorization_v1.json'),runtime_blob:blob('src/p4.js'),model_blob:blob('models/lasius_niger_painted_trail_p4_v1.json'),runner_blob:blob('tools/run-p4-reachability.js'),trials:policy.frozen_execution.nominal_reachability_panel.trials,later_response_policy_present:responsePolicyPresent,target_access:false,reserved_ymaze:false}));
