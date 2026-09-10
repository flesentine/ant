'use strict';

const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const mechPath='hypotheses/p4_painted_trail_mechanism_v1.json';
const decisionPath='hypotheses/p4_painted_trail_candidate_class_decision_v1.json';
const evidencePath='hypotheses/p4_painted_trail_candidate_class_evidence_v1.json';
const m=read(mechPath),d=read(decisionPath),e=read(evidencePath);

assert.strictEqual(blob(mechPath),'609551836e540c341365db9cc987d2ca340cc053');
assert.strictEqual(blob(decisionPath),'ad7295ba6d466549c60c8ecac37e39d30006ec1c');
assert.strictEqual(blob(evidencePath),'262f332062f271bbf111d0572f83b2faaf2cfd74');
assert.strictEqual(blob('hypotheses/p1_response_estimation_result_freeze_v1.json'),'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(blob('hypotheses/p2_response_estimation_result_freeze_v1.json'),'088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(blob('hypotheses/p3_response_estimation_result_freeze_v1.json'),'aa69afda6d80cc9d4ea0b563470cffdf0762b941');

assert.strictEqual(m.id,'P4_painted_trail_mechanism_v1');
assert.strictEqual(m.status,'prospective_absolute_signal_detection_gated_bilateral_mechanism_frozen_before_implementation_or_new_simulation');
assert.strictEqual(m.starting_checkpoint.main_commit,'4a0a007b080039848dc2d3453afb033921460de5');
assert.strictEqual(m.starting_checkpoint.permanent_main_workflow_run_id,34450498772);
assert.strictEqual(m.starting_checkpoint.test_job_id,102784908386);
assert.strictEqual(m.starting_checkpoint.deploy_job_id,102785107053);
assert.strictEqual(m.starting_checkpoint.test_job_conclusion,'success');
assert.strictEqual(m.starting_checkpoint.deploy_job_conclusion,'success');

assert.strictEqual(m.candidate_class_input.selected_class_id,'P4_candidate_absolute_signal_dependent_bilateral_response');
assert.strictEqual(m.candidate_class_input.decision_git_blob_sha,'ad7295ba6d466549c60c8ecac37e39d30006ec1c');
assert.strictEqual(m.candidate_class_input.evidence_git_blob_sha,'262f332062f271bbf111d0572f83b2faaf2cfd74');
assert.strictEqual(d.selected_next_candidate_class.class_id,m.candidate_class_input.selected_class_id);
assert.ok(e.fresh_candidate_classes.some(x=>x.class_id===m.candidate_class_input.selected_class_id));

assert.strictEqual(m.selection_rule.selected_subclass,'hard_absolute_detection_gate_then_local_weber_direction');
assert.strictEqual(m.mechanism.mechanism_id,'P4_local_sector_hard_detection_weber_steering_v1');
assert.strictEqual(m.mechanism.absolute_detection.absolute_evidence_statistic,'S = L + R');
assert.strictEqual(m.mechanism.absolute_detection.theta_parameter,'theta_detect');
assert.match(m.mechanism.absolute_detection.gate,/S <= theta_detect/);
assert.match(m.mechanism.absolute_detection.gate,/S > theta_detect/);
assert.strictEqual(m.mechanism.directional_transduction.equation,'W(L,R;theta_detect) = 0 if L+R <= theta_detect; otherwise (R-L)/(R+L)');
assert.strictEqual(m.mechanism.directional_transduction.global_positive_scale_invariance,false);
assert.strictEqual(m.mechanism.directional_transduction.epsilon_or_regularization,0);
assert.strictEqual(m.mechanism.steering.equation,'omega_trail = kappa_trail_per_s * W(L,R;theta_detect)');

assert.strictEqual(m.mechanism.sector_sensors.radius_mm,10);
assert.strictEqual(m.mechanism.sector_sensors.digital_operator.radial_bins,4);
assert.strictEqual(m.mechanism.sector_sensors.digital_operator.angular_bins_per_sector,8);
assert.strictEqual(m.mechanism.sector_sensors.digital_operator.samples_per_sector,32);
assert.strictEqual(m.mechanism.field.type,'gaussian_distance_to_segment');
assert.match(m.mechanism.field.equation,/dose_ratio \* exp/);

assert.strictEqual(m.mechanism.stochastic_structure.signal_independent_lapse_state_present,false);
assert.strictEqual(m.mechanism.stochastic_structure.response_rng_present,false);
assert.strictEqual(m.mechanism.stochastic_structure.biology_rng_draws_added,0);
for(const v of Object.values(m.mechanism.speed_pause_noise_effects)) assert.strictEqual(v,false);

const W=(L,R,theta)=>L+R<=theta?0:(R-L)/(R+L);
assert.strictEqual(W(0.10,0.15,0.25),0,'threshold equality must be off');
assert(W(0.10,0.16,0.25)>0,'just-above-threshold right-heavy signal must turn right');
assert.strictEqual(W(0.40,0.40,0.25),0,'equal above-threshold signal must not turn');
assert(Math.abs(W(0.10,0.40,0.25)+W(0.40,0.10,0.25))<1e-15,'left-right antisymmetry');
const base=W(0.20,0.60,0.25),scaled=W(0.40,1.20,0.25);
assert(Math.abs(base-scaled)<1e-15,'above-threshold positive scaling must preserve Weber direction');
assert.strictEqual(W(0.02,0.08,0.25),0);
assert(W(0.08,0.32,0.25)!==0,'crossing threshold must break global scale invariance');

const eng=m.engineering_only_reachability_values;
assert.strictEqual(eng.sigma_field_mm,8);
assert.strictEqual(eng.kappa_trail_per_s,4);
assert.strictEqual(eng.theta_detect,0.25);
assert.strictEqual(eng.planned_reference_free_panel.physics_dt_s,0.02);
assert.deepStrictEqual(eng.planned_reference_free_panel.exact_identity_seeds,[840001,840002,840003,840004,840005,840006,840007,840008]);
assert.strictEqual(eng.planned_reference_free_panel.nominal_reachability_trials,400);
assert.strictEqual(eng.planned_reference_free_panel.nominal_first_seed,841000);
assert.strictEqual(eng.planned_reference_free_panel.nominal_last_seed,841399);
assert.strictEqual(eng.retuning_from_reachability_forbidden,true);

// Engineering proof: C(p)<=dose_ratio, so at dose_ratio=.10 each sector mean <=.10 and S<=.20<theta=.25 globally.
assert(2*0.10<eng.theta_detect);
assert.match(eng.value_rationale,/not a biological threshold estimate/i);
assert.match(eng.value_rationale,/may not define a later estimation bound/i);

const identityCases=new Set(m.exact_and_structural_identities.map(x=>x.case));
for(const required of ['DCM_or_zero_dose','zero_steering_gain','subthreshold_local_signal','threshold_boundary','equal_sector_signal','above_threshold_left_right_reflection','conditional_positive_dose_scale','scale_crossing_detection_boundary','trail_segment_endpoint_reversal','rigid_translation','rigid_rotation','centered_parallel_trail_symmetry']) assert(identityCases.has(required),required);

assert.strictEqual(m.implementation_gate.src_p4_exists_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.p4_model_exists_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.new_P4_simulation_executed_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.implementation_authorized_by_this_record,false);
for(const [k,v] of Object.entries(m.estimation_firewall)) if(k!=='rule') assert.strictEqual(v,false,k);
for(const v of Object.values(m.global_firewall)) assert.strictEqual(v,false);

for(const forbidden of ['src/p4.js','models/lasius_niger_painted_trail_p4_v1.json','hypotheses/p4_response_estimation_v1.json','tools/run-p4-reachability.js','tools/run-p4-estimation.js']) assert.ok(!fs.existsSync(path.join(root,forbidden)),forbidden+' must not exist at mechanism freeze');

const forbiddenText=m.invariances_and_forbidden_inputs.join(' ');
assert.match(forbiddenText,/No stochastic detection or response RNG/);
assert.match(forbiddenText,/No sigmoid slope, Hill exponent, epsilon/);
assert.match(forbiddenText,/No painted-trail-driven speed modulation/);
assert.match(forbiddenText,/No reserved Y-maze/);

console.log('p4-mechanism-selection.test.js PASS '+JSON.stringify({mechanism_blob:blob(mechPath),subclass:m.selection_rule.selected_subclass,theta_engineering:eng.theta_detect,implementation_authorized:false,response_target_access:false}));
