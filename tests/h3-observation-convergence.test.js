'use strict';
const assert=require('assert');
const{Simulation}=require('../src/integrity.js');
const{loadBundle}=require('../tools/load-bundle.js');

function controlledBundle(){
  const b=loadBundle('open_arena_short_control.json',{modelId:'lasius_niger_locomotion_h3_v1'});
  b.experiment.protocol.state_facts.recent_constrained_travel_mm=200;
  b.experiment.protocol.entry_state.position_jitter_mm=0;
  b.experiment.protocol.entry_state.heading_jitter_rad=0;
  Object.assign(b.model.movement,{speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,pause_rate_s:0});
  return b;
}

function run(dt){
  const s=new Simulation(controlledBundle(),12345);
  s.runFor(4,dt);
  return s;
}

const sims=[.01,.02,.05].map(run);
const eventTimes=sims.map(s=>s.events.filter(e=>e.type==='h3_reorientation')[0].time);
for(let i=1;i<eventTimes.length;i++)assert(Math.abs(eventTimes[i]-eventTimes[0])<1e-10,'H3 event time must be timestep invariant in deterministic motion');
assert(Math.abs(eventTimes[0]/.02-Math.round(eventTimes[0]/.02))>1e-4,'H3 event must not be snapped to 20 ms ticks');

const ref=sims[0].observations;
for(const s of sims.slice(1)){
  assert.strictEqual(s.observations.length,ref.length,'25-fps frame count must be timestep invariant');
  let maxDelta=0;
  for(let i=0;i<ref.length;i++){
    assert.strictEqual(s.observations[i].time_s,ref[i].time_s);
    const a=ref[i].ants[0],b=s.observations[i].ants[0];
    maxDelta=Math.max(maxDelta,Math.hypot(a.x-b.x,a.y-b.y));
  }
  assert(maxDelta<1e-8,`H3 camera samples must follow the piecewise sub-step truth path; max delta ${maxDelta}`);
}

const turnTime=eventTimes[0],cameraBefore=Math.floor(turnTime*25)/25;
const frame=sims[2].observations.find(f=>Math.abs(f.time_s-cameraBefore)<1e-9);
assert(frame,'Expected camera frame immediately before first H3 turn');
assert(frame.time_s<turnTime,'Regression frame must be before the sub-step turn');

console.log('h3-observation-convergence.test.js PASS '+JSON.stringify({event_time_s:eventTimes[0],camera_before_s:cameraBefore,frames:ref.length}));
