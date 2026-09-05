#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const childProcess=require('child_process');
const h5=require('../src/h5.js');
const {Simulation:IntegritySimulation,streamSeed,FIXED_DT}=require('../src/integrity.js');
const core=require('../src/sim-core.js');
const h2est=require('./run-h2-estimation.js');
const h3est=require('./run-h3-estimation.js');
const h4est=require('./run-h4-estimation.js');
const {loadBundle,readJson}=require('./load-bundle.js');

const POLICY_FILE='hypotheses/h5_parameter_estimation_v1.json';
const POLICY_GIT_BLOB_SHA='ead45bacff89bf626deaaf3238a5c363b74279d1';
const AUTHORIZATION_FILE='hypotheses/h5_highres_authorization_v1.json';
const ENTRY_STREAM='h2_estimation_entry_transition_v1';
const ASSAYS=Object.freeze([
  ['s','open_arena_short_control.json'],
  ['l','open_arena_long_control.json']
]);
const HALTON=Object.freeze([
  [2,'angular_sigma_rad_sqrt_s'],
  [3,'entry_orientation_retention_q'],
  [5,'lambda_commitment_mm'],
  [7,'tau_commitment_s'],
  [11,'kappa_restore_per_s']
]);

const FROZEN_RUNTIME_BLOBS=Object.freeze({
  'src/h5.js':'b43f8e9fcaa4b2cc9981ed4f2922a833cc1a3177',
  'models/lasius_niger_locomotion_h5_v1.json':'ee2e5570f6d43cd91317fd38299b70bde32f191a',
  'src/integrity.js':'f23c68a6955832b70eeb3bd3e6893d71a3759018',
  'src/sim-core.js':'24777aac3577d442893e4779d70aee4e27761fe8',
  'src/measurement.js':'8845726e02360655c605851662256bc729277b21',
  'src/h3.js':'9bb8fc966a5aa4d4173f9bda2020c6d9cd9368f1',
  'tools/load-bundle.js':'235067f10ed85eeeaebcfe6fef0963940d516b6b',
  'tools/run-h2-estimation.js':'0fb069b3772c30f5769b4d1be285be7f67f3efe3',
  'tools/run-h3-estimation.js':'9b27812fcb869489d4979e26e8085cb8d2bf6fc1',
  'tools/run-h4-estimation.js':'d417c62a4ef4f97c338a1da2f1ff10f49e18c175',
  'experiments/open_arena_short_control.json':'2a75bcff9e88dc8617911886f8381315d5c05638',
  'experiments/open_arena_long_control.json':'f38632b4fad43f0282b85e345416a1c6f1593725',
  'states/naive_outbound_v1.json':'d3db29a83eed68bc28f771c147dd33966764d535',
  'apparatus/poissonnier2026_open_arena.json':'1f6461ffa392656a7cf807413ad2120636d99ee9',
  'observations/poissonnier2026_tracking_25fps.json':'8720b5ee34165d167a7ff7a5a363449ffabef2ad',
  'scoring/open_arena_first_border_v1.json':'7e6ee59c223a9da1763d6b54ef3a2e3938c8bee0'
});

const FROZEN_REFERENCE_COMPARATOR_BLOBS=Object.freeze({
  'reference/calibration_manifest.json':'29044577af38dced5cccb83c687117ee878fd66c',
  'reference/poissonnier2026_source_manifest.json':'545c108f0da20cbebbe8e95c62e43fc5443d9f18',
  'reference/poissonnier2026_h2_estimation_targets.json':'07e2b8cf2dddbfcb152f0bd6d3031d473e0901b3',
  'models/lasius_niger_locomotion_h2_v1.json':'3d12970e782b5fd1dc54727f4d8df044c11801db',
  'models/lasius_niger_locomotion_h3_v1.json':'fe33c31facfcabb7ddeb9a7bedf71ac248ad8e84',
  'models/lasius_niger_locomotion_h4_v1.json':'4f14e9f9b5eaab4cc89f28cbd033a8fd26a8f944',
  'reports/h2_parameter_estimation_500x60_v1.json':'342f7a5af7c1ed71a8bdb7ff14becf38d24daa88',
  'reports/h3_parameter_estimation_500x60_v1.json':'1d5c1b88ca9b425e927d761bc3ff1e5bad5bd5f3',
  'reports/h4_parameter_estimation_500x60_v1.json':'8619b96bb3a02e78b905320ac96585bec08b2918'
});

