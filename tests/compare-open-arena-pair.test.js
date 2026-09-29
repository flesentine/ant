const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const short=JSON.parse(fs.readFileSync('experiments/open_arena_short_control.json','utf8'));
const long=JSON.parse(fs.readFileSync('experiments/open_arena_long_control.json','utf8'));

assert.ok(app.includes("fileA:'open_arena_short_control.json'"),'default preset must reference the 20 cm control');
assert.ok(app.includes("fileB:'open_arena_long_control.json'"),'default preset must reference the 100 cm control');
assert.ok(app.includes("loadBundle(preset.fileA)")&&app.includes("loadBundle(preset.fileB)"),'comparison pair must load both conditions through the active preset');
assert.ok(app.includes("comparePair.a=new SimulationA(bundleA,seed);"),'20 cm condition must use bundle A');
assert.ok(app.includes("comparePair.b=new SimulationB(bundleB,seed);"),'100 cm condition must use bundle B');
assert.ok(app.includes("ui.status.textContent=`${preset.readyStatus} READY`;"),'ready state must identify the active preset');

assert.strictEqual(short.protocol.approach_distance_mm,200,'short control must remain 20 cm');
assert.strictEqual(long.protocol.approach_distance_mm,1000,'long control must remain 100 cm');
assert.strictEqual(short.model,long.model,'comparison must hold the model constant');
assert.strictEqual(short.apparatus,long.apparatus,'comparison must hold apparatus constant');
assert.strictEqual(short.observation,long.observation,'comparison must hold observation profile constant');
assert.strictEqual(short.scoring,long.scoring,'comparison must hold scoring constant');
assert.deepStrictEqual(short.protocol.treatment,long.protocol.treatment,'comparison must hold solvent treatment constant');
assert.ok(html.includes('20 CM ↔ 100 CM'),'compare shell must identify the active pair');
assert.ok(html.includes('Matched-seed comparison of the 20 cm and 100 cm open-arena control approaches.'),'pair explanation missing');

console.log('compare-open-arena-pair.test.js PASS');
