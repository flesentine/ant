'use strict';
const fs=require('fs'),path=require('path');
const{Simulation,FIXED_DT}=require('../src/integrity.js');
const{loadBundle,readJson}=require('./load-bundle.js');
const MODEL_ID='lasius_niger_locomotion_h3_v1';
function mean(xs){const v=xs.filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function validateFrozenMechanism(model,freeze){
  if(model.id!==MODEL_ID)throw new Error(`Expected ${MODEL_ID}.`);
  if(freeze.id!=='H3_transient_reorientation_gate_v1')throw new Error('Unexpected H3 freeze.');
  if(freeze.implementation_freeze?.fit_parameters_during_initial_mechanism_reachability!==false)throw new Error('H3 reachability must prohibit parameter fitting.');
  if(freeze.implementation_freeze?.use_ymaze!==false)throw new Error('H3 mechanism reachability must prohibit Y-maze access.');
  const c=model.reorientation_gate;
  if(!c||c.enabled!==true)throw new Error('H3 model must enable reorientation_gate.');
  if(c.mechanism_id!==freeze.id)throw new Error('H3 model mechanism id must match freeze.');
  if(Number(model.movement.angular_sigma_rad_sqrt_s)!==0)throw new Error('H3 v1 must not use continuous angular diffusion.');
  if(c.baseline?.type!=='run_and_reorientation'||c.effect?.type!=='turn_hazard_reduction')throw new Error('H3 model does not match frozen mechanism class.');
  return true;
}
function runCondition(experiment,trials,firstSeed,dt){
  const bundle=loadBundle(experiment,{modelId:MODEL_ID}),rows=[];
  for(let i=0;i<trials;i++){
    const sim=new Simulation(bundle,firstSeed+i),summary=sim.runUntilComplete(bundle.experiment.duration_s,dt),latent=summary.latent_states[0],events=sim.events.filter(e=>e.type==='h3_reorientation'&&e.ant===0);
    rows.push({seed:firstSeed+i,model_hash:summary.provenance.model_hash,gate_initial:latent.reorientation_gate_initial,gate_current:latent.reorientation_gate_current,reorientation_count:latent.h3_reorientation_count,first_turn_time_s:latent.h3_first_reorientation_time_s,first_turn_distance_mm:latent.h3_first_reorientation_distance_mm,time_to_exit_s:summary.observed_metrics.ants[0]?.time_to_arena_edge_s??null,total_distance_mm:summary.observed_metrics.ants[0]?.total_distance_mm??null,straightness:summary.observed_metrics.ants[0]?.path_straightness??null,event_angles:events.map(e=>e.angle_rad)});
  }
  return{bundle,rows};
}
function summarize(rows){return{trials:rows.length,gate_initial:mean(rows.map(r=>r.gate_initial)),mean_reorientation_count:mean(rows.map(r=>r.reorientation_count)),fraction_with_reorientation:rows.filter(r=>r.reorientation_count>0).length/rows.length,mean_first_turn_time_s:mean(rows.map(r=>r.first_turn_time_s)),mean_first_turn_distance_mm:mean(rows.map(r=>r.first_turn_distance_mm)),mean_exit_time_s:mean(rows.map(r=>r.time_to_exit_s)),mean_observed_distance_mm:mean(rows.map(r=>r.total_distance_mm)),mean_observed_straightness:mean(rows.map(r=>r.straightness))};}
function runH3Mechanism({trials=400,firstSeed=928491,dt=FIXED_DT}={}){
  const root=path.resolve(__dirname,'..'),freeze=readJson(path.resolve(root,'hypotheses','h3_transient_reorientation_gate_v1.json')),model=readJson(path.resolve(root,'models',`${MODEL_ID}.json`));
  validateFrozenMechanism(model,freeze);
  const short=runCondition('open_arena_short_control.json',trials,firstSeed,dt),long=runCondition('open_arena_long_control.json',trials,firstSeed,dt);
  const sh=summarize(short.rows),lo=summarize(long.rows),shortHash=short.rows[0]?.model_hash,longHash=long.rows[0]?.model_hash;
  if(shortHash!==longHash)throw new Error('H3 short/long runs must use the exact same model hash.');
  return{schema_version:1,mechanism_id:freeze.id,model_id:MODEL_ID,model_hash:shortHash,fit_performed:false,reference_targets_accessed:false,ymaze_accessed:false,selection_performed:false,common_random_numbers:true,trials_per_condition:trials,seed_range:[firstSeed,firstSeed+trials-1],dt_s:dt,engineering_parameters:clone(model.reorientation_gate),short:sh,long:lo,structural_checks:{long_gate_exceeds_short:lo.gate_initial>sh.gate_initial,long_first_turn_distance_exceeds_short:lo.mean_first_turn_distance_mm!=null&&sh.mean_first_turn_distance_mm!=null?lo.mean_first_turn_distance_mm>sh.mean_first_turn_distance_mm:null,long_reorientation_count_lower:lo.mean_reorientation_count<sh.mean_reorientation_count},restrictions:['No reference target file was loaded.','No parameter optimization was performed.','The Y-maze was not loaded.','Engineering model values remain assumed and are not biological estimates.']};
}
if(require.main===module){const arg=(n,d)=>{const i=process.argv.indexOf(`--${n}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:d;},report=runH3Mechanism({trials:Math.max(1,Number(arg('trials',400))),firstSeed:Math.max(1,Number(arg('seed',928491))),dt:Number(arg('dt',FIXED_DT))}),out=path.resolve(process.cwd(),arg('out','h3-mechanism-results.json'));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log(`Saved ${out}`);}
module.exports={MODEL_ID,validateFrozenMechanism,runH3Mechanism};
