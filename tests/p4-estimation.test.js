'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const policy=read('hypotheses/p4_response_estimation_v1.json');
const auth=read('hypotheses/p4_estimator_implementation_authorization_v1.json');
const est=require('../tools/p4-estimation-core.js');
const run=require('../tools/run-p4-estimation.js');

assert.strictEqual(blob('hypotheses/p4_response_estimation_v1.json'),'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(blob('hypotheses/p4_estimator_implementation_authorization_v1.json'),'e8f26731412d8693a5596da4374de932745b9392');
assert.strictEqual(blob('tools/p4-estimation-core.js'),'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
assert.strictEqual(blob('tools/run-p4-estimation.js'),'e57b554c0ad56a0034f4f79ec8090d3e863e3d11');
assert.strictEqual(blob('src/p4.js'),'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
assert.strictEqual(blob('src/p3.js'),'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p4_v1.json'),'3d8460b6916a90d06e70768f696ee3f0d48fccf4');
assert.strictEqual(blob('models/lasius_niger_painted_trail_p3_v1.json'),'9107de0c71641c4037bbedbb498b9fa868c1ef00');
assert.strictEqual(blob('reference/poissonnier2026_pheromone_response_targets.json'),'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');

assert.strictEqual(auth.id,'P4_estimator_implementation_authorization_v1');
assert.strictEqual(auth.frozen_policy.git_blob_sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(auth.frozen_runtime.git_blob_sha,'bf7d5781bd69ec4568450ebbd3bdc284897b6f61');
assert.strictEqual(auth.ungated_structural_benchmark_runtime.git_blob_sha,'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8');
assert.strictEqual(auth.response_target_metadata.semantic_loading_authorized,false);
assert.strictEqual(auth.authorization.create_tools_p4_estimation_core_js,true);
assert.strictEqual(auth.authorization.create_tools_run_p4_estimation_js,true);
assert.strictEqual(auth.authorization.run_synthetic_and_reference_free_estimator_qualification,true);
for(const value of Object.values(auth.still_forbidden)) assert.strictEqual(value,true);

assert.strictEqual(run.POLICY_GIT_BLOB_SHA,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(run.CORE_GIT_BLOB_SHA,'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
assert.strictEqual(run.IMPLEMENTATION_AUTH_GIT_BLOB_SHA,'e8f26731412d8693a5596da4374de932745b9392');
assert.strictEqual(run.assertExactPolicyBlob(root).sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(run.assertResponseTargetHashOnly(root,policy),'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(est.assertPolicySemantics(policy),true);

assert.deepStrictEqual(est.HALTON,[[2,'sigma_field_mm'],[3,'kappa_trail_per_s'],[5,'theta_detect']]);
const c0=est.p4Candidate(0,policy),c1=est.p4Candidate(1,policy),u0=est.ungatedCandidate(0,policy),n=est.nullAnchor(policy);
assert(est.near(c0.sigma_field_mm,8,1e-14));
assert(est.near(c0.kappa_trail_per_s,16/3,1e-14));
assert(est.near(c0.theta_detect,.4,1e-14));
assert(est.near(c1.sigma_field_mm,4,1e-14));
assert(est.near(c1.kappa_trail_per_s,32/3,1e-14));
assert(est.near(c1.theta_detect,.8,1e-14));
assert.strictEqual(c0.candidate_index,1);
assert.strictEqual(c1.candidate_index,2);
assert.strictEqual(u0.candidate_index,c0.candidate_index);
assert.strictEqual(u0.sigma_field_mm,c0.sigma_field_mm);
assert.strictEqual(u0.kappa_trail_per_s,c0.kappa_trail_per_s);
assert.strictEqual(u0.theta_detect,0);
assert.deepStrictEqual({sigma:n.sigma_field_mm,kappa:n.kappa_trail_per_s,theta:n.theta_detect,index:n.candidate_index},{sigma:8,kappa:0,theta:.25,index:2000});
assert.throws(()=>est.p4Candidate(1999,policy),/out of range/);

const p4Base=read('models/lasius_niger_painted_trail_p4_v1.json');
const p3Base=read('models/lasius_niger_painted_trail_p3_v1.json');
const p4Model=est.configuredP4Model(p4Base,{sigma_field_mm:13,kappa_trail_per_s:2.5,theta_detect:.7});
assert.strictEqual(p4Model.painted_trail_response.mechanism_id,'P4_local_sector_hard_detection_weber_steering_v1');
assert.strictEqual(p4Model.painted_trail_response.field.sigma_field_mm,13);
assert.strictEqual(p4Model.painted_trail_response.steering.kappa_trail_per_s,2.5);
assert.strictEqual(p4Model.painted_trail_response.absolute_detection.theta_detect,.7);
assert.deepStrictEqual(p4Model.movement,p4Base.movement);
const p3Model=est.configuredUngatedModel(p3Base,{sigma_field_mm:13,kappa_trail_per_s:2.5,theta_detect:0});
assert.strictEqual(p3Model.painted_trail_response.mechanism_id,'P3_local_sector_weber_steering_v1');
assert.strictEqual(p3Model.painted_trail_response.field.sigma_field_mm,13);
assert.strictEqual(p3Model.painted_trail_response.steering.kappa_trail_per_s,2.5);
assert.deepStrictEqual(p3Model.movement,p3Base.movement);

assert.strictEqual(est.trialSeed(8210000,'s',4,policy),8210004);
assert.strictEqual(est.trialSeed(8210000,'l',4,policy),8211004);
assert.strictEqual(est.sampleSd([1,2,3]),1);
assert.strictEqual(est.identityQualification({p4:p4Base,p3:p3Base}),true);
assert.strictEqual(est.noResponseRngQualification({p4:p4Base,p3:p3Base}),true);

const syn=est.syntheticRows();
const cols=policy.reference_partition.colonies;
const target=est.referenceContrastTarget(syn,cols,est.PRIMARY_METRICS);
for(const pl of est.PATHS)for(const metric of est.PRIMARY_METRICS){
  const manual=est.mean(cols.map(col=>est.colonyContrast(syn,col,pl,metric)));
  assert.strictEqual(target[pl+'|'+metric],manual);
}
assert.strictEqual(run.comparatorMathQualification(),true);
assert.strictEqual(run.identifiabilityQualification(policy),true);

const folds=[[.1,.1],[.2,.2],[.3,.3],[.4,.4],[.5,.5],[-.1,-.1]].map(x=>({heldout_relative_improvement_vs_exact_null:x[0],heldout_relative_improvement_vs_ungated_benchmark:x[1]}));
const survival=est.survivalSummary(folds);
assert.strictEqual(survival.P4_wins_vs_exact_null,5);
assert.strictEqual(survival.P4_wins_vs_selected_ungated_benchmark,5);
assert.strictEqual(survival.P4_dual_survival_guard_passed,true);
assert.strictEqual(est.finalIncrementGuard({primary_loss:.01},{primary_loss:.02},{primary_loss:.03}).passed,true);

const qualification=run.qualify({root,policy,trials:1});
assert.strictEqual(qualification.status,'passed');
assert.strictEqual(qualification.scientific_evidence,false);
assert.strictEqual(qualification.reference_outcomes_accessed,false);
assert.strictEqual(qualification.response_target_semantics_loaded,false);
assert.strictEqual(qualification.response_target_hash_verified_only,true);
assert.strictEqual(qualification.P1_official_result_semantics_loaded,false);
assert.strictEqual(qualification.P2_official_result_semantics_loaded,false);
assert.strictEqual(qualification.P3_official_result_semantics_loaded,false);
assert.strictEqual(qualification.ymaze_accessed,false);
assert.strictEqual(qualification.high_resolution_search_executed,false);
assert.strictEqual(qualification.policy_git_blob_sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
assert.strictEqual(qualification.estimator_core_git_blob_sha,'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
assert.strictEqual(qualification.estimator_git_blob_sha,'e57b554c0ad56a0034f4f79ec8090d3e863e3d11');
assert.strictEqual(qualification.implementation_authorization_git_blob_sha,'e8f26731412d8693a5596da4374de932745b9392');
for(const [name,value] of Object.entries(qualification.checks)) assert.strictEqual(value,true,'qualification check failed: '+name);

const highresAuthPresent=fs.existsSync(path.join(root,'hypotheses/p4_highres_authorization_v1.json'));
if(highresAuthPresent){
  assert.strictEqual(blob('hypotheses/p4_highres_authorization_v1.json'),'d8088ab94480faf0f5db012ca538bdc4d5a42ccb');
  const a=read('hypotheses/p4_highres_authorization_v1.json');
  assert.strictEqual(a.policy_git_blob_sha,'2d0bdfaba74ad08f8424870f37a48399428ae8b7');
  assert.strictEqual(a.estimator_git_blob_sha,'e57b554c0ad56a0034f4f79ec8090d3e863e3d11');
  assert.strictEqual(a.estimator_core_git_blob_sha,'4d985cd7258fc26eb06be75f09bdac4b92325ff0');
  assert.strictEqual(a.qualification_result_freeze.git_blob_sha,'635b64ff1bfe08f6f914e5fd8bef8306ee0b27d5');
  assert.strictEqual(a.P1_official_result_semantic_access_authorized,false);
  assert.strictEqual(a.P2_official_result_semantic_access_authorized,false);
  assert.strictEqual(a.P3_official_result_semantic_access_authorized,false);
  assert.strictEqual(a.ymaze_access_authorized,false);
  assert.throws(()=>run.assertHighResolutionAuthorized(root,policy,{branchName:'authorization-review'}),/not effective until merged to main/);
  assert.throws(()=>run.loadReferenceTarget(root,policy,{branchName:'authorization-review'}),/not effective until merged to main/);
}else{
  assert.throws(()=>run.assertHighResolutionAuthorized(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/);
  assert.throws(()=>run.loadReferenceTarget(root,policy,{branchName:'main'}),/missing post-qualification authorization artifact/);
}

const runnerSource=fs.readFileSync(path.join(root,'tools/run-p4-estimation.js'),'utf8');
assert(runnerSource.indexOf('highResolutionPreflight({ root, policy, options })') < runnerSource.indexOf("validateReferenceTarget(readJson(path.resolve(root, RESPONSE_TARGET_FILE)), policy)"));
assert(!runnerSource.includes('p1_response_estimation_'));
assert(!runnerSource.includes('p2_response_estimation_'));
assert(!runnerSource.includes('p3_response_estimation_'));
assert(!runnerSource.includes('neutral-y-maze'));
assert(!fs.readFileSync(path.join(root,'tools/p4-estimation-core.js'),'utf8').includes('Math.random'));

console.log('p4-estimation.test.js PASS '+JSON.stringify({policy_blob:blob('hypotheses/p4_response_estimation_v1.json'),authorization_blob:blob('hypotheses/p4_estimator_implementation_authorization_v1.json'),core_blob:blob('tools/p4-estimation-core.js'),runner_blob:blob('tools/run-p4-estimation.js'),parameters:policy.response_parameter_surface.estimated_parameter_names_exact,candidates:policy.search_protocol.candidate_budget_per_fold_total,qualification:'passed',scientific_evidence:false,target_semantics:false,highres_authorization_present:highresAuthPresent,highres_effective_on_review_branch:false,ymaze:false}));
