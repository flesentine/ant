#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const core=require('../src/sim-core.js');
const integrity=require('../src/integrity.js');
const h3est=require('./run-h3-estimation.js');
const h4est=require('./run-h4-estimation.js');
const geom=require('./poissonnier2026-measurement-geometry.js');
const {loadBundle,readJson}=require('./load-bundle.js');

const {Simulation,streamSeed,FIXED_DT}=integrity;
const ENTRY_STREAM='h2_estimation_entry_transition_v1';
const POLICY_FILE='hypotheses/h5_parameter_estimation_v1.json';
const POLICY_GIT_BLOB_SHA='d81e756c3643778c067ef1b1bb8f68521adb8141';
const MODEL_ID='lasius_niger_locomotion_h5_v1';
const QUALIFICATION_FILE='reports/h5_synthetic_qualification_v1.json';
const HALTON=Object.freeze([
  [2,'ell0'],
  [3,'kappa_turn'],
  [5,'q'],
  [7,'H5 amplitude raw coordinate A'],
  [11,'H5 amplitude raw coordinate B']
]);
const COLONIES=Object.freeze([0,7,16,20,21,27]);

function clone(v){return JSON.parse(JSON.stringify(v));}
function read(root,rel){return readJson(path.resolve(root,rel));}
function arg(name,def=null){const prefix='--'+name+'=';const hit=process.argv.find(x=>x.startsWith(prefix));return hit?hit.slice(prefix.length):def;}
function gitBlobShaBuffer(buf){return crypto.createHash('sha1').update(Buffer.from(`blob ${buf.length}\0`)).update(buf).digest('hex');}
function gitBlobShaFile(file){return gitBlobShaBuffer(fs.readFileSync(file));}
function assertBlob(root,rel,expected){const got=gitBlobShaFile(path.resolve(root,rel));if(got!==expected)throw new Error(`Frozen blob mismatch for ${rel}: expected ${expected}, got ${got}`);return got;}

function halton(index,base){
  let f=1,r=0,i=index;
  while(i>0){f/=base;r+=f*(i%base);i=Math.floor(i/base);}
  return r;
}
function mapVal(u,bounds,scale){
  const [a,b]=bounds;
  return scale==='log'?Math.exp(Math.log(a)+u*(Math.log(b)-Math.log(a))):a+(b-a)*u;
}
function nuisanceAt(index,policy){
  const p=policy.estimated_parameters;
  return{
    ell0:mapVal(halton(index,2),p.baseline_mean_free_path_mm.bounds,p.baseline_mean_free_path_mm.scale),
    kappa:mapVal(halton(index,3),p.baseline_turn_concentration.bounds,p.baseline_turn_concentration.scale),
    q:mapVal(halton(index,5),p.entry_orientation_retention_q.bounds,p.entry_orientation_retention_q.scale)
  };
}
function nullCandidate(i,policy){
  const index=i+1;
  return Object.assign(nuisanceAt(index,policy),{alpha200:0,alpha1000:0,_kind:'null',_source:`halton_${index}`});
}
function commonCandidate(i,policy){
  const index=i+1,n=nuisanceAt(index,policy),a=halton(index,7);
  return Object.assign(n,{alpha200:a,alpha1000:a,alpha_common:a,_kind:'common',_source:`halton_${index}`});
}
function historyCandidate(i,policy){
  const index=i+1,n=nuisanceAt(index,policy),a=halton(index,7),b=halton(index,11);
  return Object.assign(n,{alpha200:Math.max(a,b),alpha1000:Math.min(a,b),_kind:'history',_source:`halton_${index}`});
}
function commonNullAnchor(selectedNull){
  return{ell0:selectedNull.ell0,kappa:selectedNull.kappa,q:selectedNull.q,alpha200:0,alpha1000:0,alpha_common:0,_kind:'common',_source:'exact_null_anchor'};
}
function historyCommonAnchor(selectedCommon){
  const a=selectedCommon.alpha_common!=null?selectedCommon.alpha_common:selectedCommon.alpha200;
  return{ell0:selectedCommon.ell0,kappa:selectedCommon.kappa,q:selectedCommon.q,alpha200:a,alpha1000:a,_kind:'history',_source:'exact_common_anchor'};
}
function historyNullAnchor(selectedNull){
  return{ell0:selectedNull.ell0,kappa:selectedNull.kappa,q:selectedNull.q,alpha200:0,alpha1000:0,_kind:'history',_source:'exact_null_anchor'};
}

