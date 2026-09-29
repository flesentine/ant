const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

for(const id of ['showCompareOverlay','compareOverlayBody','compareOverlayCanvas','compareOverlayNote']){
  assert.ok(html.includes(`id="${id}"`),`missing trajectory overlay UI #${id}`);
}
assert.ok(html.includes('TRAJECTORY OVERLAY'),'trajectory overlay heading missing');
assert.ok(html.includes('Matched paths on one arena'),'trajectory overlay title missing');
assert.ok(html.includes('20 cm · A'),'Condition A overlay legend missing');
assert.ok(html.includes('100 cm · B'),'Condition B overlay legend missing');
assert.ok(html.includes('Display-only trajectory history sampled every 0.25 s; not a new measurement endpoint.'),'display-only overlay boundary missing');
assert.ok(html.includes('P4 left vs right remains locked until step 14.'),'step-13 preset handoff copy missing');

assert.ok(app.includes("const comparePaths={a:new Map(),b:new Map(),nextSample:.25,loading:false};"),'overlay history must be kept outside simulation state');
assert.ok(app.includes('const COMPARE_PATH_SAMPLE_S=.25;'),'trajectory history sampling interval missing');
assert.ok(app.includes('function recordCompareTrajectoryPoints(force=false)'),'trajectory history recorder missing');
assert.ok(app.includes('for(const id of matchedCompareWorkerIds())'),'overlay must retain path history for matched worker IDs');
assert.ok(app.includes('comparePathPush(comparePaths.a,id,antA,comparePair.a.time);'),'Condition A path history missing');
assert.ok(app.includes('comparePathPush(comparePaths.b,id,antB,comparePair.b.time);'),'Condition B path history missing');
assert.ok(app.includes('function resetCompareTrajectoryHistory()'),'trajectory history reset missing');
assert.ok(app.includes('recordCompareTrajectoryPoints(true);'),'reset must capture the shared starting position');
assert.ok(app.includes('recordCompareTrajectoryPoints(done);'),'shared fixed-step loop must feed the overlay history');
assert.ok(!app.includes('comparePaths.a=comparePair.a.ants[0].tail'),'overlay must not depend on the bounded ant.tail display cache');

assert.ok(app.includes('function drawCompareTrajectoryOverlay()'),'trajectory overlay renderer missing');
assert.ok(app.includes("if(comparePair.a.apparatus.id!==comparePair.b.apparatus.id)"),'overlay must refuse incompatible apparatus coordinate systems');
assert.ok(app.includes("drawCompareOverlayPath(c,canvas,simA,pathA,{stroke:'#d9f99d',width:4});"),'Condition A overlay path missing');
assert.ok(app.includes("drawCompareOverlayPath(c,canvas,simA,pathB,{stroke:'#60a5fa',dashed:true,width:2.5});"),'Condition B dashed overlay path missing');
assert.ok(app.includes('not a new measurement endpoint.'),'runtime overlay note must preserve measurement boundary');
assert.ok(app.includes('drawCompareTrajectoryOverlay();\n    updateCompareMetrics();'),'overlay must update with paired rendering');
assert.ok(app.includes("ui.showCompareOverlay.addEventListener('change',toggleCompareTrajectoryOverlay);"),'overlay visibility toggle listener missing');

assert.ok(css.includes('.compare-overlay-card'),'trajectory overlay card styling missing');
assert.ok(css.includes('.overlay-line.overlay-a'),'Condition A line legend styling missing');
assert.ok(css.includes('.overlay-line.overlay-b'),'Condition B line legend styling missing');
assert.ok(css.includes('.compare-overlay-body[hidden] { display:none; }'),'overlay toggle must hide only the display surface');

console.log('compare-trajectory-overlay.test.js PASS');
