'use strict';
const assert=require('assert');
const fs=require('fs');
const p4=require('../src/p4.js');
const {loadBundle}=require('../tools/load-bundle.js');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.ok(app.includes("'p4-left-vs-right':{"),'P4 left-vs-right preset missing');
assert.ok(app.includes("fileA:'y_maze_p4_left_consistency_v1.json',fileB:'y_maze_p4_right_consistency_v1.json'"),'P4 left-vs-right preset files incorrect');
assert.ok(app.includes("labelA:'P4 left-marked',labelB:'P4 right-marked',readyStatus:'P4 LEFT VS RIGHT',metricMode:'branch-choice',p4Diagnostic:true,enabled:true"),'P4 left-vs-right must be enabled as a branch-choice diagnostic');
assert.ok(html.includes('Both frozen P4 diagnostic presets are now available'),'step-14 availability copy missing');
assert.ok(html.includes('Step 15 improves comparison legends.'),'step-15 handoff copy missing');

assert.ok(app.includes('function compareOverlayCoordinateSystemCompatible(a,b)'),'geometry-aware overlay compatibility helper missing');
assert.ok(app.includes("const frame=apparatus=>({world:apparatus.world,geometry:apparatus.geometry,boundary:apparatus.boundary,entry_points:apparatus.entry_points,terminal_regions:apparatus.terminal_regions});"),'overlay coordinate frame must exclude only treatment-specific external fields');
assert.ok(app.includes("label:'A · MARKED TRAIL'"),'overlay must label Condition A marked trail');
assert.ok(app.includes("label:'B · MARKED TRAIL'"),'overlay must label Condition B marked trail');
assert.ok(app.includes('active marked trails ${Number(trailA)+Number(trailB)}'),'overlay note must report active marked trails');

const left=loadBundle('y_maze_p4_left_consistency_v1.json');
const right=loadBundle('y_maze_p4_right_consistency_v1.json');
assert.strictEqual(left.experiment.model,right.experiment.model,'left/right comparison must hold frozen Candidate 307 model constant');
assert.strictEqual(left.experiment.state,right.experiment.state,'left/right comparison must hold state constant');
assert.strictEqual(left.experiment.observation,right.experiment.observation,'left/right comparison must hold observation constant');
assert.strictEqual(left.experiment.scoring,right.experiment.scoring,'left/right comparison must hold scoring constant');
assert.deepStrictEqual(left.experiment.requested_metrics,['branch_choice']);
assert.deepStrictEqual(right.experiment.requested_metrics,['branch_choice']);
assert.notStrictEqual(left.experiment.apparatus,right.experiment.apparatus,'left/right treatments must keep distinct frozen apparatus identities');
assert.deepStrictEqual(left.apparatus.world,right.apparatus.world,'left/right apparatus world coordinates must match');
assert.deepStrictEqual(left.apparatus.geometry,right.apparatus.geometry,'left/right apparatus geometry must match exactly');
assert.deepStrictEqual(left.apparatus.boundary,right.apparatus.boundary,'left/right boundary must match');
assert.deepStrictEqual(left.apparatus.entry_points,right.apparatus.entry_points,'left/right entry coordinates must match');
assert.deepStrictEqual(left.apparatus.terminal_regions,right.apparatus.terminal_regions,'left/right terminal coordinates must match');

const leftTrail=left.apparatus.external_fields.painted_trail.line_segment_mm;
const rightTrail=right.apparatus.external_fields.painted_trail.line_segment_mm;
assert.deepStrictEqual(leftTrail,{x1:140,y1:120,x2:190,y2:33.3975});
assert.deepStrictEqual(rightTrail,{x1:140,y1:120,x2:190,y2:206.6025});
assert.strictEqual(left.experiment.protocol.treatment.marked_side,'left');
assert.strictEqual(right.experiment.protocol.treatment.marked_side,'right');
assert.strictEqual(left.experiment.protocol.painted_trail.applied_hindgut_equivalents_per_cm,0.0048);
assert.strictEqual(right.experiment.protocol.painted_trail.applied_hindgut_equivalents_per_cm,0.0048);
assert.strictEqual(left.experiment.metadata.official_execution_authorized,false);
assert.strictEqual(right.experiment.metadata.official_execution_authorized,false);

const seed=914014;
const simA=new p4.Simulation(left,seed),simB=new p4.Simulation(right,seed);
assert.strictEqual(simA.seed,simB.seed,'left/right P4 pair must use the exact same seed');
assert.ok(simA.p4DoseRatio>0&&simB.p4DoseRatio>0,'both mirrored conditions must have active frozen P4 dose');
assert.strictEqual(simA.ants[0].x,simB.ants[0].x,'matched pair must start at the same x');
assert.strictEqual(simA.ants[0].y,simB.ants[0].y,'matched pair must start at the same y');
assert.strictEqual(simA.ants[0].heading,simB.ants[0].heading,'matched pair must start with the same heading');

simA.runUntilComplete(left.experiment.duration_s,p4.FIXED_DT);
simB.runUntilComplete(right.experiment.duration_s,p4.FIXED_DT);
for(const pair of [['left-marked',simA.summary()],['right-marked',simB.summary()]]){
  const label=pair[0],summary=pair[1];
  assert.deepStrictEqual(summary.observed_metrics.requested_metrics,['branch_choice'],label+' must expose only branch_choice');
  assert.strictEqual(summary.observed_metrics.ants.length,1,label+' must expose one observed worker row');
  assert.ok(Object.prototype.hasOwnProperty.call(summary.observed_metrics.ants[0],'branch_choice'),label+' must expose observed branch_choice');
}

console.log('compare-p4-left-right.test.js PASS');