function configuredH5Model(base,c){
  const m=clone(base);
  if(m.id!==MODEL_ID)throw new Error('H5 estimator received wrong model id.');
  const g=m.reorientation_gate,o=m.origin_search;
  if(!g?.enabled||!o?.enabled)throw new Error('H5 estimator requires enabled run-and-reorientation and origin_search.');
  g.baseline.mean_free_path_mm=c.ell0;
  g.baseline.turn_concentration=c.kappa;
  g.effect.max_hazard_reduction_fraction=0;
  o.history_response.alpha_search_200=c.alpha200;
  o.history_response.alpha_search_1000=c.alpha1000;
  return m;
}
function configuredH2Model(base,c){
  const m=clone(base);
  m.movement.angular_sigma_rad_sqrt_s=c.sigma0;
  m.directional_persistence.initialization.distance_scale_mm=c.lambda_mm;
  m.directional_persistence.decay.tau_s=c.tau_s;
  m.directional_persistence.effect.max_reduction_fraction=c.rho;
  return m;
}
function configuredH3Model(base,c){
  const m=clone(base),g=m.reorientation_gate;
  g.baseline.mean_free_path_mm=c.ell0;
  g.baseline.turn_concentration=c.kappa;
  g.initialization.history_distance_scale_mm=c.lambda_mm;
  g.decay.gate_tau_s=c.tau_s;
  g.effect.max_hazard_reduction_fraction=c.rho;
  return m;
}
function configuredH4Model(base,c){
  return h4est.configuredModel(base,c);
}

function exitEdge(ex,w,h){
  if(!ex)return'timeout';
  const d={left:Math.abs(ex.x),right:Math.abs(ex.x-w),top:Math.abs(ex.y),bottom:Math.abs(ex.y-h)};
  return Object.keys(d).sort((a,b)=>d[a]-d[b])[0];
}
function applyEntryTransition(sim,c,seed){
  const rr=new core.RNG(streamSeed(seed,ENTRY_STREAM));
  if(rr.next()>c.q)sim.ants[0].heading=rr.next()*2*Math.PI-Math.PI;
}
function rowFromSummary(pl,summary,sim,sx,sy){
  const r=summary.observed_metrics.ants[0],ex=r.exit_coordinate_mm;
  return{
    path_length:pl,
    time_to_exit_s:r.time_to_arena_edge_s??sim.experiment.duration_s,
    middle_zone_fraction:r.central_zone_fraction??0,
    beeline_mm:ex?Math.hypot(ex.x-sx,ex.y-sy):0,
    exit_edge:exitEdge(ex,sim.apparatus.world.width,sim.apparatus.world.height)
  };
}
function simulateConfiguredGeometryAware(model,c,trials,seed0,pool){
  const out=[];
  for(const [pl,experiment] of [['s','open_arena_short_control.json'],['l','open_arena_long_control.json']]){
    for(let i=0;i<trials;i++){
      const seed=seed0+i;
      const sampled=geom.sampleGeometry(pool,seed).row;
      let b=loadBundle(experiment,{modelId:model.id});
      b.model=clone(model);
      b=geom.applyGeometry(b,sampled);
      b.observation.record_trajectories=false;
      const sim=new Simulation(b,seed);
      applyEntryTransition(sim,c,seed);
      const sx=sim.ants[0].x,sy=sim.ants[0].y;
      const summary=sim.runUntilComplete(b.experiment.duration_s,FIXED_DT);
      out.push(rowFromSummary(pl,summary,sim,sx,sy));
    }
  }
  return out;
}
function simulateH5Candidate(c,trials,seed0,base,pool){
  return simulateConfiguredGeometryAware(configuredH5Model(base,c),c,trials,seed0,pool);
}
function simulateH2CandidateGeometryAware(c,trials,seed0,base,pool){
  return simulateConfiguredGeometryAware(configuredH2Model(base,c),c,trials,seed0,pool);
}
function simulateH3CandidateGeometryAware(c,trials,seed0,base,pool){
  return simulateConfiguredGeometryAware(configuredH3Model(base,c),c,trials,seed0,pool);
}
function simulateH4CandidateGeometryAware(c,trials,seed0,base,pool){
  return simulateConfiguredGeometryAware(configuredH4Model(base,c),c,trials,seed0,pool);
}

