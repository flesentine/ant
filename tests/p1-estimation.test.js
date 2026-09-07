'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),os=require('os');
const {execFileSync,spawnSync}=require('child_process');
const est=require('../tools/run-p1-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

assert.strictEqual(blob('tools/run-p1-estimation.js'),'a307e74e8ba2366e2546eebe1a7cccac69a3ff9a','P1 estimator blob drifted');
assert.strictEqual(blob('hypotheses/p1_response_estimation_v1.json'),'628d17f6eb69fd11216aff33d1356d184365aedd');
assert.strictEqual(est.POLICY_GIT_BLOB_SHA,'628d17f6eb69fd11216aff33d1356d184365aedd');
assert.strictEqual(est.AUTHORIZATION_FILE,'hypotheses/p1_highres_authorization_v1.json');
assert.strictEqual(est.RESPONSE_TARGET_FILE,'reference/poissonnier2026_pheromone_response_targets.json');

const policy=readJson(path.join(root,'hypotheses','p1_response_estimation_v1.json'));
est.assertPolicySemantics(policy);
assert.deepStrictEqual(est.PRIMARY_METRICS,['middle_zone_fraction','trail_axis_exit']);
assert.deepStrictEqual(est.SECONDARY_METRICS,['time_to_exit_s','beeline_mm']);
assert.deepStrictEqual(est.HALTON,[[2,'sigma_field_mm'],[3,'kappa_trail_per_s']]);

const c1=est.contextCandidate(0,policy);
assert(Math.abs(c1.sigma_field_mm-8)<1e-14);
assert(Math.abs(c1.kappa_trail_per_s-16/3)<1e-14);
assert.strictEqual(c1.candidate_index,1);
const n=est.nullAnchor(policy);
assert.deepStrictEqual({sigma:n.sigma_field_mm,kappa:n.kappa_trail_per_s,index:n.candidate_index,source:n.source},{sigma:8,kappa:0,index:500,source:'exact_null_anchor'});
assert.throws(()=>est.contextCandidate(499,policy),/out of range/);

assert.strictEqual(est.trialSeed(2210000,'s',4,policy),2210004);
assert.strictEqual(est.trialSeed(2210000,'l',4,policy),2211004);
assert.strictEqual(est.conditionExperiment('dcm_control'),'open_arena_p1_zero_dose_reachability.json');
assert.strictEqual(est.conditionExperiment('pheromone'),'open_arena_p1_nominal_dose_reachability.json');

const base=readJson(path.join(root,'models','lasius_niger_painted_trail_p1_v1.json'));
const configured=est.configuredModel(base,{sigma_field_mm:11,kappa_trail_per_s:2});
assert.deepStrictEqual(configured.movement,base.movement,'P1 estimator may not mutate canonical movement');
assert.strictEqual(configured.painted_trail_response.field.sigma_field_mm,11);
assert.strictEqual(configured.painted_trail_response.steering.kappa_trail_per_s,2);
assert.strictEqual(configured.painted_trail_response.sensors.forward_offset_mm,2);
assert.strictEqual(configured.painted_trail_response.sensors.lateral_half_separation_mm,1.5);

const syn=est.syntheticRows(),cols=policy.reference_partition.colonies;
const eq=est.referenceContrastTarget(syn,cols,est.PRIMARY_METRICS);
for(const pl of est.PATHS)for(const metric of est.PRIMARY_METRICS){
  const manual=est.mean(cols.map(col=>est.colonyContrast(syn,col,pl,metric)));
  assert(Math.abs(eq[pl+'|'+metric]-manual)<1e-15);
}
const pooledShort=est.cellMean(syn,null,'s','pheromone','middle_zone_fraction')-est.cellMean(syn,null,'s','dcm_control','middle_zone_fraction');
assert.notStrictEqual(eq['s|middle_zone_fraction'],pooledShort,'synthetic fixture must detect row-weighted pooling');

const trainCols=cols.filter(c=>c!==27),train=syn.filter(r=>r.colony!==27);
assert(!train.some(r=>r.colony===27));
assert.strictEqual(Object.keys(est.referenceContrastTarget(train,trainCols,est.PRIMARY_METRICS)).length,4);
assert.strictEqual(est.sampleSd([1,2,3]),1);

const q=est.qualify({root,policy,trials:1});
assert.strictEqual(q.status,'passed');
assert.strictEqual(q.scientific_evidence,false);
assert.strictEqual(q.reference_outcomes_accessed,false);
assert.strictEqual(q.response_target_semantics_loaded,false);
assert.strictEqual(q.response_target_hash_verified_only,true);
assert.strictEqual(q.ymaze_accessed,false);
assert.strictEqual(q.estimator_git_blob_sha,'a307e74e8ba2366e2546eebe1a7cccac69a3ff9a');
assert(Object.values(q.checks).every(Boolean),JSON.stringify(q.checks));

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p1_highres_authorization_v1.json')),'active P1 high-resolution authorization must not exist during estimator qualification');
assert.throws(()=>est.assertHighResolutionAuthorized(root,null,{branchName:'main'}),/missing post-qualification authorization artifact/);
assert.throws(()=>est.loadReferenceTarget(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/,'semantic target loader must be authorization-gated');

const tmp=path.join(os.tmpdir(),'p1-estimation-highres-should-not-exist-'+process.pid+'.json');
try{fs.rmSync(tmp,{force:true});}catch(_){}
const high=spawnSync(process.execPath,[path.join(root,'tools','run-p1-estimation.js'),'--mode','highres','--out',tmp],{cwd:root,encoding:'utf8'});
assert.notStrictEqual(high.status,0,'high-resolution mode must fail without authorization');
assert.match((high.stderr||'')+(high.stdout||''),/missing post-qualification authorization artifact/);
assert.strictEqual(fs.existsSync(tmp),false,'unauthorized high-resolution mode must not write a report');

const source=fs.readFileSync(path.join(root,'tools','run-p1-estimation.js'),'utf8');
const preflightPos=source.indexOf('const preflight=highResolutionPreflight');
const targetLoadPos=source.indexOf('const target=loadReferenceTarget');
assert(preflightPos>=0&&targetLoadPos>preflightPos,'authorization preflight must happen before semantic target load');
assert.ok(!/(?:loadBundle|readJson)\s*\([^)]*y[_-]?maze/i.test(source),'P1 estimator must not load Y-maze content');

assert.throws(()=>est.assertSafeReportOutput(root,path.join(root,'models','forbidden.json')),/only under reports/);
assert.doesNotThrow(()=>est.assertSafeReportOutput(root,path.join(root,'reports','p1-safe.json')));

console.log('p1-estimation.test.js PASS '+JSON.stringify({
  estimator_blob:blob('tools/run-p1-estimation.js'),
  policy_blob:blob('hypotheses/p1_response_estimation_v1.json'),
  qualification:q.status,
  highres_authorized:false,
  response_outcomes_accessed:false,
  ymaze_accessed:false
}));
