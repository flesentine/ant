'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const e=read('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json');
assert.strictEqual(blob('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json'),'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
assert.strictEqual(e.status,'candidate_class_evidence_frozen_no_mechanism_selected_no_implementation_authorized');
assert.strictEqual(e.p1_dependency_boundary.p1_closed,true);
assert.strictEqual(e.p1_dependency_boundary.p1_rerun_authorized,false);
assert.strictEqual(e.p1_dependency_boundary.p1_result_freeze_git_blob_sha,'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(e.p1_dependency_boundary.p1_official_report_git_blob_sha,'561aca4a14346ebb4f062f30d0438d3115784172');

const sources=Object.fromEntries(e.independent_sources.map(s=>[s.source_id,s]));
assert.strictEqual(sources.koch_czaczkes_2021_lasius_niger_lapses.species,'Lasius niger');
assert.strictEqual(sources.koch_czaczkes_2021_lasius_niger_lapses.doi,'10.1111/een.12995');
assert.match(sources.koch_czaczkes_2021_lasius_niger_lapses.evidence_relevant_to_future_mechanism.join(' '),/around 20%/i);
assert.match(sources.koch_czaczkes_2021_lasius_niger_lapses.evidence_relevant_to_future_mechanism.join(' '),/not repeatable/i);

assert.strictEqual(sources.perna_et_al_2012_linepithema_weber.species,'Linepithema humile');
assert.strictEqual(sources.perna_et_al_2012_linepithema_weber.pubmed_id,'22829756');
assert.match(sources.perna_et_al_2012_linepithema_weber.evidence_relevant_to_future_mechanism.join(' '),/Weber/i);
assert.match(sources.perna_et_al_2012_linepithema_weber.forbidden_inference,/cross-species/i);

assert.strictEqual(sources.poissonnier_et_al_2026_lasius_niger_context.species,'Lasius niger');
assert.strictEqual(sources.poissonnier_et_al_2026_lasius_niger_context.doi,'10.1007/s00040-026-01106-9');
assert.match(sources.poissonnier_et_al_2026_lasius_niger_context.allowed_inference,/should not add path-history, travel-direction, or recent-food-experience/i);

assert.deepStrictEqual(e.candidate_mechanism_classes.map(x=>x.status),['plausible_class_not_selected','plausible_class_not_selected']);
assert.strictEqual(e.selection_firewall.candidate_class_selected,false);
assert.strictEqual(e.selection_firewall.p2_hypothesis_record_exists,false);
assert.strictEqual(e.selection_firewall.p2_runtime_authorized,false);
assert.strictEqual(e.selection_firewall.p2_parameter_policy_authorized,false);
assert.strictEqual(e.selection_firewall.p2_reference_target_search_authorized,false);
assert.strictEqual(e.selection_firewall.new_simulation_authorized,false);
assert.strictEqual(e.selection_firewall.ymaze_access_authorized,false);

const laterMechanismPath=path.join(root,'hypotheses','p2_painted_trail_mechanism_v1.json');
const laterMechanismPresent=fs.existsSync(laterMechanismPath);
if(laterMechanismPresent){
  const m=read('hypotheses/p2_painted_trail_mechanism_v1.json');
  assert.strictEqual(m.selected_candidate_class.source_evidence_git_blob_sha,'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
  assert.strictEqual(m.selected_candidate_class.class_id,'P2_candidate_A_transient_response_engagement');
  assert.strictEqual(m.implementation_gate.implementation_authorized_by_this_record,false);
  assert.strictEqual(m.implementation_gate.new_simulation_executed_at_this_freeze,false);
  assert.strictEqual(m.estimation_firewall.p2_parameter_search_authorized,false);
  assert.strictEqual(m.estimation_firewall.raw_response_target_access_authorized,false);
  assert.strictEqual(m.global_firewall.Y_maze_access,false);
}
const laterImplementationPresent=fs.existsSync(path.join(root,'src','p2.js'))||fs.existsSync(path.join(root,'models','lasius_niger_painted_trail_p2_v1.json'));
if(laterImplementationPresent){
  assert.strictEqual(blob('hypotheses/p2_reachability_execution_v1.json'),'8431ada87724953128104077f4ce1c11b569b1cf');
  assert.strictEqual(blob('hypotheses/p2_implementation_authorization_v1.json'),'462997ea7399d98efca5a6b19a0e38160fbddbaf');
  const a=read('hypotheses/p2_implementation_authorization_v1.json');
  assert.strictEqual(a.authorization.create_src_p2_js,true);
  assert.strictEqual(a.authorization.create_p2_engineering_model,true);
  assert.strictEqual(a.still_forbidden.response_target_access,true);
  assert.strictEqual(a.still_forbidden.Y_maze_access,true);
}
const laterPolicyPath=path.join(root,'hypotheses','p2_response_estimation_v1.json');
const laterPolicyPresent=fs.existsSync(laterPolicyPath);
if(laterPolicyPresent){
  assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
  const p=read('hypotheses/p2_response_estimation_v1.json');
  assert.strictEqual(p.frozen_inputs.candidate_class_evidence.git_blob_sha,'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
  assert.strictEqual(p.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
  assert.strictEqual(p.estimator_implementation_gate.high_resolution_response_search_authorized,false);
  assert.strictEqual(p.estimator_implementation_gate.response_target_semantic_access_authorized,false);
  assert.strictEqual(p.global_firewalls.Y_maze_access,false);
}
const laterEstimatorPath=path.join(root,'tools','run-p2-estimation.js');
const laterEstimatorPresent=fs.existsSync(laterEstimatorPath);
if(laterEstimatorPresent){
  assert.strictEqual(blob('tools/run-p2-estimation.js'),'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
  assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
}
const laterAuthorizationPath=path.join(root,'hypotheses','p2_highres_authorization_v1.json');
const laterAuthorizationPresent=fs.existsSync(laterAuthorizationPath);
if(laterAuthorizationPresent){
  assert.strictEqual(blob('hypotheses/p2_highres_authorization_v1.json'),'de361b15b9600bd92a35baf30fa71c2a7c61003c');
  const a=read('hypotheses/p2_highres_authorization_v1.json');
  assert.strictEqual(a.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
  assert.strictEqual(a.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
  assert.strictEqual(a.effective_when_merged_to_main,true);
  assert.strictEqual(a.P1_official_result_semantic_access_authorized,false);
  assert.strictEqual(a.Candidate_B_authorized,false);
  assert.strictEqual(a.ymaze_access_authorized,false);
}

const neg=Object.fromEntries(e.negative_candidate_classes.map(x=>[x.class_id,x]));
assert.match(neg.path_history_direction_recent_experience_modulation.status,/not_independently_supported/);
assert.match(neg.stable_specialist_pheromone_ignorer_identity.status,/contradicted/);

console.log('p2-candidate-class-evidence.test.js PASS '+JSON.stringify({
  evidence_blob:blob('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json'),
  sources:e.independent_sources.length,
  plausible_classes:e.candidate_mechanism_classes.length,
  historical_selection_at_evidence_gate:false,
  later_mechanism_present:laterMechanismPresent,
  later_implementation_present:laterImplementationPresent,
  historical_evidence_gate_implementation_authorized:false,
  later_response_policy_present:laterPolicyPresent,
  later_estimator_present:laterEstimatorPresent,
  ymaze_authorized:false
}));