function nearBound(value,bounds,scale){
  if(!Number.isFinite(value))return false;
  const[a,b]=bounds;
  const u=scale==='log'?(Math.log(value)-Math.log(a))/(Math.log(b)-Math.log(a)):(value-a)/(b-a);
  return u<=.01||u>=.99;
}
function boundaryFlags(c,policy){
  const p=policy.estimated_parameters,out=[];
  if(nearBound(c.ell0,p.baseline_mean_free_path_mm.bounds,p.baseline_mean_free_path_mm.scale))out.push('ell0');
  if(nearBound(c.kappa,p.baseline_turn_concentration.bounds,p.baseline_turn_concentration.scale))out.push('kappa_turn');
  if(nearBound(c.q,p.entry_orientation_retention_q.bounds,p.entry_orientation_retention_q.scale))out.push('q');
  if(nearBound(c.alpha200,[0,1],'linear'))out.push('alpha_search_200');
  if(nearBound(c.alpha1000,[0,1],'linear'))out.push('alpha_search_1000');
  return out;
}
function besselI0(x){
  const ax=Math.abs(x);
  if(ax<3.75){const y=(x/3.75)**2;return 1+y*(3.5156229+y*(3.0899424+y*(1.2067492+y*(0.2659732+y*(0.0360768+y*0.0045813)))));}
  const y=3.75/ax;
  return Math.exp(ax)/Math.sqrt(ax)*(0.39894228+y*(0.01328592+y*(0.00225319+y*(-0.00157565+y*(0.00916281+y*(-0.02057706+y*(0.02635537+y*(-0.01647633+y*0.00392377))))))));
}
function besselI1(x){
  const ax=Math.abs(x);let ans;
  if(ax<3.75){const y=(x/3.75)**2;ans=ax*(0.5+y*(0.87890594+y*(0.51498869+y*(0.15084934+y*(0.02658733+y*(0.00301532+y*0.00032411))))));}
  else{const y=3.75/ax;ans=Math.exp(ax)/Math.sqrt(ax)*(0.39894228+y*(-0.03988024+y*(-0.00362018+y*(0.00163801+y*(-0.01031555+y*(0.02282967+y*(-0.02895312+y*(0.01787654-y*0.00420059))))))));}
  return x<0?-ans:ans;
}
function vonMisesA1(kappa){
  const k=Math.max(0,Number(kappa)||0);
  if(k===0)return 0;
  return besselI1(k)/besselI0(k);
}
function effectiveQuantities(c){
  const A1=vonMisesA1(c.kappa),a200=c.alpha200||0,a1000=c.alpha1000||0;
  return{
    alpha_search_200:a200,
    alpha_search_1000:a1000,
    delta_alpha:a200-a1000,
    A1_kappa_turn:A1,
    P200:a200*A1,
    P1000:a1000*A1,
    delta_P:(a200-a1000)*A1
  };
}
function reportCandidate(c,policy){
  return Object.assign({},c,{near_search_bounds:boundaryFlags(c,policy),effective:effectiveQuantities(c)});
}

