const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

for(const id of ['compareSummaryTitle','compareSummaryText','compareSummaryQualifier']){
  assert.ok(html.includes(`id="${id}"`),`missing comparison summary UI #${id}`);
}
assert.ok(html.includes('WHAT THIS SEED SHOWS'),'plain-English summary kicker missing');
assert.ok(html.includes('Plain-English comparison'),'plain-English summary heading missing');
assert.ok(html.includes('aria-live="polite"'),'live summary must update accessibly');
assert.ok(html.includes('Descriptive simulation output only; this does not establish a biological effect.'),'initial scientific caveat missing');
assert.ok(html.includes('TRAJECTORY OVERLAY'),'plain-English summary must flow into the trajectory overlay feature');

assert.ok(app.includes('function compareDifferenceClause(a,b'),'comparison sentence delta helper missing');
assert.ok(app.includes('const delta=b-a'),'plain-English differences must preserve B minus A direction');
assert.ok(app.includes('function buildCompareSummary(a,b)'),'summary builder missing');
assert.ok(app.includes("if(!started)return`The matched pair is ready. Start the run to compare ${preset.labelA} and ${preset.labelB}.`;"),'pre-run summary must use preset labels without claiming a result');
assert.ok(app.includes("const prefix=finished?`For this completed simulated seed, the ${preset.labelB} condition`:`So far for this simulated seed, the ${preset.labelB} condition`;"),'summary must distinguish partial from completed runs using preset labels');
assert.ok(app.includes("positive:'later',negative:'sooner'"),'edge-time summary direction must be correct');
assert.ok(app.includes("positive:'farther',negative:'less far'"),'distance summary direction must be correct');
assert.ok(app.includes("positive:'higher in mean moving speed',negative:'lower in mean moving speed'"),'speed summary direction must be correct');
assert.ok(app.includes('const selected=clauses.slice(0,3);'),'summary must stay concise rather than dumping every metric');
assert.ok(app.includes("has no displayed difference from the ${preset.labelA} condition at the current metric precision."),'equal-at-display-precision state must use preset labels');
assert.ok(app.includes("Observed differences are not available yet for this matched seed."),'unavailable-data state missing');
assert.ok(app.includes('function updateCompareSummary(a,b)'),'summary UI updater missing');
assert.ok(app.includes("not biological validation or causal evidence."),'summary must explicitly avoid biological/causal overclaiming');
assert.ok(app.includes('updateCompareSummary(a,b);'),'summary must update from the same observed A/B snapshots as the metrics panel');

assert.ok(css.includes('.compare-summary-card'),'comparison summary card styling missing');
assert.ok(css.includes('.compare-summary-icon'),'comparison summary visual marker missing');

console.log('compare-plain-language-summary.test.js PASS');
