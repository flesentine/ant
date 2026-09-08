'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const run=require('../tools/run-p3-estimation.js');
const est=require('../tools/p3-estimation-core.js');
const p1=require('../src/p1.js');
const {readJson}=require('../tools/load-bundle.js');

const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

assert.strictEqual(blob('tools/p3-estimation-core.js'),'a661ef821dd6b7e3a34d2dc2fdd7058dd2c2e5d3');
assert.strictEqual(blob('tools/run-p3-estimation.js'),'462de97b21f0968b754dc365902ae97a0eba0b18');
assert.strictEqual(blob('hypotheses/p3_response_estimation_v1.json'),'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(blob('src/p3.js'),'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(blob('src/p1.js'),'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(blob('hypotheses/p1_response_estimation_result_freeze_v1.json'),'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(blob('hypotheses/p2_response_estimation_result_freeze_v1.json'),'088316e1746594f9b3f700cb277a83eb53fdd9f6');

const policy=readJson(path.join(root,'hypotheses','p3_response_estimation_v1.json'));
const base=readJson(path.join(root,'models','lasius_niger_painted_trail_p3_v1.json'));
assert.strictEqual(est.assertPolicySemantics(policy),true);
assert.strictEqual(run.POLICY_GIT_BLOB_SHA,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(run.CORE_GIT_BLOB_SHA,'a661ef821dd6b7e3a34d2dc2fdd7058dd2c2e5d3');
assert.deepStrictEqual(est.HALTON,[[2,'sigma_field_mm'],[3,'kappa_trail_per_s']]);

const c0=est.p3Candidate(0,policy),c1=est.p3Candidate(1,policy),a0=est.absoluteCandidate(0,policy),n=est.nullAnchor(policy);
assert(Math.abs(c0.sigma_field_mm-8)<1e-14);
assert(Math.abs(c0.kappa_trail_per_s-16/3)<1e-14);
assert(Math.abs(c1.sigma_field_mm-4)<1e-14);
assert(Math.abs(c1.kappa_trail_per_s-32/3)<1e-14);
assert.strictEqual(c0.candidate_index,1);
assert.strictEqual(a0.sigma_field_mm,c0.sigma_field_mm);
assert.strictEqual(a0.kappa_trail_per_s,c0.kappa_trail_per_s);
assert.strictEqual(a0.candidate_index,c0.candidate_index);
assert.strictEqual(a0.source,'absolute_transduction_benchmark');
assert.deepStrictEqual(n,{sigma_field_mm:8,kappa_trail_per_s:0,candidate_index:1000,source:'exact_canonical_null'});
assert.throws(()=>est.p3Candidate(999,policy),/out of range/);

const pm=est.configuredP3Model(base,{sigma_field_mm:13,kappa_trail_per_s:2.5});
assert.deepStrictEqual(pm.movement,base.movement);
assert.strictEqual(pm.painted_trail_response.field.sigma_field_mm,13);
assert.strictEqual(pm.painted_trail_response.steering.kappa_trail_per_s,2.5);
assert.strictEqual(pm.painted_trail_response.sensors.radius_mm,10);
assert.strictEqual(pm.painted_trail_response.sensors.radial_bins,4);
assert.strictEqual(pm.painted_trail_response.sensors.angular_bins_per_sector,8);
assert.strictEqual(pm.painted_trail_response.transduction.epsilon_or_regularization,0);

const am=est.configuredAbsoluteModel(base,{sigma_field_mm:13,kappa_trail_per_s:2.5}),ac=p1.paintedTrailResponseConfig(am);
assert.deepStrictEqual(am.movement,base.movement);
assert.strictEqual(ac.sigma,13);
assert.strictEqual(ac.kappa,2.5);
assert.strictEqual(ac.forward,2);
assert.strictEqual(ac.half,1.5);
assert.strictEqual(am.painted_trail_response.transduction.type,'c_over_one_plus_c');
assert.ok(!('engagement' in am.painted_trail_response));

assert.strictEqual(est.identityQualification(base),true);
assert.strictEqual(est.noResponseRngQualification(base),true);
assert.strictEqual(est.trialSeed(6210000,'s',4,policy),6210004);
assert.strictEqual(est.trialSeed(6210000,'l',4,policy),6211004);

const syn=est.syntheticRows(),cols=policy.reference_partition.colonies;
const weighted=est.referenceContrastTarget(syn,cols,est.PRIMARY_METRICS);
for(const pl of est.PATHS)for(const metric of est.PRIMARY_METRICS){
  const manual=est.mean(cols.map(c=>est.colonyContrast(syn,c,pl,metric)));
  assert.strictEqual(weighted[pl+'|'+metric],manual);
}
assert.strictEqual(est.sampleSd([1,2,3]),1);

const good=[
  [.2,.1],[.3,.2],[.1,.05],[.4,.3],[.2,.1],[-.1,-.1]
].map(x=>({heldout_relative_improvement_vs_exact_null:x[0],heldout_relative_improvement_vs_absolute_benchmark:x[1]}));
const survival=est.survivalSummary(good);
assert.strictEqual(survival.P3_wins_vs_exact_null,5);
assert.strictEqual(survival.P3_wins_vs_selected_absolute_benchmark,5);
assert.strictEqual(survival.P3_dual_survival_guard_passed,true);
assert.strictEqual(est.finalIncrementGuard({primary_loss:.01},{primary_loss:.02},{primary_loss:.03}).passed,true);
assert.strictEqual(est.finalIncrementGuard({primary_loss:.02},{primary_loss:.01},{primary_loss:.03}).passed,false);

const idRows=[
  {candidate:{sigma_field_mm:8,kappa_trail_per_s:8},candidate_index:1,source:'halton_P3',loss:.01},
  {candidate:{sigma_field_mm:8.2,kappa_trail_per_s:8.2},candidate_index:2,source:'halton_P3',loss:.0101},
  {candidate:n,candidate_index:1000,source:'exact_canonical_null',loss:.2}
];
const ident=est.identifiability(idRows,.05,policy);
assert.strictEqual(ident.passed,true);
assert.strictEqual(ident.best_absolute_benchmark_outside_P3_near_best_tolerance,true);

const q=run.qualify({root,policy,trials:1});
assert.strictEqual(q.status,'passed');
assert.strictEqual(q.scientific_evidence,false);
assert.strictEqual(q.reference_outcomes_accessed,false);
assert.strictEqual(q.response_target_semantics_loaded,false);
assert.strictEqual(q.response_target_hash_verified_only,true);
assert.strictEqual(q.P1_official_result_semantics_loaded,false);
assert.strictEqual(q.P2_official_result_semantics_loaded,false);
assert.strictEqual(q.ymaze_accessed,false);
assert.strictEqual(q.policy_git_blob_sha,'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(q.estimator_git_blob_sha,'462de97b21f0968b754dc365902ae97a0eba0b18');
assert.strictEqual(q.estimator_core_git_blob_sha,'a661ef821dd6b7e3a34d2dc2fdd7058dd2c2e5d3');
assert.strictEqual(q.response_target_git_blob_sha_verified,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(Object.keys(q.checks).length,20);
for(const [k,v] of Object.entries(q.checks))assert.strictEqual(v,true,k+' must remain true');

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p3_highres_authorization_v1.json')));
assert.throws(()=>run.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);
assert.throws(()=>run.loadReferenceTarget(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/);

const source=fs.readFileSync(path.join(root,'tools','run-p3-estimation.js'),'utf8');
const coreSource=fs.readFileSync(path.join(root,'tools','p3-estimation-core.js'),'utf8');
for(const bad of ['p1_response_estimation_500x60_v1.json','p2_response_estimation_1000x60_v1.json'])
  assert.ok(!source.includes(bad)&&!coreSource.includes(bad),'P3 estimator must not load official P1/P2 result semantics');
assert.ok(!/reference\/.*y[_-]?maze|experiments\/.*y[_-]?maze|loadBundle\([^\n]*y[_-]?maze|readJson\([^\n]*y[_-]?maze/i.test(source+coreSource),'P3 estimator must not contain Y-maze load surface');
const preflightIndex=source.indexOf('const preflight=highResolutionPreflight');
const targetIndex=source.indexOf('target=loadReferenceTarget');
assert(preflightIndex>=0&&targetIndex>preflightIndex,'authorization/qualification preflight must occur before target load');
assert.match(source,/assertHighResolutionAuthorized\(root,null,options\)/);
assert.match(source,/forbidden=\['candidates','trials','eval-trials','seed','final-trials','final-seed','dt'\]/);

console.log('p3-estimation.test.js PASS '+JSON.stringify({
  estimator_blob:blob('tools/run-p3-estimation.js'),
  core_blob:blob('tools/p3-estimation-core.js'),
  qualification:q.status,
  parameters:['sigma_field_mm','kappa_trail_per_s'],
  P3_candidates:1000,
  absolute_candidates:1000,
  dual_survival:true,
  target_semantics:false,
  P1_result_semantics:false,
  P2_result_semantics:false,
  highres_authorized:false,
  ymaze:false
}));
