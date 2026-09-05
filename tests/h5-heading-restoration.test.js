'use strict';
const assert=require('assert');
const core=require('../src/sim-core.js');
const{Simulation,headingRestorationConfig,exactHeadingRestorationAngle,captureHeadingReferences}=require('../src/h5.js');
const{Simulation:IntegritySimulation}=require('../src/integrity.js');
const{loadBundle}=require('../tools/load-bundle.js');
const{runH5Mechanism}=require('../tools/run-h5-mechanism.js');
function clone(v){return JSON.parse(JSON.stringify(v));}
function near(a,b,tol=1e-10){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b} within ${tol}`);}
function angleNear(a,b,tol=1e-10){near(core.normalizeAngle(a-b),0,tol);}
function h5Bundle(experiment='open_arena_short_control.json'){return loadBundle(experiment,{modelId:'lasius_niger_locomotion_h5_v1'});}

const base=h5Bundle(),cfg=headingRestorationConfig(base.model);
assert.ok(cfg,'H5 config should be enabled');
assert.strictEqual(cfg.mechanismId,'H5_transient_entry_heading_restoration_v1');
assert.strictEqual(cfg.inputFact,'recent_constrained_travel_mm');
assert.strictEqual(cfg.lambda,500);
assert.strictEqual(cfg.tau,5);
assert.strictEqual(cfg.kappa,0.5);

// Exact C decay.
{
  const sim=new Simulation(h5Bundle(),77123),c0=sim.ants[0].headingCommitmentInitial;
  for(let i=0;i<50;i++)sim.step(0.02);
  near(sim.ants[0].headingCommitment,c0*Math.exp(-1/5),2e-12);
}

// theta_ref is captured lazily after construction, so a shared post-construction entry transition is remembered.
{
  const sim=new Simulation(h5Bundle(),77231),ant=sim.ants[0];
  assert.strictEqual(ant.headingReferenceCaptured,false);
  ant.heading=1.2345;
  sim.step(0.02);
  assert.strictEqual(ant.headingReferenceCaptured,true);
  angleNear(ant.headingReference,1.2345,1e-14);
}

// Exact deterministic circular-restoration identity over an uninterrupted moving interval.
{
  const c0=0.8,theta0=0.9,ref=-0.2,t=1.3;
  const delta0=core.normalizeAngle(theta0-ref);
  const expectedDelta=2*Math.atan(Math.tan(delta0/2)*Math.exp(-cfg.kappa*c0*cfg.tau*(1-Math.exp(-t/cfg.tau))));
  const actual=exactHeadingRestorationAngle(theta0,ref,c0,cfg,t);
  angleNear(actual,core.normalizeAngle(ref+expectedDelta),2e-14);
}

// Restoring drift follows the shortest circular direction for ordinary signed errors.
{
  const c0=0.9,ref=0;
  const pos=exactHeadingRestorationAngle(0.6,ref,c0,cfg,0.2);
  const neg=exactHeadingRestorationAngle(-0.6,ref,c0,cfg,0.2);
  assert.ok(pos>0&&pos<0.6,'positive error should shrink toward reference');
  assert.ok(neg<0&&neg>-0.6,'negative error should shrink toward reference');
}

// During a pause H5 applies no heading drift, while C continues to decay in real time.
{
  const sim=new Simulation(h5Bundle(),77311),ant=sim.ants[0];
  sim.step(0.02);
  ant.heading=core.normalizeAngle(ant.headingReference+0.7);
  ant.pauseRemaining=0.5;ant.state='paused';
  const beforeHeading=ant.heading,beforeC=ant.headingCommitment,beforeRng=ant.rng.state;
  sim.step(0.02);
  angleNear(ant.heading,beforeHeading,1e-14);
  near(ant.headingCommitment,beforeC*Math.exp(-0.02/cfg.tau),2e-14);
  assert.strictEqual(ant.rng.state,beforeRng,'already-paused step must not consume biology RNG');
}

// Exact deterministic heading dynamics are invariant to timestep partitioning.
{
  function headingAt(dt){
    const b=h5Bundle();Object.assign(b.model.movement,{angular_sigma_rad_sqrt_s:0,speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,pause_rate_s:0});
    const sim=new Simulation(b,77401),ant=sim.ants[0];
    ant.headingReference=0;ant.headingReferenceCaptured=true;ant.heading=0.8;
    const c0=ant.headingCommitment;
    for(let t=0;t<1-1e-12;t+=dt)sim.step(Math.min(dt,1-t));
    return{heading:ant.heading,c0};
  }
  const a=headingAt(0.04),b=headingAt(0.02),c=headingAt(0.01);
  angleNear(a.heading,b.heading,2e-12);angleNear(b.heading,c.heading,2e-12);
}

// Longer history changes deterministic restoration but not baseline RNG cadence, speed process, pause draws, or noise scale.
{
  const s=new Simulation(h5Bundle('open_arena_short_control.json'),88221),l=new Simulation(h5Bundle('open_arena_long_control.json'),88221);
  assert.ok(l.ants[0].headingCommitmentInitial>s.ants[0].headingCommitmentInitial);
  assert.strictEqual(s.model.movement.angular_sigma_rad_sqrt_s,l.model.movement.angular_sigma_rad_sqrt_s);
  for(let i=0;i<50;i++){s.step(0.02);l.step(0.02);}
  near(s.ants[0].speedFactor,l.ants[0].speedFactor,1e-12);
  assert.strictEqual(s.ants[0].rng.state,l.ants[0].rng.state,'H5 must not consume biology RNG');
  assert.strictEqual(s.ants[0].state,l.ants[0].state,'H5 must not alter pause-state draws');
  near(s.ants[0].pauseRemaining,l.ants[0].pauseRemaining,1e-12);
  near(s.ants[0].speedMultiplier,1,1e-12);near(l.ants[0].speedMultiplier,1,1e-12);
}

// Observation/logging differences do not perturb H5 biology.
{
  const standard=h5Bundle(),altered=clone(standard);
  altered.observation.fps=13;altered.observation.record_trajectories=false;altered.observation.tracking.position_noise_mm_sd=3;
  const a=new Simulation(standard,667788),b=new Simulation(altered,667788);
  for(let i=0;i<50;i++){a.step(0.02);b.step(0.02);}
  near(a.ants[0].x,b.ants[0].x,1e-12);near(a.ants[0].y,b.ants[0].y,1e-12);angleNear(a.ants[0].heading,b.ants[0].heading,1e-12);
  near(a.ants[0].headingCommitment,b.ants[0].headingCommitment,1e-12);angleNear(a.ants[0].headingReference,b.ants[0].headingReference,1e-12);
  assert.strictEqual(a.ants[0].rng.state,b.ants[0].rng.state);
}

// Zero history is exactly context-free for matched seeds.
{
  const zero=h5Bundle();zero.experiment.protocol.state_facts.recent_constrained_travel_mm=0;
  const nullBundle=clone(zero);nullBundle.model.heading_restoration.enabled=false;
  const a=new Simulation(zero,99172),b=new IntegritySimulation(nullBundle,99172);
  for(let i=0;i<50;i++){a.step(0.02);b.step(0.02);}
  near(a.ants[0].x,b.ants[0].x,1e-12);near(a.ants[0].y,b.ants[0].y,1e-12);angleNear(a.ants[0].heading,b.ants[0].heading,1e-12);
  assert.strictEqual(a.ants[0].rng.state,b.ants[0].rng.state);
}

// kappa=0 is exactly context-free for matched seeds.
{
  const k0=h5Bundle();k0.model.heading_restoration.effect.kappa_restore_per_s=0;
  const nullBundle=clone(k0);nullBundle.model.heading_restoration.enabled=false;
  const a=new Simulation(k0,55391),b=new IntegritySimulation(nullBundle,55391);
  for(let i=0;i<50;i++){a.step(0.02);b.step(0.02);}
  near(a.ants[0].x,b.ants[0].x,1e-12);near(a.ants[0].y,b.ants[0].y,1e-12);angleNear(a.ants[0].heading,b.ants[0].heading,1e-12);
  assert.strictEqual(a.ants[0].rng.state,b.ants[0].rng.state);
}

// Protocol/state cannot inject H5 latent state, target heading, or H5 biological parameters.
{
  const badC=h5Bundle();badC.experiment.protocol.state_facts.C=0.9;
  assert.throws(()=>new Simulation(badC,1),/H5 biology override forbidden/);
  const badTheta=h5Bundle();badTheta.experiment.protocol.state_facts.theta_ref=1.2;
  assert.throws(()=>new Simulation(badTheta,1),/H5 biology override forbidden/);
  const badK=h5Bundle();badK.experiment.protocol.state_facts.kappa_restore_per_s=2;
  assert.throws(()=>new Simulation(badK,1),/H5 biology override forbidden/);
  const badOverride=h5Bundle();badOverride.experiment.protocol.heading_restoration={effect:{kappa_restore_per_s:9}};
  assert.throws(()=>new Simulation(badOverride,1),/H5 biology override forbidden/);
}

// H5 cannot be combined with prior context mechanisms.
{
  const mixed=h5Bundle();mixed.model.locomotor_activation={enabled:true,mechanism_id:'x',input_fact:'recent_constrained_travel_mm',initialization:{type:'saturating_distance',history_distance_scale_mm:500},decay:{type:'exponential',activation_tau_s:5},effect:{type:'moving_speed_gain',max_speed_gain_fraction:0.2}};
  assert.throws(()=>new Simulation(mixed,1),/cannot be combined/);
}

// Partial-step apparatus-boundary termination advances final C only to the exact event time.
{
  const b=h5Bundle();b.experiment.protocol.entry_state.position_jitter_mm=0;b.experiment.protocol.entry_state.heading_jitter_rad=0;
  Object.assign(b.model.movement,{speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,angular_sigma_rad_sqrt_s:0,pause_rate_s:0});
  const sim=new Simulation(b,445577),ant=sim.ants[0],c0=ant.headingCommitmentInitial;
  sim.runUntilComplete(30,0.5);
  assert.ok(ant.finished,'deterministic H5 ant should reach the arena boundary');
  near(ant.headingCommitment,c0*Math.exp(-ant.completedAt/sim.h5Config.tau),3e-10);
}

// Reachability smoke is mechanism-only: no fitting, no reference target, no Y-maze, one frozen parameter set.
{
  const r=runH5Mechanism({trials:40,firstSeed:934000,dt:0.02});
  assert.strictEqual(r.fit_performed,false);assert.strictEqual(r.reference_targets_accessed,false);assert.strictEqual(r.ymaze_accessed,false);assert.strictEqual(r.selection_performed,false);assert.strictEqual(r.estimator_policy_frozen,false);
  assert.strictEqual(r.structural_checks.long_commitment_exceeds_short,true);
  assert.strictEqual(r.structural_checks.all_references_captured,true);
}

console.log('h5-heading-restoration.test.js PASS');
