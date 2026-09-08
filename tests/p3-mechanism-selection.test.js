'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const rel='hypotheses/p3_painted_trail_mechanism_v1.json';
const m=read(rel);

assert.strictEqual(blob(rel),'5d00ce0058ff388c9f57d7dce56ce465d82c5765');
assert.strictEqual(blob('hypotheses/p3_painted_trail_candidate_class_decision_v1.json'),'e8da07f6f73934e0120fd41d4668ae4039108336');
assert.strictEqual(blob('hypotheses/p2_response_estimation_result_freeze_v1.json'),'088316e1746594f9b3f700cb277a83eb53fdd9f6');

assert.strictEqual(m.id,'P3_painted_trail_mechanism_v1');
assert.strictEqual(m.status,'prospective_relative_bilateral_mechanism_frozen_before_implementation_or_new_simulation');
assert.strictEqual(m.species,'Lasius niger');
assert.strictEqual(m.candidate_class_input.selected_class_id,'P3_candidate_relative_bilateral_transduction');
assert.strictEqual(m.candidate_class_input.decision_git_blob_sha,'e8da07f6f73934e0120fd41d4668ae4039108336');
assert.strictEqual(m.candidate_class_input.evidence_strength,'cross_species_mechanistic_support_only');

assert.strictEqual(m.independent_evidence_basis.perna_et_al_2012.species,'Linepithema humile');
assert.strictEqual(m.independent_evidence_basis.perna_et_al_2012.doi,'10.1371/journal.pcbi.1002592');
assert.strictEqual(m.independent_evidence_basis.perna_et_al_2012.pubmed_id,'22829756');
assert(m.independent_evidence_basis.perna_et_al_2012.frozen_relevant_facts.some(x=>/difference divided by their sum/i.test(x)));
assert(m.independent_evidence_basis.perna_et_al_2012.frozen_relevant_facts.some(x=>/speed was largely unaffected/i.test(x)));
assert.strictEqual(m.independent_evidence_basis.poissonnier_et_al_2026.species,'Lasius niger');

assert.strictEqual(m.p2_closure_boundary.p2_result_freeze_git_blob_sha,'088316e1746594f9b3f700cb277a83eb53fdd9f6');
assert.strictEqual(m.p2_closure_boundary.p2_official_report_git_blob_sha,'cb3060cdbec1ab0832b1e2799c9e37e6ae8e5a72');
assert.strictEqual(m.p2_closure_boundary.p2_v1_closed,true);
assert.strictEqual(m.p2_closure_boundary.p2_rerun_or_rescue_authorized,false);
assert.strictEqual(m.p2_closure_boundary.p2_fold_outcomes_used_to_choose_P3_mechanism_details,false);

const mech=m.mechanism;
assert.strictEqual(mech.mechanism_id,'P3_local_sector_weber_steering_v1');
assert.strictEqual(mech.field.type,'gaussian_distance_to_segment');
assert.strictEqual(mech.field.equation,'C(p) = dose_ratio * exp(-d(p, segment)^2 / (2*sigma_field_mm^2))');
assert.strictEqual(mech.sector_sensors.type,'deterministic_equal_area_front_quadrant_sector_means');
assert.strictEqual(mech.sector_sensors.radius_mm,10);
assert.strictEqual(mech.sector_sensors.digital_operator.radial_bins,4);
assert.strictEqual(mech.sector_sensors.digital_operator.angular_bins_per_sector,8);
assert.strictEqual(mech.sector_sensors.digital_operator.samples_per_sector,32);
assert.strictEqual(mech.relative_transduction.type,'piecewise_weber_michelson_right_minus_left');
assert.strictEqual(mech.relative_transduction.equation,'W(L,R) = 0 if L+R <= 0; otherwise (R-L)/(R+L)');
assert.strictEqual(mech.relative_transduction.epsilon_or_regularization,0);
assert.strictEqual(mech.relative_transduction.threshold_parameter,null);
assert.deepStrictEqual(mech.relative_transduction.range,[-1,1]);
assert.strictEqual(mech.steering.type,'relative_right_minus_left_heading_drift');
assert.strictEqual(mech.steering.equation,'omega_trail = kappa_trail_per_s * W(L,R)');
assert.strictEqual(mech.stochastic_structure.P2_transient_lapse_state_present,false);
assert.strictEqual(mech.stochastic_structure.response_rng_present,false);
assert.strictEqual(mech.stochastic_structure.biology_rng_draws_added,0);
assert.strictEqual(mech.speed_pause_noise_effects.base_speed_changed,false);
assert.strictEqual(mech.speed_pause_noise_effects.pause_process_changed,false);
assert.strictEqual(mech.speed_pause_noise_effects.angular_noise_amplitude_changed,false);

