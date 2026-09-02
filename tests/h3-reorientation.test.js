'use strict';
const assert=require('assert');
const path=require('path');
const core=require('../src/sim-core.js');
const h3=require('../src/h3.js');
const{Simulation}=require('../src/integrity.js');
const{loadBundle,readJson}=require('../tools/load-bundle.js');
const{MODEL_ID,validateFrozenMechanism,runH3Mechanism}=require('../tools/run-h3-mechanism.js');
const root=path.resolve(__dirname,'..');
const freeze=readJson(path.resolve(root,'hypotheses','h3_transient_reorientation_gate_v1.json'));
const model=readJson(path.resolve(root,'models',`${MODEL_ID}.json`));
validateFrozenMechanism(model,freeze);

function clone(v){return JSON.parse(JSON.stringify(v));}
function eventRows(sim){return sim.events.filter(e=>e.type==='h3_reorientation').map(e=>({time:e.time,angle:e.angle_rad,sequence:e.sequence}));}
function makeLargeBundle(historyMm=200){
  const b=loadBundle('open_arena_short_control.json',{modelId:MODEL_ID});
  b.experiment.protocol.state_facts.recent_constrained_travel_mm=historyMm;
  b.experiment.duration_s=10;
  b.apparatus=clone(b.apparatus);
  b.apparatus.world={width:100000,height:100000};
  b.apparatus.geometry={primitives:[{type:'rect',x:0,y:0,width:100000,height:100000}]};
  b.apparatus.entry_points={default:{x:50000,y:50000,heading_rad:0},center:{x:50000,y:50000,heading_rad:0}};
  b.experiment.protocol.entry_point='center';
  b.experiment.protocol.entry_state={heading_rad:0,position_jitter_mm:0,heading_jitter_rad:0};
  b.model=clone(b.model);
  Object.assign(b.model.movement,{base_speed_mm_s:20,speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,pause_rate_s:0,pause_min_s:.1,pause_max_s:.1});
  b.model.reorientation_gate.baseline.mean_free_path_mm=20;
  return b;
}

const short=loadBundle('open_arena_short_control.json',{modelId:MODEL_ID});
const long=loadBundle('open_arena_long_control.json',{modelId:MODEL_ID});
const s=new Simulation(short,12345),l=new Simulation(long,12345);
const cfg=h3.reorientationGateConfig(model);
const expectedShort=1-Math.exp(-200/cfg.lambda),expectedLong=1-Math.exp(-1000/cfg.lambda);
assert(Math.abs(s.ants[0].reorientationGateInitial-expectedShort)<1e-12);
assert(Math.abs(l.ants[0].reorientationGateInitial-expectedLong)<1e-12);
assert(l.ants[0].reorientationGateInitial>s.ants[0].reorientationGateInitial,'long history must initialize a larger H3 gate');
for(let i=0;i<50;i++)s.step(.02);
assert(Math.abs(s.ants[0].reorientationGate-expectedShort*Math.exp(-1/cfg.tau))<1e-11,'G must follow exact exponential decay');

const zero=loadBundle('open_arena_short_control.json',{modelId:MODEL_ID});
zero.experiment.protocol.state_facts.recent_constrained_travel_mm=0;
const nullGate=clone(zero);nullGate.model.reorientation_gate.effect.max_hazard_reduction_fraction=0;
const zg=new Simulation(zero,777),zn=new Simulation(nullGate,777);
for(let i=0;i<200;i++){zg.step(.02);zn.step(.02);}
assert.strictEqual(zg.ants[0].x,zn.ants[0].x);assert.strictEqual(zg.ants[0].y,zn.ants[0].y);assert.strictEqual(zg.ants[0].heading,zn.ants[0].heading);assert.strictEqual(zg.ants[0].distanceTravelled,zn.ants[0].distanceTravelled);assert.strictEqual(zg.ants[0].h3TurnCount,zn.ants[0].h3TurnCount);

const nullShort=makeLargeBundle(200),nullLong=makeLargeBundle(1000);nullShort.model.reorientation_gate.effect.max_hazard_reduction_fraction=0;nullLong.model.reorientation_gate.effect.max_hazard_reduction_fraction=0;
const ns=new Simulation(nullShort,778),nl=new Simulation(nullLong,778);for(let i=0;i<250;i++){ns.step(.02);nl.step(.02);}assert.strictEqual(ns.ants[0].x,nl.ants[0].x);assert.strictEqual(ns.ants[0].y,nl.ants[0].y);assert.strictEqual(ns.ants[0].heading,nl.ants[0].heading);assert.strictEqual(ns.ants[0].h3TurnCount,nl.ants[0].h3TurnCount);