function clone(v){return JSON.parse(JSON.stringify(v));}
function arg(name,def){const i=process.argv.indexOf(`--${name}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:def;}
function hasArg(name){return process.argv.includes(`--${name}`);}
function narg(name,def){return Number(arg(name,def));}
function near(a,b,tol=1e-12){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol;}
function gitBlobShaBuffer(buf){return crypto.createHash('sha1').update(Buffer.from(`blob ${buf.length}\0`)).update(buf).digest('hex');}
function gitBlobShaFile(file){return gitBlobShaBuffer(fs.readFileSync(file));}
function currentRepoCommit(root){try{return childProcess.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch(_){return process.env.GITHUB_SHA||null;}}

function assertExactPolicyBlob(root){
  const file=path.resolve(root,POLICY_FILE),sha=gitBlobShaFile(file);
  if(sha!==POLICY_GIT_BLOB_SHA)throw new Error(`H5 estimation policy blob mismatch: expected ${POLICY_GIT_BLOB_SHA}, got ${sha}.`);
  return{file,sha,policy:readJson(file)};
}
function assertBlobSet(root,blobs,label){
  const verified={};
  for(const[rel,expected]of Object.entries(blobs)){
    const actual=gitBlobShaFile(path.resolve(root,rel));
    if(actual!==expected)throw new Error(`${label} blob mismatch for ${rel}: expected ${expected}, got ${actual}.`);
    verified[rel]=actual;
  }
  return verified;
}
function assertFrozenRuntimeBlobs(root){return assertBlobSet(root,FROZEN_RUNTIME_BLOBS,'Frozen H5 runtime/input');}
function assertFrozenReferenceComparatorBlobs(root){return assertBlobSet(root,FROZEN_REFERENCE_COMPARATOR_BLOBS,'Frozen H5 reference/comparator');}

function assertSafeReportOutput(root,out){
  const resolved=path.resolve(out);
  if(path.extname(resolved).toLowerCase()!=='.json')throw new Error('H5 estimation output must be a JSON report.');
  if(fs.existsSync(resolved)&&fs.lstatSync(resolved).isSymbolicLink())throw new Error('H5 estimation refuses to write through a symbolic-link output path.');
  const rel=path.relative(root,resolved),insideRepo=rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));
  if(insideRepo){
    const reportsRoot=path.resolve(root,'reports'),reportRel=path.relative(reportsRoot,resolved);
    const insideReports=reportRel!==''&&!reportRel.startsWith('..'+path.sep)&&reportRel!=='..'&&!path.isAbsolute(reportRel);
    if(!insideReports)throw new Error('H5 estimation may write inside the repository only under reports/.');
  }
  return resolved;
}

function halton(index,base){let f=1,r=0,i=index;while(i>0){f/=base;r+=f*(i%base);i=Math.floor(i/base);}return r;}
function mapVal(u,spec){const[a,b]=spec.bounds;return spec.scale==='log'?Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*u):a+(b-a)*u;}
function nullCandidate(i,policy){
  const p=policy.estimated_parameters,index=i+1;
  return{
    angular_sigma_rad_sqrt_s:mapVal(halton(index,2),p.angular_sigma_rad_sqrt_s),
    q:mapVal(halton(index,3),p.entry_orientation_retention_q),
    lambda_commitment_mm:500,
    tau_commitment_s:5,
    kappa_restore_per_s:0
  };
}
function contextCandidate(i,policy){
  const p=policy.estimated_parameters,index=i+1;
  return{
    angular_sigma_rad_sqrt_s:mapVal(halton(index,2),p.angular_sigma_rad_sqrt_s),
    q:mapVal(halton(index,3),p.entry_orientation_retention_q),
    lambda_commitment_mm:mapVal(halton(index,5),p.lambda_commitment_mm),
    tau_commitment_s:mapVal(halton(index,7),p.tau_commitment_s),
    kappa_restore_per_s:mapVal(halton(index,11),p.kappa_restore_per_s)
  };
}
function nullAnchor(n){return{angular_sigma_rad_sqrt_s:n.angular_sigma_rad_sqrt_s,q:n.q,lambda_commitment_mm:500,tau_commitment_s:5,kappa_restore_per_s:0,_source:'null_anchor'};}
function reportCandidate(c,kind,source='halton'){
  const out={angular_sigma_rad_sqrt_s:c.angular_sigma_rad_sqrt_s,q:c.q};
  if(kind==='context'){
    if(source==='exact_null_anchor'){
      out.lambda_commitment_mm=null;out.tau_commitment_s=null;out.kappa_restore_per_s=0;out.null_equivalent_anchor=true;
    }else{
      out.lambda_commitment_mm=c.lambda_commitment_mm;out.tau_commitment_s=c.tau_commitment_s;out.kappa_restore_per_s=c.kappa_restore_per_s;
    }
  }
  return out;
}
function configuredModel(base,c){
  const m=clone(base);
  if(!near(Number(m.movement.base_speed_mm_s),24,1e-15))throw new Error('Frozen H5 estimator requires base_speed_mm_s fixed at 24.');
  m.movement.angular_sigma_rad_sqrt_s=c.angular_sigma_rad_sqrt_s;
  const h=m.heading_restoration;
  if(!h||h.enabled!==true)throw new Error('H5 estimator requires enabled heading_restoration.');
  h.initialization.lambda_commitment_mm=c.lambda_commitment_mm;
  h.decay.tau_commitment_s=c.tau_commitment_s;
  h.effect.kappa_restore_per_s=c.kappa_restore_per_s;
  return m;
}
function exitEdge(ex,w,h){if(!ex)return'timeout';const d={left:Math.abs(ex.x),right:Math.abs(ex.x-w),top:Math.abs(ex.y),bottom:Math.abs(ex.y-h)};return Object.keys(d).sort((a,b)=>d[a]-d[b])[0];}
function applySharedEntryTransition(sim,seed,q){
  const rr=new core.RNG(streamSeed(seed,ENTRY_STREAM));
  if(rr.next()>q)sim.ants[0].heading=rr.next()*2*Math.PI-Math.PI;
  return sim.ants[0].heading;
}
function simulateCandidate(c,trials,seed0,base,dt=FIXED_DT){
  const model=configuredModel(base,c),out=[];
  for(const[pl,exp]of ASSAYS){
    for(let i=0;i<trials;i++){
      const seed=seed0+i,b=loadBundle(exp,{modelId:model.id});
      b.model=clone(model);b.observation.record_trajectories=false;
      const sim=new h5.Simulation(b,seed);
      applySharedEntryTransition(sim,seed,c.q);
      const sx=sim.ants[0].x,sy=sim.ants[0].y;
      const summary=sim.runUntilComplete(b.experiment.duration_s,dt),r=summary.observed_metrics.ants[0],ex=r.exit_coordinate_mm;
      out.push({path_length:pl,time_to_exit_s:r.time_to_arena_edge_s??b.experiment.duration_s,middle_zone_fraction:r.central_zone_fraction??0,beeline_mm:ex?Math.hypot(ex.x-sx,ex.y-sy):0,exit_edge:exitEdge(ex,sim.apparatus.world.width,sim.apparatus.world.height)});
    }
  }
  return out;
}

const score=h4est.score;
const scoreScales=h4est.scoreScales;
const edgeProbs=h4est.edgeProbs;

function effective(c,L){
  const C=1-Math.exp(-L/c.lambda_commitment_mm),R=c.kappa_restore_per_s*C,E=R*c.tau_commitment_s;
  return{commitment:C,initial_restoration_rate_per_s:R,idealized_infinite_horizon_exponent:E};
}
function parameterSpec(policy,key){return policy.estimated_parameters[key];}
function nearBound(value,spec){
  if(!spec||!Number.isFinite(value))return false;
  const[a,b]=spec.bounds,u=spec.scale==='log'?(Math.log(value)-Math.log(a))/(Math.log(b)-Math.log(a)):(value-a)/(b-a);
  return u<=0.01||u>=0.99;
}
function boundaryFlags(c,policy,kind){
  const pairs=[['angular_sigma_rad_sqrt_s','angular_sigma_rad_sqrt_s'],['q','entry_orientation_retention_q']];
  if(kind==='context')pairs.push(['lambda_commitment_mm','lambda_commitment_mm'],['tau_commitment_s','tau_commitment_s'],['kappa_restore_per_s','kappa_restore_per_s']);
  return pairs.filter(([ck,pk])=>nearBound(c[ck],parameterSpec(policy,pk))).map(([,pk])=>pk);
}
function scoreCandidate(c,kind,realRows,policy,base,trials,seed0,source){
  const sc=score(simulateCandidate(c,trials,seed0,base),realRows),flagKind=source==='exact_null_anchor'?'null':kind;
  const row={candidate:reportCandidate(c,kind,source),source,loss:sc.loss,components:sc.components,near_search_bounds:boundaryFlags(c,policy,flagKind)};
  if(kind==='context'&&source!=='exact_null_anchor'){
    const e200=effective(c,200),e1000=effective(c,1000);
    row.effective={
      C200:e200.commitment,C1000:e1000.commitment,
      R200:e200.initial_restoration_rate_per_s,R1000:e1000.initial_restoration_rate_per_s,
      delta_R0:e1000.initial_restoration_rate_per_s-e200.initial_restoration_rate_per_s,
      E200:e200.idealized_infinite_horizon_exponent,E1000:e1000.idealized_infinite_horizon_exponent,
      commitment_half_life_s:c.tau_commitment_s*Math.log(2)
    };
  }else if(kind==='context'){
    row.effective={R200:0,R1000:0,delta_R0:0,E200:0,E1000:0,null_equivalent:true};
  }
  return row;
}
function searchNull(realRows,policy,base,{count,trials,seed0}){
  let best=null,bestCandidate=null;const top=[];
  for(let i=0;i<count;i++){const c=nullCandidate(i,policy),row=scoreCandidate(c,'null',realRows,policy,base,trials,seed0,`halton_${i+1}`);top.push(row);if(!best||row.loss<best.loss){best=row;bestCandidate=c;}}
  top.sort((a,b)=>a.loss-b.loss);return{best,top:top.slice(0,Math.min(12,top.length)),selectedCandidate:bestCandidate};
}
function searchContext(realRows,policy,base,{count,trials,seed0,nullSelected}){
  if(count<2)throw new Error('H5-context search requires at least two candidates so one slot remains the exact null anchor.');
  let best=null,bestCandidate=null;const top=[];
  for(let i=0;i<count-1;i++){const c=contextCandidate(i,policy),row=scoreCandidate(c,'context',realRows,policy,base,trials,seed0,`halton_${i+1}`);top.push(row);if(!best||row.loss<best.loss){best=row;bestCandidate=c;}}
  const anchor=nullAnchor(nullSelected),anchorRow=scoreCandidate(anchor,'context',realRows,policy,base,trials,seed0,'exact_null_anchor');top.push(anchorRow);
  if(!best||anchorRow.loss<best.loss){best=anchorRow;bestCandidate=anchor;}
  top.sort((a,b)=>a.loss-b.loss);return{best,top:top.slice(0,Math.min(12,top.length)),selectedCandidate:bestCandidate,anchor:anchorRow};
}
function h2CandidateFromReportFold(fold){return h4est.h2CandidateFromReportFold(fold);}
function h3CandidateFromReportFold(fold){return h4est.h3CandidateFromReportFold(fold);}
function h4CandidateFromReportFold(fold){
  const fit=fold&&fold.H4_context&&fold.H4_context.fit,c=fit&&fit.candidate;
  if(!c)throw new Error('Recorded H4 report is missing fold H4_context candidate.');
  return{
    base_speed_mm_s:c.base_speed_mm_s,
    angular_sigma_rad_sqrt_s:c.angular_sigma_rad_sqrt_s,
    q:c.q,
    lambda_activation_mm:c.lambda_activation_mm==null?500:c.lambda_activation_mm,
    tau_activation_s:c.tau_activation_s==null?5:c.tau_activation_s,
    rho_speed:Number(c.rho_speed)||0,
    source:fit.source
  };
}
function assertPolicySemantics(policy){
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  if(policy.id!=='H5_parameter_estimation_v1'||policy.status!=='development_estimation_policy_frozen_before_estimator_implementation_or_parameter_search')throw new Error('Unexpected H5 frozen policy identity/status.');
  if(policy.model_candidate!=='lasius_niger_locomotion_h5_v1')throw new Error('Unexpected H5 model candidate.');
  const p=policy.estimated_parameters;
  if(!eq(p.angular_sigma_rad_sqrt_s.bounds,[0.7,2.4])||p.angular_sigma_rad_sqrt_s.scale!=='linear')throw new Error('Frozen H5 angular-sigma bounds/scale changed.');
  if(!eq(p.entry_orientation_retention_q.bounds,[0,1])||p.entry_orientation_retention_q.scale!=='linear')throw new Error('Frozen H5 q bounds/scale changed.');
  if(!eq(p.lambda_commitment_mm.bounds,[100,3000])||p.lambda_commitment_mm.scale!=='log')throw new Error('Frozen H5 lambda bounds/scale changed.');
  if(!eq(p.tau_commitment_s.bounds,[0.5,40])||p.tau_commitment_s.scale!=='log')throw new Error('Frozen H5 tau bounds/scale changed.');
  if(!eq(p.kappa_restore_per_s.bounds,[0,2])||p.kappa_restore_per_s.scale!=='linear'||p.kappa_restore_per_s.nested_null_value!==0)throw new Error('Frozen H5 kappa bounds/null changed.');
  if(Object.prototype.hasOwnProperty.call(p,'base_speed_mm_s'))throw new Error('Frozen H5 policy forbids a fitted baseline-speed nuisance.');
  const s=policy.search_protocol,b=s.high_resolution_budget;
  if(b.H5_null_candidates_per_fold!==500||b.H5_context_candidates_per_fold_total!==500||b.training_trials_per_condition_per_candidate!==60||b.heldout_evaluation_trials_per_condition!==120||b.folds!==6||s.root_seed!==1110000)throw new Error('Frozen H5 high-resolution budget/seed changed.');
  if(!near(policy.numerical_invariants.physics_dt_s,FIXED_DT,1e-15))throw new Error('Frozen H5 physics dt does not match simulator.');
  const mapping=HALTON.map(([prime,parameter])=>({prime,parameter}));
  if(JSON.stringify(s.halton_mapping)!==JSON.stringify(mapping))throw new Error('Frozen H5 Halton mapping changed.');
  if(policy.entry_transition_model?.rng_stream!==ENTRY_STREAM)throw new Error('Frozen H5 entry-transition RNG stream changed.');
  if(policy.estimator_implementation_gate?.high_resolution_search_authorized!==false)throw new Error('Frozen H5 policy must not itself authorize high-resolution search.');
  if(!String(policy.holdout_rule||'').includes('Y-maze'))throw new Error('Frozen H5 policy must protect the Y-maze.');
}
function reportSourceHash(r){return r.execution?.source_xlsx_sha256||r.source_xlsx_sha256||null;}
function reportYmaze(r){return r.fit_policy?.ymaze_accessed??r.ymaze_accessed;}
function validateReferenceInputs({policy,target,cal,sourceManifest,h2Report,h3Report,h4Report,targetPath}){
  assertPolicySemantics(policy);
  if(gitBlobShaFile(targetPath)!==policy.reference_target_git_blob_sha)throw new Error('H5 reference target Git blob does not match policy.');
  if(target.source_xlsx_sha256!==policy.reference_source_xlsx_sha256)throw new Error('H5 target XLSX hash does not match policy.');
  const d=cal.datasets?.poissonnier2026_open_arena;
  if(d?.allowed_for_development_parameter_estimation!==true||d?.allowed_for_fitting!==false)throw new Error('Open-arena manifest does not permit development estimation while canonical fitting remains locked.');
  if(cal.datasets?.poissonnier2026_ymaze?.allowed_for_development_parameter_estimation!==false)throw new Error('Y-maze must remain forbidden for development estimation.');
  if(target.status!=='development_estimation_only_not_external_validation'||target.rows.some(r=>!['s','l'].includes(r.path_length)))throw new Error('Unexpected H5 target scope/status.');
  const published=sourceManifest.supplements?.find(s=>s.role==='published_dataset');
  if(!published?.sha256||published.sha256!==target.source_xlsx_sha256)throw new Error('H5 target does not match canonical XLSX hash.');
  for(const[r,name]of[[h2Report,'H2'],[h3Report,'H3'],[h4Report,'H4']]){
    if(r?.status!=='development_estimation_failed_promotion_guard')throw new Error(`Expected frozen failed-promotion ${name} report.`);
    if(reportSourceHash(r)!==target.source_xlsx_sha256)throw new Error(`${name} report uses a different source XLSX.`);
    if(reportYmaze(r)!==false)throw new Error(`${name} report must not have accessed the Y-maze.`);
  }
  const colonies=[...new Set(target.rows.map(r=>r.colony))].sort((a,b)=>a-b);
  for(const[r,name]of[[h2Report,'H2'],[h3Report,'H3'],[h4Report,'H4']]){
    const rc=(r.folds||[]).map(f=>f.held_out_colony).sort((a,b)=>a-b);
    if(JSON.stringify(colonies)!==JSON.stringify(rc))throw new Error(`${name} comparison folds do not match H5 colony folds.`);
  }
  return{colonies};
}
function loadReferenceInputs(root,policy){
  const frozenRuntimeBlobs=assertFrozenRuntimeBlobs(root),frozenReferenceComparatorBlobs=assertFrozenReferenceComparatorBlobs(root);
  const targetPath=path.resolve(root,policy.reference_target_file),target=readJson(targetPath);
  const cal=readJson(path.resolve(root,'reference','calibration_manifest.json')),sourceManifest=readJson(path.resolve(root,'reference','poissonnier2026_source_manifest.json'));
  const base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h5_v1.json')),h2Base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h2_v1.json')),h3Base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h3_v1.json')),h4Base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h4_v1.json'));
  const h2Report=readJson(path.resolve(root,'reports','h2_parameter_estimation_500x60_v1.json')),h3Report=readJson(path.resolve(root,'reports','h3_parameter_estimation_500x60_v1.json')),h4Report=readJson(path.resolve(root,'reports','h4_parameter_estimation_500x60_v1.json'));
  const v=validateReferenceInputs({policy,target,cal,sourceManifest,h2Report,h3Report,h4Report,targetPath});
  return{target,cal,sourceManifest,base,h2Base,h3Base,h4Base,h2Report,h3Report,h4Report,targetPath,frozenRuntimeBlobs,frozenReferenceComparatorBlobs,colonies:v.colonies};
}
function median(xs){const a=[...xs].sort((x,y)=>x-y),n=a.length;if(!n)return NaN;const m=Math.floor(n/2);return n%2?a[m]:(a[m-1]+a[m])/2;}
function runLoco({policy,inputs,count,trials,evalTrials,seed0,evidence}){
  const{target,base,h2Base,h3Base,h4Base,h2Report,h3Report,h4Report,colonies}=inputs,folds=[];
  for(let fi=0;fi<colonies.length;fi++){
    const held=colonies[fi],train=target.rows.filter(r=>r.colony!==held),test=target.rows.filter(r=>r.colony===held),fitSeed=seed0+fi*10000,evalSeed=seed0+600000+fi*10000,scales=scoreScales(train);
    const ns=searchNull(train,policy,base,{count,trials,seed0:fitSeed});
    const cs=searchContext(train,policy,base,{count,trials,seed0:fitSeed,nullSelected:ns.selectedCandidate});
    const nEval=score(simulateCandidate(ns.selectedCandidate,evalTrials,evalSeed,base),test,scales),cEval=score(simulateCandidate(cs.selectedCandidate,evalTrials,evalSeed,base),test,scales);
    const h2Fold=h2Report.folds.find(f=>f.held_out_colony===held),h3Fold=h3Report.folds.find(f=>f.held_out_colony===held),h4Fold=h4Report.folds.find(f=>f.held_out_colony===held);
    const h2c=h2CandidateFromReportFold(h2Fold),h3c=h3CandidateFromReportFold(h3Fold),h4c=h4CandidateFromReportFold(h4Fold);
    const h2Eval=score(h2est.simulateCandidate(h2c,evalTrials,evalSeed,h2Base),test,scales),h3Eval=score(h3est.simulateCandidate(h3c,evalTrials,evalSeed,h3Base),test,scales),h4Eval=score(h4est.simulateCandidate(h4c,evalTrials,evalSeed,h4Base),test,scales);
    const prior=[['H2',h2Eval],['H3',h3Eval],['H4',h4Eval]].sort((a,b)=>a[1].loss-b[1].loss),bestPrior=prior[0];
    const rel=(loss)=>(loss-cEval.loss)/Math.max(1e-12,loss);
    folds.push({
      held_out_colony:held,train_n:train.length,test_n:test.length,fit_seed:fitSeed,evaluation_seed:evalSeed,evaluation_trials_per_condition:evalTrials,heldout_metric_scales_from_training:scales,
      H5_null:{fit:ns.best,training_top_candidates:ns.top,heldout_loss:nEval.loss,heldout_components:nEval.components},
      H5_context:{fit:cs.best,training_top_candidates:cs.top,heldout_loss:cEval.loss,heldout_components:cEval.components,null_anchor_train_loss:cs.anchor.loss},
      H2_v1_frozen_candidate:{candidate:h2c,reevaluated_heldout_loss_matched_crn:h2Eval.loss,heldout_components:h2Eval.components},
      H3_v1_frozen_candidate:{candidate:h3c,reevaluated_heldout_loss_matched_crn:h3Eval.loss,heldout_components:h3Eval.components},
      H4_v1_frozen_candidate:{candidate:h4c,reevaluated_heldout_loss_matched_crn:h4Eval.loss,heldout_components:h4Eval.components},
      per_fold_best_prior:{family:bestPrior[0],reevaluated_heldout_loss_matched_crn:bestPrior[1].loss},
      heldout_relative_improvement_vs_H5_null:rel(nEval.loss),
      heldout_relative_improvement_vs_H2_v1:rel(h2Eval.loss),
      heldout_relative_improvement_vs_H3_v1:rel(h3Eval.loss),
      heldout_relative_improvement_vs_H4_v1:rel(h4Eval.loss),
      heldout_relative_improvement_vs_best_prior:rel(bestPrior[1].loss)
    });
  }
  const summaries={};
  for(const[key,label]of[
    ['heldout_relative_improvement_vs_H5_null','H5_null'],
    ['heldout_relative_improvement_vs_H2_v1','H2_v1'],
    ['heldout_relative_improvement_vs_H3_v1','H3_v1'],
    ['heldout_relative_improvement_vs_H4_v1','H4_v1'],
    ['heldout_relative_improvement_vs_best_prior','best_prior']
  ]){
    const vals=folds.map(f=>f[key]);summaries[label]={wins:vals.filter(x=>x>0).length,median:median(vals)};
  }
  if(!evidence)return{folds,execution_path_smoke_summary:{H5_wins_vs_H5_null:summaries.H5_null.wins,median_relative_improvement_vs_H5_null:summaries.H5_null.median,H5_wins_vs_best_prior:summaries.best_prior.wins,median_relative_improvement_vs_best_prior:summaries.best_prior.median,promotion_evaluated:false,scientific_evidence:false}};
  const nullPass=summaries.H5_null.wins>=5&&summaries.H5_null.median>0,bestPass=summaries.best_prior.wins>=4&&summaries.best_prior.median>0;
  const pairPass={H2:summaries.H2_v1.wins>=4&&summaries.H2_v1.median>0,H3:summaries.H3_v1.wins>=4&&summaries.H3_v1.median>0,H4:summaries.H4_v1.wins>=4&&summaries.H4_v1.median>0};
  const boundaryHitCounts={},nullAnchorSelectedFolds=[];
  for(const f of folds){const fit=f.H5_context.fit;if(fit.source==='exact_null_anchor')nullAnchorSelectedFolds.push(f.held_out_colony);for(const k of fit.near_search_bounds||[])boundaryHitCounts[k]=(boundaryHitCounts[k]||0)+1;}
  return{
    folds,
    identifiability:{boundary_hit_counts_across_selected_H5_context_folds:boundaryHitCounts,null_anchor_selected_folds:nullAnchorSelectedFolds,top_training_candidates_retained_per_model_per_fold:12,ridge_assessment:'Not automated because the frozen policy defines no numeric ridge tolerance; effective quantities and top candidates are retained for review.'},
    internal_cv:{
      H5_wins_vs_H5_null:summaries.H5_null.wins,total_folds:folds.length,median_relative_improvement_vs_H5_null:summaries.H5_null.median,H5_survival_guard_passed:nullPass,
      H5_wins_vs_H2_v1:summaries.H2_v1.wins,median_relative_improvement_vs_H2_v1:summaries.H2_v1.median,H2_pairwise_guard_passed:pairPass.H2,
      H5_wins_vs_H3_v1:summaries.H3_v1.wins,median_relative_improvement_vs_H3_v1:summaries.H3_v1.median,H3_pairwise_guard_passed:pairPass.H3,
      H5_wins_vs_H4_v1:summaries.H4_v1.wins,median_relative_improvement_vs_H4_v1:summaries.H4_v1.median,H4_pairwise_guard_passed:pairPass.H4,
      H5_wins_vs_best_prior:summaries.best_prior.wins,median_relative_improvement_vs_best_prior:summaries.best_prior.median,best_prior_guard_passed:bestPass,
      development_preferred:null,
      canonical_promotion:false
    }
  };
}
function finalizeEvidenceRun(run){
  if(run.internal_cv)run.internal_cv.development_preferred=run.internal_cv.H5_survival_guard_passed&&run.internal_cv.best_prior_guard_passed;
  return run;
}
function assertHighResolutionArgs(policy){
  const b=policy.search_protocol.high_resolution_budget,checks=[['candidates',b.H5_null_candidates_per_fold],['trials',b.training_trials_per_condition_per_candidate],['eval-trials',b.heldout_evaluation_trials_per_condition],['seed',policy.search_protocol.root_seed],['dt',policy.numerical_invariants.physics_dt_s]];
  for(const[name,expected]of checks)if(hasArg(name)&&Number(arg(name,expected))!==expected)throw new Error(`Frozen H5 high-resolution mode forbids --${name} override; expected ${expected}.`);
}
function currentBranchName(root){
  if(process.env.GITHUB_REF_NAME)return process.env.GITHUB_REF_NAME;
  try{
    const name=childProcess.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
    return name||null;
  }catch(_){return null;}
}
function assertAuthorizationEffective(a,root,{branchName=null}={}){
  const branch=branchName||currentBranchName(root);
  if(a.effective_when_merged_to_main===true&&branch!=='main'){
    throw new Error(`H5 high-resolution authorization is not effective until merged to main; current branch is ${branch||'unknown'}.`);
  }
  return branch;
}
function assertHighResolutionAuthorized(root,estimatorBlob=null,options={}){
  const file=path.resolve(root,AUTHORIZATION_FILE);
  if(!fs.existsSync(file))throw new Error('H5 high-resolution search is not authorized: missing post-qualification authorization artifact.');
  const a=readJson(file),actualEstimator=estimatorBlob||gitBlobShaFile(__filename);
  if(a.id!=='H5_high_resolution_authorization_v1'||a.status!=='qualified_estimator_authorized_for_frozen_high_resolution_search'||a.high_resolution_search_authorized!==true)throw new Error('Invalid H5 high-resolution authorization status.');
  if(a.policy_git_blob_sha!==POLICY_GIT_BLOB_SHA)throw new Error('H5 authorization policy pin mismatch.');
  if(a.estimator_git_blob_sha!==actualEstimator)throw new Error('H5 authorization estimator blob mismatch.');
  assertAuthorizationEffective(a,root,options);
  return a;
}
function syntheticThetaReferenceQualification(base){
  const c={angular_sigma_rad_sqrt_s:0.9,q:0,lambda_commitment_mm:500,tau_commitment_s:5,kappa_restore_per_s:0.5},model=configuredModel(base,c),b=loadBundle('open_arena_short_control.json',{modelId:model.id});
  b.model=model;b.observation.record_trajectories=false;
  const seed=884101,sim=new h5.Simulation(b,seed),ant=sim.ants[0];
  if(ant.headingReferenceCaptured)return false;
  const expected=applySharedEntryTransition(sim,seed,0);
  sim.step(FIXED_DT);
  return ant.headingReferenceCaptured&&near(core.normalizeAngle(ant.headingReference-expected),0,1e-14);
}
function deterministicIdentityQualification(){
  const cfg={tau:5,kappa:0.5},c0=0.8,heading=0.9,reference=-0.2,t=1.3,delta0=core.normalizeAngle(heading-reference);
  const expected=core.normalizeAngle(reference+2*Math.atan(Math.tan(delta0/2)*Math.exp(-cfg.kappa*c0*cfg.tau*(1-Math.exp(-t/cfg.tau)))));
  const actual=h5.exactHeadingRestorationAngle(heading,reference,c0,cfg,t);
  return near(core.normalizeAngle(actual-expected),0,2e-14);
}
function qualify({root,policy,trials=3}){
  assertPolicySemantics(policy);
  const runtimeBlobs=assertFrozenRuntimeBlobs(root),referenceComparatorBlobHashes=assertFrozenReferenceComparatorBlobs(root),base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h5_v1.json'));
  const short=loadBundle('open_arena_short_control.json',{modelId:base.id}),long=loadBundle('open_arena_long_control.json',{modelId:base.id}),checks={};
  checks.context_inputs=short.experiment.protocol.state_facts.recent_constrained_travel_mm===200&&long.experiment.protocol.state_facts.recent_constrained_travel_mm===1000;
  checks.fixed_baseline_speed=near(base.movement.base_speed_mm_s,24,1e-15)&&!Object.prototype.hasOwnProperty.call(policy.estimated_parameters,'base_speed_mm_s');
  const nc=nullCandidate(7,policy),cc=contextCandidate(7,policy);
  checks.nuisance_coordinate_pairing=near(nc.angular_sigma_rad_sqrt_s,cc.angular_sigma_rad_sqrt_s)&&near(nc.q,cc.q);
  const anchor=nullAnchor(nc),nr=simulateCandidate(nc,trials,883100,base),ar=simulateCandidate(anchor,trials,883100,base);
  checks.null_anchor_equivalence=JSON.stringify(nr)===JSON.stringify(ar);
  checks.candidate_parameter_wiring=(()=>{const m=configuredModel(base,cc);return near(m.movement.base_speed_mm_s,24)&&near(m.movement.angular_sigma_rad_sqrt_s,cc.angular_sigma_rad_sqrt_s)&&near(m.heading_restoration.initialization.lambda_commitment_mm,cc.lambda_commitment_mm)&&near(m.heading_restoration.decay.tau_commitment_s,cc.tau_commitment_s)&&near(m.heading_restoration.effect.kappa_restore_per_s,cc.kappa_restore_per_s);})();
  checks.shared_q_precedes_theta_ref=syntheticThetaReferenceQualification(base);
  const source=fs.readFileSync(path.resolve(root,'src','h5.js'),'utf8');
  checks.no_geometry_target_read=!/(centerline|edge[_ ]?bearing|bearing[_ ]?to[_ ]?edge|apparatus[_ ]?forward|fixed[_ ]?axis|target[_ ]?heading)/i.test(source);
  checks.no_added_rng_and_kappa0_baseline_equivalence=(()=>{
    const c={...nc,q:0.41},m=configuredModel(base,c),b1=loadBundle('open_arena_short_control.json',{modelId:m.id}),b2=loadBundle('open_arena_short_control.json',{modelId:m.id});
    b1.model=clone(m);b2.model=clone(m);b2.model.heading_restoration.enabled=false;b1.observation.record_trajectories=false;b2.observation.record_trajectories=false;
    const seed=884202,a=new h5.Simulation(b1,seed),b=new IntegritySimulation(b2,seed);applySharedEntryTransition(a,seed,c.q);applySharedEntryTransition(b,seed,c.q);
    for(let i=0;i<60;i++){a.step(FIXED_DT);b.step(FIXED_DT);}
    return near(a.ants[0].x,b.ants[0].x,1e-12)&&near(a.ants[0].y,b.ants[0].y,1e-12)&&near(core.normalizeAngle(a.ants[0].heading-b.ants[0].heading),0,1e-12)&&a.ants[0].rng.state===b.ants[0].rng.state;
  })();
  checks.pause_preview_no_mutation_and_no_paused_drift=(()=>{
    const sim=new h5.Simulation(short,884303),ant=sim.ants[0];sim.step(FIXED_DT);ant.heading=core.normalizeAngle(ant.headingReference+0.7);ant.pauseRemaining=0.5;ant.state='paused';const rng=ant.rng.state,h=ant.heading,c=ant.headingCommitment;h5.movingThisStepWithoutMutation(ant,sim.model.movement,FIXED_DT);const previewUnchanged=ant.rng.state===rng;sim.step(FIXED_DT);return previewUnchanged&&ant.rng.state===rng&&near(core.normalizeAngle(ant.heading-h),0,1e-14)&&near(ant.headingCommitment,c*Math.exp(-FIXED_DT/sim.h5Config.tau),2e-14);
  })();
  checks.exact_deterministic_identity=deterministicIdentityQualification();
  const ep=edgeProbs([{exit_edge:'left'},{exit_edge:'timeout'}]);
  checks.five_category_exit_normalization=ep.length===5&&near(ep.reduce((a,b)=>a+b,0),1,1e-15)&&near(ep[4],0.5,1e-15);
  checks.scorer_identity_is_frozen_h4=h4est.score===score&&h4est.scoreScales===scoreScales&&h4est.edgeProbs===edgeProbs;
  const tr=[{time_to_exit_s:1,middle_zone_fraction:.1,beeline_mm:10},{time_to_exit_s:3,middle_zone_fraction:.3,beeline_mm:30},{time_to_exit_s:5,middle_zone_fraction:.5,beeline_mm:50}],ho=[{time_to_exit_s:10,middle_zone_fraction:.2,beeline_mm:100},{time_to_exit_s:30,middle_zone_fraction:.8,beeline_mm:300},{time_to_exit_s:50,middle_zone_fraction:.9,beeline_mm:500}];
  const ts=scoreScales(tr),hs=scoreScales(ho);
  checks.training_fold_scaling_semantics=!near(ts.time,hs.time)&&!near(ts.beeline,hs.beeline);
  checks.frozen_cross_family_report_blobs=referenceComparatorBlobHashes['reports/h2_parameter_estimation_500x60_v1.json']==='342f7a5af7c1ed71a8bdb7ff14becf38d24daa88'&&referenceComparatorBlobHashes['reports/h3_parameter_estimation_500x60_v1.json']==='1d5c1b88ca9b425e927d761bc3ff1e5bad5bd5f3'&&referenceComparatorBlobHashes['reports/h4_parameter_estimation_500x60_v1.json']==='8619b96bb3a02e78b905320ac96585bec08b2918';
  checks.colony_identity_not_model_input=!JSON.stringify(base).toLowerCase().includes('colony');
  checks.ymaze_inaccessible=ASSAYS.every(([,x])=>!x.toLowerCase().includes('ymaze'));
  const passed=Object.values(checks).every(Boolean);
  return{schema_version:1,qualification_id:'H5_estimator_synthetic_qualification_v1',policy_git_blob_sha:POLICY_GIT_BLOB_SHA,estimator_git_blob_sha:gitBlobShaFile(__filename),status:passed?'passed':'failed',reference_outcomes_accessed:false,reference_files_semantically_loaded:false,reference_comparator_files_hash_verified_only:true,ymaze_accessed:false,scientific_evidence:false,frozen_runtime_blobs_verified:runtimeBlobs,frozen_reference_comparator_blob_hashes_verified:referenceComparatorBlobHashes,trials_per_condition:trials,checks};
}
function highResolutionPreflight({root,policy}){
  const q=qualify({root,policy,trials:3});
  if(q.status!=='passed'||q.reference_outcomes_accessed!==false||q.ymaze_accessed!==false)throw new Error('Frozen H5 high-resolution search requires passing reference-free synthetic qualification.');
  const authorization=assertHighResolutionAuthorized(root,q.estimator_git_blob_sha);
  return{qualification:q,authorization};
}
function writeReport(report,out){
  const root=path.resolve(__dirname,'..'),safe=assertSafeReportOutput(root,out);fs.writeFileSync(safe,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log(`Saved ${safe}`);
}
function reportSummary(r){return{id:r.id||r.estimation_id,status:r.status,repo_commit:r.execution?.repo_commit};}
function main(){
  const root=path.resolve(__dirname,'..'),pinned=assertExactPolicyBlob(root),policy=pinned.policy,mode=arg('mode','qualification');assertPolicySemantics(policy);
  if(mode==='qualification'){
    const q=qualify({root,policy,trials:Math.max(1,narg('trials',3))});
    if(q.status!=='passed')throw new Error(`H5 estimator qualification failed: ${JSON.stringify(q.checks)}`);
    return writeReport(q,path.resolve(process.cwd(),arg('out',path.join('reports','h5_estimator_qualification_v1.json'))));
  }
  if(mode!=='smoke'&&mode!=='highres')throw new Error(`Unknown H5 estimation mode '${mode}'. Use qualification, smoke, or highres.`);
  let evidence=false,preflight=null,count,trials,evalTrials,seed0;
  if(mode==='highres'){
    assertHighResolutionArgs(policy);
    preflight=highResolutionPreflight({root,policy});
    evidence=true;
    const b=policy.search_protocol.high_resolution_budget;count=b.H5_null_candidates_per_fold;trials=b.training_trials_per_condition_per_candidate;evalTrials=b.heldout_evaluation_trials_per_condition;seed0=policy.search_protocol.root_seed;
  }else{
    const q=qualify({root,policy,trials:2});
    if(q.status!=='passed')throw new Error('H5 smoke requires passing synthetic qualification before reference data are loaded.');
    preflight={qualification:q,authorization:null};
    count=Math.max(2,narg('candidates',8));trials=Math.max(1,narg('trials',4));evalTrials=Math.max(2,narg('eval-trials',Math.max(8,trials*2)));seed0=Math.max(1,narg('seed',policy.search_protocol.root_seed));
  }
  const inputs=loadReferenceInputs(root,policy);
  const run=finalizeEvidenceRun(runLoco({policy,inputs,count,trials,evalTrials,seed0,evidence}));
  const report={
    schema_version:1,estimation_id:policy.id,status:evidence?'development_estimation_high_resolution_complete':'execution_path_smoke_only_not_evidence',execution_class:evidence?'frozen_high_resolution':'low_resolution_smoke',scientific_evidence:evidence,policy_git_blob_sha:POLICY_GIT_BLOB_SHA,estimator_git_blob_sha:gitBlobShaFile(__filename),reference_outcomes_accessed:true,pre_reference_qualification:preflight.qualification,high_resolution_authorization:evidence?preflight.authorization:null,canonical_parameters_updated:false,ymaze_accessed:false,threshold_dependent_metrics_used:false,moving_speed_used_for_fit:false,moving_distance_used_for_fit:false,straightness_used_for_fit:false,raw_heading_diagnostics_used_for_fit:false,colony_identity_used_as_biological_input:false,H1_treatment_specific_entry_state_used:false,geometry_derived_theta_ref_used:false,entry_transition_rng_stream:ENTRY_STREAM,source_xlsx_sha256:inputs.target.source_xlsx_sha256,reference_target_git_blob_sha:gitBlobShaFile(inputs.targetPath),
    execution:{repo_commit:currentRepoCommit(root),node_version:process.version,frozen_runtime_blobs:inputs.frozenRuntimeBlobs,frozen_reference_comparator_blobs:inputs.frozenReferenceComparatorBlobs},
    search:{method:policy.search_protocol.method,H5_null_candidates_per_fold:count,H5_context_candidates_per_fold_total:count,context_halton_candidates_per_fold:count-1,exact_null_anchor_per_fold:1,training_trials_per_condition_per_candidate:trials,evaluation_trials_per_condition:evalTrials,folds:inputs.colonies.length,root_seed:seed0,evaluation_seed_offset:600000,physics_dt_s:FIXED_DT,common_random_numbers:true,heldout_continuous_scaling:'pooled training SD frozen per LOCO fold',exit_categories:['left','right','top','bottom','timeout'],halton_mapping:policy.search_protocol.halton_mapping},
    comparators:{H2_report:reportSummary(inputs.h2Report),H3_report:reportSummary(inputs.h3Report),H4_report:reportSummary(inputs.h4Report),rule:'Frozen H2/H3/H4 fold candidates are re-evaluated on H5 held-out rows with H5 training-derived scales, matched evaluation trials/seeds, and shared q CRN where applicable; no prior family is refit.'},
    ...run
  };
  if(evidence)report.status=report.internal_cv.H5_survival_guard_passed&&report.internal_cv.best_prior_guard_passed?'development_estimation_passed_development_preference_guards':'development_estimation_failed_development_preference_guards';
  return writeReport(report,path.resolve(process.cwd(),arg('out',evidence?path.join('reports','h5_parameter_estimation_500x60_v1.json'):path.join('reports','h5_estimation_smoke_v1.json'))));
}
if(require.main===module)main();

module.exports={
  POLICY_GIT_BLOB_SHA,AUTHORIZATION_FILE,ENTRY_STREAM,ASSAYS,HALTON,FROZEN_RUNTIME_BLOBS,FROZEN_REFERENCE_COMPARATOR_BLOBS,
  gitBlobShaBuffer,gitBlobShaFile,assertExactPolicyBlob,assertFrozenRuntimeBlobs,assertFrozenReferenceComparatorBlobs,assertSafeReportOutput,currentRepoCommit,
  halton,mapVal,nullCandidate,contextCandidate,nullAnchor,reportCandidate,configuredModel,applySharedEntryTransition,exitEdge,simulateCandidate,
  score,scoreScales,edgeProbs,effective,boundaryFlags,searchNull,searchContext,h2CandidateFromReportFold,h3CandidateFromReportFold,h4CandidateFromReportFold,
  assertPolicySemantics,validateReferenceInputs,loadReferenceInputs,runLoco,finalizeEvidenceRun,assertHighResolutionArgs,currentBranchName,assertAuthorizationEffective,assertHighResolutionAuthorized,
  syntheticThetaReferenceQualification,deterministicIdentityQualification,qualify,highResolutionPreflight
};