function scoreCandidate(c,realRows,scales,policy,base,pool,trials,seed0){
  const simRows=simulateH5Candidate(c,trials,seed0,base,pool);
  const sc=h3est.score(simRows,realRows,scales);
  return{candidate:reportCandidate(c,policy),source:c._source,loss:sc.loss,components:sc.components};
}
function chooseBest(rows){
  let best=null;
  for(const row of rows)if(!best||row.loss<best.loss)best=row;
  return best;
}
function sortedTop(rows,n=12){return[...rows].sort((a,b)=>a.loss-b.loss).slice(0,Math.min(n,rows.length));}
function searchNull(realRows,scales,policy,base,pool,{count,trials,seed0}){
  const rows=[];
  for(let i=0;i<count;i++)rows.push(scoreCandidate(nullCandidate(i,policy),realRows,scales,policy,base,pool,trials,seed0));
  const best=chooseBest(rows);
  return{best,selectedCandidate:clone(best.candidate),top:sortedTop(rows,12),candidate_count:rows.length};
}
function searchCommon(realRows,scales,policy,base,pool,{count,trials,seed0,nullSelected}){
  if(count<2)throw new Error('H5 common search needs at least one Halton point plus exact null anchor.');
  const rows=[];
  for(let i=0;i<count-1;i++)rows.push(scoreCandidate(commonCandidate(i,policy),realRows,scales,policy,base,pool,trials,seed0));
  const anchor=scoreCandidate(commonNullAnchor(nullSelected),realRows,scales,policy,base,pool,trials,seed0);
  rows.push(anchor);
  const best=chooseBest(rows);
  return{best,selectedCandidate:clone(best.candidate),anchor,top:sortedTop(rows,12),candidate_count:rows.length};
}
function searchHistory(realRows,scales,policy,base,pool,{count,trials,seed0,nullSelected,commonSelected}){
  if(count<3)throw new Error('H5 history search needs Halton points plus exact common and null anchors.');
  const rows=[];
  for(let i=0;i<count-2;i++)rows.push(scoreCandidate(historyCandidate(i,policy),realRows,scales,policy,base,pool,trials,seed0));
  const commonAnchor=scoreCandidate(historyCommonAnchor(commonSelected),realRows,scales,policy,base,pool,trials,seed0);
  const nullAnchor=scoreCandidate(historyNullAnchor(nullSelected),realRows,scales,policy,base,pool,trials,seed0);
  rows.push(commonAnchor,nullAnchor);
  const best=chooseBest(rows);
  return{best,selectedCandidate:clone(best.candidate),commonAnchor,nullAnchor,top:sortedTop(rows,12),candidate_count:rows.length};
}

function h2CandidateFromFold(fold){
  const c=fold?.H2;if(!c)throw new Error('Missing H2 fold candidate.');
  return{sigma0:c.sigma0,q:c.q,lambda_mm:c.lambda_mm,tau_s:c.tau_s,rho:c.rho};
}
function h3CandidateFromFold(fold){
  const c=fold?.H3_context;if(!c)throw new Error('Missing H3 fold candidate.');
  return{ell0:c.ell0,kappa:c.kappa,q:c.q,lambda_mm:c.lambda_history_mm,tau_s:c.tau_gate_s,rho:c.rho_gate};
}
function h4CandidateFromFold(fold){
  const c=fold?.H4_context?.fit?.candidate;if(!c)throw new Error('Missing H4 fold candidate.');
  const out=clone(c);
  if(out.null_equivalent_anchor===true||(out.rho_speed===0&&out.lambda_activation_mm==null&&out.tau_activation_s==null)){
    // Historical H4 reports intentionally serialize the exact-null anchor's
    // lambda/tau as null because they are not estimates. Rehydrate the same
    // inert runtime placeholders used by the frozen H4 nullAnchor() function.
    out.lambda_activation_mm=500;
    out.tau_activation_s=5;
    out.rho_speed=0;
    out._rehydrated_exact_null_anchor=true;
  }
  return out;
}
function median(xs){return h3est.score?quantile([...xs].sort((a,b)=>a-b),.5):NaN;}
function quantile(sorted,p){if(!sorted.length)return NaN;const x=(sorted.length-1)*p,lo=Math.floor(x),hi=Math.ceil(x);return lo===hi?sorted[lo]:sorted[lo]+(sorted[hi]-sorted[lo])*(x-lo);}
function relImprove(comparator,model){return(comparator-model)/Math.max(1e-12,comparator);}

