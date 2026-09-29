const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

for(const id of [
  'compareLegendTitle','compareLegendScoring','compareLegendPathA','compareLegendPathB',
  'compareLegendTrailA','compareLegendTrailB','compareLegendTrailALabel','compareLegendTrailBLabel',
  'compareTreatmentDifference','compareTreatmentA','compareTreatmentB',
  'comparePaneScoringA','comparePaneScoringB','comparePaneTreatmentA','comparePaneTreatmentB',
  'compareOverlayScoringLabel','compareOverlayTrailA','compareOverlayTrailB',
  'compareOverlayTrailALabel','compareOverlayTrailBLabel'
]){
  assert.ok(html.includes(`id="${id}"`),`missing compare legend UI #${id}`);
}
assert.ok(html.includes('COMPARE KEY'),'compare legend kicker missing');
assert.ok(html.includes('ONLY DESIGNED CONDITION DIFFERENCE'),'treatment-difference key missing');
assert.ok(html.includes('Matched worker W0 on both sides'),'matched-worker legend missing');
assert.ok(html.includes('Step 16 adds a comparison completion state.'),'step-15 completion copy missing');

assert.ok(app.includes("legendScoring:'Arena-edge scoring region'"),'open-arena scoring legend metadata missing');
assert.ok(app.includes("difference:'Constrained approach distance before arena entry'"),'open-arena treatment difference missing');
assert.ok(app.includes("treatmentA:'20 cm approach · DCM control'"),'open-arena A treatment legend missing');
assert.ok(app.includes("treatmentB:'100 cm approach · DCM control'"),'open-arena B treatment legend missing');

assert.ok(app.includes("difference:'P4 painted-trail dose'"),'marked-zero difference legend missing');
assert.ok(app.includes("treatmentB:'Exact zero-dose identity control'"),'zero-dose treatment legend missing');
assert.ok(app.includes("trailA:'Left-arm P4 marked trail',trailB:null"),'marked-zero trail legend metadata missing');

assert.ok(app.includes("difference:'Which Y-maze arm carries the same frozen P4 dose'"),'left-right difference legend missing');
assert.ok(app.includes("trailA:'Left-arm P4 marked trail',trailB:'Right-arm P4 marked trail'"),'left-right dual trail legend metadata missing');

assert.ok(app.includes("ui.compareLegendPathA.textContent=`A path · ${preset.labelA}`;"),'A path legend must follow preset label');
assert.ok(app.includes("ui.compareLegendPathB.textContent=`B path · ${preset.labelB}`;"),'B path legend must follow preset label');
assert.ok(app.includes('ui.compareLegendScoring.textContent=preset.legendScoring;'),'scoring legend must follow preset metadata');
assert.ok(app.includes('ui.compareTreatmentDifference.textContent=preset.difference;'),'designed difference must follow preset metadata');
assert.ok(app.includes('ui.comparePaneTreatmentA.textContent=preset.treatmentA;'),'Condition A pane treatment key missing');
assert.ok(app.includes('ui.comparePaneTreatmentB.textContent=preset.treatmentB;'),'Condition B pane treatment key missing');
assert.ok(app.includes('ui.compareLegendTrailA.hidden=!trailA;ui.compareOverlayTrailA.hidden=!trailA;'),'A trail legend visibility must follow active preset');
assert.ok(app.includes('ui.compareLegendTrailB.hidden=!trailB;ui.compareOverlayTrailB.hidden=!trailB;'),'B trail legend visibility must follow active preset');

assert.ok(css.includes('.compare-legend-card'),'compare legend card styling missing');
assert.ok(css.includes('.compare-legend-grid [hidden],.compare-overlay-legend [hidden] { display:none; }'),'hidden trail keys must not occupy layout');
assert.ok(css.includes('.compare-trail-swatch.trail-a'),'Condition A P4 trail swatch missing');
assert.ok(css.includes('.compare-trail-swatch.trail-b'),'Condition B P4 trail swatch missing');
assert.ok(css.includes('.compare-condition-chip.condition-a'),'Condition A chip styling missing');
assert.ok(css.includes('.compare-condition-chip.condition-b'),'Condition B chip styling missing');

console.log('compare-legends.test.js PASS');
