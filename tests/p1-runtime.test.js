'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const core=require('../src/sim-core.js');
const integrity=require('../src/integrity.js');
const p1=require('../src/p1.js');
const{loadBundle,readJson}=require('../tools/load-bundle.js');
const reach=require('../tools/run-p1-reachability.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const clone=v=>JSON.parse(JSON.stringify(v));
const exact=(a,b,msg)=>assert(Object.is(a,b),msg||`${a} !== ${b}`);
const angleExact=(a,b,msg)=>assert(Object.is(a,b),msg||`angle ${a} !== ${b}`);

assert.strictEqual(blob('src/p1.js'),'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p1_v1.json'),'73873fd6763838423ca27648136bb0b9ff062817');
assert.strictEqual(blob('apparatus/poissonnier2026_open_arena_p1_v1.json'),'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4');
assert.strictEqual(blob('experiments/open_arena_p1_zero_dose_reachability.json'),'6e47fa91143ed5d4d2b52bf2c555246b7d216297');
assert.strictEqual(blob('experiments/open_arena_p1_nominal_dose_reachability.json'),'8232d378195304f2a15aa76da8abf108d94f2c58');
assert.strictEqual(blob('tools/run-p1-reachability.js'),'4341bcd34405022551b3b7bb28ee67a76812024e');
assert.strictEqual(blob('hypotheses/p1_reachability_execution_v1.json'),'282a95ec6761acd8d94163b25f712f191181f2ff');

const model=readJson(path.join(root,'models','lasius_niger_painted_trail_p1_v1.json'));
const base=readJson(path.join(root,'models','lasius_niger_locomotion_v1.json'));
const apparatus=readJson(path.join(root,'apparatus','poissonnier2026_open_arena_p1_v1.json'));
assert.deepStrictEqual(model.movement,base.movement,'P1 must preserve canonical movement block exactly');
const cfg=p1.paintedTrailResponseConfig(model),field=p1.paintedTrailApparatusConfig(apparatus);
assert.deepStrictEqual({sigma:cfg.sigma,kappa:cfg.kappa,forward:cfg.forward,half:cfg.half},{sigma:8,kappa:4,forward:2,half:1.5});
assert.deepStrictEqual(field.a,{x:0,y:105});assert.deepStrictEqual(field.b,{x:297,y:105});exact(field.nominalDose,0.0048);

const zeroBundle=loadBundle('open_arena_p1_zero_dose_reachability.json',{modelId:'lasius_niger_painted_trail_p1_v1'});
const nominalBundle=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:'lasius_niger_painted_trail_p1_v1'});
exact(p1.appliedDoseRatio(zeroBundle.experiment,p1.paintedTrailApparatusConfig(zeroBundle.apparatus)),0);
exact(p1.appliedDoseRatio(nominalBundle.experiment,p1.paintedTrailApparatusConfig(nominalBundle.apparatus)),1);

{
  const d0=p1.trailSteeringRate(100,95,0,cfg,field,0),k0=p1.trailSteeringRate(100,95,0,Object.assign({},cfg,{kappa:0}),field,1);
  exact(d0.omega,0);exact(k0.omega,0);
  assert.strictEqual(Object.is(d0.omega,-0),false);assert.strictEqual(Object.is(k0.omega,-0),false);
  assert.strictEqual(d0.bypass,true);assert.strictEqual(k0.bypass,true);
  assert.strictEqual(d0.left,null);assert.strictEqual(k0.left,null);
}
{
  const above=p1.trailSteeringRate(100,95,0,cfg,field,1),below=p1.trailSteeringRate(100,115,0,cfg,field,1),on=p1.trailSteeringRate(100,105,0,cfg,field,1);
  assert(above.omega>0);assert(below.omega<0);
  assert(Math.abs(above.omega+below.omega)<1e-12);
  assert(Math.abs(on.omega)<1e-15);
}
{
  const rev={a:field.b,b:field.a,nominalDose:field.nominalDose};
  const a=p1.trailSteeringRate(117,96,.37,cfg,field,1),b=p1.trailSteeringRate(117,96,.37,cfg,rev,1);
  assert(Math.abs(a.omega-b.omega)<1e-14);assert(Math.abs(a.left-b.left)<1e-14);assert(Math.abs(a.right-b.right)<1e-14);
}
{
  for(const seed of [1333001,1333007,1333019,1333032]){
    const cb=loadBundle('open_arena_p1_zero_dose_reachability.json',{modelId:'lasius_niger_locomotion_v1'});
    const pb=loadBundle('open_arena_p1_zero_dose_reachability.json',{modelId:'lasius_niger_painted_trail_p1_v1'});
    const c=new integrity.Simulation(cb,seed),p=new p1.Simulation(pb,seed);
    for(let i=0;i<100;i++){c.step(.02);p.step(.02);}
    for(const k of ['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'])exact(c.ants[0][k],p.ants[0][k],`zero-dose ${seed} ${k}`);
    assert.strictEqual(c.ants[0].rng.state,p.ants[0].rng.state);assert.strictEqual(c.ants[0].state,p.ants[0].state);assert.strictEqual(p.ants[0].p1SteeringSamples,0);
  }
}
{
  for(const seed of [1333001,1333007,1333019,1333032]){
    const cb=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:'lasius_niger_locomotion_v1'});
    const pb=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:'lasius_niger_painted_trail_p1_v1'});
    pb.model.painted_trail_response.steering.kappa_trail_per_s=0;
    const c=new integrity.Simulation(cb,seed),p=new p1.Simulation(pb,seed);
    for(let i=0;i<100;i++){c.step(.02);p.step(.02);}
    for(const k of ['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'])exact(c.ants[0][k],p.ants[0][k],`kappa0 ${seed} ${k}`);
    assert.strictEqual(c.ants[0].rng.state,p.ants[0].rng.state);assert.strictEqual(p.ants[0].p1SteeringSamples,0);
  }
}
{
  const bad=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:'lasius_niger_painted_trail_p1_v1'});
  bad.experiment.protocol.sigma_field_mm=12;
  assert.throws(()=>new p1.Simulation(bad,1),/P1 biology\/navigation override forbidden/);
}
{
  const bad=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:'lasius_niger_painted_trail_p1_v1'});
  bad.experiment.protocol.trail_bearing=0;
  assert.throws(()=>new p1.Simulation(bad,1),/P1 biology\/navigation override forbidden/);
}
{
  const mixed=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:'lasius_niger_painted_trail_p1_v1'});
  mixed.model.heading_restoration={enabled:true,initialization:{type:'saturating_distance',lambda_commitment_mm:500},decay:{type:'exponential',tau_commitment_s:5},effect:{type:'circular_entry_heading_restoration',kappa_restore_per_s:.5},input_fact:'recent_constrained_travel_mm'};
  assert.throws(()=>new p1.Simulation(mixed,1),/cannot be combined/);
}
{
  const policy=readJson(path.join(root,'hypotheses','p1_reachability_execution_v1.json'));
  const rows=reach.exactIdentityPanel(Object.assign({},policy,{frozen_execution:Object.assign({},policy.frozen_execution,{exact_identity_panel:{seeds:[1333001,1333002],fixed_time_s:.2}})}));
  assert.strictEqual(rows.length,2);assert(rows.every(x=>x.zero_dose_identity&&x.kappa_zero_identity&&x.nonzero_dose_speed_biology_identity));
}
console.log('p1-runtime.test.js PASS');