function assertPolicySemantics(policy){
  if(policy.id!=='H5_parameter_estimation_v1'||policy.schema_version!==2)throw new Error('Unexpected H5 estimator policy identity/schema.');
  const b=policy.search_protocol.high_resolution_budget;
  if(b.H5_null_candidates_per_fold!==500||b.H5_common_candidates_per_fold_total!==500||b.H5_history_candidates_per_fold_total!==500||b.training_trials_per_condition_per_candidate!==60||b.heldout_evaluation_trials_per_condition!==120||b.folds!==6)throw new Error('Frozen H5 budget drift.');
  if(policy.search_protocol.root_seed!==990000)throw new Error('Frozen H5 root seed drift.');
  if(policy.rng_contract.baseline_H3_event_stream!=='existing biology_h3_turn_event:<ant_id> stream unchanged')throw new Error('H3 event-stream contract drift.');
  if(policy.rng_contract.H5_choice_stream!=='biology_h5_search_choice:<ant_id>'||policy.rng_contract.H5_search_angle_stream!=='biology_h5_search_angle:<ant_id>')throw new Error('H5 RNG contract drift.');
  if(policy.search_protocol.safe_kappa_support.frozen_500_point_halton_min!==0.027434842249657063||policy.search_protocol.safe_kappa_support.frozen_500_point_halton_max!==19.945130315500684)throw new Error('Frozen kappa support drift.');
  const first=nullCandidate(0,policy),last=nullCandidate(499,policy);
  const ks=[];for(let i=0;i<500;i++)ks.push(nullCandidate(i,policy).kappa);
  if(Math.min(...ks)!==policy.search_protocol.safe_kappa_support.frozen_500_point_halton_min||Math.max(...ks)!==policy.search_protocol.safe_kappa_support.frozen_500_point_halton_max)throw new Error('H5 candidate mapping no longer matches frozen kappa support.');
  if(!(first.ell0>0&&last.ell0>0))throw new Error('Invalid H5 candidate mapping.');
  return true;
}
function assertDevelopmentInputs(root,target,cal,source){
  const d=cal.datasets?.poissonnier2026_open_arena;
  if(d?.allowed_for_development_parameter_estimation!==true)throw new Error('Open-arena development estimation is not permitted.');
  if(cal.datasets?.poissonnier2026_ymaze?.allowed_for_development_parameter_estimation!==false)throw new Error('Y-maze must remain forbidden.');
  if(target.status!=='development_estimation_only_not_external_validation')throw new Error('Unexpected H5 target status.');
  if(target.rows.some(r=>!['s','l'].includes(r.path_length)))throw new Error('H5 target may contain DCM short/long controls only.');
  const published=source.supplements?.find(s=>s.role==='published_dataset');
  if(!published?.sha256||published.sha256!==target.source_xlsx_sha256)throw new Error('Target/source XLSX mismatch.');
  const colonies=[...new Set(target.rows.map(r=>r.colony))].sort((a,b)=>a-b);
  if(JSON.stringify(colonies)!==JSON.stringify(COLONIES))throw new Error('H5 LOCO colony set drift.');
  return true;
}
function currentImplementationBlobs(root){
  const files=[
    'src/h3.js','src/h5.js','src/integrity.js',
    'models/lasius_niger_locomotion_h5_v1.json',
    'tools/run-h5-estimation.js',
    POLICY_FILE
  ];
  return Object.fromEntries(files.map(rel=>[rel,gitBlobShaFile(path.resolve(root,rel))]));
}
function assertSyntheticQualification(root){
  const file=path.resolve(root,QUALIFICATION_FILE);
  if(!fs.existsSync(file))throw new Error('H5 reference parameter search is blocked: synthetic qualification record is missing.');
  const q=readJson(file);
  if(q.status!=='passed_reference_parameter_search_authorized'||q.reference_outcomes_used!==false||q.ymaze_accessed!==false)throw new Error('H5 synthetic qualification is not an accepted no-reference-loss pass.');
  const now=currentImplementationBlobs(root);
  if(JSON.stringify(q.implementation_blobs)!==JSON.stringify(now))throw new Error('H5 implementation changed after synthetic qualification; reference search remains blocked.');
  return q;
}

