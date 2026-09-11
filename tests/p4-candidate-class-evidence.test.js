'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p4_painted_trail_candidate_class_evidence_v1.json';
const e=read(rel);
assert.strictEqual(blob(rel),'262f332062f271bbf111d0572f83b2faaf2cfd74');
assert.strictEqual(e.id,'P4_painted_trail_candidate_class_evidence_v1');
assert.strictEqual(e.status,'independent_candidate_evidence_frozen_one_fresh_broad_class_supported_no_mechanism_selected_no_implementation_authorized');
assert.strictEqual(e.species,'Lasius niger');

assert.strictEqual(e.starting_checkpoint.main_commit,'50ab8180982dd1a7d8864f88a72fc7dbd3aac166');
assert.strictEqual(e.starting_checkpoint.permanent_main_workflow_run_id,34444825773);
assert.strictEqual(e.starting_checkpoint.permanent_main_workflow_run_number,152);
assert.strictEqual(e.starting_checkpoint.test_job_id,102767251258);
assert.strictEqual(e.starting_checkpoint.test_job_conclusion,'success');
assert.strictEqual(e.starting_checkpoint.deploy_job_id,102767409139);
assert.strictEqual(e.starting_checkpoint.deploy_job_conclusion,'success');

assert.strictEqual(blob(e.prior_closure_boundary.p1_result_freeze_file),'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(blob(e.prior_closure_boundary.p2_result_freeze_file),'088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(blob(e.prior_closure_boundary.p3_result_freeze_file),'aa69afda6d80cc9d4ea0b563470cffdf0762b941');
assert.strictEqual(blob(e.prior_closure_boundary.p3_post_failure_characterization_file),'541259b5f26cc475997b7b1a03d6b6f3cba6a332');
assert.strictEqual(e.prior_closure_boundary.p1_closed,true);
assert.strictEqual(e.prior_closure_boundary.p2_closed,true);
assert.strictEqual(e.prior_closure_boundary.p3_closed,true);
assert.strictEqual(e.prior_closure_boundary.p1_rerun_or_rescue_authorized,false);
assert.strictEqual(e.prior_closure_boundary.p2_rerun_or_rescue_authorized,false);
assert.strictEqual(e.prior_closure_boundary.p3_rerun_or_rescue_authorized,false);
assert.strictEqual(e.prior_closure_boundary.p3_target_ranked_outcomes_used_to_define_or_parameterize_P4_classes,false);

assert.strictEqual(e.independent_sources.length,5);
const byId=Object.fromEntries(e.independent_sources.map(s=>[s.source_id,s]));
for(const id of [
  'oberhauser_wendt_czaczkes_2020_lasius_concentration_attraction',
  'perna_et_al_2012_linepithema_relative_turning_with_detection_threshold_boundary',
  'czaczkes_gruter_jones_ratnieks_2011_lasius_presence_strength_boundary',
  'koch_czaczkes_2021_lasius_transient_nonfollowing',
  'poissonnier_et_al_2026_lasius_context_boundary'
]) assert(byId[id],'missing independent source '+id);

const dose=byId.oberhauser_wendt_czaczkes_2020_lasius_concentration_attraction;
const doseFacts=dose.frozen_relevant_facts.join(' ');
assert.match(doseFacts,/73\.4%/);
assert.match(doseFacts,/85\.1%/);
assert.match(doseFacts,/94\.4%/);
assert.match(doseFacts,/51\.2%/);
assert.match(dose.allowed_inference,/absolute local pheromone-evidence dependence/);
assert.match(dose.limits.join(' '),/does not identify a hard sensory threshold/);
assert.match(dose.limits.join(' '),/does not expose or unlock the project's reserved Y-maze validation target/);

const perna=byId.perna_et_al_2012_linepithema_relative_turning_with_detection_threshold_boundary;
assert.strictEqual(perna.species,'Linepithema humile');
assert.match(perna.frozen_relevant_facts.join(' '),/minimum sensory detection threshold/);
assert.match(perna.allowed_inference,/absolute-signal-dependent expression or detection stage/);
assert.match(perna.limits.join(' '),/cross-species/);

const strength=byId.czaczkes_gruter_jones_ratnieks_2011_lasius_presence_strength_boundary;
assert.match(strength.frozen_relevant_facts.join(' '),/one ant passage to 20 ant passages/);
assert.match(strength.allowed_inference,/need not be assumed to form one universal smooth dose-response/);

const lapse=byId.koch_czaczkes_2021_lasius_transient_nonfollowing;
assert.match(lapse.allowed_inference,/already-tested P2-v1 signal-independent lapse class is not a fresh P4 class/);
assert.match(lapse.limits.join(' '),/does not establish that lapse probability depends on instantaneous absolute pheromone concentration/);

const context=byId.poissonnier_et_al_2026_lasius_context_boundary;
assert.match(context.frozen_relevant_facts.join(' '),/No significant modulation/);
assert.match(context.limits.join(' '),/cannot be used to create path-length-specific, direction-specific, or recent-experience-specific P4 response parameters/);

assert.strictEqual(e.fresh_candidate_classes.length,1);
const c=e.fresh_candidate_classes[0];
assert.strictEqual(c.class_id,'P4_candidate_absolute_signal_dependent_bilateral_response');
assert.strictEqual(c.status,'fresh_plausible_class_supported_not_formally_selected');
assert.match(c.description,/absolute local pheromone-evidence quantity/);
assert.match(c.independent_evidence_strength,/direct_Lasius_niger_support_for_absolute_concentration_dependence/);
assert(c.why_genuinely_new_relative_to_closed_versions.some(x=>/Unlike P1-v1/.test(x)));
assert(c.why_genuinely_new_relative_to_closed_versions.some(x=>/Unlike P2-v1/.test(x)));
assert(c.why_genuinely_new_relative_to_closed_versions.some(x=>/Unlike P3-v1/.test(x)));
const subclasses=c.mechanism_subclasses_not_selected_by_this_gate.join(' ');
assert.match(subclasses,/hard absolute detection threshold/);
assert.match(subclasses,/smooth deterministic absolute-signal gate/);
assert.match(subclasses,/stochastic detection or engagement/);
assert.match(subclasses,/regularized relative comparison/);
const unset=c.must_remain_unset_until_a_separate_mechanism_freeze.join(' ');
assert.match(unset,/exact absolute-evidence statistic/);
assert.match(unset,/exact transduction equation/);
assert.match(unset,/sensor geometry/);
assert.match(unset,/parameter values and search bounds/);
assert.match(unset,/estimation objective, folds, seeds, trial budgets, comparators, and promotion criteria/);

const closed=Object.fromEntries(e.previously_tested_or_nonfresh_classes.map(x=>[x.maps_to,x]));
for(const version of ['P1-v1','P2-v1','P3-v1']){
  assert(closed[version],'missing closed prior class '+version);
  assert.match(closed[version].status,/already_tested_and_permanently_closed_not_a_fresh_P4_class/);
}
const neg=Object.fromEntries(e.negative_or_not_yet_supported_classes.map(x=>[x.class_id,x]));
for(const id of [
  'path_distance_direction_recent_experience_specific_response',
  'stable_specialist_pheromone_ignorer_identity',
  'pheromone_driven_speed_law_as_primary_P4_mechanism',
  'repulsive_or_sign_reversing_pheromone_response'
]) assert(neg[id],'missing negative/not-supported class '+id);

assert.strictEqual(e.evidence_synthesis.candidate_class_supported,'P4_candidate_absolute_signal_dependent_bilateral_response');
assert.strictEqual(e.evidence_synthesis.candidate_class_formally_selected,false);
assert.match(e.evidence_synthesis.important_form_uncertainty,/hard threshold, smooth deterministic gate, regularized relative response, or signal-dependent stochastic detection/);
assert.match(e.evidence_synthesis.reason_selection_is_deferred,/separate candidate-class decision gate/);

for(const [k,v] of Object.entries(e.selection_firewall)){
  if(k==='rule')continue;
  assert.strictEqual(v,false,k+' must remain false');
}
assert.match(e.next_gate,/separate P4 candidate-class decision record/);
assert.match(e.next_gate,/exact absolute-evidence statistic/);
assert.match(e.next_gate,/unset until a later prospective mechanism freeze/);

const decisionRel='hypotheses/p4_painted_trail_candidate_class_decision_v1.json';
const decisionPresent=fs.existsSync(path.join(root,decisionRel));
if(decisionPresent){
  assert.strictEqual(blob(decisionRel),'ad7295ba6d466549c60c8ecac37e39d30006ec1c');
  const d=read(decisionRel);
  assert.strictEqual(d.independent_evidence_input.git_blob_sha,'262f332062f271bbf111d0572f83b2faaf2cfd74');
  assert.strictEqual(d.selected_next_candidate_class.class_id,c.class_id);
  assert.strictEqual(d.selection_firewall.P4_executable_mechanism_exists,false);
  assert.strictEqual(d.selection_firewall.new_P4_simulation_authorized,false);
  assert.strictEqual(d.selection_firewall.response_target_semantic_access_authorized,false);
}
const mechanismRel='hypotheses/p4_painted_trail_mechanism_v1.json';
const mechanismPresent=fs.existsSync(path.join(root,mechanismRel));
if(mechanismPresent){
  assert.strictEqual(blob(mechanismRel),'609551836e540c341365db9cc987d2ca340cc053');
  const m=read(mechanismRel);
  assert.strictEqual(m.candidate_class_input.evidence_git_blob_sha,'262f332062f271bbf111d0572f83b2faaf2cfd74');
  assert.strictEqual(m.candidate_class_input.selected_class_id,c.class_id);
  assert.strictEqual(m.implementation_gate.src_p4_exists_at_this_freeze,false);
  assert.strictEqual(m.implementation_gate.p4_model_exists_at_this_freeze,false);
  assert.strictEqual(m.implementation_gate.new_P4_simulation_executed_at_this_freeze,false);
  assert.strictEqual(m.implementation_gate.implementation_authorized_by_this_record,false);
  assert.strictEqual(m.estimation_firewall.response_target_semantic_access_authorized,false);
  assert.strictEqual(m.global_firewall.reserved_Y_maze_access,false);
}
const implementationPresent=fs.existsSync(path.join(root,'src/p4.js'));
if(implementationPresent){
  assert.strictEqual(blob('hypotheses/p4_reachability_execution_v1.json'),'0d452f9c0d548ec962e0a6d9826648bf5e14a4ef');
  assert.strictEqual(blob('hypotheses/p4_implementation_authorization_v1.json'),'42f8d51b06a20c0c6001a42b6021a134f2694e0d');
  assert.strictEqual(blob('src/p4.js'),'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
  assert.strictEqual(blob('models/lasius_niger_painted_trail_p4_v1.json'),'3d8460b6916a90d06e70768f696ee3f0d48fccf4');
  assert.strictEqual(blob('tools/run-p4-reachability.js'),'ba4e067a7f686933ed3271a64da2f79f0a558ab0');
  const p=read('hypotheses/p4_reachability_execution_v1.json');
  const a=read('hypotheses/p4_implementation_authorization_v1.json');
  assert.strictEqual(p.mechanism_freeze.git_blob_sha,'609551836e540c341365db9cc987d2ca340cc053');
  assert.strictEqual(a.reachability_execution_policy.git_blob_sha,'0d452f9c0d548ec962e0a6d9826648bf5e14a4ef');
  assert.strictEqual(a.authorization.create_src_p4_js,true);
  assert.strictEqual(a.still_forbidden.response_target_access,true);
  assert.strictEqual(a.still_forbidden.reserved_Y_maze_access,true);
}
const responsePolicyPresent=fs.existsSync(path.join(root,'hypotheses/p4_response_estimation_v1.json'));
if(responsePolicyPresent){
  assert.strictEqual(blob('hypotheses/p4_response_estimation_v1.json'),'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
  const p=read('hypotheses/p4_response_estimation_v1.json');
  assert.strictEqual(p.frozen_inputs.candidate_class_evidence.git_blob_sha,'262f332062f271bbf111d0572f83b2faaf2cfd74');
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

console.log('p4-candidate-class-evidence.test.js PASS '+JSON.stringify({
  evidence_blob:blob(rel),
  sources:e.independent_sources.length,
  supported_class:c.class_id,
  historical_formally_selected:e.evidence_synthesis.candidate_class_formally_selected,
  later_decision_present:decisionPresent,
  later_mechanism_present:mechanismPresent,
  later_implementation_present:implementationPresent,
  later_response_policy_present:responsePolicyPresent,
  reserved_ymaze_access:e.selection_firewall.reserved_project_Y_maze_validation_access_authorized
}));
