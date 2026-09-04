'use strict';

const assert=require('assert');
const core=require('../src/sim-core.js');
const h3=require('../src/h3.js');
const h5=require('../src/h5.js');
const integrity=require('../src/integrity.js');
const {loadBundle}=require('../tools/load-bundle.js');

const H5_MODEL='lasius_niger_locomotion_h5_v1';
function clone(v){return JSON.parse(JSON.stringify(v));}
function eventSig(sim){return sim.events.filter(e=>e.type==='h3_reorientation').map(e=>({time:e.time,angle:e.angle_rad,x:e.x,y:e.y}));}
function trajectorySig(sim){const a=sim.ants[0];return{x:a.x,y:a.y,heading:a.heading,distance:a.distanceTravelled,turns:a.h3TurnCount,events:eventSig(sim)};}

function makeHuge(historyMm, alpha200=.6, alpha1000=.3){
  const b=loadBundle('open_arena_short_control.json',{modelId:H5_MODEL});
  b.experiment.protocol.state_facts.recent_constrained_travel_mm=historyMm;
  b.experiment.protocol.state_facts.recent_travel_mm=historyMm;
  b.experiment.duration_s=8;
  b.apparatus=clone(b.apparatus);
  b.apparatus.world={width:100000,height:100000};
  b.apparatus.geometry={primitives:[{type:'rect',name:'a4_arena',x:0,y:0,width:100000,height:100000}]};
  b.apparatus.entry_points={default:{x:50020,y:50000,heading_rad:0},center:{x:50020,y:50000,heading_rad:0}};
  b.experiment.protocol.entry_point='center';
  b.experiment.protocol.entry_state={heading_rad:0,position_jitter_mm:0,heading_jitter_rad:0};
  b.model=clone(b.model);
  Object.assign(b.model.movement,{base_speed_mm_s:20,speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,pause_rate_s:0,pause_min_s:.1,pause_max_s:.1});
  b.model.reorientation_gate.baseline.mean_free_path_mm=20;
  b.model.reorientation_gate.baseline.turn_concentration=2;
  b.model.reorientation_gate.effect.max_hazard_reduction_fraction=0;
  b.model.origin_search.history_response.alpha_search_200=alpha200;
  b.model.origin_search.history_response.alpha_search_1000=alpha1000;
  return b;
}

const cfg=h5.originSearchConfig(loadBundle('open_arena_short_control.json',{modelId:H5_MODEL}).model);
assert.strictEqual(h5.historyAmplitude(200,cfg),.6);
assert.strictEqual(h5.historyAmplitude(1000,cfg),.3);
assert.throws(()=>h5.historyAmplitude(600,cfg),/only 200 and 1000/);

assert.strictEqual(h5.boundaryNormalizedRadius(50,50,50,50,100,100),0);
assert(Math.abs(h5.boundaryNormalizedRadius(75,50,50,50,100,100)-.5)<1e-12);
assert(Math.abs(h5.boundaryNormalizedRadius(100,50,50,50,100,100)-1)<1e-12);
assert(Math.abs(h5.boundaryNormalizedRadius(75,75,50,50,100,100)-.5)<1e-12);
assert(Math.abs(h5.boundaryNormalizedRadius(25,75,50,50,100,100)-.5)<1e-12);

const unsupported=makeHuge(600);
assert.throws(()=>new integrity.Simulation(unsupported,1),/only 200 and 1000/);

const protocolOverride=makeHuge(200);
protocolOverride.experiment.protocol.analysis_note={alpha_search_200:.9};
assert.throws(()=>new integrity.Simulation(protocolOverride,1),/H5 biological parameters belong in the model profile/);

const stateOverride=makeHuge(200);
stateOverride.state.initial.origin_search={alpha_search_200:.9};
assert.throws(()=>new integrity.Simulation(stateOverride,1),/Model parameter forbidden/);

