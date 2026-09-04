'use strict';
const assert=require('assert');
const{Simulation,locomotorActivationConfig,meanActivationOverStep}=require('../src/integrity.js');
const{loadBundle}=require('../tools/load-bundle.js');
const{runH4Mechanism}=require('../tools/run-h4-mechanism.js');
function clone(v){return JSON.parse(JSON.stringify(v));}
function near(a,b,tol=1e-10){assert.ok(Math.abs(a-b)<=tol,`${a} != ${b} within ${tol}`);}
function h4Bundle(experiment='open_arena_short_control.json'){return loadBundle(experiment,{modelId:'lasius_niger_locomotion_h4_v1'});}

const base=h4Bundle();
const cfg=locomotorActivationConfig(base.model);
assert.ok(cfg,'H4 config should be enabled');
assert.strictEqual(cfg.mechanismId,'H4_transient_locomotor_activation_v1');
assert.strictEqual(cfg.inputFact,'recent_constrained_travel_mm');
assert.strictEqual(cfg.lambda,500);
assert.strictEqual(cfg.tau,5);
assert.strictEqual(cfg.rho,0.25);

// Exact exponential state decay and deterministic time-averaged gain.
{
  const sim=new Simulation(h4Bundle(),77123);
  const a0=sim.ants[0].locomotorActivationInitial;
  for(let i=0;i<50;i++)sim.step(0.02);
  near(sim.ants[0].locomotorActivation,a0*Math.exp(-1/5),2e-12);
  assert.ok(sim.ants[0].speedMultiplier>1,'positive history should create a speed gain');
}

// Exact H4 activation integral is invariant to splitting a physics interval.
{
  const a0=0.8,tau=5,dt=0.02;
  const whole=meanActivationOverStep(a0,tau,dt)*dt;
  const half=dt/2,a1=a0*Math.exp(-half/tau);
  const split=meanActivationOverStep(a0,tau,half)*half+meanActivationOverStep(a1,tau,half)*half;
  near(whole,split,2e-14);
}

// Full H4 displacement contribution converges across physics dt in an isolated deterministic walk.
{
  function effectAt(dt){
    const active=h4Bundle();
    active.experiment.protocol.entry_state.position_jitter_mm=0;
    active.experiment.protocol.entry_state.heading_jitter_rad=0;
    Object.assign(active.model.movement,{speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,angular_sigma_rad_sqrt_s:0,pause_rate_s:0});
    const nullBundle=clone(active);
    nullBundle.model.locomotor_activation.effect.max_speed_gain_fraction=0;
    const a=new Simulation(active,445566),n=new Simulation(nullBundle,445566);
    a.runFor(1,dt);n.runFor(1,dt);
    return a.ants[0].distanceTravelled-n.ants[0].distanceTravelled;
  }
  const effects=[0.04,0.02,0.01].map(effectAt);
  near(effects[0],effects[1],2e-9);
  near(effects[1],effects[2],2e-9);
}

// A mid-step boundary exit solves the decaying H4 speed integral, not a constant full-step mean speed.
{
  const b=h4Bundle();
  b.experiment.protocol.entry_state.position_jitter_mm=0;
  b.experiment.protocol.entry_state.heading_jitter_rad=0;
  Object.assign(b.model.movement,{speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,angular_sigma_rad_sqrt_s:0,pause_rate_s:0});
  const sim=new Simulation(b,445577),ant=sim.ants[0],a0=ant.locomotorActivationInitial;
  const v0=ant.baseSpeed*ant.speedFactor,tau=sim.h4Config.tau,rho=sim.h4Config.rho;
  const target=sim.apparatus.world.width-ant.x;
  const travel=t=>v0*(t+rho*a0*tau*(1-Math.exp(-t/tau)));
  let lo=0,hi=20;
  for(let i=0;i<90;i++){const mid=(lo+hi)/2;if(travel(mid)<target)lo=mid;else hi=mid;}
  const expected=(lo+hi)/2;
  sim.runUntilComplete(30,0.5);
  assert.ok(sim.ants[0].finished,'deterministic H4 ant should reach the arena boundary');
  near(sim.ants[0].completedAt,expected,2e-9);
  near(sim.ants[0].locomotorActivation,a0*Math.exp(-expected/tau),2e-10);
}

