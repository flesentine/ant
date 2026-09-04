'use strict';
const fs=require('fs'),path=require('path');
const{Simulation,FIXED_DT,locomotorActivationConfig}=require('../src/integrity.js');
const{loadBundle,readJson}=require('./load-bundle.js');
const MODEL_ID='lasius_niger_locomotion_h4_v1';
function mean(xs){const v=xs.filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function validateFrozenMechanism(model,freeze){
  if(model.id!==MODEL_ID)throw new Error(`Expected ${MODEL_ID}.`);
  if(freeze.id!=='H4_transient_locomotor_activation_v1')throw new Error('Unexpected H4 freeze.');
  if(freeze.implementation_freeze?.fit_parameters_during_initial_mechanism_reachability!==false)throw new Error('H4 reachability must prohibit parameter fitting.');
  if(freeze.implementation_freeze?.use_ymaze!==false)throw new Error('H4 mechanism reachability must prohibit Y-maze access.');
  const c=locomotorActivationConfig(model);
  if(!c)throw new Error('H4 model must enable locomotor_activation.');
  if(c.mechanismId!==freeze.id)throw new Error('H4 model mechanism id must match freeze.');
  if(Number(model.movement.angular_sigma_rad_sqrt_s)!==0.7)throw new Error('H4 v1 must retain baseline angular diffusion.');
  if(Number(model.movement.pause_rate_s)!==0.008||Number(model.movement.pause_min_s)!==0.1||Number(model.movement.pause_max_s)!==0.5)throw new Error('H4 v1 must retain the baseline pause process.');
  return true;
}
function runCondition(experiment,trials,firstSeed,dt){
  const bundle=loadBundle(experiment,{modelId:MODEL_ID}),rows=[];
  for(let i=0;i<trials;i++){
    const sim=new Simulation(bundle,firstSeed+i),summary=sim.runUntilComplete(bundle.experiment.duration_s,dt),latent=summary.latent_states[0],obs=summary.observed_metrics.ants[0];
    rows.push({seed:firstSeed+i,model_hash:summary.provenance.model_hash,activation_initial:latent.locomotor_activation_initial,activation_current:latent.locomotor_activation_current,time_to_exit_s:obs?.time_to_arena_edge_s??null,total_distance_mm:obs?.total_distance_mm??null,straightness:obs?.path_straightness??null,mean_moving_speed_mm_s:obs?.mean_moving_speed_mm_s??null});
  }
  return{bundle,rows};
}
function summarize(rows){return{trials:rows.length,activation_initial:mean(rows.map(r=>r.activation_initial)),mean_exit_time_s:mean(rows.map(r=>r.time_to_exit_s)),mean_observed_distance_mm:mean(rows.map(r=>r.total_distance_mm)),mean_observed_straightness:mean(rows.map(r=>r.straightness)),mean_observed_moving_speed_mm_s:mean(rows.map(r=>r.mean_moving_speed_mm_s))};}
function runH4Mechanism({trials=400,firstSeed=928491,dt=FIXED_DT}={}){
  const root=path.resolve(__dirname,'..'),freeze=readJson(path.resolve(root,'hypotheses','h4_transient_locomotor_activation_v1.json')),model=readJson(path.resolve(root,'models',`${MODEL_ID}.json`));
  validateFrozenMechanism(model,freeze);
  const short=runCondition('open_arena_short_control.json',trials,firstSeed,dt),long=runCondition('open_arena_long_control.json',trials,firstSeed,dt);
  const sh=summarize(short.rows),lo=summarize(long.rows),shortHash=short.rows[0]?.model_hash,longHash=long.rows[0]?.model_hash;
  if(shortHash!==longHash)throw new Error('H4 short/long runs must use the exact same model hash.');
  return{schema_version:1,mechanism_id:freeze.id,model_id:MODEL_ID,model_hash:shortHash,fit_performed:false,reference_targets_accessed:false,ymaze_accessed:false,selection_performed:false,common_random_numbers:true,trials_per_condition:trials,seed_range:[firstSeed,firstSeed+trials-1],dt_s:dt,engineering_parameters:clone(model.locomotor_activation),short:sh,long:lo,structural_checks:{long_activation_exceeds_short:lo.activation_initial>sh.activation_initial,long_moving_speed_exceeds_short:lo.mean_observed_moving_speed_mm_s!=null&&sh.mean_observed_moving_speed_mm_s!=null?lo.mean_observed_moving_speed_mm_s>sh.mean_observed_moving_speed_mm_s:null,long_exit_time_lower:lo.mean_exit_time_s!=null&&sh.mean_exit_time_s!=null?lo.mean_exit_time_s<sh.mean_exit_time_s:null,long_straightness_exceeds_short:lo.mean_observed_straightness!=null&&sh.mean_observed_straightness!=null?lo.mean_observed_straightness>sh.mean_observed_straightness:null},restrictions:['No reference target file was loaded.','No parameter optimization was performed.','Moving speed was reported as a reachability diagnostic only and was not fitted.','The Y-maze was not loaded.','Engineering model values remain assumed and are not biological estimates.']};
}
if(require.main===module){const arg=(n,d)=>{const i=process.argv.indexOf(`--${n}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:d;},report=runH4Mechanism({trials:Math.max(1,Number(arg('trials',400))),firstSeed:Math.max(1,Number(arg('seed',928491))),dt:Number(arg('dt',FIXED_DT))}),out=path.resolve(process.cwd(),arg('out','h4-mechanism-results.json'));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log(`Saved ${out}`);}
module.exports={MODEL_ID,validateFrozenMechanism,runH4Mechanism};
