'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const m=read('hypotheses/p2_painted_trail_mechanism_v1.json');
const e=read('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json');

assert.strictEqual(blob('hypotheses/p2_painted_trail_mechanism_v1.json'),'70f51e5cab5db0024947ed71cf760590089f8aea');
assert.strictEqual(blob('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json'),'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
assert.strictEqual(blob('hypotheses/p1_response_estimation_result_freeze_v1.json'),'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(blob('reports/p1_response_estimation_500x60_v1.json'),'561aca4a14346ebb4f062f30d0438d3115784172');
assert.strictEqual(blob('src/p1.js'),'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p1_v1.json'),'73873fd6763838423ca27648136bb0b9ff062817');

assert.strictEqual(m.id,'P2_painted_trail_mechanism_v1');
assert.strictEqual(m.status,'prospective_mechanism_selected_and_frozen_before_implementation_or_new_simulation');
assert.strictEqual(m.species,'Lasius niger');
assert.strictEqual(m.selected_candidate_class.source_evidence_git_blob_sha,'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
assert.strictEqual(m.selected_candidate_class.class_id,'P2_candidate_A_transient_response_engagement');
assert.match(m.selected_candidate_class.selection_rationale.join(' '),/direct Lasius niger support/i);
assert.match(m.selected_candidate_class.selection_rationale.join(' '),/not combined into P2-v1/i);
assert.strictEqual(m.selected_candidate_class.candidate_B_status,'not_selected_retained_for_future_independent_hypothesis_only');

const evidenceA=e.candidate_mechanism_classes.find(x=>x.class_id==='P2_candidate_A_transient_response_engagement');
const evidenceB=e.candidate_mechanism_classes.find(x=>x.class_id==='P2_candidate_B_relative_bilateral_transduction');
assert(evidenceA&&evidenceB);
assert.strictEqual(evidenceA.status,'plausible_class_not_selected');
assert.strictEqual(evidenceB.status,'plausible_class_not_selected');
assert.strictEqual(evidenceA.species_support[0],'Lasius niger');
assert.strictEqual(evidenceB.species_support[0],'Linepithema humile');

assert.strictEqual(m.p1_closure_boundary.p1_v1_closed,true);
assert.strictEqual(m.p1_closure_boundary.p1_rerun_authorized,false);
assert.strictEqual(m.p1_closure_boundary.p1_result_freeze_git_blob_sha,'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(m.p1_closure_boundary.p1_official_report_git_blob_sha,'561aca4a14346ebb4f062f30d0438d3115784172');

assert.strictEqual(m.mechanism.mechanism_id,'P2_trial_level_transient_trail_engagement_v1');
assert.strictEqual(m.mechanism.trial_level_engagement_state.parameter,'p_lapse');
assert.deepStrictEqual(m.mechanism.trial_level_engagement_state.domain,[0,1]);
assert.match(m.mechanism.trial_level_engagement_state.draw_rule,/exactly one U~Uniform\[0,1\)/);
assert.match(m.mechanism.trial_level_engagement_state.draw_rule,/engaged = \(U >= p_lapse\)/);
assert.match(m.mechanism.trial_level_engagement_state.within_trial_rule,/fixed/);
assert.match(m.mechanism.trial_level_engagement_state.between_trial_rule,/No engagement state is persisted/);
assert.strictEqual(m.mechanism.trial_level_engagement_state.stable_specialist_identity,false);

const kernel=m.mechanism.engaged_local_response_kernel;
assert.strictEqual(kernel.field.type,'gaussian_distance_to_segment');
assert.strictEqual(kernel.field.equation,'C(p) = dose_ratio * exp(-d(p, segment)^2 / (2*sigma_field_mm^2))');
assert.strictEqual(kernel.sensors.type,'bilateral_body_frame_points');
assert.strictEqual(kernel.sensors.forward_offset_mm,2);
assert.strictEqual(kernel.sensors.lateral_half_separation_mm,1.5);
assert.strictEqual(kernel.transduction.type,'c_over_one_plus_c');
assert.strictEqual(kernel.transduction.equation,'T(C)=C/(1+C)');
assert.strictEqual(kernel.steering.type,'engagement_gated_right_minus_left_heading_drift');
assert.strictEqual(kernel.steering.equation,'omega_trail = engaged * kappa_trail_per_s * (T(C_right)-T(C_left))');

const effects=m.mechanism.speed_pause_noise_effects;
assert.deepStrictEqual(effects,{
  base_speed_changed:false,
  speed_process_changed:false,
  pause_process_changed:false,
  angular_noise_amplitude_changed:false,
  contact_process_changed:false
});

const rng=m.dedicated_response_rng;
assert.strictEqual(rng.biology_rng_draws_added,0);
assert.strictEqual(rng.response_rng_draws_per_ant,'0 under exact bypass cases; otherwise exactly 1 when 0 < p_lapse < 1.');
assert.match(rng.seed_namespace_rule,/0x27d4eb2d/);
assert.match(rng.seed_namespace_rule,/0x6c8e9cf5/);
assert.deepStrictEqual(rng.hash32_definition,[
  'x |= 0',
  'x = (x + 0x9e3779b9) | 0',
  'x = Math.imul(x ^ (x >>> 16), 0x21f0aaad)',
  'x = Math.imul(x ^ (x >>> 15), 0x735a2d97)',
  'return (x ^ (x >>> 15)) >>> 0'
]);
assert.match(rng.rng_algorithm,/separate core\.RNG/);
assert.match(rng.common_random_number_future_rule,/same underlying U/);

const ids=Object.fromEntries(m.exact_identities.map(x=>[x.case,x]));
assert.match(ids.DCM_or_zero_dose.condition,/dose_ratio == 0/);
assert.match(ids.DCM_or_zero_dose.required_identity,/Exact canonical locomotion trajectory/);
assert.match(ids.zero_steering_gain.condition,/kappa_trail_per_s == 0/);
assert.match(ids.zero_steering_gain.required_identity,/no P2 response RNG draw/);
assert.match(ids.all_lapse.condition,/p_lapse == 1/);
assert.match(ids.all_lapse.required_identity,/Exact canonical locomotion trajectory/);
assert.match(ids.always_engaged_nested_kernel.condition,/p_lapse == 0/);
assert.match(ids.always_engaged_nested_kernel.required_identity,/exactly identical to the frozen P1 local-kernel trajectory/);
assert.match(ids.always_engaged_nested_kernel.required_identity,/does not reopen P1-v1/);

assert(m.invariances.includes('No treatment-specific response parameter.'));
assert(m.invariances.includes('No short-vs-long path-specific response parameter.'));
assert(m.invariances.includes('No colony-specific response parameter.'));
assert(m.invariances.includes('No persistent ant specialist/ignorer identity.'));
assert(m.invariances.includes('No speed modulation by painted-trail response.'));
assert(m.invariances.includes('No Y-maze geometry, outcomes, or treatment labels.'));

assert.deepStrictEqual(m.structural_parameters.p_lapse.mathematical_domain,[0,1]);
assert.strictEqual(m.structural_parameters.p_lapse.future_estimation_status,'not_decided_by_this_gate');
assert.strictEqual(m.structural_parameters.sigma_field_mm.future_estimation_status,'not_decided_by_this_gate');
assert.strictEqual(m.structural_parameters.kappa_trail_per_s.future_estimation_status,'not_decided_by_this_gate');

const eng=m.engineering_only_reachability_values;
assert.strictEqual(eng.sigma_field_mm,8);
assert.strictEqual(eng.kappa_trail_per_s,4);
assert.strictEqual(eng.p_lapse,0.2);
assert.match(eng.p_lapse_basis,/not asserted to be the Poissonnier open-arena lapse probability/i);
assert.strictEqual(eng.retuning_from_reachability_forbidden,true);
assert.deepStrictEqual(eng.planned_reference_free_panel.map(x=>x.name),[
  'zero_dose_canonical_identity',
  'zero_kappa_canonical_identity',
  'always_engaged_nested_p1_identity',
  'literature_anchor_stochastic_reachability',
  'all_lapse_canonical_identity'
]);

assert.strictEqual(m.selection_decisions.candidate_A_transient_response_engagement,'selected_for_P2_v1');
assert.strictEqual(m.selection_decisions.candidate_B_relative_bilateral_transduction,'not_selected_for_P2_v1');
assert.strictEqual(m.selection_decisions.combined_A_plus_B,'not_selected');
assert.strictEqual(m.selection_decisions.path_history_direction_recent_experience_modulation,'forbidden_without_new_independent_evidence');
assert.strictEqual(m.selection_decisions.stable_specialist_pheromone_ignorer_identity,'forbidden_by_current_evidence');

assert.strictEqual(m.implementation_gate.src_p2_exists_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.p2_model_exists_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.new_simulation_executed_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.implementation_authorized_by_this_record,false);
assert.strictEqual(m.estimation_firewall.p2_response_estimation_policy_exists,false);
assert.strictEqual(m.estimation_firewall.p2_parameter_search_authorized,false);
assert.strictEqual(m.estimation_firewall.raw_response_target_access_authorized,false);
assert.strictEqual(m.estimation_firewall.candidate_ranking_against_response_target_authorized,false);
assert.strictEqual(m.estimation_firewall.p1_official_result_rerun_authorized,false);
assert.strictEqual(m.global_firewall.response_target_access,false);
assert.strictEqual(m.global_firewall.Y_maze_access,false);

const laterRuntime=fs.existsSync(path.join(root,'src','p2.js'));
const laterModel=fs.existsSync(path.join(root,'models','lasius_niger_painted_trail_p2_v1.json'));
if(laterRuntime||laterModel){
  assert.strictEqual(blob('hypotheses/p2_reachability_execution_v1.json'),'8431ada87724953128104077f4ce1c11b569b1cf');
  assert.strictEqual(blob('hypotheses/p2_implementation_authorization_v1.json'),'462997ea7399d98efca5a6b19a0e38160fbddbaf');
  const a=read('hypotheses/p2_implementation_authorization_v1.json');
  assert.strictEqual(a.mechanism_freeze.git_blob_sha,'70f51e5cab5db0024947ed71cf760590089f8aea');
  assert.strictEqual(a.reachability_execution_policy.git_blob_sha,'8431ada87724953128104077f4ce1c11b569b1cf');
  assert.strictEqual(a.still_forbidden.response_target_access,true);
  assert.strictEqual(a.still_forbidden.parameter_search_or_ranking,true);
  assert.strictEqual(a.still_forbidden.Y_maze_access,true);
}
const laterPolicyPath=path.join(root,'hypotheses','p2_response_estimation_v1.json');
const laterPolicyPresent=fs.existsSync(laterPolicyPath);
if(laterPolicyPresent){
  assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
  const p=read('hypotheses/p2_response_estimation_v1.json');
  assert.strictEqual(p.frozen_inputs.mechanism_freeze.git_blob_sha,'70f51e5cab5db0024947ed71cf760590089f8aea');
  assert.strictEqual(p.global_firewalls.P2_estimator_implementation_in_this_policy_PR,false);
  assert.strictEqual(p.global_firewalls.response_target_semantic_access_during_this_policy_freeze,false);
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
  assert.strictEqual(a.Candidate_B_authorized,false);
  assert.strictEqual(a.canonical_promotion_authorized,false);
  assert.strictEqual(a.ymaze_access_authorized,false);
}

console.log('p2-mechanism-selection.test.js PASS '+JSON.stringify({
  mechanism_blob:blob('hypotheses/p2_painted_trail_mechanism_v1.json'),
  selected:'P2_candidate_A_transient_response_engagement',
  p_lapse_engineering_anchor:eng.p_lapse,
  candidate_B_selected:false,
  historical_mechanism_freeze_implementation_authorized:false,
  later_runtime_present:laterRuntime,
  later_model_present:laterModel,
  response_target_authorized:false,
  later_response_policy_present:laterPolicyPresent,
  later_estimator_present:laterEstimatorPresent,
  ymaze_authorized:false
}));