function W(L,R){
  L=Math.max(0,Number(L)||0);R=Math.max(0,Number(R)||0);
  const s=L+R;return s<=0?0:(R-L)/s;
}
assert.strictEqual(W(0,0),0);
assert.strictEqual(W(2,2),0);
assert.strictEqual(W(0,3),1);
assert.strictEqual(W(3,0),-1);
assert(Math.abs(W(2,6)-0.5)<1e-15);
assert(Math.abs(W(20,60)-W(2,6))<1e-15);
assert(Math.abs(W(2,6)+W(6,2))<1e-15);

function samples(heading=0,radius=10,nr=4,na=8){
  const ch=Math.cos(heading),sh=Math.sin(heading);
  const u={x:ch,y:sh},r={x:-sh,y:ch},l={x:sh,y:-ch};
  const left=[],right=[];
  for(let i=0;i<nr;i++)for(let j=0;j<na;j++){
    const rho=radius*Math.sqrt((i+.5)/nr),alpha=(j+.5)*(Math.PI/2)/na;
    const ca=Math.cos(alpha),sa=Math.sin(alpha);
    right.push({x:rho*(ca*u.x+sa*r.x),y:rho*(ca*u.y+sa*r.y)});
    left.push({x:rho*(ca*u.x+sa*l.x),y:rho*(ca*u.y+sa*l.y)});
  }
  return{left,right};
}
const s=samples();
assert.strictEqual(s.left.length,32);
assert.strictEqual(s.right.length,32);
for(let i=0;i<32;i++){
  assert(Math.abs(s.left[i].x-s.right[i].x)<1e-15);
  assert(Math.abs(s.left[i].y+s.right[i].y)<1e-15);
  assert(s.left[i].x>0&&s.right[i].x>0);
  assert(s.left[i].y<0&&s.right[i].y>0);
}

const cases=new Map(m.exact_and_structural_identities.map(x=>[x.case,x]));
for(const name of [
  'DCM_or_zero_dose',
  'zero_steering_gain',
  'zero_or_equal_sector_signal',
  'positive_global_dose_scale',
  'trail_segment_endpoint_reversal',
  'rigid_translation',
  'rigid_rotation',
  'left_right_reflection',
  'centered_parallel_trail_symmetry'
]) assert(cases.has(name),name+' identity missing');

assert.strictEqual(m.structural_parameters.fixed_sensor_structure.radius_mm,10);
assert.strictEqual(m.structural_parameters.fixed_sensor_structure.sector_angle_deg_each,90);
assert.strictEqual(m.structural_parameters.fixed_sensor_structure.radial_bins,4);
assert.strictEqual(m.structural_parameters.fixed_sensor_structure.angular_bins_per_sector,8);
assert.strictEqual(m.structural_parameters.fixed_sensor_structure.estimated_in_P3_v1,false);

assert.strictEqual(m.engineering_only_reachability_values.sigma_field_mm,8);
assert.strictEqual(m.engineering_only_reachability_values.kappa_trail_per_s,4);
assert.strictEqual(m.engineering_only_reachability_values.sector_radius_mm,10);
assert.strictEqual(m.engineering_only_reachability_values.retuning_from_reachability_forbidden,true);
assert(m.engineering_only_reachability_values.planned_reference_free_panel.some(x=>x.name==='positive_dose_scale_invariance'));
assert(m.engineering_only_reachability_values.planned_reference_free_panel.some(x=>x.name==='nominal_reference_free_open_arena_reachability'&&x.trial_count===400));

assert.strictEqual(m.implementation_gate.src_p3_exists_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.p3_model_exists_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.new_simulation_executed_at_this_freeze,false);
assert.strictEqual(m.implementation_gate.implementation_authorized_by_this_record,false);
assert.strictEqual(m.estimation_firewall.p3_response_estimation_policy_exists,false);
assert.strictEqual(m.estimation_firewall.p3_parameter_search_authorized,false);
assert.strictEqual(m.estimation_firewall.response_target_semantic_access_authorized,false);
assert.strictEqual(m.estimation_firewall.P1_result_semantic_access_authorized,false);
assert.strictEqual(m.estimation_firewall.P2_result_semantic_access_authorized,false);
assert.strictEqual(m.global_firewall.canonical_locomotion_change,false);
assert.strictEqual(m.global_firewall.P1_rerun_or_rescue,false);
assert.strictEqual(m.global_firewall.P2_rerun_or_rescue,false);
assert.strictEqual(m.global_firewall.response_target_access,false);
assert.strictEqual(m.global_firewall.Y_maze_access,false);

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

console.log('p3-mechanism-selection.test.js PASS '+JSON.stringify({
  mechanism_blob:blob(rel),
  mechanism_id:mech.mechanism_id,
  sector_radius_mm:mech.sector_sensors.radius_mm,
  samples_per_sector:mech.sector_sensors.digital_operator.samples_per_sector,
  epsilon:mech.relative_transduction.epsilon_or_regularization,
  lapse_state:false,
  response_rng:false,
  later_runtime_present:laterRuntime,
  later_policy_present:laterPolicyPresent,
  p3_runtime_at_mechanism_freeze:false,
  response_target_access:false,
  ymaze:false
}));