function runLoco(root,policy){
  assertSyntheticQualification(root);
  const target=read(root,'reference/poissonnier2026_h2_estimation_targets.json');
  const cal=read(root,'reference/calibration_manifest.json');
  const source=read(root,'reference/poissonnier2026_source_manifest.json');
  assertDevelopmentInputs(root,target,cal,source);
  const {geometry}=geom.loadFrozenMeasurementGeometry(root);
  geom.assertTargetAlignment(geometry,target);
  const h5Base=read(root,'models/lasius_niger_locomotion_h5_v1.json');
  const h2Base=read(root,'models/lasius_niger_locomotion_h2_v1.json');
  const h3Base=read(root,'models/lasius_niger_locomotion_h3_v1.json');
  const h4Base=read(root,'models/lasius_niger_locomotion_h4_v1.json');
  const h2Report=read(root,'reports/h2_parameter_estimation_500x60_v1.json');
  const h3Report=read(root,'reports/h3_parameter_estimation_500x60_v1.json');
  const h4Report=read(root,'reports/h4_parameter_estimation_500x60_v1.json');
  const budget=policy.search_protocol.high_resolution_budget;
  const report={
    schema_version:1,
    id:'H5_parameter_estimation_500x60_v1',
    status:'development_estimation_complete_pending_interpretation',
    policy_git_blob_sha:POLICY_GIT_BLOB_SHA,
    implementation_blobs:currentImplementationBlobs(root),
    canonical_parameters_updated:false,
    ymaze_accessed:false,
    source_xlsx_sha256:target.source_xlsx_sha256,
    measurement_geometry_blob:geom.GEOMETRY_GIT_BLOB_SHA,
    search:{method:'deterministic Halton low-discrepancy search with exact nesting anchors',budget,root_seed:policy.search_protocol.root_seed,common_random_numbers:true},
    folds:[]
  };
  for(let fi=0;fi<COLONIES.length;fi++){
    const held=COLONIES[fi],train=target.rows.filter(r=>r.colony!==held),test=target.rows.filter(r=>r.colony===held);
    const pool=geom.geometryPool(geometry.rows,held);
    const scales=h3est.scoreScales(train);
    const fitSeed=990000+fi*10000,evalSeed=1490000+fi*10000;
    const ns=searchNull(train,scales,policy,h5Base,pool,{count:500,trials:60,seed0:fitSeed});
    const cs=searchCommon(train,scales,policy,h5Base,pool,{count:500,trials:60,seed0:fitSeed,nullSelected:ns.selectedCandidate});
    const hs=searchHistory(train,scales,policy,h5Base,pool,{count:500,trials:60,seed0:fitSeed,nullSelected:ns.selectedCandidate,commonSelected:cs.selectedCandidate});
    const nEval=h3est.score(simulateH5Candidate(ns.selectedCandidate,120,evalSeed,h5Base,pool),test,scales);
    const cEval=h3est.score(simulateH5Candidate(cs.selectedCandidate,120,evalSeed,h5Base,pool),test,scales);
    const hEval=h3est.score(simulateH5Candidate(hs.selectedCandidate,120,evalSeed,h5Base,pool),test,scales);

    const h2Fold=h2Report.folds.find(f=>f.held_out_colony===held),h3Fold=h3Report.folds.find(f=>f.held_out_colony===held),h4Fold=h4Report.folds.find(f=>f.held_out_colony===held);
    const h2c=h2CandidateFromFold(h2Fold),h3c=h3CandidateFromFold(h3Fold),h4c=h4CandidateFromFold(h4Fold);
    const h2Eval=h3est.score(simulateH2CandidateGeometryAware(h2c,120,evalSeed,h2Base,pool),test,scales);
    const h3Eval=h3est.score(simulateH3CandidateGeometryAware(h3c,120,evalSeed,h3Base,pool),test,scales);
    const h4Eval=h3est.score(simulateH4CandidateGeometryAware(h4c,120,evalSeed,h4Base,pool),test,scales);

    report.folds.push({
      held_out_colony:held,
      train_n:train.length,test_n:test.length,geometry_pool_n:pool.length,
      fit_seed:fitSeed,evaluation_seed:evalSeed,evaluation_trials_per_condition:120,
      heldout_metric_scales_from_training:scales,
      H5_null:{fit:ns.best,training_top_candidates:ns.top,heldout_loss:nEval.loss,heldout_components:nEval.components},
      H5_common_search:{fit:cs.best,training_top_candidates:cs.top,heldout_loss:cEval.loss,heldout_components:cEval.components,null_anchor_train_loss:cs.anchor.loss},
      H5_history:{fit:hs.best,training_top_candidates:hs.top,heldout_loss:hEval.loss,heldout_components:hEval.components,common_anchor_train_loss:hs.commonAnchor.loss,null_anchor_train_loss:hs.nullAnchor.loss},
      H2_v1_frozen_candidate:{candidate:h2c,reevaluated_heldout_loss_reconstructed_geometry:h2Eval.loss,heldout_components:h2Eval.components},
      H3_v1_frozen_candidate:{candidate:h3c,reevaluated_heldout_loss_reconstructed_geometry:h3Eval.loss,heldout_components:h3Eval.components},
      H4_v1_frozen_candidate:{candidate:h4c,reevaluated_heldout_loss_reconstructed_geometry:h4Eval.loss,heldout_components:h4Eval.components},
      heldout_relative_improvement_vs_H5_common:relImprove(cEval.loss,hEval.loss),
      heldout_relative_improvement_vs_H5_null:relImprove(nEval.loss,hEval.loss),
      heldout_relative_improvement_common_vs_null:relImprove(nEval.loss,cEval.loss),
      heldout_relative_improvement_vs_H2_v1:relImprove(h2Eval.loss,hEval.loss),
      heldout_relative_improvement_vs_H3_v1:relImprove(h3Eval.loss,hEval.loss),
      heldout_relative_improvement_vs_H4_v1:relImprove(h4Eval.loss,hEval.loss)
    });
  }
  const vals=name=>report.folds.map(f=>f[name]);
  const summarize=name=>{const x=vals(name),wins=x.filter(v=>v>0).length;return{wins,total:6,median_relative_improvement:quantile([...x].sort((a,b)=>a-b),.5)};};
  const vsCommon=summarize('heldout_relative_improvement_vs_H5_common');
  const vsNull=summarize('heldout_relative_improvement_vs_H5_null');
  const commonVsNull=summarize('heldout_relative_improvement_common_vs_null');
  const vsH2=summarize('heldout_relative_improvement_vs_H2_v1');
  const vsH3=summarize('heldout_relative_improvement_vs_H3_v1');
  const vsH4=summarize('heldout_relative_improvement_vs_H4_v1');
  const ownPass=vsCommon.wins>=5&&vsCommon.median_relative_improvement>0&&vsNull.wins>=5&&vsNull.median_relative_improvement>0;
  report.internal_cv={
    H5_history_vs_H5_common:vsCommon,
    H5_history_vs_H5_null:vsNull,
    H5_common_vs_H5_null:commonVsNull,
    H5_history_vs_H2_v1:vsH2,
    H5_history_vs_H3_v1:vsH3,
    H5_history_vs_H4_v1:vsH4,
    history_modulation_guard_passed:ownPass,
    generic_origin_search_guard_passed:commonVsNull.wins>=5&&commonVsNull.median_relative_improvement>0,
    H2_comparison_guard_passed:ownPass&&vsH2.wins>=4&&vsH2.median_relative_improvement>0,
    H3_comparison_guard_passed:ownPass&&vsH3.wins>=4&&vsH3.median_relative_improvement>0,
    H4_comparison_guard_passed:ownPass&&vsH4.wins>=4&&vsH4.median_relative_improvement>0,
    overall_development_preferred:ownPass&&vsH2.wins>=4&&vsH2.median_relative_improvement>0&&vsH3.wins>=4&&vsH3.median_relative_improvement>0&&vsH4.wins>=4&&vsH4.median_relative_improvement>0,
    canonical_promotion:false
  };
  return report;
}

