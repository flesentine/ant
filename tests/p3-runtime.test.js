'use strict';
const assert=require('assert');
const p3=require('../src/p3.js'),integrity=require('../src/integrity.js'),p1=require('../src/p1.js');
const {loadBundle}=require('../tools/load-bundle.js');
const MODEL='lasius_niger_painted_trail_p3_v1',BASE='lasius_niger_locomotion_v1';
const ZERO='open_arena_p3_zero_dose_reachability.json',NOM='open_arena_p3_nominal_dose_reachability.json';
const same=(a,b)=>Object.is(a,b);
function run(sim,seconds=2,dt=.02){for(let i=0;i<Math.round(seconds/dt)&&!sim.allFinished();i++)sim.step(dt);return sim;}
function exact(a,b,label){
  for(const k of ['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'])assert(same(a[k],b[k]),label+' '+k);
  assert.strictEqual(a.rng.state,b.rng.state,label+' rng');
  assert.strictEqual(a.state,b.state,label+' state');
  assert.strictEqual(a.finished,b.finished,label+' finished');
  assert.strictEqual(a.outcome,b.outcome,label+' outcome');
}
const model=loadBundle(NOM,{modelId:MODEL}).model,cfg=p3.paintedTrailResponseConfig(model);
assert.strictEqual(cfg.sigma,8);assert.strictEqual(cfg.kappa,4);assert.strictEqual(cfg.radius,10);assert.strictEqual(cfg.radialBins,4);assert.strictEqual(cfg.angularBins,8);assert.strictEqual(cfg.samplesPerSector,32);
assert.throws(()=>{const b=loadBundle(NOM,{modelId:MODEL});b.model.painted_trail_response.transduction.epsilon_or_regularization=.01;p3.paintedTrailResponseConfig(b.model);},/must be exactly 0/);
assert.throws(()=>p3.assertNoP3Overrides({protocol:{p_lapse:.2}}),/P3 biology\/navigation override forbidden/);

const pts=p3.sectorSamplePoints(0,0,0,cfg);
assert.strictEqual(pts.left.length,32);assert.strictEqual(pts.right.length,32);
for(let i=0;i<32;i++){
  assert(Math.abs(pts.left[i].x-pts.right[i].x)<1e-15);
  assert(Math.abs(pts.left[i].y+pts.right[i].y)<1e-15);
  assert(pts.left[i].x>0&&pts.right[i].x>0);
  assert(pts.left[i].y<0&&pts.right[i].y>0);
}
assert.strictEqual(p3.relativeSignal(0,0),0);
assert.strictEqual(p3.relativeSignal(2,2),0);
assert.strictEqual(p3.relativeSignal(0,3),1);
assert.strictEqual(p3.relativeSignal(3,0),-1);
assert(Math.abs(p3.relativeSignal(2,6)-.5)<1e-15);
assert(Math.abs(p3.relativeSignal(20,60)-.5)<1e-15);
assert(Math.abs(p3.relativeSignal(2,6)+p3.relativeSignal(6,2))<1e-15);

for(const seed of [813301,813302]){
  const bz=loadBundle(ZERO,{modelId:BASE}),pz=loadBundle(ZERO,{modelId:MODEL});
  const a=run(new integrity.Simulation(bz,seed)),b=run(new p3.Simulation(pz,seed));
  exact(a.ants[0],b.ants[0],'zero dose '+seed);assert.strictEqual(b.ants[0].p3SteeringSamples,0);

  const bk=loadBundle(NOM,{modelId:BASE}),pk=loadBundle(NOM,{modelId:MODEL});pk.model.painted_trail_response.steering.kappa_trail_per_s=0;
  const c=run(new integrity.Simulation(bk,seed)),d=run(new p3.Simulation(pk,seed));
  exact(c.ants[0],d.ants[0],'kappa zero '+seed);assert.strictEqual(d.ants[0].p3SteeringSamples,0);
}

{
  const b=loadBundle(NOM,{modelId:MODEL}),sim=new p3.Simulation(b,741000);
  const base=loadBundle(NOM,{modelId:BASE}),s0=new integrity.Simulation(base,741000);
  assert.strictEqual(sim.ants[0].rng.state,s0.ants[0].rng.state,'P3 construction must not perturb biology RNG');
  run(sim,.5);
  assert(sim.ants[0].p3SteeringSamples>0,'P3 should reach steering on nominal trial');
  assert(Number.isFinite(sim.ants[0].p3LastOmega));
  assert(Number.isFinite(sim.ants[0].p3LastRelativeSignal));
}

{
  const b=loadBundle(NOM,{modelId:MODEL}),sim=new p3.Simulation(b,1),field=sim.p3Field;
  const on=p3.trailSteeringRate(100,105,0,sim.p3Config,field,1);
  assert(Math.abs(on.left-on.right)<1e-12);assert(Math.abs(on.omega)<1e-12);
  const above=p3.trailSteeringRate(100,95,0,sim.p3Config,field,1);
  const below=p3.trailSteeringRate(100,115,0,sim.p3Config,field,1);
  assert(above.omega>0&&below.omega<0);
  assert(Math.abs(above.omega+below.omega)<1e-10);
  const q1=p3.trailSteeringRate(117,96,.37,sim.p3Config,field,.25);
  const q2=p3.trailSteeringRate(117,96,.37,sim.p3Config,field,1);
  const q3=p3.trailSteeringRate(117,96,.37,sim.p3Config,field,4);
  assert(Math.abs(q1.signal-q2.signal)<1e-12);assert(Math.abs(q2.signal-q3.signal)<1e-12);
}

console.log('p3-runtime.test.js PASS '+JSON.stringify({mechanism:'P3_local_sector_weber_steering_v1',samples_per_sector:32,zero_and_kappa_identities:true,biology_rng_isolated:true,weber_scale_invariant:true}));