// Longer observable travel changes displacement only: biology RNG cadence, heading, and pause state stay matched.
{
  const short=h4Bundle('open_arena_short_control.json');
  const long=h4Bundle('open_arena_long_control.json');
  const s=new Simulation(short,88221),l=new Simulation(long,88221);
  assert.ok(l.ants[0].locomotorActivationInitial>s.ants[0].locomotorActivationInitial);
  for(let i=0;i<50;i++){s.step(0.02);l.step(0.02);}
  near(s.ants[0].heading,l.ants[0].heading,1e-12);
  near(s.ants[0].speedFactor,l.ants[0].speedFactor,1e-12);
  assert.strictEqual(s.ants[0].rng.state,l.ants[0].rng.state,'H4 must not consume biology RNG');
  assert.strictEqual(s.ants[0].state,l.ants[0].state,'H4 must not alter pause-state draws');
  near(s.ants[0].pauseRemaining,l.ants[0].pauseRemaining,1e-12);
  assert.ok(l.ants[0].distanceTravelled>s.ants[0].distanceTravelled,'longer history should increase early displacement');
}

// Observation/logging changes may consume observation RNG differently but must not perturb biology.
{
  const standard=h4Bundle();
  const altered=clone(standard);
  altered.observation.fps=13;
  altered.observation.record_trajectories=false;
  altered.observation.tracking.position_noise_mm_sd=3;
  const a=new Simulation(standard,667788),b=new Simulation(altered,667788);
  for(let i=0;i<50;i++){a.step(0.02);b.step(0.02);}
  near(a.ants[0].x,b.ants[0].x,1e-12);
  near(a.ants[0].y,b.ants[0].y,1e-12);
  near(a.ants[0].heading,b.ants[0].heading,1e-12);
  near(a.ants[0].speedFactor,b.ants[0].speedFactor,1e-12);
  near(a.ants[0].locomotorActivation,b.ants[0].locomotorActivation,1e-12);
  assert.strictEqual(a.ants[0].rng.state,b.ants[0].rng.state,'observation configuration must not perturb biology RNG');
  assert.strictEqual(a.ants[0].state,b.ants[0].state);
  near(a.ants[0].pauseRemaining,b.ants[0].pauseRemaining,1e-12);
}

// Zero history is exactly context-free for matched seeds despite the H4 model being present.
{
  const zero=h4Bundle();
  zero.experiment.protocol.state_facts.recent_constrained_travel_mm=0;
  const nullBundle=clone(zero);
  nullBundle.model.locomotor_activation.enabled=false;
  const a=new Simulation(zero,99172),b=new Simulation(nullBundle,99172);
  for(let i=0;i<50;i++){a.step(0.02);b.step(0.02);}
  near(a.ants[0].x,b.ants[0].x,1e-12);near(a.ants[0].y,b.ants[0].y,1e-12);near(a.ants[0].heading,b.ants[0].heading,1e-12);
  assert.strictEqual(a.ants[0].rng.state,b.ants[0].rng.state);
  near(a.ants[0].speedMultiplier,1,1e-12);
}

// rho_speed = 0 is exactly context-free for matched seeds.
{
  const rho0=h4Bundle();
  rho0.model.locomotor_activation.effect.max_speed_gain_fraction=0;
  const nullBundle=clone(rho0);
  nullBundle.model.locomotor_activation.enabled=false;
  const a=new Simulation(rho0,55391),b=new Simulation(nullBundle,55391);
  for(let i=0;i<50;i++){a.step(0.02);b.step(0.02);}
  near(a.ants[0].x,b.ants[0].x,1e-12);near(a.ants[0].y,b.ants[0].y,1e-12);near(a.ants[0].heading,b.ants[0].heading,1e-12);
  assert.strictEqual(a.ants[0].rng.state,b.ants[0].rng.state);
}

// Protocol/state cannot inject latent H4 state or H4 biological parameters.
{
  const badA=h4Bundle();badA.experiment.protocol.state_facts.A=0.9;
  assert.throws(()=>new Simulation(badA,1),/Latent biological state forbidden|Biology override forbidden/);
  const badRho=h4Bundle();badRho.experiment.protocol.state_facts.rho_speed=2;
  assert.throws(()=>new Simulation(badRho,1),/Model parameter forbidden|Biology override forbidden/);
  const badModelOverride=h4Bundle();badModelOverride.experiment.protocol.locomotor_activation={effect:{max_speed_gain_fraction:9}};
  assert.throws(()=>new Simulation(badModelOverride,1),/Biology override forbidden/);
}

// Reachability smoke: no fitting/Y-maze, same model hash, and the intended speed signature is reachable.
{
  const r=runH4Mechanism({trials:80,firstSeed:934000,dt:0.02});
  assert.strictEqual(r.fit_performed,false);assert.strictEqual(r.reference_targets_accessed,false);assert.strictEqual(r.ymaze_accessed,false);assert.strictEqual(r.selection_performed,false);
  assert.strictEqual(r.structural_checks.long_activation_exceeds_short,true);
  assert.strictEqual(r.structural_checks.long_moving_speed_exceeds_short,true);
  assert.ok(r.long.mean_observed_moving_speed_mm_s>r.short.mean_observed_moving_speed_mm_s);
}

console.log('h4-locomotor-activation.test.js PASS');