function describe(root,policy){
  const ks=[];for(let i=0;i<500;i++)ks.push(nullCandidate(i,policy).kappa);
  return{
    status:'implementation_available_reference_search_blocked_until_synthetic_qualification',
    policy_blob:POLICY_GIT_BLOB_SHA,
    implementation_blobs:currentImplementationBlobs(root),
    candidate_sets:{null_halton:500,common_halton:499,history_halton:498,total_with_anchors:{null:500,common:500,history:500}},
    kappa_support:{min:Math.min(...ks),max:Math.max(...ks)},
    qualification_file:QUALIFICATION_FILE
  };
}

function main(){
  const root=path.resolve(__dirname,'..');
  assertBlob(root,POLICY_FILE,POLICY_GIT_BLOB_SHA);
  const policy=read(root,POLICY_FILE);
  assertPolicySemantics(policy);
  const mode=arg('mode','describe');
  if(mode==='describe'){console.log(JSON.stringify(describe(root,policy),null,2));return;}
  if(mode!=='loco')throw new Error(`Unsupported H5 estimator mode '${mode}'. Only describe and loco are implemented; pooled fitting remains blocked until after LOCO.`);
  const report=runLoco(root,policy);
  const out=path.resolve(process.cwd(),arg('out','h5-estimation-results.json'));
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  console.log(`Saved ${out}`);
}

if(require.main===module)main();

module.exports={
  ENTRY_STREAM,POLICY_FILE,POLICY_GIT_BLOB_SHA,MODEL_ID,QUALIFICATION_FILE,HALTON,COLONIES,
  gitBlobShaBuffer,gitBlobShaFile,assertBlob,halton,mapVal,nuisanceAt,
  nullCandidate,commonCandidate,historyCandidate,commonNullAnchor,historyCommonAnchor,historyNullAnchor,
  configuredH5Model,configuredH2Model,configuredH3Model,configuredH4Model,
  exitEdge,applyEntryTransition,rowFromSummary,simulateConfiguredGeometryAware,simulateH5Candidate,
  simulateH2CandidateGeometryAware,simulateH3CandidateGeometryAware,simulateH4CandidateGeometryAware,
  boundaryFlags,besselI0,besselI1,vonMisesA1,effectiveQuantities,reportCandidate,
  scoreCandidate,searchNull,searchCommon,searchHistory,
  h2CandidateFromFold,h3CandidateFromFold,h4CandidateFromFold,
  quantile,relImprove,assertPolicySemantics,assertDevelopmentInputs,currentImplementationBlobs,
  assertSyntheticQualification,runLoco,describe
};
