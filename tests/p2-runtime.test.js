'use strict';
const assert=require('assert');
const p2=require('../src/p2.js'),p1=require('../src/p1.js'),integrity=require('../src/integrity.js');
const {loadBundle}=require('../tools/load-bundle.js');
const MODEL='lasius_niger_painted_trail_p2_v1',P1='lasius_niger_painted_trail_p1_v1',BASE='lasius_niger_locomotion_v1';
const ZERO='open_arena_p2_zero_dose_reachability.json',NOM='open_arena_p2_nominal_dose_reachability.json';
const same=(a,b)=>Object.is(a,b);
function run(sim,seconds=2,dt=.02){for(let i=0;i<Math.round(seconds/dt)&&!sim.allFinished();i++)sim.step(dt);return sim;}
function exact(a,b,label){
  for(const k of ['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'])
    assert(same(a[k],b[k]),label+' '+k);
  assert.strictEqual(a.rng.state,b.rng.state,label+' rng');
  assert.strictEqual(a.state,b.state,label+' state');
  assert.strictEqual(a.finished,b.finished,label+' finished');
  assert.strictEqual(a.outcome,b.outcome,label+' outcome');
}
const model=loadBundle(NOM,{modelId:MODEL}).model,cfg=p2.paintedTrailResponseConfig(model);
assert.strictEqual(cfg.sigma,8);assert.strictEqual(cfg.kappa,4);assert.strictEqual(cfg.pLapse,.2);assert.strictEqual(cfg.forward,2);assert.strictEqual(cfg.half,1.5);
assert.throws(()=>{const b=loadBundle(NOM,{modelId:MODEL});b.model.painted_trail_response.engagement.p_lapse=-.01;p2.paintedTrailResponseConfig(b.model);},/p_lapse must be in \[0,1\]/);
assert.throws(()=>p2.assertNoP2Overrides({protocol:{p_lapse:.2}}),/P2 biology\/navigation override forbidden/);

assert.strictEqual(p2.responseSeed(12345,0),841765599);
assert.strictEqual(p2.responseSeed(12345,1),230844401);
const mid=p2.engagementState(12345,0,cfg,1);
assert.strictEqual(mid.responseSeed,841765599);assert.strictEqual(mid.draws,1);assert(mid.u>=0&&mid.u<1);
assert.strictEqual(p2.engagementState(1,0,Object.assign({},cfg,{pLapse:0}),1).draws,0);
assert.strictEqual(p2.engagementState(1,0,Object.assign({},cfg,{pLapse:0}),1).engaged,true);
assert.strictEqual(p2.engagementState(1,0,Object.assign({},cfg,{pLapse:1}),1).draws,0);
assert.strictEqual(p2.engagementState(1,0,Object.assign({},cfg,{pLapse:1}),1).engaged,false);
assert.strictEqual(p2.engagementState(1,0,cfg,0).draws,0);
assert.strictEqual(p2.engagementState(1,0,Object.assign({},cfg,{kappa:0}),1).draws,0);

for(const seed of [812301,812302]){
  const bz=loadBundle(ZERO,{modelId:BASE}),pz=loadBundle(ZERO,{modelId:MODEL});
  const a=run(new integrity.Simulation(bz,seed)),b=run(new p2.Simulation(pz,seed));
  exact(a.ants[0],b.ants[0],'zero dose '+seed);assert.strictEqual(b.ants[0].p2ResponseDraws,0);assert.strictEqual(b.ants[0].p2SteeringSamples,0);

  const bk=loadBundle(NOM,{modelId:BASE}),pk=loadBundle(NOM,{modelId:MODEL});pk.model.painted_trail_response.steering.kappa_trail_per_s=0;
  const c=run(new integrity.Simulation(bk,seed)),d=run(new p2.Simulation(pk,seed));
  exact(c.ants[0],d.ants[0],'kappa zero '+seed);assert.strictEqual(d.ants[0].p2ResponseDraws,0);assert.strictEqual(d.ants[0].p2SteeringSamples,0);

  const ba=loadBundle(NOM,{modelId:BASE}),pa=loadBundle(NOM,{modelId:MODEL});pa.model.painted_trail_response.engagement.p_lapse=1;
  const e=run(new integrity.Simulation(ba,seed)),f=run(new p2.Simulation(pa,seed));
  exact(e.ants[0],f.ants[0],'all lapse '+seed);assert.strictEqual(f.ants[0].p2Engaged,false);assert.strictEqual(f.ants[0].p2ResponseDraws,0);

  const p1b=loadBundle(NOM,{modelId:P1}),p0=loadBundle(NOM,{modelId:MODEL});p0.model.painted_trail_response.engagement.p_lapse=0;
  const g=run(new p1.Simulation(p1b,seed)),h=run(new p2.Simulation(p0,seed));
  exact(g.ants[0],h.ants[0],'always engaged '+seed);
  assert.strictEqual(h.ants[0].p2Engaged,true);assert.strictEqual(h.ants[0].p2ResponseDraws,0);
  assert.strictEqual(h.ants[0].p2SteeringSamples,g.ants[0].p1SteeringSamples);assert(same(h.ants[0].p2LastOmega,g.ants[0].p1LastOmega));
}

{
  const pb=loadBundle(NOM,{modelId:MODEL}),base=loadBundle(NOM,{modelId:BASE}),seed=731000;
  const s2=new p2.Simulation(pb,seed),s0=new integrity.Simulation(base,seed);
  assert.strictEqual(s2.ants[0].rng.state,s0.ants[0].rng.state,'response draw must not perturb biology RNG at construction');
  assert.strictEqual(s2.ants[0].p2ResponseDraws,1);
  const before=s2.ants[0].p2Engaged;run(s2,.5);assert.strictEqual(s2.ants[0].p2Engaged,before,'engagement state must remain fixed within trial');
}

console.log('p2-runtime.test.js PASS '+JSON.stringify({
  runtime:'P2_trial_level_transient_trail_engagement_v1',
  sample_response_seed:p2.responseSeed(12345,0),
  endpoint_identities:true,
  p1_nested_identity:true,
  biology_rng_isolated:true
}));
