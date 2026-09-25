const assert=require('assert');
const fs=require('fs');

const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');
const app=fs.readFileSync('src/app.js','utf8');

for(const id of ['singleModeBtn','compareModeBtn','singleModeView','compareModeView']){
  assert.ok(html.includes(`id="${id}"`),`missing compare-mode shell element #${id}`);
}
assert.ok(html.includes('aria-pressed="true"'),'single mode must be selected accessibly by default');
assert.ok(html.includes('Paired experiment workspace'),'compare shell copy missing');
assert.ok(css.includes('.compare-shell[hidden]'),'compare shell must hide explicitly');
assert.ok(css.includes('.mode-switch'),'mode-switch styling missing');
assert.ok(app.includes("function setViewMode(mode)"),'mode switch behavior missing');
assert.ok(app.includes("setSingleControlsDisabled(compare)"),'single-run controls must be disabled while compare shell is active');
assert.ok(app.includes("ui.singleModeBtn.addEventListener('click'"),'single mode listener missing');
assert.ok(app.includes("ui.compareModeBtn.addEventListener('click'"),'compare mode listener missing');
assert.ok(app.includes("setViewMode('single');reset();"),'single mode must remain the default startup path');

console.log('compare-mode-shell.test.js PASS');
