#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const childProcess=require('child_process');
const est=require('./p3-estimation-core.js');
const p1=require('../src/p1.js');
const {readJson}=require('./load-bundle.js');

const POLICY_FILE='hypotheses/p3_response_estimation_v1.json';
const POLICY_GIT_BLOB_SHA='d86eb9936e993d188f2a28faab838ba158c40f3b';
const AUTHORIZATION_FILE='hypotheses/p3_highres_authorization_v1.json';
const RESPONSE_TARGET_FILE='reference/poissonnier2026_pheromone_response_targets.json';
const CORE_GIT_BLOB_SHA='9a10133c384f93eed48d04a97abb1a1c592e08de';

const FROZEN_RUNTIME_BLOBS=Object.freeze({
  'tools/p3-estimation-core.js':CORE_GIT_BLOB_SHA,
  'hypotheses/p3_painted_trail_candidate_class_decision_v1.json':'e8da07f6f73934e0120fd41d4668ae4039108336',
  'hypotheses/p3_painted_trail_mechanism_v1.json':'5d00ce0058ff388c9f57d7dce56ce465d82c5765',
  'hypotheses/p3_reachability_execution_v1.json':'55494a3190964d24ded2ae0d1faf3b355cc7835f',
  'hypotheses/p3_implementation_authorization_v1.json':'128afcbdb10d3254240c5074e1e997cee7d7fe51',
  'hypotheses/p3_reachability_result_freeze_v1.json':'b3fa56386f71b0cea1dd8cfec032148c42af1b6d',
  'reports/p3_reference_free_reachability_v1.json':'a18d5cd360be79bf1a05d3fe3e2c26fd1d6c86f6',
  'src/p3.js':'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8',
  'models/lasius_niger_painted_trail_p3_v1.json':'9107de0c71641c4037bbedbb498b9fa868c1ef00',
  'experiments/open_arena_p3_zero_dose_reachability.json':'f2a97691e604bbb086216221da1c776cc74e9dbb',
  'experiments/open_arena_p3_nominal_dose_reachability.json':'e3c3d7c4c58c885b99654e8797b8570ef91f7cde',
  'tools/run-p3-reachability.js':'0e1795b7bbb3a568fbbd241cc809d600e1f8ca67',
  'src/p1.js':'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca',
  'hypotheses/p1_response_estimation_result_freeze_v1.json':'1d99ebfaa378aeb1b98963f63b3a513a616a6617',
  'hypotheses/p2_response_estimation_result_freeze_v1.json':'088316e1746594f9b3f700cb277a83eb53fdd9f6',
  'apparatus/poissonnier2026_open_arena_p1_v1.json':'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4',
  'models/lasius_niger_locomotion_v1.json':'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d',
  'src/sim-core.js':'24777aac3577d442893e4779d70aee4e27761fe8',
  'src/integrity.js':'f23c68a6955832b70eeb3bd3e6893d71a3759018',
  'tools/load-bundle.js':'235067f10ed85eeeaebcfe6fef0963940d516b6b'
});

