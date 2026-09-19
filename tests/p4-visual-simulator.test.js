'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(read(p));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const frozen=[
  ['models/lasius_niger_painted_trail_p4_fitted_v1.json','e23b022279d463442bdd4e16d4cf56e0212d2b11'],
  ['src/p4.js','bf7d5781bd69ec4568450ebbd3bdc284897b6f61'],
  ['src/p1.js','f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca'],
  ['apparatus/poissonnier2026_y_maze_p4_left_v1.json','219d42036c13463e8cae5045b8fdba6d5bd24454'],
  ['apparatus/poissonnier2026_y_maze_p4_right_v1.json','bfcba7e34eed4b4f79e67d6fc22c60af993f5386'],
  ['experiments/y_maze_p4_left_consistency_v1.json','08edc2d3ef9899820c04e900154f1b4bee2a5104'],
  ['experiments/y_maze_p4_right_consistency_v1.json','217f94ec4ba61a61c7956baeac34abd19cf5eec8'],
  ['experiments/y_maze_p4_neutral_consistency_v1.json','e58cf3f4f5c51168f2dc267af7a820bc5b875b90']
];
for(const [rel,sha] of frozen)assert.strictEqual(blob(rel),sha,rel+' frozen science blob drift');

const model=json(frozen[0][0]);
assert.strictEqual(model.provenance.candidate_index,307);
assert.deepStrictEqual({
  sigma_field_mm:model.painted_trail_response.field.sigma_field_mm,
  kappa_trail_per_s:model.painted_trail_response.steering.kappa_trail_per_s,
  theta_detect:model.painted_trail_response.absolute_detection.theta_detect
},{
  sigma_field_mm:18.319554310908863,
  kappa_trail_per_s:6.342935528120713,
  theta_detect:0.9184
});
assert.strictEqual(model.status,'frozen_fitted_candidate_307_for_cross_apparatus_consistency');

for(const [file,side] of [
  ['experiments/y_maze_p4_left_consistency_v1.json','left'],
  ['experiments/y_maze_p4_right_consistency_v1.json','right']
]){
  const e=json(file);
  assert.strictEqual(e.model,'lasius_niger_painted_trail_p4_fitted_v1');
  assert.strictEqual(e.protocol.treatment.marked_side,side);
  assert.strictEqual(e.protocol.painted_trail.applied_hindgut_equivalents_per_cm,0.0048);
  assert.strictEqual(e.calibration_role,'frozen_cross_apparatus_consistency_surface_not_fit');
  assert.strictEqual(e.metadata.evidence_class,'posthoc_same_study_cross_apparatus_consistency_only');
}
const neutral=json('experiments/y_maze_p4_neutral_consistency_v1.json');
assert.strictEqual(neutral.protocol.painted_trail.applied_hindgut_equivalents_per_cm,0);
assert.strictEqual(neutral.metadata.evidence_class,'synthetic_control_not_biological_fit');

const html=read('index.html'),app=read('src/app.js');
const pages=read('.github/workflows/pages.yml');
assert.match(pages,/cp src\/app\.js[^\n]*src\/p1\.js[^\n]*src\/p4\.js[^\n]*_site\/src\//,'Pages artifact must ship P1 helper and P4 runtime');
assert.ok(html.includes('H5-v1 failed promotion'),'frozen H5 failed-promotion disclosure missing');
assert.ok(html.includes('official result frozen'),'frozen H5 result disclosure missing');
assert.ok(html.includes('H5-v1 closed'),'frozen H5 closure disclosure missing');

for(const name of [
  'y_maze_p4_left_consistency_v1.json',
  'y_maze_p4_right_consistency_v1.json',
  'y_maze_p4_neutral_consistency_v1.json'
])assert.ok(html.includes(name),'browser dropdown missing '+name);
assert.ok(html.includes('./src/p1.js'),'P1 helper must load before P4');
assert.ok(html.includes('./src/p4.js'),'P4 browser runtime missing');
assert.ok(html.indexOf('./src/p1.js')<html.indexOf('./src/p4.js'),'P1 helper must load before P4 runtime');
assert.ok(html.indexOf('./src/p4.js')<html.indexOf('./src/app.js'),'P4 runtime must load before app');
assert.match(html,/visualization-only|visualization only/i);
assert.match(html,/noncanonical/i);
assert.match(html,/no retuning/i);

assert.match(app,/function simulationClassFor\(bundle\)/);
assert.match(app,/P4_local_sector_hard_detection_weber_steering_v1/);
assert.match(app,/return window\.AntLabP4\.Simulation/);
assert.match(app,/return window\.AntLabIntegrity\.Simulation/);
assert.match(app,/drawExternalFields/);
assert.match(app,/p4DoseRatio\)>0/,'zero-dose overlay guard missing');
assert.match(app,/PHEROMONE TRAIL/);
assert.match(app,/noncanonical descriptive visualization only/);
assert.ok(!/Candidate 307[^\n]*should choose/i.test(app),'UI must not imply deterministic individual choice');

console.log('p4-visual-simulator.test.js PASS '+JSON.stringify({
  candidate:307,
  frozen_science_blobs:frozen.length,
  visual_experiments:3,
  browser_runtime:'AntLabP4',
  canonical_runtime_fallback:'AntLabIntegrity',
  scientific_files_changed:false
}));
