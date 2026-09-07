'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const est=require('../tools/run-p2-estimation.js');
const {readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..');
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

assert.strictEqual(blob('tools/run-p2-estimation.js'),'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(blob('src/p2.js'),'f91a2f7ede1b8119acc1fd57ac94a9718d074e15');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p2_v1.json'),'7d3eecc44cb2eaf727249083a6fcfa21986fd475');
assert.strictEqual(blob('hypotheses/p2_reachability_result_freeze_v1.json'),'8dddaf083d4af046051fc1b7412b9f22cda8618a');

const policy=readJson(path.join(root,'hypotheses','p2_response_estimation_v1.json'));
est.assertPolicySemantics(policy);
assert.strictEqual(est.POLICY_GIT_BLOB_SHA,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.deepStrictEqual(est.HALTON,[[2,'sigma_field_mm'],[3,'kappa_trail_per_s'],[5,'p_lapse']]);

const c0=est.p2Candidate(0,policy),c1=est.p2Candidate(1,policy),nl0=est.projectedNoLapseCandidate(0,policy),n=est.nullAnchor(policy);
assert(Math.abs(c0.sigma_field_mm-8)<1e-14);
assert(Math.abs(c0.kappa_trail_per_s-16/3)<1e-14);
assert(Math.abs(c0.p_lapse-.2)<1e-14);
assert.strictEqual(c0.candidate_index,1);
assert(Math.abs(c1.sigma_field_mm-4)<1e-14);
assert(Math.abs(c1.kappa_trail_per_s-32/3)<1e-14);
assert(Math.abs(c1.p_lapse-.4)<1e-14);
assert.strictEqual(nl0.sigma_field_mm,c0.sigma_field_mm);
assert.strictEqual(nl0.kappa_trail_per_s,c0.kappa_trail_per_s);
assert.strictEqual(nl0.p_lapse,0);
assert.strictEqual(nl0.candidate_index,c0.candidate_index);
assert.deepStrictEqual(n,{sigma_field_mm:8,kappa_trail_per_s:0,p_lapse:.2,candidate_index:1000,source:'exact_canonical_null'});

const base=readJson(path.join(root,'models','lasius_niger_painted_trail_p2_v1.json'));
const configured=est.configuredModel(base,{sigma_field_mm:13,kappa_trail_per_s:2.5,p_lapse:.61});
assert.deepStrictEqual(configured.movement,base.movement);
assert.strictEqual(configured.painted_trail_response.field.sigma_field_mm,13);
assert.strictEqual(configured.painted_trail_response.steering.kappa_trail_per_s,2.5);
assert.strictEqual(configured.painted_trail_response.engagement.p_lapse,.61);
assert.strictEqual(configured.painted_trail_response.sensors.forward_offset_mm,2);
assert.strictEqual(configured.painted_trail_response.sensors.lateral_half_separation_mm,1.5);

assert.strictEqual(est.identityQualification(base),true);
assert.strictEqual(est.responseRngQualification(base),true);
assert.strictEqual(est.qualificationComparatorMath(),true);
assert.strictEqual(est.qualificationIdentifiability(policy),true);

assert.strictEqual(est.trialSeed(4210000,'s',4,policy),4210004);
assert.strictEqual(est.trialSeed(4210000,'l',4,policy),4211004);
assert.throws(()=>est.p2Candidate(999,policy),/out of range/);

const q=est.qualify({root,policy,trials:1});
assert.strictEqual(q.status,'passed');
assert.strictEqual(q.scientific_evidence,false);
assert.strictEqual(q.reference_outcomes_accessed,false);
assert.strictEqual(q.response_target_semantics_loaded,false);
assert.strictEqual(q.response_target_hash_verified_only,true);
assert.strictEqual(q.P1_official_result_semantics_loaded,false);
assert.strictEqual(q.ymaze_accessed,false);
assert.strictEqual(q.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(q.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
assert.strictEqual(q.checks.no_nuisance_parameters,true);
assert.strictEqual(q.checks.halton_mapping,true);
assert.strictEqual(q.checks.projected_no_lapse_mapping,true);
assert.strictEqual(q.checks.exact_null_anchor,true);
assert.strictEqual(q.checks.candidate_parameter_wiring,true);
assert.strictEqual(q.checks.exact_null_endpoint_and_nested_P1_identities,true);
assert.strictEqual(q.checks.response_rng_common_random_numbers,true);
assert.strictEqual(q.checks.equal_weight_colony_contrasts,true);
assert.strictEqual(q.checks.fold_isolation,true);
assert.strictEqual(q.checks.primary_objective_ignores_secondary,true);
assert.strictEqual(q.checks.sample_sd_semantics,true);
assert.strictEqual(q.checks.dual_survival_comparator_math,true);
assert.strictEqual(q.checks.three_parameter_identifiability_and_final_increment,true);
assert.strictEqual(q.checks.simulation_smoke,true);
assert.strictEqual(q.checks.response_target_semantics_not_loaded,true);
assert.strictEqual(q.checks.P1_official_result_semantics_not_loaded,true);
assert.strictEqual(q.checks.ymaze_not_loaded,true);

assert.ok(!fs.existsSync(path.join(root,'hypotheses','p2_highres_authorization_v1.json')));
assert.throws(()=>est.assertHighResolutionAuthorized(root),/missing post-qualification authorization artifact/);
assert.throws(()=>est.loadReferenceTarget(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/);

const source=fs.readFileSync(path.join(root,'tools','run-p2-estimation.js'),'utf8');
assert.ok(!source.includes('p1_response_estimation_500x60_v1.json'),'P2 estimator must not load P1 official result semantics');
assert.ok(!/y[_-]?maze/i.test(source),'P2 estimator source must not contain Y-maze loader/surface');
const preflightIndex=source.indexOf('const preflight=highResolutionPreflight');
const targetIndex=source.indexOf('const target=loadReferenceTarget');
assert(preflightIndex>=0&&targetIndex>preflightIndex,'highres authorization/qualification preflight must occur before target load');
assert.match(source,/assertHighResolutionAuthorized\(root,null,options\)/,'semantic target loader must authorize before readJson');
assert.match(source,/forbidden=\['candidates','trials','eval-trials','seed','final-trials','final-seed','dt'\]/);

const goodFolds=[
  {heldout_relative_improvement_vs_exact_null:.2,heldout_relative_improvement_vs_no_lapse:.1},
  {heldout_relative_improvement_vs_exact_null:.3,heldout_relative_improvement_vs_no_lapse:.2},
  {heldout_relative_improvement_vs_exact_null:.1,heldout_relative_improvement_vs_no_lapse:.05},
  {heldout_relative_improvement_vs_exact_null:.4,heldout_relative_improvement_vs_no_lapse:.3},
  {heldout_relative_improvement_vs_exact_null:.2,heldout_relative_improvement_vs_no_lapse:.1},
  {heldout_relative_improvement_vs_exact_null:-.1,heldout_relative_improvement_vs_no_lapse:-.1}
];
const survival=est.survivalSummary(goodFolds);
assert.strictEqual(survival.P2_wins_vs_exact_null,5);
assert.strictEqual(survival.P2_wins_vs_selected_no_lapse,5);
assert.strictEqual(survival.P2_dual_survival_guard_passed,true);
assert.strictEqual(est.finalIncrementGuard({primary_loss:.01},{primary_loss:.02},{primary_loss:.03}).passed,true);
assert.strictEqual(est.finalIncrementGuard({primary_loss:.02},{primary_loss:.01},{primary_loss:.03}).passed,false);

console.log('p2-estimation.test.js PASS '+JSON.stringify({
  estimator_blob:blob('tools/run-p2-estimation.js'),
  policy_blob:blob('hypotheses/p2_response_estimation_v1.json'),
  qualification:q.status,
  parameters:['sigma_field_mm','kappa_trail_per_s','p_lapse'],
  P2_candidates:1000,
  no_lapse_candidates:1000,
  dual_survival:true,
  target_semantics_loaded:false,
  P1_result_semantics_loaded:false,
  ymaze:false
}));
