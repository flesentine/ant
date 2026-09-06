'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const m=read('hypotheses/p1_painted_trail_mechanism_v1.json');
assert.strictEqual(blob('hypotheses/p1_painted_trail_mechanism_v1.json'),'90e86bce29bf45c6e390f7046a6c25a74f409c78','P1 mechanism freeze blob drifted');
assert.strictEqual(m.id,'P1_egocentric_painted_trail_gradient_steering_v1');
assert.strictEqual(m.status,'mechanism_frozen_before_implementation_or_parameter_search');
assert.strictEqual(m.frozen_inputs.evidence_freeze.git_blob_sha,'db89c879906aa1f35dc1d395cc3ebbb661b218b6');
assert.strictEqual(m.frozen_inputs.response_calibration_policy.git_blob_sha,'ec282928a095467c1082a25e0396c390c17cbdb8');
assert.strictEqual(m.frozen_inputs.response_target.git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(m.frozen_inputs.canonical_locomotion_model.git_blob_sha,'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');
assert.strictEqual(m.frozen_inputs.canonical_runtime.sim_core_git_blob_sha,'24777aac3577d442893e4779d70aee4e27761fe8');
assert.strictEqual(m.frozen_inputs.canonical_runtime.integrity_git_blob_sha,'f23c68a6955832b70eeb3bd3e6893d71a3759018');

assert.strictEqual(m.egocentric_sensors.forward_offset_mm,2);
assert.strictEqual(m.egocentric_sensors.lateral_half_separation_mm,1.5);
assert.deepStrictEqual(m.future_response_parameters.names,['sigma_field_mm','kappa_trail_per_s']);
assert.strictEqual(m.future_response_parameters.treatment_specific_values_forbidden,true);
assert.strictEqual(m.future_response_parameters.path_specific_values_forbidden,true);
assert.strictEqual(m.future_response_parameters.colony_specific_values_forbidden,true);
assert.strictEqual(m.steering.speed_effect,'none');
assert.strictEqual(m.steering.pause_effect,'none');
assert.strictEqual(m.steering.angular_noise_amplitude_effect,'none');
assert.strictEqual(m.steering.internal_memory_or_history_state,'none');
assert.strictEqual(m.steering.new_rng_streams,'none');
assert.strictEqual(m.reference_free_reachability_requirements.target_or_reference_outcomes_may_be_loaded,false);
assert.strictEqual(m.reference_free_reachability_requirements.ymaze_may_be_loaded,false);
assert.match(m.exact_nulls.computational_bypass.rule,/if applied dose A is exactly 0 OR kappa_trail_per_s is exactly 0/);
assert.strictEqual(m.exact_nulls.computational_bypass.returned_trail_drift,'positive numeric zero (+0) exactly');
assert.strictEqual(m.implementation_gate.chemical_sensor_implementation_authorized_when_this_freeze_is_merged_to_main,true);
assert.strictEqual(m.implementation_gate.implementation_before_merge_authorized,false);
assert.strictEqual(m.implementation_gate.response_parameter_search_authorized,false);
assert.strictEqual(m.implementation_gate.canonical_promotion_authorized,false);
assert.strictEqual(m.implementation_gate.ymaze_unlock_authorized,false);
assert.strictEqual(m.engineering_reachability_values.sigma_field_mm,8);
assert.strictEqual(m.engineering_reachability_values.kappa_trail_per_s,4);
assert.strictEqual(m.engineering_reachability_values.physics_dt_s,0.02);
for(const forbidden of ['Pheromone or DCM treatment label','Path_length or recent constrained travel','Y-maze outcomes or geometry','distance/bearing-to-line supplied directly to steering']){
  assert(m.forbidden_inputs_and_shortcuts.includes(forbidden),forbidden+' must remain forbidden');
}

const norm2=(x,y)=>Math.hypot(x,y);
function distanceToSegment(p,a,b){
  const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y;
  const vv=vx*vx+vy*vy;
  const t=vv===0?0:Math.max(0,Math.min(1,(wx*vx+wy*vy)/vv));
  return norm2(p.x-(a.x+t*vx),p.y-(a.y+t*vy));
}
function field(p,a,b,sigma,A){
  const d=distanceToSegment(p,a,b);
  return A*Math.exp(-(d*d)/(2*sigma*sigma));
}
const T=c=>c/(1+c);
function sensors(p,theta){
  const u={x:Math.cos(theta),y:Math.sin(theta)};
  const r={x:-Math.sin(theta),y:Math.cos(theta)};
  const l={x:Math.sin(theta),y:-Math.cos(theta)};
  return {
    L:{x:p.x+2*u.x+1.5*l.x,y:p.y+2*u.y+1.5*l.y},
    R:{x:p.x+2*u.x+1.5*r.x,y:p.y+2*u.y+1.5*r.y}
  };
}
function omega(p,theta,a,b,sigma,kappa,A){
  if(A===0||kappa===0)return {omega:0,left:null,right:null,bypass:true};
  const s=sensors(p,theta),l=T(field(s.L,a,b,sigma,A)),r=T(field(s.R,a,b,sigma,A));
  return {omega:kappa*(r-l),left:l,right:r,bypass:false};
}
const near=(a,b,t=1e-12)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`);

const A={x:0,y:105},B={x:297,y:105};
for(const p of [{x:100,y:95},{x:100,y:105},{x:100,y:115}]){
  const d0=omega(p,0,A,B,8,4,0),k0=omega(p,0,A,B,8,0,1);
  assert.strictEqual(d0.omega,0,'zero dose must be exact +0');
  assert.strictEqual(k0.omega,0,'zero gain must be exact +0');
  assert.strictEqual(Object.is(d0.omega,-0),false,'zero dose bypass must not return -0');
  assert.strictEqual(Object.is(k0.omega,-0),false,'zero gain bypass must not return -0');
  assert.strictEqual(d0.bypass,true);assert.strictEqual(k0.bypass,true);
}
const above=omega({x:100,y:95},0,A,B,8,4,1);
const below=omega({x:100,y:115},0,A,B,8,4,1);
assert(above.omega>0,'above-trail eastbound ant must turn clockwise/down toward trail');
assert(below.omega<0,'below-trail eastbound ant must turn counterclockwise/up toward trail');
near(above.omega,-below.omega);
near(above.left,below.right);
near(above.right,below.left);
assert.strictEqual(omega({x:100,y:105},0,A,B,8,4,1).omega,0,'on-trail parallel heading must have zero trail drift');

for(const p of [{x:100,y:95},{x:130,y:112},{x:15,y:101}]){
  for(const theta of [0,0.4,-1.2]){
    const q1=omega(p,theta,A,B,8,4,1);
    const q2=omega(p,theta,B,A,8,4,1);
    near(q1.left,q2.left);near(q1.right,q2.right);near(q1.omega,q2.omega);
  }
}

const shift={x:31.25,y:-17.5};
const add=(p,s)=>({x:p.x+s.x,y:p.y+s.y});
const base=omega({x:117,y:96},0.37,A,B,8,4,1);
const translated=omega(add({x:117,y:96},shift),0.37,add(A,shift),add(B,shift),8,4,1);
near(base.left,translated.left);near(base.right,translated.right);near(base.omega,translated.omega);

function rot(p,phi){const c=Math.cos(phi),s=Math.sin(phi);return{x:c*p.x-s*p.y,y:s*p.x+c*p.y};}
const phi=0.71;
const rotated=omega(rot({x:117,y:96},phi),0.37+phi,rot(A,phi),rot(B,phi),8,4,1);
near(base.left,rotated.left);near(base.right,rotated.right);near(base.omega,rotated.omega,2e-12);

const reflected=omega({x:117,y:114},-0.37,A,B,8,4,1);
near(base.left,reflected.right);
near(base.right,reflected.left);
near(base.omega,-reflected.omega);

assert(T(0)===0);
assert(T(0.1)<T(1)&&T(1)<T(10));
assert(T(10)<1);

assert.ok(!fs.existsSync(path.join(root,'src','p1.js')),'P1 runtime must not exist at mechanism-freeze checkpoint');
assert.ok(!fs.existsSync(path.join(root,'models','lasius_niger_painted_trail_p1_v1.json')),'P1 model must not exist at mechanism-freeze checkpoint');

console.log('p1-painted-trail-mechanism-policy.test.js PASS '+JSON.stringify({mechanism_blob:blob('hypotheses/p1_painted_trail_mechanism_v1.json'),above_omega:above.omega,below_omega:below.omega}));
