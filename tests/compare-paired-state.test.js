const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');
const app=fs.readFileSync('src/app.js','utf8');

assert.ok(app.includes("const comparePair={a:null,b:null,generation:0}"),'paired state container missing');
assert.ok(app.includes("comparePair.a=new Simulation(bundle,seed);"),'Condition A must own a Simulation instance');
assert.ok(app.includes("comparePair.b=new Simulation(bundle,seed+1);"),'Condition B must own an independent Simulation instance');
assert.ok(app.includes("async function resetComparePair()"),'paired reset/load path missing');
assert.ok(app.includes("drawCompareSimulation(ui.compareCanvasA,comparePair.a)"),'Condition A render hookup missing');
assert.ok(app.includes("drawCompareSimulation(ui.compareCanvasB,comparePair.b)"),'Condition B render hookup missing');
assert.ok(app.includes("resetComparePair();"),'entering Compare mode must initialize paired state');
assert.ok(app.includes("generation!==comparePair.generation||viewMode!=='compare'"),'paired async loading must fail closed when stale or hidden');
assert.ok(app.includes("function compareTransform(canvas,targetSim)"),'paired renderer must use per-simulation geometry');
assert.ok(app.includes("targetSim.apparatus.geometry.primitives"),'paired renderer must draw each simulation apparatus');
assert.ok(css.includes(".compare-canvas-placeholder[hidden] { display:none; }"),'loaded compare state must reveal canvases cleanly');
assert.ok(html.includes('Each canvas now owns an independent simulation instance.'),'step-3 status copy missing');

console.log('compare-paired-state.test.js PASS');
