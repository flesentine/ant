'use strict';
const p3=require('../src/p3.js');
const p1=require('../src/p1.js');
const integrity=require('../src/integrity.js');
const {loadBundle}=require('./load-bundle.js');

const PRIMARY_METRICS=Object.freeze(['middle_zone_fraction','trail_axis_exit']);
const SECONDARY_METRICS=Object.freeze(['time_to_exit_s','beeline_mm']);
const PATHS=Object.freeze(['s','l']);
const TREATMENTS=Object.freeze(['dcm_control','pheromone']);
const HALTON=Object.freeze([[2,'sigma_field_mm'],[3,'kappa_trail_per_s']]);

const clone=v=>JSON.parse(JSON.stringify(v));
const near=(a,b,t=1e-12)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t;
const mean=xs=>{if(!xs.length)throw new Error('Cannot take mean of empty values.');return xs.reduce((a,b)=>a+b,0)/xs.length;};
const sampleSd=xs=>{if(xs.length<2)return 1;const m=mean(xs),v=xs.reduce((s,x)=>s+(x-m)*(x-m),0)/(xs.length-1);return Math.sqrt(v)||1;};
const median=xs=>{const a=[...xs].sort((x,y)=>x-y);if(!a.length)return NaN;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
function halton(index,base){let f=1,r=0,i=index;while(i>0){f/=base;r+=f*(i%base);i=Math.floor(i/base);}return r;}
function mapVal(u,s){const[a,b]=s.bounds;return s.scale==='log'?Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*u):a+(b-a)*u;}

