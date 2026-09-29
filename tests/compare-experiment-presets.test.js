const assert=require('assert');
const fs=require('fs');

const app=fs.readFileSync('src/app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('src/style.css','utf8');

for(const id of ['comparePresetSelect','comparePresetHelp','comparePresetDescription','comparePresetBadge','compareMetricsLabelA','compareMetricsLabelB','compareOverlayLabelA','compareOverlayLabelB']){
  assert.ok(html.includes(`id="${id}"`),`missing preset UI #${id}`);
}
assert.ok(html.includes('Comparison preset'),'preset selector label missing');
assert.ok(html.includes('P4 marked vs exact zero-dose is now available'),'step-13 preset availability copy missing');
assert.ok(html.includes('P4 left vs right remains locked until step 14.'),'step-13 handoff copy missing');

assert.ok(app.includes("const COMPARE_PRESETS={"),'central compare preset registry missing');
assert.ok(app.includes("'open-arena-20-vs-100':{"),'open-arena preset missing');
assert.ok(app.includes("fileA:'open_arena_short_control.json',fileB:'open_arena_long_control.json'"),'open-arena preset files incorrect');
assert.ok(app.includes("labelA:'20 cm',labelB:'100 cm',readyStatus:'20 cm VS 100 cm',metricMode:'numeric',enabled:true"),'open-arena preset must remain enabled by default');

assert.ok(app.includes("'p4-marked-vs-zero':{"),'P4 marked-vs-zero preset must be staged');
assert.ok(app.includes("fileA:'y_maze_p4_left_consistency_v1.json',fileB:'y_maze_p4_neutral_consistency_v1.json'"),'P4 marked-vs-zero preset files incorrect');
assert.ok(app.includes("metricMode:'branch-choice',p4Diagnostic:true,enabled:true"),'P4 marked-vs-zero must be enabled as the step-13 branch-choice diagnostic');

assert.ok(app.includes("'p4-left-vs-right':{"),'P4 left-vs-right preset must be staged');
assert.ok(app.includes("fileA:'y_maze_p4_left_consistency_v1.json',fileB:'y_maze_p4_right_consistency_v1.json'"),'P4 left-vs-right preset files incorrect');
assert.ok(app.includes("enabled:false,unlockStep:14"),'P4 left-vs-right must remain locked until step 14');

assert.ok(app.includes("const DEFAULT_COMPARE_PRESET_ID='open-arena-20-vs-100';"),'default compare preset must remain open arena');
assert.ok(app.includes('function selectedComparePreset()'),'preset selection resolver missing');
assert.ok(app.includes("if(requested?.enabled)return requested;"),'disabled presets must fail closed');
assert.ok(app.includes("ui.comparePresetSelect.value=DEFAULT_COMPARE_PRESET_ID"),'invalid/locked preset selection must fall back to the default');
assert.ok(app.includes('function initializeComparePresets()'),'preset selector initializer missing');
assert.ok(app.includes('option.disabled=!preset.enabled;'),'locked presets must be disabled in the selector');
assert.ok(app.includes('function applyComparePresetUi(preset)'),'preset metadata UI updater missing');

assert.ok(app.includes('loadBundle(preset.fileA)'),'Condition A must load from active preset metadata');
assert.ok(app.includes('loadBundle(preset.fileB)'),'Condition B must load from active preset metadata');
assert.ok(!app.includes("loadBundle('open_arena_short_control.json')"),'paired loader must no longer hard-code the open-arena A file');
assert.ok(!app.includes("loadBundle('open_arena_long_control.json')"),'paired loader must no longer hard-code the open-arena B file');
assert.ok(app.includes("comparePair.presetId=preset.id"),'loaded pair must retain its preset identity');
assert.ok(app.includes("ui.comparePresetSelect.addEventListener('change',()=>{if(viewMode==='compare')resetComparePair();});"),'changing an enabled preset must rebuild the pair');
assert.ok(app.includes('initializeComparePresets();initializeCompareCanvases();'),'preset registry must initialize before compare rendering');

assert.ok(css.includes('.compare-preset-tools'),'preset selector styling missing');

console.log('compare-experiment-presets.test.js PASS');
