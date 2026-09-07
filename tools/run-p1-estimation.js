#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const childProcess=require('child_process');
const p1=require('../src/p1.js');
const integrity=require('../src/integrity.js');
const {loadBundle,readJson}=require('./load-bundle.js');

const POLICY_FILE='hypotheses/p1_response_estimation_v1.json';
const POLICY_GIT_BLOB_SHA='628d17f6eb69fd11216aff33d1356d184365aedd';
const AUTHORIZATION_FILE='hypotheses/p1_highres_authorization_v1.json';
const RESPONSE_TARGET_FILE='reference/poissonnier2026_pheromone_response_targets.json';
const PRIMARY_METRICS=Object.freeze(['middle_zone_fraction','trail_axis_exit']);
const SECONDARY_METRICS=Object.freeze(['time_to_exit_s','beeline_mm']);
const PATHS=Object.freeze(['s','l']);
const TREATMENTS=Object.freeze(['dcm_control','pheromone']);
const HALTON=Object.freeze([[2,'sigma_field_mm'],[3,'kappa_trail_per_s']]);

const FROZEN_RUNTIME_BLOBS=Object.freeze({
  'src/p1.js':'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca',
  'models/lasius_niger_painted_trail_p1_v1.json':'73873fd6763838423ca27648136bb0b9ff062817',
  'apparatus/poissonnier2026_open_arena_p1_v1.json':'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4',
  'experiments/open_arena_p1_zero_dose_reachability.json':'6e47fa91143ed5d4d2b52bf2c555246b7d216297',
  'experiments/open_arena_p1_nominal_dose_reachability.json':'8232d378195304f2a15aa76da8abf108d94f2c58',
  'models/lasius_niger_locomotion_v1.json':'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d',
  'src/sim-core.js':'24777aac3577d442893e4779d70aee4e27761fe8',
  'src/integrity.js':'f23c68a6955832b70eeb3bd3e6893d71a3759018',
  'tools/load-bundle.js':'235067f10ed85eeeaebcfe6fef0963940d516b6b'
});