function p3Candidate(i,policy){
  if(i<0||i>=policy.search_protocol.positive_P3_candidates)throw new Error('P3 Halton candidate index out of range.');
  const n=i+1,p=policy.response_parameter_surface.estimated_parameters;
  return{sigma_field_mm:mapVal(halton(n,2),p.sigma_field_mm),kappa_trail_per_s:mapVal(halton(n,3),p.kappa_trail_per_s),candidate_index:n,source:'halton_P3'};
}
function absoluteCandidate(i,policy){const c=p3Candidate(i,policy);return{...c,source:'absolute_transduction_benchmark'};}
function nullAnchor(policy){const a=policy.nested_models_and_comparators.exact_canonical_null.anchor;return{sigma_field_mm:a.sigma_field_mm,kappa_trail_per_s:a.kappa_trail_per_s,candidate_index:policy.search_protocol.candidate_budget_per_fold_total,source:'exact_canonical_null'};}
function configuredP3Model(base,c){
  const m=clone(base),r=m.painted_trail_response;
  if(!r||r.enabled!==true)throw new Error('P3 estimator requires enabled painted_trail_response.');
  r.field.sigma_field_mm=c.sigma_field_mm;r.steering.kappa_trail_per_s=c.kappa_trail_per_s;return m;
}
function configuredAbsoluteModel(base,c){
  const m=clone(base);m.id='lasius_niger_p3_absolute_transduction_benchmark_v1';m.status='structural_benchmark_not_fitted';
  m.painted_trail_response={enabled:true,mechanism_id:'P1_egocentric_painted_trail_gradient_steering_v1',field:{type:'gaussian_distance_to_segment',sigma_field_mm:c.sigma_field_mm},sensors:{type:'bilateral_body_frame_points',forward_offset_mm:2,lateral_half_separation_mm:1.5},transduction:{type:'c_over_one_plus_c'},steering:{type:'right_minus_left_heading_drift',kappa_trail_per_s:c.kappa_trail_per_s}};
  return m;
}
function conditionExperiment(t){if(t==='dcm_control')return'open_arena_p3_zero_dose_reachability.json';if(t==='pheromone')return'open_arena_p3_nominal_dose_reachability.json';throw new Error('Unknown P3 treatment '+t+'.');}
function trialSeed(seed0,pl,i,policy){if(!PATHS.includes(pl))throw new Error('Unknown P3 path stratum '+pl+'.');return seed0+(pl==='s'?policy.search_protocol.trial_seed_pairing.short_path_offset:policy.search_protocol.trial_seed_pairing.long_path_offset)+i;}
function exitEdge(ex,w,h){if(!ex)return'timeout';const d={left:Math.abs(ex.x),right:Math.abs(ex.x-w),top:Math.abs(ex.y),bottom:Math.abs(ex.y-h)};return Object.keys(d).sort((a,b)=>d[a]-d[b])[0];}
function simulateTreatment(c,t,trials,seed0,base,policy,mechanism='P3'){
  const model=mechanism==='P3'?configuredP3Model(base,c):configuredAbsoluteModel(base,c),Sim=mechanism==='P3'?p3.Simulation:p1.Simulation,out=[],exp=conditionExperiment(t);
  for(const pl of PATHS)for(let i=0;i<trials;i++){
    const seed=trialSeed(seed0,pl,i,policy),b=loadBundle(exp,{modelId:base.id});b.model=clone(model);b.observation.record_trajectories=false;
    const sim=new Sim(b,seed),sx=sim.ants[0].x,sy=sim.ants[0].y,s=sim.runUntilComplete(b.experiment.duration_s,p3.FIXED_DT),r=s.observed_metrics.ants[0],ex=r.exit_coordinate_mm,edge=exitEdge(ex,sim.apparatus.world.width,sim.apparatus.world.height);
    out.push({path_length:pl,treatment:t,time_to_exit_s:r.time_to_arena_edge_s==null?b.experiment.duration_s:r.time_to_arena_edge_s,middle_zone_fraction:r.central_zone_fraction==null?0:r.central_zone_fraction,beeline_mm:ex?Math.hypot(ex.x-sx,ex.y-sy):0,trail_axis_exit:edge==='left'||edge==='right',seed,mechanism});
  }return out;
}
function simulateCandidate(c,trials,seed0,base,policy,mechanism='P3',dcm=null){const d=dcm?clone(dcm):simulateTreatment(c,'dcm_control',trials,seed0,base,policy,mechanism);return d.concat(simulateTreatment(c,'pheromone',trials,seed0,base,policy,mechanism));}
function metricValue(r,m){if(m==='trail_axis_exit')return r[m]===true?1:r[m]===false?0:Number(r[m]);const v=Number(r[m]);if(!Number.isFinite(v))throw new Error('Non-finite '+m+' value.');return v;}
function cellMean(rows,col,pl,t,m){const a=rows.filter(r=>(col==null||r.colony===col)&&r.path_length===pl&&r.treatment===t).map(r=>metricValue(r,m));if(!a.length)throw new Error('Missing P3 cell.');return mean(a);}
const colonyContrast=(rows,col,pl,m)=>cellMean(rows,col,pl,'pheromone',m)-cellMean(rows,col,pl,'dcm_control',m);
function referenceContrastTarget(rows,cols,metrics){const o={};for(const pl of PATHS)for(const m of metrics)o[pl+'|'+m]=mean(cols.map(c=>colonyContrast(rows,c,pl,m)));return o;}
function simulationContrastTarget(rows,metrics){const o={};for(const pl of PATHS)for(const m of metrics)o[pl+'|'+m]=cellMean(rows,null,pl,'pheromone',m)-cellMean(rows,null,pl,'dcm_control',m);return o;}
function contrastScore(sim,refRows,cols,metrics=PRIMARY_METRICS){const ref=referenceContrastTarget(refRows,cols,metrics),s=simulationContrastTarget(sim,metrics),components=[];for(const pl of PATHS)for(const m of metrics){const k=pl+'|'+m,e=s[k]-ref[k];components.push({path_length:pl,metric:m,reference_contrast:ref[k],simulation_contrast:s[k],error:e,squared_error:e*e});}return{loss:mean(components.map(x=>x.squared_error)),components};}
function secondaryScales(rows){const o={};for(const pl of PATHS)for(const m of SECONDARY_METRICS)o[pl+'|'+m]=sampleSd(rows.filter(r=>r.path_length===pl&&TREATMENTS.includes(r.treatment)).map(r=>metricValue(r,m)));return o;}
function secondaryGuard(sim,refRows,cols,scales){const ref=referenceContrastTarget(refRows,cols,SECONDARY_METRICS),s=simulationContrastTarget(sim,SECONDARY_METRICS),components=[];for(const pl of PATHS)for(const m of SECONDARY_METRICS){const k=pl+'|'+m,e=s[k]-ref[k],z=e/scales[k];components.push({path_length:pl,metric:m,standardized_error:z,absolute_standardized_error:Math.abs(z),passed:Math.abs(z)<=1});}return{passed:components.every(x=>x.passed),components};}
function normalizedCoordinate(c,p,key){const s=p.response_parameter_surface.estimated_parameters[key],[a,b]=s.bounds,v=c[key];return s.scale==='log'?(Math.log(v)-Math.log(a))/(Math.log(b)-Math.log(a)):(v-a)/(b-a);}
function scoreRow(c,sim,ref,cols){const s=contrastScore(sim,ref,cols);return{candidate:{sigma_field_mm:c.sigma_field_mm,kappa_trail_per_s:c.kappa_trail_per_s},candidate_index:c.candidate_index,source:c.source,loss:s.loss,components:s.components};}
function searchPanel(ref,cols,policy,base,{trials,seed0,panel='P3',retainAll=false}){
  const mech=panel==='P3'?'P3':'absolute',n=nullAnchor(policy),dcm=simulateTreatment(n,'dcm_control',trials,seed0,base,policy,mech),rows=[];
  for(let i=0;i<policy.search_protocol.positive_P3_candidates;i++){const c=panel==='P3'?p3Candidate(i,policy):absoluteCandidate(i,policy);rows.push(scoreRow(c,dcm.concat(simulateTreatment(c,'pheromone',trials,seed0,base,policy,mech)),ref,cols));}
  rows.push(scoreRow(n,dcm.concat(simulateTreatment(n,'pheromone',trials,seed0,base,policy,mech)),ref,cols));rows.sort((a,b)=>a.loss-b.loss||a.candidate_index-b.candidate_index);
  return{panel,best:rows[0],top:rows.slice(0,12),all:retainAll?rows:undefined};
}
function evaluateCandidate(row,ref,cols,policy,base,trials,seed0,scaleRows=null,mech='P3'){const c={...row.candidate,candidate_index:row.candidate_index,source:row.source},sim=simulateCandidate(c,trials,seed0,base,policy,mech),p=contrastScore(sim,ref,cols),o={candidate:row.candidate,candidate_index:row.candidate_index,source:row.source,primary_loss:p.loss,primary_components:p.components};if(scaleRows)o.secondary_guard=secondaryGuard(sim,ref,cols,secondaryScales(scaleRows));return o;}
function identifiability(rows,bestAbs,policy){const best=rows[0],limit=best.loss+Math.max(.0004,.05*best.loss),nearBest=rows.filter(r=>r.loss<=limit),keys=['sigma_field_mm','kappa_trail_per_s'],spans={},coords={},dist={};for(const k of keys){const v=nearBest.filter(r=>r.source!=='exact_canonical_null').map(r=>normalizedCoordinate(r.candidate,policy,k)),u=normalizedCoordinate(best.candidate,policy,k);spans[k]=v.length?Math.max(...v)-Math.min(...v):0;coords[k]=u;dist[k]=Math.min(u,1-u);}const nullIn=nearBest.some(r=>r.source==='exact_canonical_null'),absOut=bestAbs>limit;return{passed:!nullIn&&absOut&&keys.every(k=>dist[k]>=.02&&spans[k]<=.60),near_best_loss_limit:limit,exact_canonical_null_in_near_best_set:nullIn,best_absolute_benchmark_outside_P3_near_best_tolerance:absOut,selected_normalized_coordinates:coords,selected_distance_to_nearest_bound:dist,near_best_normalized_spans:spans};}
function survivalSummary(folds){const n=folds.map(f=>f.heldout_relative_improvement_vs_exact_null),a=folds.map(f=>f.heldout_relative_improvement_vs_absolute_benchmark),nw=n.filter(x=>x>0).length,aw=a.filter(x=>x>0).length,nm=median(n),am=median(a),np=nw>=5&&nm>0,ap=aw>=5&&am>0;return{P3_wins_vs_exact_null:nw,P3_wins_vs_selected_absolute_benchmark:aw,total_folds:folds.length,median_relative_improvement_vs_exact_null:nm,median_relative_improvement_vs_absolute_benchmark:am,canonical_null_survival_guard_passed:np,structural_increment_survival_guard_passed:ap,P3_dual_survival_guard_passed:np&&ap};}
const finalIncrementGuard=(p,a,n)=>({passed:p.primary_loss<a.primary_loss&&p.primary_loss<n.primary_loss,P3_primary_loss:p.primary_loss,absolute_benchmark_primary_loss:a.primary_loss,exact_null_primary_loss:n.primary_loss});

