const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');
const app=fs.readFileSync('src/app.js','utf8');

for(const id of ['compareCanvasA','compareCanvasB','compareStatusA','compareStatusB','comparePlaceholderA','comparePlaceholderB']){
  assert.ok(html.includes(`id="${id}"`),`missing dual-canvas element #${id}`);
}
assert.ok(html.includes('width="720" height="420"'),'compare canvases must have explicit intrinsic dimensions');
assert.ok(html.includes('aria-label="Condition A comparison arena"'),'Condition A canvas must be labelled');
assert.ok(html.includes('aria-label="Condition B comparison arena"'),'Condition B canvas must be labelled');
assert.ok((html.match(/class="compare-pane"/g)||[]).length===2,'expected exactly two compare panes');
assert.ok((html.match(/class="compare-mini-legend"/g)||[]).length===2,'expected a mini legend for each pane');

assert.ok(css.includes('.compare-canvas-wrap'),'dual-canvas wrapper styling missing');
assert.ok(css.includes('grid-template-columns:minmax(0,1fr) minmax(0,1fr)'),'desktop compare panes must be equal-width responsive columns');
assert.ok(css.includes('.compare-canvas-wrap canvas'),'compare canvas responsive styling missing');

assert.ok(app.includes("function drawCompareCanvasPlaceholder(canvas,label)"),'compare canvas placeholder renderer missing');
assert.ok(app.includes("drawCompareCanvasPlaceholder(ui.compareCanvasA,'CONDITION A')"),'Condition A canvas initialization missing');
assert.ok(app.includes("drawCompareCanvasPlaceholder(ui.compareCanvasB,'CONDITION B')"),'Condition B canvas initialization missing');
assert.ok(app.includes("initializeCompareCanvases();\n      ui.play.textContent")===false,'placeholder setup must not replace single-mode playback code');

console.log('compare-dual-canvas.test.js PASS');
