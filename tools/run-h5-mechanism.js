'use strict';
const fs=require('fs'),path=require('path');
const{Simulation,FIXED_DT,headingRestorationConfig}=require('../src/integrity.js');
const{loadBundle,readJson}=require('./load-bundle.js');
const MODEL_ID='lasius_niger_locomotion_h5_v1';
function mean(xs){const v=xs.filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function validateFrozenMechanism(model,freeze,baseline){
  if(model.id!==MODEL_ID)throw new Error(`Expected ${MODEL_ID}.`);
  if(freeze.id!=='H5_transient_entry_heading_restoration_v1')throw new Error('Unexpected H5 freeze.');
  if(freeze.status!=='post_outcome_mechanism_freeze_before_implementation_or_parameter_search')throw new Error('Unexpected H5 freeze status.');
  if(freeze.implementation_freeze?.fit_parameters_during_initial_mechanism_reachability!==false)throw new Error('H5 reachability must prohibit parameter fitting.');
  if(freeze.implementation_freeze?.use_ymaze!==false)throw new Error('H5 reachability must prohibit Y-maze access.');
  if(freeze.development_estimation_guardrails?.estimator_policy_status!=='not_yet_frozen')throw new Error('H5 estimator policy must remain unfrozen during mechanism reachability.');
  const c=headingRestorationConfig(model),e=freeze.engineering_reachability_parameters;
  if(!c)throw new Error('H5 model must enable heading_restoration.');
  if(c.mechanismId!==freeze.id)throw new Error('H5 model mechanism id must match freeze.');
  if(c.lambda!==Number(e.lambda_commitment_mm)||c.tau!==Number(e.tau_commitment_s)||c.kappa!==Number(e.kappa_restore_per_s))throw new Error('H5 engineering parameters must exactly match the frozen reachability values.');
  if(JSON.stringify(model.movement)!==JSON.stringify(baseline.movement))throw new Error('H5 v1 must retain the exact baseline movement process.');
  return true;
}
function runCondition(experiment,trials,firstSeed,dt){
  const bundle=loadBundle(experiment,{modelId:MODEL_ID}),rows=[];
  for(let i=0;i<trials;i++){
    const seed=firstSeed+i,sim=new Simulation(bundle,seed),summary=sim.runUntilComplete(bundle.experiment.duration_s,dt),latent=summary.latent_states[0],obs=summary.observed_metrics.ants[0];
    rows.push({seed,model_hash:summary.provenance.model_hash,commitment_initial:latent.heading_commitment_initial,commitment_current:latent.heading_commitment_current,reference_captured:latent.h5_heading_reference_captured,time_to_exit_s:obs?.time_to_arena_edge_s??null,total_distance_mm:obs?.total_distance_mm??null,straightness:obs?.path_straightness??null,mean_moving_speed_mm_s:obs?.mean_moving_speed_mm_s??null});
  }
  return{bundle,rows};
}
function summarize(rows){return{trials:rows.length,commitment_initial:mean(rows.map(r=>r.commitment_initial)),references_captured:rows.filter(r=>r.reference_captured).length,mean_exit_time_s:mean(rows.map(r=>r.time_to_exit_s)),mean_observed_distance_mm:mean(rows.map(r=>r.total_distance_mm)),mean_observed_straightness:mean(rows.map(r=>r.straightness)),mean_observed_moving_speed_mm_s:mean(rows.map(r=>r.mean_moving_speed_mm_s))};}
function runH5Mechanism({trials=400,firstSeed=928491,dt=FIXED_DT}={}){
  const root=path.resolve(__dirname,'..'),freeze=readJson(path.resolve(root,'hypotheses','h5_transient_entry_heading_restoration_v1.json')),model=readJson(path.resolve(root,'models',`${MODEL_ID}.json`)),baseline=readJson(path.resolve(root,'models','lasius_niger_locomotion_v1.json'));
  validateFrozenMechanism(model,freeze,baseline);
  const short=runCondition('open_arena_short_control.json',trials,firstSeed,dt),long=runCondition('open_arena_long_control.json',trials,firstSeed,dt),sh=summarize(short.rows),lo=summarize(long.rows),shortHash=short.rows[0]?.model_hash,longHash=long.rows[0]?.model_hash;
  if(shortHash!==longHash)throw new Error('H5 short/long runs must use the exact same model hash.');
  return{schema_version:1,mechanism_id:freeze.id,model_id:MODEL_ID,model_hash:shortHash,mechanism_freeze_git_blob_sha:model.provenance.mechanism_freeze_git_blob_sha,fit_performed:false,reference_targets_accessed:false,ymaze_accessed:false,selection_performed:false,estimator_policy_frozen:false,common_random_numbers:true,trials_per_condition:trials,seed_range:[firstSeed,firstSeed+trials-1],dt_s:dt,engineering_parameters:clone(model.heading_restoration),short:sh,long:lo,structural_checks:{long_commitment_exceeds_short:lo.commitment_initial>sh.commitment_initial,all_references_captured:sh.references_captured===trials&&lo.references_captured===trials,long_exit_time_lower:lo.mean_exit_time_s!=null&&sh.mean_exit_time_s!=null?lo.mean_exit_time_s<sh.mean_exit_time_s:null,long_distance_lower:lo.mean_observed_distance_mm!=null&&sh.mean_observed_distance_mm!=null?lo.mean_observed_distance_mm<sh.mean_observed_distance_mm:null,long_straightness_exceeds_short:lo.mean_observed_straightness!=null&&sh.mean_observed_straightness!=null?lo.mean_observed_straightness>sh.mean_observed_straightness:null},restrictions:['No reference target file was loaded.','No parameter optimization or parameter sweep was performed.','Only the one pre-frozen engineering H5 parameter set was executed.','The Y-maze was not loaded.','Moving speed, distance, and straightness are reachability diagnostics only; no H5 fitting objective exists.','Engineering model values are not biological estimates.']};
}
if(require.main===module){const arg=(n,d)=>{const i=process.argv.indexOf(`--${n}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:d;},report=runH5Mechanism({trials:Math.max(1,Number(arg('trials',400))),firstSeed:Math.max(1,Number(arg('seed',928491))),dt:Number(arg('dt',FIXED_DT))}),out=path.resolve(process.cwd(),arg('out','h5-mechanism-results.json'));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log(`Saved ${out}`);}
module.exports={MODEL_ID,validateFrozenMechanism,runH5Mechanism};