function clone(v){return JSON.parse(JSON.stringify(v));}
function arg(name,def){const i=process.argv.indexOf('--'+name);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:def;}
function hasArg(name){return process.argv.includes('--'+name);}
function narg(name,def){return Number(arg(name,def));}
function near(a,b,tol=1e-12){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol;}
function mean(xs){if(!xs.length)throw new Error('Cannot take mean of empty values.');return xs.reduce((a,b)=>a+b,0)/xs.length;}
function sampleSd(xs){if(xs.length<2)return 1;const m=mean(xs),v=xs.reduce((s,x)=>s+(x-m)*(x-m),0)/(xs.length-1);return Math.sqrt(v)||1;}
function median(xs){const a=[...xs].sort((x,y)=>x-y);if(!a.length)return NaN;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function gitBlobShaBuffer(buf){return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');}
function gitBlobShaFile(file){return gitBlobShaBuffer(fs.readFileSync(file));}
function currentRepoCommit(root){try{return childProcess.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch(_){return process.env.GITHUB_SHA||null;}}
function currentBranchName(root){if(process.env.GITHUB_REF_NAME)return process.env.GITHUB_REF_NAME;try{return childProcess.execFileSync('git',['branch','--show-current'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()||null;}catch(_){return null;}}

function assertSafeReportOutput(root,out){
  const resolved=path.resolve(out);
  if(path.extname(resolved).toLowerCase()!=='.json')throw new Error('P1 estimation output must be a JSON report.');
  if(fs.existsSync(resolved)&&fs.lstatSync(resolved).isSymbolicLink())throw new Error('P1 estimation refuses to write through a symbolic-link output path.');
  const rel=path.relative(root,resolved),inside=rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel));
  if(inside){
    const rr=path.resolve(root,'reports'),rrel=path.relative(rr,resolved);
    if(rrel===''||rrel.startsWith('..'+path.sep)||rrel==='..'||path.isAbsolute(rrel))throw new Error('P1 estimation may write inside the repository only under reports/.');
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
  if(sha!==POLICY_GIT_BLOB_SHA)throw new Error('P1 response-estimation policy blob mismatch: expected '+POLICY_GIT_BLOB_SHA+', got '+sha+'.');
  return{file,sha,policy:readJson(file)};
}
function assertResponseTargetHashOnly(root,policy){
  const file=path.resolve(root,RESPONSE_TARGET_FILE),actual=gitBlobShaFile(file),expected=policy.frozen_inputs.response_target.git_blob_sha;
  if(actual!==expected)throw new Error('P1 response target blob mismatch: expected '+expected+', got '+actual+'.');
  return actual;
}

function halton(index,base){let f=1,r=0,i=index;while(i>0){f/=base;r+=f*(i%base);i=Math.floor(i/base);}return r;}
function mapVal(u,spec){const a=spec.bounds[0],b=spec.bounds[1];return spec.scale==='log'?Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*u):a+(b-a)*u;}
function contextCandidate(i,policy){
  if(i<0||i>=policy.search_protocol.positive_context_candidates)throw new Error('P1 Halton candidate index out of range.');
  const index=i+1,p=policy.response_parameter_surface.estimated_parameters;
  return{sigma_field_mm:mapVal(halton(index,2),p.sigma_field_mm),kappa_trail_per_s:mapVal(halton(index,3),p.kappa_trail_per_s),candidate_index:index,source:'halton'};
}
function nullAnchor(policy){
  const a=policy.exact_nested_null.null_anchor;
  return{sigma_field_mm:a.sigma_field_mm,kappa_trail_per_s:a.kappa_trail_per_s,candidate_index:policy.search_protocol.candidate_budget_per_fold_total,source:'exact_null_anchor'};
}
function configuredModel(base,c){
  const m=clone(base),r=m.painted_trail_response;
  if(!r||r.enabled!==true)throw new Error('P1 estimator requires enabled painted_trail_response.');
  if(JSON.stringify(m.movement)!==JSON.stringify(base.movement))throw new Error('Unexpected movement mutation before P1 estimator configuration.');
  r.field.sigma_field_mm=c.sigma_field_mm;
  r.steering.kappa_trail_per_s=c.kappa_trail_per_s;
  return m;
}
function conditionExperiment(treatment){
  if(treatment==='dcm_control')return'open_arena_p1_zero_dose_reachability.json';
  if(treatment==='pheromone')return'open_arena_p1_nominal_dose_reachability.json';
  throw new Error('Unknown P1 treatment '+treatment+'.');
}
function trialSeed(seed0,pathCode,i,policy){
  const off=pathCode==='s'?policy.search_protocol.trial_seed_pairing.short_path_offset:policy.search_protocol.trial_seed_pairing.long_path_offset;
  if(!PATHS.includes(pathCode))throw new Error('Unknown P1 path stratum '+pathCode+'.');
  return seed0+off+i;
}
function exitEdge(ex,w,h){
  if(!ex)return'timeout';
  const d={left:Math.abs(ex.x),right:Math.abs(ex.x-w),top:Math.abs(ex.y),bottom:Math.abs(ex.y-h)};
  return Object.keys(d).sort((a,b)=>d[a]-d[b])[0];
}
function simulateTreatment(c,treatment,trials,seed0,base,policy){
  const model=configuredModel(base,c),out=[],exp=conditionExperiment(treatment);
  for(const pl of PATHS){
    for(let i=0;i<trials;i++){
      const seed=trialSeed(seed0,pl,i,policy),b=loadBundle(exp,{modelId:model.id});
      b.model=clone(model);b.observation.record_trajectories=false;
      const sim=new p1.Simulation(b,seed),sx=sim.ants[0].x,sy=sim.ants[0].y;
      const summary=sim.runUntilComplete(b.experiment.duration_s,p1.FIXED_DT),r=summary.observed_metrics.ants[0],ex=r.exit_coordinate_mm,edge=exitEdge(ex,sim.apparatus.world.width,sim.apparatus.world.height);
      out.push({
        path_length:pl,treatment,
        time_to_exit_s:r.time_to_arena_edge_s==null?b.experiment.duration_s:r.time_to_arena_edge_s,
        middle_zone_fraction:r.central_zone_fraction==null?0:r.central_zone_fraction,
        beeline_mm:ex?Math.hypot(ex.x-sx,ex.y-sy):0,
        exit_edge:edge,trail_axis_exit:edge==='left'||edge==='right',
        seed
      });
    }
  }
  return out;
}
function simulateCandidate(c,trials,seed0,base,policy,dcmRows=null){
  const d=dcmRows?clone(dcmRows):simulateTreatment(c,'dcm_control',trials,seed0,base,policy);
  return d.concat(simulateTreatment(c,'pheromone',trials,seed0,base,policy));
}

function metricValue(row,metric){
  if(metric==='trail_axis_exit')return row.trail_axis_exit===true?1:row.trail_axis_exit===false?0:Number(row.trail_axis_exit);
  const v=Number(row[metric]);if(!Number.isFinite(v))throw new Error('Non-finite '+metric+' value.');return v;
}
function cellMean(rows,colony,pathCode,treatment,metric){
  const vals=rows.filter(r=>(colony==null||r.colony===colony)&&r.path_length===pathCode&&r.treatment===treatment).map(r=>metricValue(r,metric));
  if(!vals.length)throw new Error('Missing P1 cell for colony='+colony+' path='+pathCode+' treatment='+treatment+' metric='+metric+'.');
  return mean(vals);
}
function colonyContrast(rows,colony,pathCode,metric){
  return cellMean(rows,colony,pathCode,'pheromone',metric)-cellMean(rows,colony,pathCode,'dcm_control',metric);
}
function referenceContrastTarget(rows,colonies,metrics){
  const out={};
  for(const pl of PATHS)for(const metric of metrics)out[pl+'|'+metric]=mean(colonies.map(c=>colonyContrast(rows,c,pl,metric)));
  return out;
}
function simulationContrastTarget(rows,metrics){
  const out={};
  for(const pl of PATHS)for(const metric of metrics)out[pl+'|'+metric]=cellMean(rows,null,pl,'pheromone',metric)-cellMean(rows,null,pl,'dcm_control',metric);
  return out;
}
function contrastScore(simRows,refRows,colonies,metrics=PRIMARY_METRICS){
  const ref=referenceContrastTarget(refRows,colonies,metrics),sim=simulationContrastTarget(simRows,metrics),components=[];
  for(const pl of PATHS)for(const metric of metrics){
    const key=pl+'|'+metric,error=sim[key]-ref[key];
    components.push({path_length:pl,metric,reference_contrast:ref[key],simulation_contrast:sim[key],error,squared_error:error*error});
  }
  return{loss:mean(components.map(x=>x.squared_error)),components};
}
function secondaryScales(rows){
  const out={};
  for(const pl of PATHS)for(const metric of SECONDARY_METRICS){
    const vals=rows.filter(r=>r.path_length===pl&&TREATMENTS.includes(r.treatment)).map(r=>metricValue(r,metric));
    out[pl+'|'+metric]=sampleSd(vals);
  }
  return out;
}
function secondaryGuard(simRows,refRows,colonies,scales){
  const ref=referenceContrastTarget(refRows,colonies,SECONDARY_METRICS),sim=simulationContrastTarget(simRows,SECONDARY_METRICS),components=[];
  for(const pl of PATHS)for(const metric of SECONDARY_METRICS){
    const key=pl+'|'+metric,scale=scales[key],error=sim[key]-ref[key],z=error/scale;
    components.push({path_length:pl,metric,reference_contrast:ref[key],simulation_contrast:sim[key],reference_sd:scale,standardized_error:z,absolute_standardized_error:Math.abs(z),passed:Math.abs(z)<=1});
  }
  return{passed:components.every(x=>x.passed),components};
}

function assertPolicySemantics(policy){
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  if(policy.id!=='P1_response_estimation_v1'||policy.status!=='development_response_estimation_policy_frozen_before_estimator_implementation_or_parameter_search')throw new Error('Unexpected P1 response-estimation policy identity/status.');
  const p=policy.response_parameter_surface.estimated_parameters;
  if(!eq(p.sigma_field_mm.bounds,[2,32])||p.sigma_field_mm.scale!=='log')throw new Error('Frozen P1 sigma bounds/scale changed.');
  if(!eq(p.kappa_trail_per_s.bounds,[0,16])||p.kappa_trail_per_s.scale!=='linear'||p.kappa_trail_per_s.nested_null_value!==0)throw new Error('Frozen P1 kappa bounds/null changed.');
  if(!eq(policy.response_parameter_surface.estimated_parameter_names_exact,['sigma_field_mm','kappa_trail_per_s']))throw new Error('Frozen P1 estimated parameter surface changed.');
  if(!eq(policy.response_parameter_surface.nuisance_parameters,[]))throw new Error('Frozen P1 policy forbids nuisance parameters.');
  if(!eq(policy.reference_partition.colonies,[0,7,16,20,21,27])||policy.reference_partition.folds!==6)throw new Error('Frozen P1 colony folds changed.');
  if(!String(policy.reference_partition.training_rule).includes('equal-weight arithmetic mean of the five colony-level contrasts'))throw new Error('Frozen P1 equal-colony weighting changed.');
  if(!eq(policy.primary_fit_observables.map(x=>x.name),PRIMARY_METRICS))throw new Error('Frozen P1 primary observables changed.');
  if(policy.primary_objective.candidate_ranking_uses_only_primary_objective!==true)throw new Error('Frozen P1 ranking objective changed.');
  if(!eq(policy.secondary_guard_observables,SECONDARY_METRICS)||policy.secondary_guard_policy.ranking_use!==false||policy.secondary_guard_policy.selection_use!==false)throw new Error('Frozen P1 secondary guard semantics changed.');
  const s=policy.search_protocol;
  if(s.candidate_budget_per_fold_total!==500||s.positive_context_candidates!==499||s.exact_null_anchor_candidates!==1||s.training_trials_per_treatment_path_per_candidate!==60||s.heldout_evaluation_trials_per_treatment_path!==120||s.root_fit_seed!==2210000||s.root_evaluation_seed!==2810000||s.physics_dt_s!==0.02||s.common_random_numbers!==true)throw new Error('Frozen P1 LOCO search budget/seed changed.');
  if(!eq(s.halton_mapping.map(x=>[x.prime,x.parameter]),HALTON))throw new Error('Frozen P1 Halton mapping changed.');
  const f=policy.final_all_data_fit;
  if(f.training_trials_per_treatment_path_per_candidate!==120||f.fit_seed!==3210000||f.final_check_trials_per_treatment_path!==240||f.final_check_seed!==3610000)throw new Error('Frozen P1 final-fit budget/seed changed.');
  if(policy.cross_validation_and_survival.primary_survival_guard.minimum_heldout_fold_wins!==5||policy.cross_validation_and_survival.primary_survival_guard.folds_total!==6||policy.cross_validation_and_survival.primary_survival_guard.median_relative_improvement_must_be_strictly_positive!==true)throw new Error('Frozen P1 survival guard changed.');
  if(policy.estimator_implementation_gate.high_resolution_response_search_authorized!==false||policy.promotion_rule.canonical_locomotion_update_authorized!==false||policy.promotion_rule.ymaze_unlock_authorized!==false)throw new Error('Frozen P1 policy authorization firewall changed.');
  if(!near(p1.FIXED_DT,s.physics_dt_s,1e-15))throw new Error('Frozen P1 physics dt does not match runtime.');
}
function validateReferenceTarget(target,policy){
  if(target.status!=='development_response_estimation_only_not_external_validation')throw new Error('Unexpected P1 response target status.');
  if(target.scope!=='open_arena_painted_trail_response_threshold_independent_observables')throw new Error('Unexpected P1 response target scope.');
  if(target.source_xlsx_sha256!=='b311d5fdc89eac56724bb5195743cf4bb52a6cff4040b18704353091e1fe6318')throw new Error('Unexpected P1 source XLSX hash.');
  if(!Array.isArray(target.rows)||target.rows.length!==policy.frozen_inputs.response_target.rows)throw new Error('Unexpected P1 response target row count.');
  if(JSON.stringify(target.primary_response_observables)!==JSON.stringify(PRIMARY_METRICS)||JSON.stringify(target.secondary_guard_observables)!==JSON.stringify(SECONDARY_METRICS))throw new Error('P1 target observable surface changed.');
  const counts={dcm_control_short:0,dcm_control_long:0,pheromone_short:0,pheromone_long:0};
  for(const r of target.rows){
    if(!policy.reference_partition.colonies.includes(r.colony)||!PATHS.includes(r.path_length)||!TREATMENTS.includes(r.treatment))throw new Error('Unexpected P1 response row stratum.');
    const k=r.treatment+'_'+(r.path_length==='s'?'short':'long');counts[k]++;
    for(const metric of PRIMARY_METRICS.concat(SECONDARY_METRICS))metricValue(r,metric);
  }
  if(JSON.stringify(counts)!==JSON.stringify({dcm_control_short:25,dcm_control_long:26,pheromone_short:26,pheromone_long:25}))throw new Error('P1 response group counts changed.');
  for(const c of policy.reference_partition.colonies)for(const pl of PATHS)for(const t of TREATMENTS)if(!target.rows.some(r=>r.colony===c&&r.path_length===pl&&r.treatment===t))throw new Error('P1 response target missing colony x path x treatment cell.');
  return target;
}
function loadReferenceTarget(root,policy,options={}){
  assertHighResolutionAuthorized(root,null,options);
  const file=path.resolve(root,RESPONSE_TARGET_FILE);
  if(gitBlobShaFile(file)!==policy.frozen_inputs.response_target.git_blob_sha)throw new Error('P1 response target Git blob does not match policy.');
  return validateReferenceTarget(readJson(file),policy);
}

function normalizedCoordinate(c,policy,key){
  const spec=policy.response_parameter_surface.estimated_parameters[key],a=spec.bounds[0],b=spec.bounds[1],v=c[key];
  return spec.scale==='log'?(Math.log(v)-Math.log(a))/(Math.log(b)-Math.log(a)):(v-a)/(b-a);
}
function scoreRow(c,simRows,refRows,colonies){
  const sc=contrastScore(simRows,refRows,colonies,PRIMARY_METRICS);
  return{candidate:{sigma_field_mm:c.sigma_field_mm,kappa_trail_per_s:c.kappa_trail_per_s},candidate_index:c.candidate_index,source:c.source,loss:sc.loss,components:sc.components};
}
function searchPanel(refRows,colonies,policy,base,{trials,seed0,retainAll=false}){
  const dcm=simulateTreatment(nullAnchor(policy),'dcm_control',trials,seed0,base,policy),rows=[];
  for(let i=0;i<policy.search_protocol.positive_context_candidates;i++){
    const c=contextCandidate(i,policy),sim=dcm.concat(simulateTreatment(c,'pheromone',trials,seed0,base,policy));
    rows.push(scoreRow(c,sim,refRows,colonies));
  }
  const n=nullAnchor(policy),nSim=dcm.concat(simulateTreatment(n,'pheromone',trials,seed0,base,policy));
  rows.push(scoreRow(n,nSim,refRows,colonies));
  rows.sort((a,b)=>a.loss-b.loss||a.candidate_index-b.candidate_index);
  return{best:rows[0],top:rows.slice(0,Math.min(12,rows.length)),all:retainAll?rows:undefined};
}
function reportCandidateToConfig(row){return{sigma_field_mm:row.candidate.sigma_field_mm,kappa_trail_per_s:row.candidate.kappa_trail_per_s,candidate_index:row.candidate_index,source:row.source};}
function evaluateCandidate(row,refRows,colonies,policy,base,trials,seed0,secondaryScaleRows=null){
  const c=reportCandidateToConfig(row),sim=simulateCandidate(c,trials,seed0,base,policy),primary=contrastScore(sim,refRows,colonies,PRIMARY_METRICS),out={candidate:row.candidate,candidate_index:row.candidate_index,source:row.source,primary_loss:primary.loss,primary_components:primary.components};
  if(secondaryScaleRows)out.secondary_guard=secondaryGuard(sim,refRows,colonies,secondaryScales(secondaryScaleRows));
  return out;
}
function identifiability(allRows,policy){
  const best=allRows[0],limit=best.loss+Math.max(0.0004,0.05*best.loss),nearBest=allRows.filter(r=>r.loss<=limit),keys=['sigma_field_mm','kappa_trail_per_s'];
  const spans={},selectedCoordinates={},selectedBoundaryDistances={};
  for(const key of keys){
    const vals=nearBest.map(r=>normalizedCoordinate(r.candidate,policy,key)),u=normalizedCoordinate(best.candidate,policy,key);
    spans[key]=Math.max(...vals)-Math.min(...vals);selectedCoordinates[key]=u;selectedBoundaryDistances[key]=Math.min(u,1-u);
  }
  const nullIn=nearBest.some(r=>r.source==='exact_null_anchor'),passed=!nullIn&&selectedBoundaryDistances.sigma_field_mm>=0.02&&selectedBoundaryDistances.kappa_trail_per_s>=0.02&&spans.sigma_field_mm<=0.60&&spans.kappa_trail_per_s<=0.60;
  return{passed,near_best_loss_limit:limit,near_best_count:nearBest.length,exact_null_anchor_in_near_best_set:nullIn,selected_normalized_coordinates:selectedCoordinates,selected_distance_to_nearest_bound:selectedBoundaryDistances,near_best_normalized_spans:spans};
}
function runHighResolution(target,policy,base){
  const colonies=policy.reference_partition.colonies,folds=[];
  for(let fi=0;fi<colonies.length;fi++){
    const held=colonies[fi],trainCols=colonies.filter(c=>c!==held),trainRows=target.rows.filter(r=>r.colony!==held),testRows=target.rows.filter(r=>r.colony===held);
    const fitSeed=policy.search_protocol.root_fit_seed+fi*10000,evalSeed=policy.search_protocol.root_evaluation_seed+fi*10000;
    const search=searchPanel(trainRows,trainCols,policy,base,{trials:policy.search_protocol.training_trials_per_treatment_path_per_candidate,seed0:fitSeed});
    const selected=evaluateCandidate(search.best,testRows,[held],policy,base,policy.search_protocol.heldout_evaluation_trials_per_treatment_path,evalSeed,trainRows);
    const nullRow={candidate:{sigma_field_mm:policy.exact_nested_null.null_anchor.sigma_field_mm,kappa_trail_per_s:0},candidate_index:500,source:'exact_null_anchor'};
    const nullEval=evaluateCandidate(nullRow,testRows,[held],policy,base,policy.search_protocol.heldout_evaluation_trials_per_treatment_path,evalSeed,trainRows);
    const rel=(nullEval.primary_loss-selected.primary_loss)/Math.max(1e-12,nullEval.primary_loss);
    folds.push({held_out_colony:held,training_colonies:trainCols,fit_seed:fitSeed,evaluation_seed:evalSeed,selected_training_fit:search.best,training_top_candidates:search.top,heldout_selected:selected,heldout_exact_null:nullEval,heldout_relative_improvement_vs_exact_null:rel});
  }
  const improvements=folds.map(f=>f.heldout_relative_improvement_vs_exact_null),wins=improvements.filter(x=>x>0).length,med=median(improvements),survives=wins>=5&&med>0;
  const internal_cv={P1_wins_vs_exact_null:wins,total_folds:folds.length,median_relative_improvement_vs_exact_null:med,P1_survival_guard_passed:survives,canonical_promotion:false};
  if(!survives)return{folds,internal_cv,final_all_data_fit:null,promotion:{mechanism_survives_internal_development:false,fixed_parameter_pair_eligible_for_future_v0_4_freeze:false,reason:'failed_primary_survival_guard'}};

  const finalSearch=searchPanel(target.rows,colonies,policy,base,{trials:policy.final_all_data_fit.training_trials_per_treatment_path_per_candidate,seed0:policy.final_all_data_fit.fit_seed,retainAll:true});
  const selected=evaluateCandidate(finalSearch.best,target.rows,colonies,policy,base,policy.final_all_data_fit.final_check_trials_per_treatment_path,policy.final_all_data_fit.final_check_seed,target.rows);
  const nullRow={candidate:{sigma_field_mm:policy.exact_nested_null.null_anchor.sigma_field_mm,kappa_trail_per_s:0},candidate_index:500,source:'exact_null_anchor'};
  const nullEval=evaluateCandidate(nullRow,target.rows,colonies,policy,base,policy.final_all_data_fit.final_check_trials_per_treatment_path,policy.final_all_data_fit.final_check_seed,target.rows);
  const id=identifiability(finalSearch.all,policy),secondaryPass=selected.secondary_guard.passed,eligible=id.passed&&secondaryPass;
  return{
    folds,internal_cv,
    final_all_data_fit:{fit_seed:policy.final_all_data_fit.fit_seed,selected_training_fit:finalSearch.best,training_top_candidates:finalSearch.top,independent_final_check_seed:policy.final_all_data_fit.final_check_seed,selected_final_check:selected,exact_null_final_check:nullEval,identifiability:id},
    promotion:{mechanism_survives_internal_development:true,fixed_parameter_pair_eligible_for_future_v0_4_freeze:eligible,identifiability_passed:id.passed,secondary_guards_passed:secondaryPass,canonical_promotion:false,ymaze_unlock:false}
  };
}

function syntheticRows(){
  const rows=[],colonies=[0,7,16,20,21,27];
  for(let ci=0;ci<colonies.length;ci++)for(const pl of PATHS){
    const pathOffset=pl==='s'?0.02:0.05,delta=0.05+ci*0.02+pathOffset;
    const copies=ci===0?3:1;
    for(const t of TREATMENTS)for(let j=0;j<copies;j++){
      const active=t==='pheromone'?1:0;
      rows.push({colony:colonies[ci],path_length:pl,treatment:t,middle_zone_fraction:0.2+active*delta,trail_axis_exit:active?1:0,time_to_exit_s:10+ci+active*(1+pathOffset),beeline_mm:100+ci*2+active*(4+pathOffset)});
    }
  }
  return rows;
}
function identityQualification(base){
  for(const seed of [884501,884503,884507]){
    const cb0=loadBundle('open_arena_p1_zero_dose_reachability.json',{modelId:'lasius_niger_locomotion_v1'}),pb0=loadBundle('open_arena_p1_zero_dose_reachability.json',{modelId:base.id});
    pb0.model=configuredModel(base,{sigma_field_mm:12,kappa_trail_per_s:9});
    const c0=new integrity.Simulation(cb0,seed),q0=new p1.Simulation(pb0,seed);
    for(let i=0;i<80;i++){c0.step(p1.FIXED_DT);q0.step(p1.FIXED_DT);}
    for(const key of ['x','y','heading','speedFactor','pauseRemaining','distanceTravelled','movingTime'])if(!Object.is(c0.ants[0][key],q0.ants[0][key]))return false;
    if(c0.ants[0].rng.state!==q0.ants[0].rng.state)return false;

    const cb=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:'lasius_niger_locomotion_v1'}),pb=loadBundle('open_arena_p1_nominal_dose_reachability.json',{modelId:base.id});
    pb.model=configuredModel(base,{sigma_field_mm:12,kappa_trail_per_s:0});
    const c=new integrity.Simulation(cb,seed),q=new p1.Simulation(pb,seed);
    for(let i=0;i<80;i++){c.step(p1.FIXED_DT);q.step(p1.FIXED_DT);}
    for(const key of ['x','y','heading','speedFactor','pauseRemaining','distanceTravelled','movingTime'])if(!Object.is(c.ants[0][key],q.ants[0][key]))return false;
    if(c.ants[0].rng.state!==q.ants[0].rng.state)return false;
  }
  return true;
}
function qualify({root,policy,trials=2}){
  assertPolicySemantics(policy);
  const runtimeBlobs=assertBlobSet(root,FROZEN_RUNTIME_BLOBS,'Frozen P1 estimator input'),targetHash=assertResponseTargetHashOnly(root,policy),base=readJson(path.resolve(root,'models','lasius_niger_painted_trail_p1_v1.json')),checks={};
  checks.no_nuisance_parameters=policy.response_parameter_surface.nuisance_parameters.length===0;
  const c0=contextCandidate(0,policy),n=nullAnchor(policy);
  checks.halton_mapping=near(c0.sigma_field_mm,8,1e-14)&&near(c0.kappa_trail_per_s,16/3,1e-14)&&c0.candidate_index===1;
  checks.exact_null_anchor=n.sigma_field_mm===8&&n.kappa_trail_per_s===0&&n.candidate_index===500;
  checks.candidate_parameter_wiring=(()=>{const m=configuredModel(base,{sigma_field_mm:13,kappa_trail_per_s:2.5});return JSON.stringify(m.movement)===JSON.stringify(base.movement)&&m.painted_trail_response.field.sigma_field_mm===13&&m.painted_trail_response.steering.kappa_trail_per_s===2.5&&m.painted_trail_response.sensors.forward_offset_mm===2&&m.painted_trail_response.sensors.lateral_half_separation_mm===1.5;})();
  checks.exact_dcm_and_kappa0_identity=identityQualification(base);
  checks.crn_pairing=trialSeed(990000,'s',4,policy)===trialSeed(990000,'s',4,policy)&&trialSeed(990000,'l',4,policy)!==trialSeed(990000,'s',4,policy);
  checks.path_not_runtime_input=conditionExperiment('dcm_control')==='open_arena_p1_zero_dose_reachability.json'&&conditionExperiment('pheromone')==='open_arena_p1_nominal_dose_reachability.json';
  const syn=syntheticRows(),cols=policy.reference_partition.colonies,ref=referenceContrastTarget(syn,cols,PRIMARY_METRICS),manual={};
  for(const pl of PATHS)for(const metric of PRIMARY_METRICS)manual[pl+'|'+metric]=mean(cols.map(col=>colonyContrast(syn,col,pl,metric)));
  checks.equal_weight_colony_contrasts=JSON.stringify(ref)===JSON.stringify(manual);
  const trainCols=cols.filter(x=>x!==27),train=syn.filter(r=>r.colony!==27);
  checks.fold_isolation=!train.some(r=>r.colony===27)&&Object.keys(referenceContrastTarget(train,trainCols,PRIMARY_METRICS)).length===4;
  const simPrimaryOnly=[];
  for(const pl of PATHS)for(const t of TREATMENTS)simPrimaryOnly.push({path_length:pl,treatment:t,middle_zone_fraction:cellMean(syn,null,pl,t,'middle_zone_fraction'),trail_axis_exit:cellMean(syn,null,pl,t,'trail_axis_exit'),time_to_exit_s:9999,beeline_mm:9999});
  checks.primary_objective_ignores_secondary=Number.isFinite(contrastScore(simPrimaryOnly,syn,cols,PRIMARY_METRICS).loss);
  checks.sample_sd_semantics=near(sampleSd([1,2,3]),1,1e-15);
  const d=simulateTreatment(c0,'dcm_control',trials,884700,base,policy),ph=simulateTreatment(c0,'pheromone',trials,884700,base,policy);
  checks.simulation_smoke=d.length===trials*2&&ph.length===trials*2&&d.every(r=>r.treatment==='dcm_control')&&ph.every(r=>r.treatment==='pheromone');
  checks.response_target_semantics_not_loaded=true;
  checks.response_target_hash_verified_only=targetHash===policy.frozen_inputs.response_target.git_blob_sha;
  checks.ymaze_not_loaded=true;
  const passed=Object.values(checks).every(Boolean);
  return{schema_version:1,qualification_id:'P1_estimator_synthetic_qualification_v1',status:passed?'passed':'failed',scientific_evidence:false,reference_outcomes_accessed:false,response_target_semantics_loaded:false,response_target_hash_verified_only:true,ymaze_accessed:false,policy_git_blob_sha:POLICY_GIT_BLOB_SHA,estimator_git_blob_sha:gitBlobShaFile(__filename),frozen_runtime_blobs_verified:runtimeBlobs,response_target_git_blob_sha_verified:targetHash,trials_per_treatment_path:trials,checks};
}

function assertAuthorizationEffective(a,root,{branchName=null}={}){
  const branch=branchName||currentBranchName(root);
  if(a.effective_when_merged_to_main===true&&branch!=='main')throw new Error('P1 high-resolution authorization is not effective until merged to main; current branch is '+(branch||'unknown')+'.');
  return branch;
}
function assertHighResolutionAuthorized(root,estimatorBlob=null,options={}){
  const file=path.resolve(root,AUTHORIZATION_FILE);
  if(!fs.existsSync(file))throw new Error('P1 high-resolution response search is not authorized: missing post-qualification authorization artifact.');
  const a=readJson(file),actual=estimatorBlob||gitBlobShaFile(__filename);
  if(a.id!=='P1_high_resolution_authorization_v1'||a.status!=='qualified_estimator_authorized_for_frozen_high_resolution_response_search'||a.high_resolution_response_search_authorized!==true)throw new Error('Invalid P1 high-resolution authorization status.');
  if(a.policy_git_blob_sha!==POLICY_GIT_BLOB_SHA)throw new Error('P1 authorization policy pin mismatch.');
  if(a.estimator_git_blob_sha!==actual)throw new Error('P1 authorization estimator blob mismatch.');
  if(a.canonical_promotion_authorized!==false||a.ymaze_access_authorized!==false)throw new Error('P1 authorization may not promote canonical locomotion or unlock the Y-maze.');
  assertAuthorizationEffective(a,root,options);
  return a;
}
function assertHighResolutionArgs(policy){
  const forbidden=['candidates','trials','eval-trials','seed','final-trials','final-seed','dt'];
  for(const name of forbidden)if(hasArg(name))throw new Error('Frozen P1 high-resolution mode forbids --'+name+' override.');
  assertPolicySemantics(policy);
}
function highResolutionPreflight({root,policy}){
  const q=qualify({root,policy,trials:2});
  if(q.status!=='passed'||q.reference_outcomes_accessed!==false||q.ymaze_accessed!==false)throw new Error('Frozen P1 high-resolution search requires passing reference-free synthetic qualification.');
  const authorization=assertHighResolutionAuthorized(root,q.estimator_git_blob_sha);
  return{qualification:q,authorization};
}
function writeReport(report,out){
  const root=path.resolve(__dirname,'..'),safe=assertSafeReportOutput(root,out);
  fs.writeFileSync(safe,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));console.log('Saved '+safe);
}
function main(){
  const root=path.resolve(__dirname,'..'),pinned=assertExactPolicyBlob(root),policy=pinned.policy,mode=arg('mode','qualification');
  assertPolicySemantics(policy);
  if(mode==='qualification'){
    const q=qualify({root,policy,trials:Math.max(1,narg('trials',2))});
    if(q.status!=='passed')throw new Error('P1 estimator qualification failed: '+JSON.stringify(q.checks));
    return writeReport(q,path.resolve(process.cwd(),arg('out',path.join('reports','p1_estimator_qualification_v1.json'))));
  }
  if(mode!=='highres')throw new Error("Unknown P1 estimation mode '"+mode+"'. Use qualification or highres.");
  assertHighResolutionArgs(policy);
  const preflight=highResolutionPreflight({root,policy});
  const target=loadReferenceTarget(root,policy),base=readJson(path.resolve(root,'models','lasius_niger_painted_trail_p1_v1.json')),run=runHighResolution(target,policy,base);
  const report={
    schema_version:1,estimation_id:policy.id,
    status:run.promotion.mechanism_survives_internal_development?(run.promotion.fixed_parameter_pair_eligible_for_future_v0_4_freeze?'development_response_estimation_passed_and_parameter_pair_eligible_for_future_freeze':'development_response_estimation_survived_but_parameter_pair_not_eligible'):'development_response_estimation_failed_primary_survival_guard',
    execution_class:'frozen_high_resolution_response_search',scientific_evidence:true,
    policy_git_blob_sha:POLICY_GIT_BLOB_SHA,estimator_git_blob_sha:gitBlobShaFile(__filename),
    response_target_git_blob_sha:policy.frozen_inputs.response_target.git_blob_sha,reference_outcomes_accessed:true,ymaze_accessed:false,
    canonical_locomotion_updated:false,H2_H3_H4_H5_refit:false,nuisance_parameters_estimated:false,
    pre_reference_qualification:preflight.qualification,high_resolution_authorization:preflight.authorization,
    execution:{repo_commit:currentRepoCommit(root),node_version:process.version,physics_dt_s:p1.FIXED_DT},
    search:{method:policy.search_protocol.method,candidates_per_fold_total:500,positive_halton_candidates:499,exact_null_anchor_candidates:1,training_trials_per_treatment_path_per_candidate:60,heldout_evaluation_trials_per_treatment_path:120,folds:6,root_fit_seed:2210000,root_evaluation_seed:2810000,common_random_numbers:true,halton_mapping:policy.search_protocol.halton_mapping},
    ...run
  };
  return writeReport(report,path.resolve(process.cwd(),arg('out',path.join('reports','p1_response_estimation_500x60_v1.json'))));
}
if(require.main===module)main();

module.exports={
  POLICY_FILE,POLICY_GIT_BLOB_SHA,AUTHORIZATION_FILE,RESPONSE_TARGET_FILE,PRIMARY_METRICS,SECONDARY_METRICS,PATHS,TREATMENTS,HALTON,FROZEN_RUNTIME_BLOBS,
  clone,near,mean,sampleSd,median,gitBlobShaBuffer,gitBlobShaFile,currentRepoCommit,currentBranchName,assertSafeReportOutput,assertBlobSet,assertExactPolicyBlob,assertResponseTargetHashOnly,
  halton,mapVal,contextCandidate,nullAnchor,configuredModel,conditionExperiment,trialSeed,exitEdge,simulateTreatment,simulateCandidate,
  metricValue,cellMean,colonyContrast,referenceContrastTarget,simulationContrastTarget,contrastScore,secondaryScales,secondaryGuard,
  assertPolicySemantics,validateReferenceTarget,loadReferenceTarget,normalizedCoordinate,scoreRow,searchPanel,reportCandidateToConfig,evaluateCandidate,identifiability,runHighResolution,
  syntheticRows,identityQualification,qualify,assertAuthorizationEffective,assertHighResolutionAuthorized,assertHighResolutionArgs,highResolutionPreflight
};
