const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

for(const id of ['compareMatchTitle','compareMatchWorker','compareMatchDetail']){
  assert.ok(html.includes(`id="${id}"`),`missing matched-worker UI #${id}`);
}
assert.ok(html.includes('Matched simulated worker'),'matched-worker heading missing');
assert.ok(html.includes('Same seed + worker ID across both conditions'),'pairing basis must be explicit');
assert.ok((html.match(/Matched worker W0/g)||[]).length===2,'each pane legend must identify the matched worker');

assert.ok(app.includes('function matchedCompareWorkerIds()'),'matched ID resolver missing');
assert.ok(app.includes('const idsB=new Set(comparePair.b.ants.map(ant=>String(ant.id)))'),'matched IDs must be resolved across both simulations');
assert.ok(app.includes('function updateCompareMatchDisplay()'),'matched-worker display updater missing');
assert.ok(app.includes('Worker W${id} ↔ Worker W${id}'),'matched worker A/B identity label missing');
assert.ok(app.includes('paired by seed + worker ID'),'matched identity basis missing from live display');
assert.ok(app.includes("comparePair.selectedId=null"),'matched selection must reset with each new pair');

assert.ok(app.includes("c.strokeStyle=selected?'#d9f99d':'rgba(217,249,157,.55)'"),'matched worker ring styling missing');
assert.ok(app.includes("`${selected?'MATCH ':''}W${ant.id}`"),'matched worker canvas label missing');
assert.ok(app.includes('function selectCompareWorkerFromCanvas(canvas,targetSim,event)'),'compare worker selection handler missing');
assert.ok(app.includes('comparePair.selectedId=best.id;renderComparePair();'),'selection in one pane must rerender both panes');
assert.ok(app.includes("ui.compareCanvasA.addEventListener('click'"),'Condition A matched selection listener missing');
assert.ok(app.includes("ui.compareCanvasB.addEventListener('click'"),'Condition B matched selection listener missing');

assert.ok(css.includes('.compare-match-card'),'matched worker card styling missing');
assert.ok(css.includes('.compare-match-glyph'),'A/B link glyph styling missing');
assert.ok(css.includes('.dot.matched'),'matched worker legend styling missing');
assert.ok(html.includes('Step 9 adds side-by-side comparison metrics.'),'step-8 completion copy missing');

console.log('compare-matched-worker-visualization.test.js PASS');
