const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

for(const id of ['replaySeedBtn','nextSeedBtn','compareSeedReadout']){
  assert.ok(html.includes(`id="${id}"`),`missing compare seed control #${id}`);
}
assert.ok(html.includes('Replay same seed'),'Replay same seed label missing');
assert.ok(html.includes('Next seed'),'Next seed label missing');
assert.ok(html.includes('role="group" aria-label="Matched-seed replay controls"'),'seed controls need an accessible group label');

assert.ok(app.includes("function normalizeCompareSeed(value)"),'compare seed normalizer missing');
assert.ok(app.includes("function replaySameCompareSeed()"),'replay handler missing');
assert.ok(app.includes("const seed=normalizeCompareSeed(comparePair.seed??ui.seed.value);"),'replay must prefer the actually loaded pair seed');
assert.ok(app.includes("ui.seed.value=String(seed);\n    resetComparePair();"),'replay must restore the loaded seed then rebuild the pair');
assert.ok(app.includes("function nextCompareSeed()"),'next-seed handler missing');
assert.ok(app.includes("const next=seed>=Number.MAX_SAFE_INTEGER?1:seed+1;"),'next seed must increment safely and wrap at MAX_SAFE_INTEGER');
assert.ok(app.includes("ui.seed.value=String(next);\n    resetComparePair();"),'next seed must update the shared seed then rebuild both simulations');
assert.ok(app.includes("ui.replaySeedBtn.addEventListener('click',replaySameCompareSeed)"),'Replay same seed listener missing');
assert.ok(app.includes("ui.nextSeedBtn.addEventListener('click',nextCompareSeed)"),'Next seed listener missing');
assert.ok(app.includes("ui.compareSeedReadout.textContent=`Seed ${seed} · matched A/B`;"),'matched seed readout must track the loaded pair');
assert.ok(css.includes('.compare-seed-tools'),'compare seed toolbar styling missing');
assert.ok(html.includes('Step 8 adds matched-ant visualization.'),'step-7 completion copy missing');

console.log('compare-seed-replay.test.js PASS');
