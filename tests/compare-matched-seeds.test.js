const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.ok(app.includes("comparePair.a=new SimulationA(bundleA,seed);"),'Condition A must use the selected compare seed');
assert.ok(app.includes("comparePair.b=new SimulationB(bundleB,seed);"),'Condition B must use the exact same compare seed');
assert.ok(!app.includes("new SimulationB(bundleB,seed+1)"),'Condition B must never offset the matched seed');
assert.ok(!app.includes("READY · seed ${seed+1}"),'UI must not report an offset seed');
assert.ok(app.includes("ui.compareStatusA.textContent=`${preset.labelA} · seed ${seed} · MATCHED`;"),'Condition A matched-seed badge must use preset metadata');
assert.ok(app.includes("ui.compareStatusB.textContent=`${preset.labelB} · seed ${seed} · MATCHED`;"),'Condition B matched-seed badge must use preset metadata');
assert.ok(html.includes('Matched-seed comparison of the 20 cm and 100 cm open-arena control approaches.'),'matched-seed user-facing note missing');

console.log('compare-matched-seeds.test.js PASS');
