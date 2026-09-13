'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const integrity=require('../src/integrity.js');
const p4=require('../src/p4.js');
const {loadBundle}=require('../tools/load-bundle.js');
const runner=require('../tools/run-p4-ymaze-consistency.js');
const comparator=require('../tools/compare-p4-ymaze-consistency.js');
const root=path.resolve(__dirname,'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const blob=rel=>execFileSync('git',['hash-object',rel],{cwd:root,encoding:'utf8'}).trim();
const clone=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>Object.is(a,b);
function assertExactAntIdentity(a,b,label){
  const keys=['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'];
  for(const k of keys)assert.ok(same(a[k],b[k]),label+': ant.'+k+' drifted '+a[k]+' vs '+b[k]);
  assert.strictEqual(a.rng.state,b.rng.state,label+': biology RNG state drifted');
  assert.strictEqual(a.state,b.state,label+': state drifted');
  assert.strictEqual(a.finished,b.finished,label+': finished drifted');
  assert.strictEqual(a.outcome,b.outcome,label+': outcome drifted');
  assert.ok(same(a.completedAt,b.completedAt),label+': completedAt drifted');
  assert.ok(same(a.exitX,b.exitX),label+': exitX drifted');
  assert.ok(same(a.exitY,b.exitY),label+': exitY drifted');
}

const PINS={
  authorization:'db64b72830c3715b3dd26d5ad3422655e50e8828',
  protocol:'22515a3fe0945c0f19b6fb2166923f027bbf1b54',
  runtime:'bf7d5781bd69ec4568450ebbd3bdc284897b6f61',
  p1:'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca',
  engineeringModel:'3d8460b6916a90d06e70768f696ee3f0d48fccf4',
  fittedModel:'e23b022279d463442bdd4e16d4cf56e0212d2b11',
  baseApparatus:'eca7a0e66aed9546e5fc26c08f7abaa37bb3cbc8',
  leftApparatus:'219d42036c13463e8cae5045b8fdba6d5bd24454',
  rightApparatus:'bfcba7e34eed4b4f79e67d6fc22c60af993f5386',
  leftExperiment:'08edc2d3ef9899820c04e900154f1b4bee2a5104',
  rightExperiment:'217f94ec4ba61a61c7956baeac34abd19cf5eec8',
  neutralExperiment:'e58cf3f4f5c51168f2dc267af7a820bc5b875b90',
  runner:'fe3bff285290d0d612a5b9ab665e887c728e3d2e',
  comparator:'75cf0ae6075695784e7c67c1473a50e0daaa98cc'
};
for(const [rel,sha] of Object.entries({
  'hypotheses/p4_Y_maze_consistency_implementation_authorization_v1.json':PINS.authorization,
  'hypotheses/p4_cross_apparatus_Y_maze_consistency_protocol_v1.json':PINS.protocol,
  'src/p4.js':PINS.runtime,
  'src/p1.js':PINS.p1,
  'models/lasius_niger_painted_trail_p4_v1.json':PINS.engineeringModel,
  'models/lasius_niger_painted_trail_p4_fitted_v1.json':PINS.fittedModel,
  'apparatus/poissonnier2026_y_maze.json':PINS.baseApparatus,
  'apparatus/poissonnier2026_y_maze_p4_left_v1.json':PINS.leftApparatus,
  'apparatus/poissonnier2026_y_maze_p4_right_v1.json':PINS.rightApparatus,
  'experiments/y_maze_p4_left_consistency_v1.json':PINS.leftExperiment,
  'experiments/y_maze_p4_right_consistency_v1.json':PINS.rightExperiment,
  'experiments/y_maze_p4_neutral_consistency_v1.json':PINS.neutralExperiment,
  'tools/run-p4-ymaze-consistency.js':PINS.runner,
  'tools/compare-p4-ymaze-consistency.js':PINS.comparator
}))assert.strictEqual(blob(rel),sha,rel+' blob drift');

const eng=read('models/lasius_niger_painted_trail_p4_v1.json'),fit=read('models/lasius_niger_painted_trail_p4_fitted_v1.json');
assert.strictEqual(fit.id,'lasius_niger_painted_trail_p4_fitted_v1');
assert.strictEqual(fit.provenance.candidate_index,307);
assert.strictEqual(fit.painted_trail_response.field.sigma_field_mm,18.319554310908863);
assert.strictEqual(fit.painted_trail_response.steering.kappa_trail_per_s,6.342935528120713);
assert.strictEqual(fit.painted_trail_response.absolute_detection.theta_detect,0.9184);
const normalized=clone(fit);
normalized.id=eng.id;normalized.status=eng.status;normalized.provenance=eng.provenance;
normalized.painted_trail_response.field.sigma_field_mm=eng.painted_trail_response.field.sigma_field_mm;
normalized.painted_trail_response.steering.kappa_trail_per_s=eng.painted_trail_response.steering.kappa_trail_per_s;
normalized.painted_trail_response.absolute_detection.theta_detect=eng.painted_trail_response.absolute_detection.theta_detect;
assert.deepStrictEqual(normalized,eng,'fitted model changed unauthorized biological/numerical structure');

const baseApp=read('apparatus/poissonnier2026_y_maze.json'),leftApp=read('apparatus/poissonnier2026_y_maze_p4_left_v1.json'),rightApp=read('apparatus/poissonnier2026_y_maze_p4_right_v1.json');
for(const a of [leftApp,rightApp])for(const key of ['world','geometry','boundary','entry_points','terminal_regions'])assert.deepStrictEqual(a[key],baseApp[key],key+' geometry drift');
const field=a=>a.external_fields.painted_trail;
assert.deepStrictEqual(field(leftApp).line_segment_mm,{x1:140,y1:120,x2:190,y2:33.3975});
assert.deepStrictEqual(field(rightApp).line_segment_mm,{x1:140,y1:120,x2:190,y2:206.6025});
for(const a of [leftApp,rightApp]){assert.strictEqual(field(a).type,'line_segment_scalar_field');assert.strictEqual(field(a).nominal_dose_hindgut_equivalents_per_cm,0.0048);assert.strictEqual(field(a).directionality,'undirected');}

for(const [file,side,apparatus,dose] of [
  ['experiments/y_maze_p4_left_consistency_v1.json','left','poissonnier2026_y_maze_p4_left_v1',0.0048],
  ['experiments/y_maze_p4_right_consistency_v1.json','right','poissonnier2026_y_maze_p4_right_v1',0.0048],
  ['experiments/y_maze_p4_neutral_consistency_v1.json',null,'poissonnier2026_y_maze_p4_left_v1',0]
]){
  const e=read(file);assert.strictEqual(e.model,'lasius_niger_painted_trail_p4_fitted_v1');assert.strictEqual(e.apparatus,apparatus);assert.strictEqual(e.duration_s,90);assert.strictEqual(e.workers,1);assert.strictEqual(e.protocol.entry_point,'stem');assert.deepStrictEqual(e.protocol.entry_state,{heading_rad:0,position_jitter_mm:0.4,heading_jitter_rad:0.05});assert.strictEqual(e.scoring,'y_maze_endpoint_engineering_v1');assert.strictEqual(e.protocol.painted_trail.applied_hindgut_equivalents_per_cm,dose);if(side)assert.strictEqual(e.protocol.treatment.marked_side,side);
}

const runnerSource=fs.readFileSync(path.join(root,'tools/run-p4-ymaze-consistency.js'),'utf8');
for(const forbidden of ['poissonnier2026_published_targets','poissonnier2026_inventory','raw Experiment 2','colony-level Experiment 2'])assert.ok(!runnerSource.includes(forbidden),'Stage A source contains forbidden semantic input '+forbidden);
assert.deepStrictEqual(runner.PLAN.qualification,{leftRoot:8410000,rightRoot:8410000,markedCount:12,neutralRoot:8510000,neutralCount:12,scientificEvidence:false});
assert.deepStrictEqual(runner.PLAN.official,{leftRoot:8210000,rightRoot:8210000,markedCount:1000,neutralRoot:8310000,neutralCount:1000,scientificEvidence:false});
assert.throws(()=>runner.buildReport('official'),/locked|authorization/i,'official Stage A must remain locked');
assert.throws(()=>comparator.main(['--simulation','does-not-matter.json','--observed','does-not-matter.json','--synthetic']),/locked|authorization/i,'Stage B CLI must remain locked before it can consider any retired input override');
for(const args of [['--simulation','x.json'],['--observed','x.json'],['--synthetic']])assert.throws(()=>comparator.parseRealCliArgs(args),/forbidden/i,'real Stage B must reject caller-selected input overrides');
assert.deepStrictEqual(comparator.parseRealCliArgs([]),{out:null});
assert.deepStrictEqual(comparator.parseRealCliArgs(['--out','reports/example.json']),{out:'reports/example.json'});
assert.throws(()=>comparator.rate(null,'missing model rate'),/finite rate/i,'missing rates must not coerce to zero');
assert.strictEqual(comparator.PUBLISHED_FILE,'reference/poissonnier2026_published_targets.json');
assert.strictEqual(comparator.PUBLISHED_BLOB,'5836b5011d765043f94683fa761f3016e86643dc');
assert.strictEqual(comparator.INVENTORY_FILE,'reference/poissonnier2026_inventory.json');
assert.strictEqual(comparator.INVENTORY_BLOB,'2ff7d9dcd27cf7609ce77b0f655a6520597c2432');
assert.strictEqual(comparator.OFFICIAL_STAGE_A_FILE,'reports/p4_ymaze_consistency_simulation_v1.json');

const publishedFixture={source:'poissonnier2026_final_record',y_maze:{n:10,pheromone_followed:8,condition_results:{outwards_naive:{n:3,correct:2},outwards_experienced:{n:2,correct:2},return_experienced:{n:2,correct:2},return_naive:{n:3,correct:2}}}};
const inventoryFixture={source:'poissonnier2026_final_record',experiment_2:{rows:10,overall:{n:10,correct:8},condition_counts:{ON:{n:3,correct:2},OE:{n:2,correct:2},RE:{n:2,correct:2},RN:{n:3,correct:2}},pheromone_side_counts:{Left:{n:5,correct:4},Right:{n:5,correct:4}}}};
const normalizedFixture=comparator.normalizeFrozenObservedSources(publishedFixture,inventoryFixture);
assert.strictEqual(normalizedFixture.overall,0.8);
assert.deepStrictEqual(normalizedFixture.conditions,{outwards_naive:2/3,outwards_experienced:1,return_experienced:1,return_naive:2/3});
assert.deepStrictEqual(normalizedFixture.pheromone_side,{left:0.8,right:0.8});
assert.strictEqual(normalizedFixture.provenance.normalized_from_frozen_counts,true);
assert.strictEqual(normalizedFixture.provenance.published_targets.git_blob_sha,comparator.PUBLISHED_BLOB);
assert.strictEqual(normalizedFixture.provenance.inventory.git_blob_sha,comparator.INVENTORY_BLOB);
const conflictingInventory=clone(inventoryFixture);conflictingInventory.experiment_2.condition_counts.ON.correct=1;
assert.throws(()=>comparator.normalizeFrozenObservedSources(publishedFixture,conflictingInventory),/disagree/i,'source normalization must fail closed when frozen summaries disagree');

const officialStageAFixture={
  id:'P4_Y_maze_consistency_stage_A_simulation_v1',mode:'official',scientific_evidence:false,
  frozen_candidate:{index:307,sigma_field_mm:18.319554310908863,kappa_trail_per_s:6.342935528120713,theta_detect:0.9184},
  seed_contract:{left_root:8210000,right_root:8210000,marked_count_per_side:1000,neutral_root:8310000,neutral_count:1000,paired_left_right:true},
  left_marked:{trials:1000,left_choices:700,right_choices:250,timeouts:50},
  right_marked:{trials:1000,left_choices:250,right_choices:700,timeouts:50},
  neutral:{trials:1000,left_choices:490,right_choices:490,timeouts:20}
};
assert.strictEqual(comparator.validateOfficialStageAReport(officialStageAFixture),officialStageAFixture);
const qualificationImpostor=clone(officialStageAFixture);qualificationImpostor.id='P4_Y_maze_consistency_reference_free_qualification_simulation_v1';qualificationImpostor.mode='qualification';
assert.throws(()=>comparator.validateOfficialStageAReport(qualificationImpostor),/official frozen Stage A/i,'qualification output must never be accepted as official Stage A');
assert.throws(()=>comparator.loadAuthorizedOfficialStageA({}),/pin the official Stage A/i,'future Stage B authorization must pin the official Stage A blob');

for(const [s,n] of [[0,1],[1,1],[6,12],[12,12]]){const w=runner.wilson95(s,n);assert.ok(Number.isFinite(w.low)&&Number.isFinite(w.high)&&w.low>=0&&w.high<=1&&w.low<=w.high);}
const report=runner.buildReport('qualification');
assert.strictEqual(report.mode,'qualification');assert.strictEqual(report.scientific_evidence,false);
for(const k of ['left_marked','right_marked','neutral']){const x=report[k];assert.strictEqual(x.left_choices+x.right_choices+x.timeouts,x.trials,k+' accounting drift');}
assert.strictEqual(report.left_marked.trials,12);assert.strictEqual(report.right_marked.trials,12);assert.strictEqual(report.neutral.trials,12);
assert.ok(report.left_marked.wilson_95_marked_arm.low>=0&&report.left_marked.wilson_95_marked_arm.high<=1);
assert.ok(report.right_marked.wilson_95_marked_arm.low>=0&&report.right_marked.wilson_95_marked_arm.high<=1);
assert.ok(report.neutral.wilson_95_left.low>=0&&report.neutral.wilson_95_left.high<=1);

for(const [experiment,seed,side] of [['y_maze_p4_left_consistency_v1.json',8410000,'left'],['y_maze_p4_right_consistency_v1.json',8410000,'right']]){
  const a=runner.runCondition(experiment,[seed],side),b=runner.runCondition(experiment,[seed],side);assert.deepStrictEqual(a,b,experiment+' must be deterministic');
}
const bn=loadBundle('y_maze_p4_neutral_consistency_v1.json',{modelId:'lasius_niger_locomotion_v1'}),pn=loadBundle('y_maze_p4_neutral_consistency_v1.json');
const seed=8510000,baseSim=new integrity.Simulation(bn,seed),p4Sim=new p4.Simulation(pn,seed);
baseSim.runUntilComplete(bn.experiment.duration_s,integrity.FIXED_DT);p4Sim.runUntilComplete(pn.experiment.duration_s,p4.FIXED_DT);
assert.ok(same(baseSim.time,p4Sim.time),'zero-dose simulation time drifted');
assert.deepStrictEqual(p4Sim.metrics,baseSim.metrics,'zero-dose metrics drifted');
assertExactAntIdentity(p4Sim.ants[0],baseSim.ants[0],'zero-dose P4');
assert.strictEqual(p4Sim.ants[0].p4EvaluationSamples,0,'zero-dose P4 must bypass evaluation');

const observed={overall:0.61,conditions:{outwards_naive:0.51,outwards_experienced:0.52,return_experienced:0.53,return_naive:0.54},pheromone_side:{left:0.55,right:0.56}};
const comparison=comparator.compare(report,observed);
assert.strictEqual(comparison.row_count,7,'protocol enumerates seven descriptive rows');
assert.strictEqual(comparison.rows.length,7);assert.strictEqual(comparison.all_predeclared_comparisons_reported,true);
for(const r of comparison.rows){assert.strictEqual(r.signed_difference_model_minus_observed,r.model_prediction-r.observed_rate);assert.strictEqual(r.absolute_difference,Math.abs(r.signed_difference_model_minus_observed));}
const forbiddenDecisionKey=/(?:^|_)(?:pass|fail|pvalue|p_value|significance|threshold|promotion)(?:_|$)/i;
(function walk(v){if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){assert.ok(!forbiddenDecisionKey.test(k),'decision semantic key forbidden: '+k);walk(x);}})(comparison);
assert.throws(()=>comparator.requireRealAuthorization(),/locked|authorization/i,'real Stage B must remain locked');

assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_simulation_v1.json')),'official Stage A report must not exist');
assert.ok(!fs.existsSync(path.join(root,'reports/p4_ymaze_consistency_comparison_v1.json')),'real Stage B report must not exist');
console.log('p4-ymaze-consistency-implementation.test.js PASS '+JSON.stringify({candidate:307,qualification_trials:36,comparison_rows:7,official_stage_A_locked:true,official_stage_B_locked:true,stage_B_input_overrides:false,stage_B_frozen_source_normalizer:true,stage_B_official_stage_A_pin_required:true,zero_dose_behavior_rng_lifecycle_identity:true}));
