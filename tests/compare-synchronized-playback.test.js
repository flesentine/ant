const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.ok(app.includes("if(running&&viewMode==='single'&&sim)"),'single playback must be isolated to single mode');
assert.ok(app.includes("else if(running&&viewMode==='compare'&&comparePair.a&&comparePair.b)"),'compare playback branch missing');
assert.ok(app.includes("if(activeA)a.step(FIXED_DT);"),'Condition A must advance by the fixed timestep');
assert.ok(app.includes("if(activeB)b.step(FIXED_DT);"),'Condition B must advance by the same fixed timestep');
assert.ok(app.includes("comparePair.clock+=FIXED_DT;"),'paired playback clock must advance once per shared step');
assert.ok(app.includes("simBudget+=wallDt*Number(ui.speed.value)"),'speed control must drive the shared fixed-step budget');
assert.ok(app.includes("function stepCompareOneSecond()"),'paired Step 1 s handler missing');
assert.ok(app.includes("const steps=Math.round(1/FIXED_DT);"),'paired Step 1 s must use fixed timesteps');
assert.ok(app.includes("if(viewMode==='compare')resetComparePair();else reset();"),'Reset must target the active mode');
assert.ok(app.includes("if(viewMode==='compare')resetComparePair();else reset();"),'compare reset routing missing');
assert.ok(app.includes("ui.seed.addEventListener('change',()=>{if(viewMode==='compare')resetComparePair();else reset();});"),'seed changes must reset both compare simulations');
assert.ok(app.includes("[ui.seed,ui.speed,ui.play,ui.step,ui.reset].forEach(control=>{if(control)control.disabled=false;});"),'compare transport controls must remain enabled');
assert.ok(html.includes('Run, Pause, Speed, Step 1 s, Reset, and seed changes control both simulations together.'),'synchronized playback user-facing note missing');

console.log('compare-synchronized-playback.test.js PASS');
