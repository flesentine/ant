const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

const ids=[
  'compareSpeedA','compareSpeedB','compareSpeedDelta',
  'compareDistanceA','compareDistanceB','compareDistanceDelta',
  'compareStraightnessA','compareStraightnessB','compareStraightnessDelta',
  'compareEdgeTimeA','compareEdgeTimeB','compareEdgeTimeDelta',
  'compareCentralA','compareCentralB','compareCentralDelta',
  'compareOutcomeA','compareOutcomeB','compareOutcomeDelta','compareMetricsNote'
];
for(const id of ids) assert.ok(html.includes(`id="${id}"`),`missing comparison metric output #${id}`);

assert.ok(html.includes('Observed metrics'),'comparison panel heading missing');
assert.ok(html.includes('B − A'),'delta direction must be explicit');
assert.ok(html.includes('Time to arena edge'),'edge-time row missing');
assert.ok(html.includes('Central-zone fraction'),'central-zone row missing');
assert.ok(html.includes('WHAT THIS SEED SHOWS'),'metrics panel must flow into the plain-English summary');

assert.ok(app.includes('function compareObservedSnapshot(targetSim)'),'observed snapshot adapter missing');
assert.ok(app.includes("const summary=targetSim.summary(),means=summary.observed_metrics?.means||{},observedRows=summary.observed_metrics?.ants||[]"),'comparison values must come from observed measurement summaries');
assert.ok(app.includes('function formatCompareDelta(a,b'),'delta formatter missing');
assert.ok(app.includes('const delta=b-a'),'delta must be Condition B minus Condition A');
assert.ok(app.includes("return Number.isFinite(value)"),'missing values must be handled without fabricated numbers');
assert.ok(app.includes("if(!Number.isFinite(a)||!Number.isFinite(b))return'—';"),'delta must remain unavailable until both sides are observable');
assert.ok(app.includes('function updateCompareMetrics()'),'live comparison updater missing');
assert.ok(app.includes("['speed',ui.compareSpeedA,ui.compareSpeedB,ui.compareSpeedDelta"),'speed row wiring missing');
assert.ok(app.includes("['distance',ui.compareDistanceA,ui.compareDistanceB,ui.compareDistanceDelta"),'distance row wiring missing');
assert.ok(app.includes("['straightness',ui.compareStraightnessA,ui.compareStraightnessB,ui.compareStraightnessDelta"),'straightness row wiring missing');
assert.ok(app.includes("['edgeTime',ui.compareEdgeTimeA,ui.compareEdgeTimeB,ui.compareEdgeTimeDelta"),'edge-time row wiring missing');
assert.ok(app.includes("['central',ui.compareCentralA,ui.compareCentralB,ui.compareCentralDelta"),'central-zone row wiring missing');
assert.ok(app.includes("ui.compareOutcomeDelta.textContent=a.outcome==='—'||b.outcome==='—'?'—':(a.outcome===b.outcome?'same':'different')"),'outcome comparison must be categorical, not a numeric delta');
assert.ok(app.includes('updateCompareMetrics();\n    updateComparePlaybackStatus();'),'metrics must refresh with compare rendering');

assert.ok(css.includes('.compare-metrics-table'),'comparison metrics table styling missing');
assert.ok(css.includes('grid-template-columns:minmax(130px,1.35fr) repeat(3,minmax(88px,.8fr))'),'metrics need aligned Metric/A/B/Delta columns');
assert.ok(css.includes('.compare-metrics-table { min-width:570px; }'),'mobile metrics table must preserve readable columns');

const singleLegend=html.match(/<div class="legend">[\s\S]*?<\/div>/)?.[0]||'';
assert.ok(singleLegend.includes('<i class="dot ant"></i>Worker'),'single-run legend must remain generic');
assert.ok(!singleLegend.includes('Matched worker'),'single-run legend must not claim an A/B match');
assert.strictEqual((html.match(/<div class="compare-mini-legend"[\s\S]*?Matched worker W0[\s\S]*?<\/div>/g)||[]).length,2,'both compare pane legends must identify the matched worker');

console.log('compare-metrics-panel.test.js PASS');