function exactAntIdentity(a,b){for(const k of ['x','y','heading','speedFactor','pauseRemaining','distanceTravelled','movingTime'])if(!Object.is(a[k],b[k]))return false;return a.rng.state===b.rng.state&&a.finished===b.finished&&a.outcome===b.outcome;}
function identityQualification(base){
  for(const seed of [984501,984503,984507]){
    for(const x of [{t:'dcm_control',k:9,mech:'P3'},{t:'pheromone',k:0,mech:'P3'},{t:'dcm_control',k:9,mech:'absolute'},{t:'pheromone',k:0,mech:'absolute'}]){
      const exp=conditionExperiment(x.t),cb=loadBundle(exp,{modelId:'lasius_niger_locomotion_v1'}),qb=loadBundle(exp,{modelId:base.id}),cfg={sigma_field_mm:12,kappa_trail_per_s:x.k},Sim=x.mech==='P3'?p3.Simulation:p1.Simulation;
      qb.model=x.mech==='P3'?configuredP3Model(base,cfg):configuredAbsoluteModel(base,cfg);const c=new integrity.Simulation(cb,seed),q=new Sim(qb,seed);for(let i=0;i<80;i++){c.step(p3.FIXED_DT);q.step(p3.FIXED_DT);}if(!exactAntIdentity(c.ants[0],q.ants[0]))return false;
    }
  }return true;
}
function noResponseRngQualification(base){for(const seed of [985111,985113]){const c=loadBundle(conditionExperiment('pheromone'),{modelId:'lasius_niger_locomotion_v1'}),pb=loadBundle(conditionExperiment('pheromone'),{modelId:base.id}),ab=loadBundle(conditionExperiment('pheromone'),{modelId:base.id});pb.model=configuredP3Model(base,{sigma_field_mm:8,kappa_trail_per_s:4});ab.model=configuredAbsoluteModel(base,{sigma_field_mm:8,kappa_trail_per_s:4});const cs=new integrity.Simulation(c,seed),ps=new p3.Simulation(pb,seed),as=new p1.Simulation(ab,seed);if(cs.ants[0].rng.state!==ps.ants[0].rng.state||cs.ants[0].rng.state!==as.ants[0].rng.state)return false;}return true;}
function syntheticRows(){const rows=[],cols=[0,7,16,20,21,27];for(let ci=0;ci<cols.length;ci++)for(const pl of PATHS){const po=pl==='s'?.02:.05,d=.05+ci*.02+po,copies=ci===0?3:1;for(const t of TREATMENTS)for(let j=0;j<copies;j++){const a=t==='pheromone'?1:0;rows.push({colony:cols[ci],path_length:pl,treatment:t,middle_zone_fraction:.2+a*d,trail_axis_exit:!!a,time_to_exit_s:10+ci+a*(1+po),beeline_mm:100+ci*2+a*(4+po)});}}return rows;}
function assertPolicySemantics(p){
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b),s=p.search_protocol,cv=p.cross_validation_and_survival,f=p.final_all_data_fit,e=p.response_parameter_surface.estimated_parameters;
  if(p.id!=='P3_response_estimation_v1'||!eq(p.response_parameter_surface.estimated_parameter_names_exact,['sigma_field_mm','kappa_trail_per_s'])||!eq(e.sigma_field_mm.bounds,[2,32])||!eq(e.kappa_trail_per_s.bounds,[0,16])||!eq(p.reference_partition.colonies,[0,7,16,20,21,27]))throw new Error('Frozen P3 policy surface changed.');
  if(!eq(s.halton_mapping.map(x=>[x.prime,x.parameter]),HALTON)||s.positive_P3_candidates!==999||s.candidate_budget_per_fold_total!==1000||s.absolute_transduction_benchmark_panel.positive_absolute_candidates!==999||s.root_fit_seed!==6210000||s.root_evaluation_seed!==6810000)throw new Error('Frozen P3 search changed.');
  if(cv.canonical_null_survival_guard.minimum_heldout_fold_wins!==5||cv.structural_increment_survival_guard.minimum_heldout_fold_wins_vs_selected_absolute_benchmark!==5||f.fit_seed!==7210000||f.final_check_seed!==7610000)throw new Error('Frozen P3 guards changed.');
  if(p.estimator_implementation_gate.high_resolution_response_search_authorized!==false||p.estimator_implementation_gate.response_target_semantic_access_authorized!==false||p.promotion_rule.ymaze_unlock_authorized!==false||p.global_firewalls.P1_official_result_semantic_access!==false||p.global_firewalls.P2_official_result_semantic_access!==false)throw new Error('Frozen P3 firewall changed.');
  return true;
}
module.exports={PRIMARY_METRICS,SECONDARY_METRICS,PATHS,TREATMENTS,HALTON,clone,near,mean,sampleSd,median,halton,mapVal,p3Candidate,absoluteCandidate,nullAnchor,configuredP3Model,configuredAbsoluteModel,conditionExperiment,trialSeed,simulateTreatment,simulateCandidate,metricValue,cellMean,colonyContrast,referenceContrastTarget,simulationContrastTarget,contrastScore,secondaryScales,secondaryGuard,normalizedCoordinate,scoreRow,searchPanel,evaluateCandidate,identifiability,survivalSummary,finalIncrementGuard,identityQualification,noResponseRngQualification,syntheticRows,assertPolicySemantics};
