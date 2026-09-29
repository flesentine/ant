'use strict';
const assert=require('assert');
const fs=require('fs');
const p4=require('../src/p4.js');
const {loadBundle}=require('../tools/load-bundle.js');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

assert.ok(app.includes("'p4-marked-vs-zero':{"),'P4 marked-vs-zero preset missing');
assert.ok(app.includes("fileA:'y_maze_p4_left_consistency_v1.json',fileB:'y_maze_p4_neutral_consistency_v1.json'"),'P4 marked-vs-zero pair must use frozen left-marked and exact zero-dose experiments');
assert.ok(app.includes("difference:'P4 painted-trail dose',treatmentA:'Left arm marked · 0.0048 hindgut eq/cm',treatmentB:'Exact zero-dose identity control'"),'P4 marked-vs-zero legend must state the designed dose difference');
assert.ok(html.includes('Both frozen P4 diagnostic presets are now available'),'P4 diagnostics availability copy missing');

for(const id of ['compareMetricsTitle','compareMetricsModeLabel','compareMetricsDeltaLabel','compareOutcomeLabel','compareMetricSpeedRow','compareMetricDistanceRow','compareMetricStraightnessRow','compareMetricEdgeTimeRow','compareMetricCentralRow']){
  assert.ok(html.includes('id="'+id+'"'),'missing preset-aware metric UI #'+id);
}
assert.ok(app.includes("const branchChoice=preset.metricMode==='branch-choice';"),'branch-choice metric mode switch missing');
assert.ok(app.includes("ui.compareMetricsTitle.textContent=branchChoice?'Observed branch choice':'Observed metrics';"),'P4 metric title switch missing');
assert.ok(app.includes("ui.compareMetricsModeLabel.textContent=branchChoice?'A ↔ B':'B − A';"),'P4 relation heading missing');
assert.ok(app.includes("ui.compareMetricsDeltaLabel.textContent=branchChoice?'Relation':'Δ';"),'P4 relation column label missing');
assert.ok(app.includes("ui.compareOutcomeLabel.textContent=branchChoice?'Branch choice':'Outcome';"),'P4 branch-choice row label missing');
assert.ok(app.includes('row.hidden=branchChoice'),'irrelevant numeric rows must hide for branch-choice presets');
assert.ok(css.includes('.compare-metrics-row[hidden] { display:none; }'),'hidden P4 metric rows must not occupy layout');

assert.ok(app.includes('function drawCompareExternalField(c,canvas,targetSim,{'),'compare P4 trail renderer missing');
assert.ok(app.includes("if(!trail?.line_segment_mm||!(Number(targetSim?.p4DoseRatio)>0))return false;"),'zero-dose pane must suppress painted-trail rendering');
assert.ok(app.includes("trailLabel=label||(side?`P4 ${String(side).toUpperCase()} TRAIL`:'P4 MARKED TRAIL')"),'marked P4 trail label must identify the active side');
assert.ok(app.includes('drawCompareExternalField(c,canvas,targetSim);'),'P4 trail must render in paired condition canvas');
assert.ok(app.includes("label:'A · MARKED TRAIL'"),'P4 marked condition must render in the trajectory overlay');

assert.ok(app.includes("const choices=observedRows.map(row=>row.branch_choice).filter(Boolean);"),'branch choice must come from observed measurement rows');
assert.ok(app.includes("branchChoice:choices.length?choices.map(choice=>String(choice).toUpperCase()).join(', '):'—'"),'observed branch choice adapter missing');
assert.ok(app.includes('function buildBranchChoiceSummary(a,b,preset)'),'P4 plain-language branch summary missing');
assert.ok(app.includes('if(aChoice===bChoice)return'),'same-choice summary missing');
assert.ok(app.includes('while ${preset.labelB} chose ${bChoice}.'),'different-choice summary missing');
assert.ok(app.includes('Relation compares the two observed categorical choices; no numeric delta or significance claim.'),'P4 metrics boundary copy missing');
assert.ok(app.includes('official biological execution remains unauthorized.'),'P4 authorization boundary missing');
assert.ok(app.includes('No new fit, calibration, validation, or causal claim.'),'P4 scientific boundary missing');

const marked=loadBundle('y_maze_p4_left_consistency_v1.json');
const zero=loadBundle('y_maze_p4_neutral_consistency_v1.json');
assert.strictEqual(marked.experiment.model,zero.experiment.model,'P4 comparison must hold frozen Candidate 307 model constant');
assert.strictEqual(marked.experiment.apparatus,zero.experiment.apparatus,'marked vs zero-dose must use the same Y-maze coordinate system');
assert.strictEqual(marked.experiment.state,zero.experiment.state,'marked vs zero-dose must hold state constant');
assert.strictEqual(marked.experiment.observation,zero.experiment.observation,'marked vs zero-dose must hold observation pipeline constant');
assert.strictEqual(marked.experiment.scoring,zero.experiment.scoring,'marked vs zero-dose must hold scoring constant');
assert.deepStrictEqual(marked.experiment.requested_metrics,['branch_choice']);
assert.deepStrictEqual(zero.experiment.requested_metrics,['branch_choice']);
assert.strictEqual(marked.experiment.protocol.painted_trail.applied_hindgut_equivalents_per_cm,0.0048);
assert.strictEqual(zero.experiment.protocol.painted_trail.applied_hindgut_equivalents_per_cm,0);
assert.strictEqual(marked.experiment.metadata.official_execution_authorized,false);
assert.strictEqual(zero.experiment.metadata.official_execution_authorized,false);

const seed=913013;
const simA=new p4.Simulation(marked,seed),simB=new p4.Simulation(zero,seed);
assert.strictEqual(simA.seed,simB.seed,'paired P4 simulations must share the exact seed');
assert.ok(simA.p4DoseRatio>0,'marked condition must have active P4 dose');
assert.strictEqual(simB.p4DoseRatio,0,'neutral condition must be exact zero dose');
for(let i=0;i<50;i++){simA.step(p4.FIXED_DT);simB.step(p4.FIXED_DT);}
assert.strictEqual(simB.ants[0].p4EvaluationSamples,0,'zero-dose condition must preserve the exact P4 evaluation bypass');

simA.runUntilComplete(marked.experiment.duration_s,p4.FIXED_DT);
simB.runUntilComplete(zero.experiment.duration_s,p4.FIXED_DT);
for(const pair of [['marked',simA.summary()],['zero',simB.summary()]]){
  const label=pair[0],summary=pair[1];
  assert.deepStrictEqual(summary.observed_metrics.requested_metrics,['branch_choice'],label+' comparison must expose only observed branch choice');
  assert.strictEqual(summary.observed_metrics.ants.length,1,label+' must expose one observed worker row');
  assert.ok(Object.prototype.hasOwnProperty.call(summary.observed_metrics.ants[0],'branch_choice'),label+' observed row must carry branch_choice');
}

console.log('compare-p4-marked-zero.test.js PASS');