// Exact H5 null must preserve the H3-null trajectory despite consuming H5-only streams.
const h5Null=makeHuge(200,0,0);
const h3Null=loadBundle('open_arena_short_control.json',{modelId:'lasius_niger_locomotion_h3_v1'});
h3Null.experiment.protocol.state_facts.recent_constrained_travel_mm=200;
h3Null.experiment.duration_s=h5Null.experiment.duration_s;
h3Null.apparatus=clone(h5Null.apparatus);
h3Null.experiment.protocol.entry_point='center';
h3Null.experiment.protocol.entry_state=clone(h5Null.experiment.protocol.entry_state);
h3Null.model=clone(h3Null.model);
h3Null.model.movement=clone(h5Null.model.movement);
h3Null.model.reorientation_gate=clone(h5Null.model.reorientation_gate);
const sn=new integrity.Simulation(h5Null,7711);
const s3=new integrity.Simulation(h3Null,7711);
sn.runFor(6,.02);s3.runFor(6,.02);
assert.deepStrictEqual(trajectorySig(sn),trajectorySig(s3));
assert.strictEqual(sn.ants[0].h5ChoiceDrawCount,sn.ants[0].h3TurnCount);
assert.strictEqual(sn.ants[0].h5AngleDrawCount,sn.ants[0].h3TurnCount);
assert.strictEqual(sn.ants[0].h5SearchSelections,0);

// Active H5 may change direction, but not the H3 event clock or baseline turn sequence.
const active=new integrity.Simulation(makeHuge(200,.9,.45),8822);
const nullPeer=new integrity.Simulation(makeHuge(200,0,0),8822);
active.runFor(6,.02);nullPeer.runFor(6,.02);
const ae=eventSig(active),ne=eventSig(nullPeer);
assert(ae.length>2);
assert.strictEqual(ae.length,ne.length);
for(let i=0;i<ae.length;i++){
  assert(Math.abs(ae[i].time-ne[i].time)<1e-10,'H5 must not alter event time');
  assert(Math.abs(ae[i].angle-ne[i].angle)<1e-12,'H5 must not alter baseline H3 angle stream');
}
assert.strictEqual(active.ants[0].h5ChoiceDrawCount,active.ants[0].h3TurnCount);
assert.strictEqual(active.ants[0].h5AngleDrawCount,active.ants[0].h3TurnCount);
assert(active.events.filter(e=>e.h5_search_selected).length===active.ants[0].h5SearchSelections);

// Search-angle stream uses the same kappa as H3 baseline, but is independently seeded.
const firstEvent=active.events.find(e=>e.type==='h3_reorientation');
assert(firstEvent);
const searchSeed=active.ants[0].h5StreamSeeds.angle;
const replay=new core.RNG(searchSeed);
const expectedSearchAngle=h3.sampleVonMises(replay,active.h3Config.kappa);
assert.strictEqual(firstEvent.h5_search_angle_rad,expectedSearchAngle);
assert.notStrictEqual(active.ants[0].h5StreamSeeds.angle,active.ants[0].h3StreamSeeds.angle);
assert.notStrictEqual(active.ants[0].h5StreamSeeds.choice,active.ants[0].h3StreamSeeds.event);

// Equal-strength common search must be behaviorally treatment-neutral for matched seeds.
const commonShort=makeHuge(200,.4,.4);
const commonLong=makeHuge(1000,.4,.4);
const cs=new integrity.Simulation(commonShort,9933),cl=new integrity.Simulation(commonLong,9933);
cs.runFor(6,.02);cl.runFor(6,.02);
assert.deepStrictEqual(trajectorySig(cs),trajectorySig(cl));
assert.strictEqual(cs.ants[0].h5SearchAmplitude,.4);
assert.strictEqual(cl.ants[0].h5SearchAmplitude,.4);
assert.notStrictEqual(cs.ants[0].h5HistoryMm,cl.ants[0].h5HistoryMm);

// The origin is the arena center, not the reconstructed observation start.
const centered=new integrity.Simulation(makeHuge(200,.6,.3),12001);
assert.strictEqual(centered.ants[0].h5OriginX,50000);
assert.strictEqual(centered.ants[0].h5OriginY,50000);
assert.strictEqual(centered.ants[0].x,50020);
assert.strictEqual(centered.ants[0].y,50000);

console.log('h5-origin-search.test.js PASS '+JSON.stringify({
  exact_null_turns:sn.ants[0].h3TurnCount,
  active_turns:active.ants[0].h3TurnCount,
  active_search_selections:active.ants[0].h5SearchSelections,
  common_turns:cs.ants[0].h3TurnCount
}));
