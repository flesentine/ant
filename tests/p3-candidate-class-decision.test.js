'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p3_painted_trail_candidate_class_decision_v1.json';
const d=read(rel);

assert.strictEqual(blob(rel),'e8da07f6f73934e0120fd41d4668ae4039108336');
assert.strictEqual(blob('hypotheses/p2_response_estimation_result_freeze_v1.json'),'088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(blob('reports/p2_response_estimation_1000x60_v1.json'),'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(blob('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json'),'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');

assert.strictEqual(d.id,'P3_painted_trail_candidate_class_decision_v1');
assert.strictEqual(d.status,'next_independent_candidate_class_selected_no_mechanism_equation_no_implementation_authorized');
assert.strictEqual(d.species,'Lasius niger');

assert.strictEqual(d.p2_closure_boundary.p2_result_freeze_git_blob_sha,'088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(d.p2_closure_boundary.p2_official_report_git_blob_sha,'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(d.p2_closure_boundary.p2_v1_closed,true);
assert.strictEqual(d.p2_closure_boundary.p2_rerun_authorized,false);
assert.strictEqual(d.p2_closure_boundary.p2_official_fold_outcomes_used_to_select_or_parameterize_P3,false);

const perna=d.independent_evidence_inputs.find(x=>x.source_id==='perna_et_al_2012_linepithema_weber');
assert(perna);
assert.strictEqual(perna.species,'Linepithema humile');
assert.strictEqual(perna.doi,'10.1371/journal.pcbi.1002592');
assert.strictEqual(perna.pubmed_id,'22829756');
assert(perna.evidence.some(x=>/Weber-like relative bilateral rule/i.test(x)));
assert(perna.evidence.some(x=>/speed was largely unaffected/i.test(x)));

const pois=d.independent_evidence_inputs.find(x=>x.source_id==='poissonnier_et_al_2026_lasius_niger_context');
assert(pois);
assert.strictEqual(pois.species,'Lasius niger');
assert.strictEqual(pois.doi,'10.1007/s00040-026-01106-9');
assert(pois.evidence.some(x=>/No significant modulation/i.test(x)));

assert.strictEqual(d.selected_next_candidate_class.class_id,'P3_candidate_relative_bilateral_transduction');
assert.strictEqual(d.selected_next_candidate_class.historical_alias,'P2_candidate_B_relative_bilateral_transduction');
assert.strictEqual(d.selected_next_candidate_class.selection_strength,'cross_species_mechanistic_support_only');
assert.match(d.selected_next_candidate_class.description,/relative left-right pheromone contrast/i);
assert.match(d.selected_next_candidate_class.biological_claim_limit,/not a claim that Lasius niger/i);

assert.strictEqual(d.explicit_nonselections.carry_forward_P2_transient_lapse_state,false);
assert.strictEqual(d.explicit_nonselections.combined_P2_lapse_plus_relative_transduction,false);
assert.strictEqual(d.explicit_nonselections.stable_specialist_ignorer_identity,false);
assert.strictEqual(d.explicit_nonselections.path_length_specific_response,false);
assert.strictEqual(d.explicit_nonselections.travel_direction_specific_response,false);
assert.strictEqual(d.explicit_nonselections.recent_food_experience_specific_response,false);
assert.strictEqual(d.explicit_nonselections.colony_specific_response,false);
assert.strictEqual(d.explicit_nonselections.pheromone_driven_speed_modulation,false);

for(const item of [
  'exact relative-transduction equation',
  'difference-over-sum regularization or epsilon rule',
  'sensor or antenna geometry',
  'field representation',
  'steering gain',
  'parameter surface and bounds',
  'null identities',
  'engineering-only reachability values'
]) assert(d.mechanism_details_deliberately_not_frozen_here.includes(item),item+' must remain unfrozen at candidate-class gate');

assert.strictEqual(d.selection_firewall.P3_executable_mechanism_exists,false);
assert.strictEqual(d.selection_firewall.P3_runtime_authorized,false);
assert.strictEqual(d.selection_firewall.P3_model_authorized,false);
assert.strictEqual(d.selection_firewall.new_simulation_authorized,false);
assert.strictEqual(d.selection_firewall.P3_parameter_estimation_policy_authorized,false);
assert.strictEqual(d.selection_firewall.response_target_semantic_access_authorized,false);
assert.strictEqual(d.selection_firewall.candidate_ranking_against_response_target_authorized,false);
assert.strictEqual(d.selection_firewall.P2_rerun_or_rescue_authorized,false);
assert.strictEqual(d.selection_firewall.canonical_locomotion_change_authorized,false);
assert.strictEqual(d.selection_firewall.H2_H3_H4_H5_refit_authorized,false);
assert.strictEqual(d.selection_firewall.Y_maze_access_authorized,false);

const laterMechanismRel='hypotheses/p3_painted_trail_mechanism_v1.json';
const laterMechanismPresent=fs.existsSync(path.join(root,laterMechanismRel));
if(laterMechanismPresent){
  assert.strictEqual(blob(laterMechanismRel),'5d00ce0058ff388c9f57d7dce56ce465d82c5765');
  const m=read(laterMechanismRel);
  assert.strictEqual(m.candidate_class_input.decision_git_blob_sha,'e8da07f6f73934e0120fd41d4668ae4039108336');
  assert.strictEqual(m.candidate_class_input.selected_class_id,'P3_candidate_relative_bilateral_transduction');
  assert.strictEqual(m.implementation_gate.src_p3_exists_at_this_freeze,false);
  assert.strictEqual(m.implementation_gate.p3_model_exists_at_this_freeze,false);
  assert.strictEqual(m.implementation_gate.new_simulation_executed_at_this_freeze,false);
  assert.strictEqual(m.implementation_gate.implementation_authorized_by_this_record,false);
  assert.strictEqual(m.estimation_firewall.response_target_semantic_access_authorized,false);
  assert.strictEqual(m.global_firewall.Y_maze_access,false);
}
const laterRuntime=fs.existsSync(path.join(root,'src','p3.js'));
if(laterRuntime){
  assert.strictEqual(blob('hypotheses/p3_reachability_execution_v1.json'),'55494a3190964d24ded2ae0d1faf3b355cc7835f');
  assert.strictEqual(blob('hypotheses/p3_implementation_authorization_v1.json'),'128afcbdb10d3254240c5074e1e997cee7d7fe51');
  assert.strictEqual(blob('src/p3.js'),'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
  assert.strictEqual(blob('models/lasius_niger_painted_trail_p3_v1.json'),'9107de0c71641c4037bbedbb498b9fa868c1ef00');
  assert.strictEqual(blob('tools/run-p3-reachability.js'),'0e1795b7bbb3a568fbbd241cc809d600e1f8ca67');
}
const laterPolicyRel='hypotheses/p3_response_estimation_v1.json';
const laterPolicyPresent=fs.existsSync(path.join(root,laterPolicyRel));
if(laterPolicyPresent){
  assert.strictEqual(blob(laterPolicyRel),'d86eb9936e993d188f2a28faab838ba158c40f3b');
  const p=read(laterPolicyRel);
  assert.strictEqual(p.id,'P3_response_estimation_v1');
  assert.strictEqual(p.frozen_inputs.mechanism_freeze.git_blob_sha,'5d00ce0058ff388c9f57d7dce56ce465d82c5765');
  assert.strictEqual(p.frozen_inputs.reachability_result_freeze.git_blob_sha,'b3fa56386f71b0cea1dd8cfec032148c42af1b6d');
  assert.strictEqual(p.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
  assert.strictEqual(p.estimator_implementation_gate.response_target_semantic_access_authorized,false);
  assert.strictEqual(p.global_firewalls.P1_official_result_semantic_access,false);
  assert.strictEqual(p.global_firewalls.P2_official_result_semantic_access,false);
  assert.strictEqual(p.global_firewalls.Y_maze_access,false);
}
const laterEstimatorPresent=fs.existsSync(path.join(root,'tools','run-p3-estimation.js'));
if(laterEstimatorPresent){
  assert.strictEqual(blob('tools/run-p3-estimation.js'),'5bf27bf439dca18629cdfd36f56fe767a23062ff');
  assert.strictEqual(blob('tools/p3-estimation-core.js'),'410ef81dfe761e3c218d072ca311632329ac1617');
}
const laterHighresAuthorizationRel='hypotheses/p3_highres_authorization_v1.json';
const laterHighresAuthorizationPresent=fs.existsSync(path.join(root,laterHighresAuthorizationRel));
if(laterHighresAuthorizationPresent) assert.strictEqual(blob(laterHighresAuthorizationRel),'04d2c7b454143fd7073b274bff0ec9b355ec058d');

assert.match(d.next_gate,/separate P3 mechanism-selection\/freeze record/i);

console.log('p3-candidate-class-decision.test.js PASS '+JSON.stringify({
  decision_blob:blob(rel),
  selected_class:d.selected_next_candidate_class.class_id,
  evidence_strength:d.selected_next_candidate_class.selection_strength,
  p2_closed:d.p2_closure_boundary.p2_v1_closed,
  p2_outcomes_used_for_selection:false,
  later_mechanism_present:laterMechanismPresent,
  later_runtime_present:laterRuntime,
  later_policy_present:laterPolicyPresent,
  p3_runtime_at_candidate_freeze:false,
  response_target_access:false,
  ymaze:false
}));