const timing={};
for(const dt of [.01,.02,.05]){const sim=new Simulation(makeLargeBundle(1000),991);sim.runFor(5,dt);timing[dt]=eventRows(sim);}
assert(timing[.01].length>1,'timing fixture should generate multiple H3 turns');
assert.strictEqual(timing[.01].length,timing[.02].length);assert.strictEqual(timing[.01].length,timing[.05].length);
for(let i=0;i<timing[.01].length;i++){assert(Math.abs(timing[.01][i].time-timing[.02][i].time)<1e-9,`H3 event ${i} must converge for 10/20ms`);assert(Math.abs(timing[.01][i].time-timing[.05][i].time)<1e-9,`H3 event ${i} must converge for 10/50ms`);assert(Math.abs(timing[.01][i].angle-timing[.02][i].angle)<1e-12);assert(Math.abs(timing[.01][i].angle-timing[.05][i].angle)<1e-12);}
const coarse=new Simulation(makeLargeBundle(1000),992);coarse.step(.5);const firstCoarse=eventRows(coarse)[0];if(firstCoarse)assert(Math.abs(firstCoarse.time/.5-Math.round(firstCoarse.time/.5))>1e-6,'H3 reorientation must occur at a sub-step time, not the tick boundary');

const speedShort=new Simulation(makeLargeBundle(200),12001),speedLong=new Simulation(makeLargeBundle(1000),12001);
assert.strictEqual(speedShort.ants[0].h3StreamSeeds.angle,speedLong.ants[0].h3StreamSeeds.angle,'turn-angle stream seed must not depend on treatment history');
assert.strictEqual(speedShort.ants[0].h3StreamSeeds.event,speedLong.ants[0].h3StreamSeeds.event,'turn-event stream seed must not depend on treatment history');
for(let i=0;i<200;i++){speedShort.step(.02);speedLong.step(.02);assert.strictEqual(speedShort.ants[0].baseSpeed,speedLong.ants[0].baseSpeed);assert.strictEqual(speedShort.ants[0].speedFactor,speedLong.ants[0].speedFactor);assert.strictEqual(speedShort.ants[0].pauseRemaining,speedLong.ants[0].pauseRemaining);}

const angleSeed=speedShort.ants[0].h3StreamSeeds.angle,ar1=new core.RNG(angleSeed),ar2=new core.RNG(angleSeed);for(let i=0;i<100;i++)assert.strictEqual(h3.sampleVonMises(ar1,cfg.kappa),h3.sampleVonMises(ar2,cfg.kappa),'conditional turn-angle sequence must be history-independent for matched kappa/seed');

const logged=makeLargeBundle(1000),unlogged=clone(logged);logged.observation.record_trajectories=true;unlogged.observation.record_trajectories=false;const sl=new Simulation(logged,13001),su=new Simulation(unlogged,13001);sl.runFor(5,.02);su.runFor(5,.02);assert.deepStrictEqual(eventRows(sl),eventRows(su),'observation retention must not perturb H3 event biology');assert.strictEqual(sl.ants[0].speedFactor,su.ants[0].speedFactor);

const rejection=/(Biology override forbidden|Latent biological state forbidden|Model parameter forbidden)/;
const injected=loadBundle('open_arena_short_control.json',{modelId:MODEL_ID});injected.experiment.protocol.state_facts.reorientation_gate=.9;assert.throws(()=>new Simulation(injected,1),rejection);
const protocolInjected=loadBundle('open_arena_short_control.json',{modelId:MODEL_ID});protocolInjected.experiment.protocol.reorientation_gate={effect:{rho_gate:.9}};assert.throws(()=>new Simulation(protocolInjected,1),rejection);
const ellInjected=loadBundle('open_arena_short_control.json',{modelId:MODEL_ID});ellInjected.experiment.protocol.analysis_note={mean_free_path_mm:999};assert.throws(()=>new Simulation(ellInjected,1),rejection);
const rhoInjected=loadBundle('open_arena_short_control.json',{modelId:MODEL_ID});rhoInjected.experiment.protocol.analysis_note={rho_gate:.9};assert.throws(()=>new Simulation(rhoInjected,1),rejection);

const report=runH3Mechanism({trials:20,firstSeed:810000,dt:.02});
assert.strictEqual(report.fit_performed,false);assert.strictEqual(report.reference_targets_accessed,false);assert.strictEqual(report.ymaze_accessed,false);assert.strictEqual(report.selection_performed,false);assert.strictEqual(report.model_id,MODEL_ID);assert(report.short.gate_initial<report.long.gate_initial);assert.strictEqual(report.structural_checks.long_gate_exceeds_short,true);
console.log('h3-reorientation.test.js PASS '+JSON.stringify({g0_short:expectedShort,g0_long:expectedLong,events_5s:timing[.02].length,model_hash:report.model_hash}));