function arg(name,def){const i=process.argv.indexOf('--'+name);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:def;}
function hasArg(name){return process.argv.includes('--'+name);}
function narg(name,def){return Number(arg(name,def));}
function gitBlobShaBuffer(buf){return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');}
function gitBlobShaFile(file){return gitBlobShaBuffer(fs.readFileSync(file));}
function currentRepoCommit(root){try{return childProcess.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch(_){return process.env.GITHUB_SHA||null;}}
function currentBranchName(root){if(process.env.GITHUB_REF_NAME)return process.env.GITHUB_REF_NAME;try{return childProcess.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()||null;}catch(_){return null;}}
function assertSafeReportOutput(root,out){
  const resolved=path.resolve(out);
  if(path.extname(resolved).toLowerCase()!=='.json')throw new Error('P3 estimation output must be a JSON report.');
  if(fs.existsSync(resolved)&&fs.lstatSync(resolved).isSymbolicLink())throw new Error('P3 estimation refuses to write through a symbolic-link output path.');
  const rel=path.relative(root,resolved),inside=rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));
  if(inside){
    const rr=path.resolve(root,'reports'),rrel=path.relative(rr,resolved);
    if(rrel===''||rrel.startsWith('..'+path.sep)||rrel==='..'||path.isAbsolute(rrel))throw new Error('P3 estimation may write inside the repository only under reports/.');
  }
  return resolved;
}
function assertBlobSet(root,blobs,label){
  const verified={};
  for(const [rel,expected] of Object.entries(blobs)){
    const actual=gitBlobShaFile(path.resolve(root,rel));
    if(actual!==expected)throw new Error(label+' blob mismatch for '+rel+': expected '+expected+', got '+actual+'.');
    verified[rel]=actual;
  }
  return verified;
}
function assertExactPolicyBlob(root){
  const file=path.resolve(root,POLICY_FILE),sha=gitBlobShaFile(file);
  if(sha!==POLICY_GIT_BLOB_SHA)throw new Error('P3 response-estimation policy blob mismatch: expected '+POLICY_GIT_BLOB_SHA+', got '+sha+'.');
  const policy=readJson(file);est.assertPolicySemantics(policy);return{file,sha,policy};
}
function assertResponseTargetHashOnly(root,policy){
  const file=path.resolve(root,RESPONSE_TARGET_FILE),actual=gitBlobShaFile(file),expected=policy.frozen_inputs.response_target.git_blob_sha;
  if(actual!==expected)throw new Error('P3 response target blob mismatch: expected '+expected+', got '+actual+'.');
  return actual;
}
function validateReferenceTarget(target,policy){
  if(target.status!=='development_response_estimation_only_not_external_validation')throw new Error('Unexpected P3 response target status.');
  if(target.scope!=='open_arena_painted_trail_response_threshold_independent_observables')throw new Error('Unexpected P3 response target scope.');
  if(target.source_xlsx_sha256!=='b311d5fdc89eac56724bb5195743cf4bb52a6cff4040b18704353091e1fe6318')throw new Error('Unexpected P3 source XLSX hash.');
  if(!Array.isArray(target.rows)||target.rows.length!==policy.frozen_inputs.response_target.rows)throw new Error('Unexpected P3 response target row count.');
  if(JSON.stringify(target.primary_response_observables)!==JSON.stringify(est.PRIMARY_METRICS)||JSON.stringify(target.secondary_guard_observables)!==JSON.stringify(est.SECONDARY_METRICS))throw new Error('P3 target observable surface changed.');
  const counts={dcm_control_short:0,dcm_control_long:0,pheromone_short:0,pheromone_long:0};
  for(const r of target.rows){
    if(!policy.reference_partition.colonies.includes(r.colony)||!est.PATHS.includes(r.path_length)||!est.TREATMENTS.includes(r.treatment))throw new Error('Unexpected P3 response row stratum.');
    counts[r.treatment+'_'+(r.path_length==='s'?'short':'long')]++;
    for(const metric of est.PRIMARY_METRICS.concat(est.SECONDARY_METRICS))est.metricValue(r,metric);
  }
  if(JSON.stringify(counts)!==JSON.stringify({dcm_control_short:25,dcm_control_long:26,pheromone_short:26,pheromone_long:25}))throw new Error('P3 response group counts changed.');
  for(const c of policy.reference_partition.colonies)for(const pl of est.PATHS)for(const t of est.TREATMENTS)if(!target.rows.some(r=>r.colony===c&&r.path_length===pl&&r.treatment===t))throw new Error('P3 response target missing colony x path x treatment cell.');
  return target;
}
function comparatorMathQualification(){
  const folds=[
    [.1,.05],[.2,.02],[.3,.03],[.4,.04],[.5,.01],[-.1,-.01]
  ].map(x=>({heldout_relative_improvement_vs_exact_null:x[0],heldout_relative_improvement_vs_absolute_benchmark:x[1]}));
  const pass=est.survivalSummary(folds);
  const fail=est.survivalSummary(folds.map((f,i)=>i===4?{...f,heldout_relative_improvement_vs_absolute_benchmark:-.02}:f));
  return pass.P3_wins_vs_exact_null===5&&pass.P3_wins_vs_selected_absolute_benchmark===5&&pass.P3_dual_survival_guard_passed===true&&fail.P3_dual_survival_guard_passed===false;
}
function identifiabilityQualification(policy){
  const rows=[
    {candidate:{sigma_field_mm:8,kappa_trail_per_s:8},candidate_index:1,source:'halton_P3',loss:.01},
    {candidate:{sigma_field_mm:8.2,kappa_trail_per_s:8.2},candidate_index:2,source:'halton_P3',loss:.0101},
    {candidate:est.nullAnchor(policy),candidate_index:1000,source:'exact_canonical_null',loss:.2}
  ];
  const id=est.identifiability(rows,.05,policy);
  return id.passed===true&&id.best_absolute_benchmark_outside_P3_near_best_tolerance===true&&est.finalIncrementGuard({primary_loss:.01},{primary_loss:.02},{primary_loss:.03}).passed===true;
}
function qualify({root,policy,trials=2}){
  est.assertPolicySemantics(policy);
  const runtimeBlobs=assertBlobSet(root,FROZEN_RUNTIME_BLOBS,'Frozen P3 estimator input');
  const targetHash=assertResponseTargetHashOnly(root,policy);
  const base=readJson(path.resolve(root,'models/lasius_niger_painted_trail_p3_v1.json'));
  const checks={};
  checks.no_nuisance_parameters=policy.response_parameter_surface.nuisance_parameters.length===0;
  const c0=est.p3Candidate(0,policy),c1=est.p3Candidate(1,policy),a0=est.absoluteCandidate(0,policy),n=est.nullAnchor(policy);
  checks.halton_mapping=est.near(c0.sigma_field_mm,8,1e-14)&&est.near(c0.kappa_trail_per_s,16/3,1e-14)&&est.near(c1.sigma_field_mm,4,1e-14)&&est.near(c1.kappa_trail_per_s,32/3,1e-14);
  checks.absolute_same_coordinate_mapping=est.near(a0.sigma_field_mm,c0.sigma_field_mm,1e-15)&&est.near(a0.kappa_trail_per_s,c0.kappa_trail_per_s,1e-15)&&a0.candidate_index===c0.candidate_index;
  checks.exact_null_anchor=n.sigma_field_mm===8&&n.kappa_trail_per_s===0&&n.candidate_index===1000;
  const pm=est.configuredP3Model(base,{sigma_field_mm:13,kappa_trail_per_s:2.5}),am=est.configuredAbsoluteModel(base,{sigma_field_mm:13,kappa_trail_per_s:2.5}),ac=p1.paintedTrailResponseConfig(am);
  checks.P3_candidate_parameter_wiring=JSON.stringify(pm.movement)===JSON.stringify(base.movement)&&pm.painted_trail_response.field.sigma_field_mm===13&&pm.painted_trail_response.steering.kappa_trail_per_s===2.5&&pm.painted_trail_response.sensors.radius_mm===10&&pm.painted_trail_response.sensors.radial_bins===4&&pm.painted_trail_response.sensors.angular_bins_per_sector===8&&pm.painted_trail_response.transduction.epsilon_or_regularization===0;
  checks.absolute_transduction_comparator_wiring=JSON.stringify(am.movement)===JSON.stringify(base.movement)&&ac.sigma===13&&ac.kappa===2.5&&ac.forward===2&&ac.half===1.5&&am.painted_trail_response.transduction.type==='c_over_one_plus_c';
  checks.exact_P3_and_absolute_canonical_identities=est.identityQualification(base);
  checks.no_response_rng=est.noResponseRngQualification(base);
  checks.crn_pairing=est.trialSeed(990000,'s',4,policy)===990004&&est.trialSeed(990000,'l',4,policy)===991004;
  checks.path_not_runtime_input=est.conditionExperiment('dcm_control')==='open_arena_p3_zero_dose_reachability.json'&&est.conditionExperiment('pheromone')==='open_arena_p3_nominal_dose_reachability.json';
  const syn=est.syntheticRows(),cols=policy.reference_partition.colonies,ref=est.referenceContrastTarget(syn,cols,est.PRIMARY_METRICS),manual={};
  for(const pl of est.PATHS)for(const metric of est.PRIMARY_METRICS)manual[pl+'|'+metric]=est.mean(cols.map(col=>est.colonyContrast(syn,col,pl,metric)));
  checks.equal_weight_colony_contrasts=JSON.stringify(ref)===JSON.stringify(manual);
  const trainCols=cols.filter(x=>x!==27),train=syn.filter(r=>r.colony!==27);
  checks.fold_isolation=!train.some(r=>r.colony===27)&&Object.keys(est.referenceContrastTarget(train,trainCols,est.PRIMARY_METRICS)).length===4;
  const simPrimaryOnly=[];
  for(const pl of est.PATHS)for(const t of est.TREATMENTS)simPrimaryOnly.push({path_length:pl,treatment:t,middle_zone_fraction:est.cellMean(syn,null,pl,t,'middle_zone_fraction'),trail_axis_exit:est.cellMean(syn,null,pl,t,'trail_axis_exit'),time_to_exit_s:9999,beeline_mm:9999});
  checks.primary_objective_ignores_secondary=Number.isFinite(est.contrastScore(simPrimaryOnly,syn,cols,est.PRIMARY_METRICS).loss);
  checks.sample_sd_semantics=est.near(est.sampleSd([1,2,3]),1,1e-15);
  checks.dual_survival_comparator_math=comparatorMathQualification();
  checks.two_parameter_identifiability_and_final_increment=identifiabilityQualification(policy);
  const d=est.simulateTreatment(c0,'dcm_control',trials,984700,base,policy,'P3'),ph=est.simulateTreatment(c0,'pheromone',trials,984700,base,policy,'P3'),ap=est.simulateTreatment(a0,'pheromone',trials,984700,base,policy,'absolute');
  checks.simulation_smoke=d.length===trials*2&&ph.length===trials*2&&ap.length===trials*2&&ap.every(r=>r.mechanism==='absolute');
  checks.response_target_semantics_not_loaded=true;
  checks.response_target_hash_verified_only=targetHash===policy.frozen_inputs.response_target.git_blob_sha;
  checks.P1_official_result_semantics_not_loaded=true;
  checks.P2_official_result_semantics_not_loaded=true;
  checks.ymaze_not_loaded=true;
  const passed=Object.values(checks).every(Boolean);
  return{
    schema_version:1,qualification_id:'P3_estimator_synthetic_qualification_v1',status:passed?'passed':'failed',
    scientific_evidence:false,reference_outcomes_accessed:false,response_target_semantics_loaded:false,response_target_hash_verified_only:true,
    P1_official_result_semantics_loaded:false,P2_official_result_semantics_loaded:false,ymaze_accessed:false,
    policy_git_blob_sha:POLICY_GIT_BLOB_SHA,estimator_git_blob_sha:gitBlobShaFile(__filename),estimator_core_git_blob_sha:CORE_GIT_BLOB_SHA,
    frozen_runtime_blobs_verified:runtimeBlobs,response_target_git_blob_sha_verified:targetHash,trials_per_treatment_path:trials,checks
  };
}
function assertAuthorizationEffective(a,root,{branchName=null}={}){
  const branch=branchName||currentBranchName(root);
  if(a.effective_when_merged_to_main===true&&branch!=='main')throw new Error('P3 high-resolution authorization is not effective until merged to main; current branch is '+(branch||'unknown')+'.');
  return branch;
}
function assertHighResolutionAuthorized(root,estimatorBlob=null,options={}){
  const file=path.resolve(root,AUTHORIZATION_FILE);
  if(!fs.existsSync(file))throw new Error('P3 high-resolution response search is not authorized: missing post-qualification authorization artifact.');
  const a=readJson(file),actual=estimatorBlob||gitBlobShaFile(__filename);
  if(a.id!=='P3_high_resolution_authorization_v1'||a.status!=='qualified_estimator_authorized_for_frozen_high_resolution_response_search'||a.high_resolution_response_search_authorized!==true)throw new Error('Invalid P3 high-resolution authorization status.');
  if(a.policy_git_blob_sha!==POLICY_GIT_BLOB_SHA||a.estimator_git_blob_sha!==actual)throw new Error('P3 authorization executable pin mismatch.');
  if(a.P1_official_result_semantic_access_authorized!==false||a.P2_official_result_semantic_access_authorized!==false||a.canonical_promotion_authorized!==false||a.ymaze_access_authorized!==false)throw new Error('P3 authorization violates frozen firewalls.');
  assertAuthorizationEffective(a,root,options);return a;
}
function loadReferenceTarget(root,policy,options={}){
  assertHighResolutionAuthorized(root,null,options);
  const file=path.resolve(root,RESPONSE_TARGET_FILE);
  if(gitBlobShaFile(file)!==policy.frozen_inputs.response_target.git_blob_sha)throw new Error('P3 response target Git blob does not match policy.');
  return validateReferenceTarget(readJson(file),policy);
}
function assertHighResolutionArgs(policy){
  const forbidden=['candidates','trials','eval-trials','seed','final-trials','final-seed','dt'];
  for(const name of forbidden)if(hasArg(name))throw new Error('Frozen P3 high-resolution mode forbids --'+name+' override.');
  est.assertPolicySemantics(policy);
}
function highResolutionPreflight({root,policy}){
  const q=qualify({root,policy,trials:2});
  if(q.status!=='passed'||q.reference_outcomes_accessed!==false||q.P1_official_result_semantics_loaded!==false||q.P2_official_result_semantics_loaded!==false||q.ymaze_accessed!==false)throw new Error('Frozen P3 high-resolution search requires passing reference-free synthetic qualification.');
  return{qualification:q,authorization:assertHighResolutionAuthorized(root,q.estimator_git_blob_sha)};
}
function runHighResolution(target,policy,base){
  const colonies=policy.reference_partition.colonies,folds=[];
  for(let fi=0;fi<colonies.length;fi++){
    const held=colonies[fi],trainCols=colonies.filter(c=>c!==held),trainRows=target.rows.filter(r=>r.colony!==held),testRows=target.rows.filter(r=>r.colony===held);
    const fitSeed=policy.search_protocol.root_fit_seed+fi*10000,evalSeed=policy.search_protocol.root_evaluation_seed+fi*10000;
    const ps=est.searchPanel(trainRows,trainCols,policy,base,{trials:60,seed0:fitSeed,panel:'P3'}),as=est.searchPanel(trainRows,trainCols,policy,base,{trials:60,seed0:fitSeed,panel:'absolute'});
    const p=est.evaluateCandidate(ps.best,testRows,[held],policy,base,120,evalSeed,trainRows,'P3'),a=est.evaluateCandidate(as.best,testRows,[held],policy,base,120,evalSeed,trainRows,'absolute');
    const nr={candidate:est.nullAnchor(policy),candidate_index:1000,source:'exact_canonical_null'},n=est.evaluateCandidate(nr,testRows,[held],policy,base,120,evalSeed,trainRows,'P3');
    folds.push({held_out_colony:held,training_colonies:trainCols,fit_seed:fitSeed,evaluation_seed:evalSeed,selected_P3_training_fit:ps.best,P3_training_top_candidates:ps.top,selected_absolute_training_fit:as.best,absolute_training_top_candidates:as.top,heldout_selected_P3:p,heldout_selected_absolute_benchmark:a,heldout_exact_null:n,heldout_relative_improvement_vs_exact_null:(n.primary_loss-p.primary_loss)/Math.max(1e-12,n.primary_loss),heldout_relative_improvement_vs_absolute_benchmark:(a.primary_loss-p.primary_loss)/Math.max(1e-12,a.primary_loss)});
  }
  const internal_cv=est.survivalSummary(folds);
  if(!internal_cv.P3_dual_survival_guard_passed)return{folds,internal_cv,final_all_data_fit:null,promotion:{mechanism_survives_internal_development:false,fixed_parameter_pair_eligible_for_future_freeze:false,reason:'failed_dual_primary_survival_guard',canonical_promotion:false,ymaze_unlock:false}};
  const pf=est.searchPanel(target.rows,colonies,policy,base,{trials:120,seed0:7210000,panel:'P3',retainAll:true}),af=est.searchPanel(target.rows,colonies,policy,base,{trials:120,seed0:7210000,panel:'absolute',retainAll:true});
  const p=est.evaluateCandidate(pf.best,target.rows,colonies,policy,base,240,7610000,target.rows,'P3'),a=est.evaluateCandidate(af.best,target.rows,colonies,policy,base,240,7610000,target.rows,'absolute');
  const nr={candidate:est.nullAnchor(policy),candidate_index:1000,source:'exact_canonical_null'},n=est.evaluateCandidate(nr,target.rows,colonies,policy,base,240,7610000,target.rows,'P3');
  const id=est.identifiability(pf.all,af.best.loss,policy),increment=est.finalIncrementGuard(p,a,n),secondaryPass=p.secondary_guard.passed,eligible=id.passed&&increment.passed&&secondaryPass;
  return{folds,internal_cv,final_all_data_fit:{fit_seed:7210000,selected_P3_training_fit:pf.best,P3_training_top_candidates:pf.top,selected_absolute_training_fit:af.best,absolute_training_top_candidates:af.top,independent_final_check_seed:7610000,selected_P3_final_check:p,selected_absolute_final_check:a,exact_null_final_check:n,final_primary_increment_guard:increment,identifiability:id},promotion:{mechanism_survives_internal_development:true,fixed_parameter_pair_eligible_for_future_freeze:eligible,identifiability_passed:id.passed,final_primary_increment_guard_passed:increment.passed,secondary_guards_passed:secondaryPass,canonical_promotion:false,ymaze_unlock:false}};
}
function writeReport(report,out){
  const root=path.resolve(__dirname,'..'),safe=assertSafeReportOutput(root,out);
  fs.writeFileSync(safe,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log('Saved '+safe);return report;
}
function main(){
  const root=path.resolve(__dirname,'..'),policy=assertExactPolicyBlob(root).policy,mode=arg('mode','qualification');
  if(mode==='qualification'){
    const q=qualify({root,policy,trials:Math.max(1,narg('trials',2))});
    if(q.status!=='passed')throw new Error('P3 estimator qualification failed: '+JSON.stringify(q.checks));
    return writeReport(q,path.resolve(process.cwd(),arg('out',path.join('reports','p3_estimator_qualification_v1.json'))));
  }
  if(mode!=='highres')throw new Error("Unknown P3 estimation mode '"+mode+"'. Use qualification or highres.");
  assertHighResolutionArgs(policy);
  const preflight=highResolutionPreflight({root,policy}),target=loadReferenceTarget(root,policy),base=readJson(path.resolve(root,'models','lasius_niger_painted_trail_p3_v1.json')),run=runHighResolution(target,policy,base);
  const survives=run.promotion.mechanism_survives_internal_development,eligible=run.promotion.fixed_parameter_pair_eligible_for_future_freeze;
  return writeReport({
    schema_version:1,estimation_id:policy.id,status:survives?(eligible?'development_response_estimation_passed_and_parameter_pair_eligible_for_future_freeze':'development_response_estimation_survived_but_parameter_pair_not_eligible'):'development_response_estimation_failed_dual_primary_survival_guard',
    execution_class:'frozen_high_resolution_response_search',scientific_evidence:true,policy_git_blob_sha:POLICY_GIT_BLOB_SHA,estimator_git_blob_sha:gitBlobShaFile(__filename),estimator_core_git_blob_sha:CORE_GIT_BLOB_SHA,
    response_target_git_blob_sha:policy.frozen_inputs.response_target.git_blob_sha,reference_outcomes_accessed:true,P1_official_result_semantics_loaded:false,P2_official_result_semantics_loaded:false,ymaze_accessed:false,canonical_locomotion_updated:false,H2_H3_H4_H5_refit:false,nuisance_parameters_estimated:false,
    pre_reference_qualification:preflight.qualification,high_resolution_authorization:preflight.authorization,execution:{repo_commit:currentRepoCommit(root),node_version:process.version,physics_dt_s:.02},
    search:{method:policy.search_protocol.method,P3_candidates_per_fold_total:1000,positive_P3_halton_candidates:999,exact_canonical_null_candidates:1,absolute_benchmark_candidates_per_fold_total:1000,absolute_benchmark_positive_candidates:999,training_trials_per_treatment_path_per_candidate:60,heldout_evaluation_trials_per_treatment_path:120,folds:6,root_fit_seed:6210000,root_evaluation_seed:6810000,common_random_numbers:true,response_rng:'none',halton_mapping:policy.search_protocol.halton_mapping},...run
  },path.resolve(process.cwd(),arg('out',path.join('reports','p3_response_estimation_1000x60_v1.json'))));
}
if(require.main===module)main();

module.exports={POLICY_FILE,POLICY_GIT_BLOB_SHA,AUTHORIZATION_FILE,RESPONSE_TARGET_FILE,CORE_GIT_BLOB_SHA,FROZEN_RUNTIME_BLOBS,gitBlobShaBuffer,gitBlobShaFile,currentRepoCommit,currentBranchName,assertSafeReportOutput,assertBlobSet,assertExactPolicyBlob,assertResponseTargetHashOnly,validateReferenceTarget,comparatorMathQualification,identifiabilityQualification,qualify,assertAuthorizationEffective,assertHighResolutionAuthorized,loadReferenceTarget,assertHighResolutionArgs,highResolutionPreflight,runHighResolution};
