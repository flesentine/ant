#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const{Simulation,FIXED_DT}=require('../src/integrity.js');
const{loadBundle,readJson}=require('./load-bundle.js');
const METRICS=['mean_moving_speed_mm_s','total_distance_mm','time_to_arena_edge_s','path_straightness','central_zone_fraction'];
function textArg(name,fallback){const i=process.argv.indexOf(`--${name}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:fallback;}
function numArg(name,fallback){return Number(textArg(name,fallback));}
function mean(xs){const v=xs.filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function metric(summary,key){return summary.observed_metrics?.means?.[key];}
function validateFrozenMechanism(model,freeze){
  const c=model.directional_persistence,p=freeze.parameters;
  if(model.id!==freeze.model_candidate)throw new Error(`Freeze expects model ${freeze.model_candidate}, got ${model.id}.`);
  if(!c||c.enabled!==true)throw new Error('H2 model must enable directional_persistence.');
  if(c.mechanism_id!==freeze.id)throw new Error(`H2 mechanism id ${c.mechanism_id} does not match freeze ${freeze.id}.`);
  if(c.input_fact!=='recent_constrained_travel_mm')throw new Error('H2 may only read recent_constrained_travel_mm in v0.3.2b.');
  if(Number(c.initialization.distance_scale_mm)!==Number(p.lambda_mm.value))throw new Error('H2 lambda_mm differs from frozen value.');
  if(Number(c.decay.tau_s)!==Number(p.tau_s.value))throw new Error('H2 tau_s differs from frozen value.');
  if(Number(c.effect.max_reduction_fraction)!==Number(p.rho.value))throw new Error('H2 rho differs from frozen value.');
  if(freeze.evaluation_rules?.fit_parameters!==false||freeze.evaluation_rules?.compare_to_reference_targets_for_selection!==false||freeze.evaluation_rules?.use_ymaze!==false)throw new Error('H2 freeze must prohibit fitting, reference-target selection, and Y-maze access.');
}
function runOne(bundle,seed,dt){const b=clone(bundle);b.observation.record_trajectories=false;const sim=new Simulation(b,seed);const initial=sim.ants.map(a=>({id:a.id,p0:a.directionalPersistenceInitial||0,input_mm:a.latentState?.directional_persistence_input_mm||0}));const summary=sim.runUntilComplete(b.experiment.duration_s,dt);return{initial,summary};}
function runH2Mechanism({trials=200,firstSeed=928491,dt=FIXED_DT}={}){
  const root=path.resolve(__dirname,'..'),modelId='lasius_niger_locomotion_h2_v1';
  const shortBundle=loadBundle('open_arena_short_control.json',{modelId}),longBundle=loadBundle('open_arena_long_control.json',{modelId});
  const freeze=readJson(path.resolve(root,'hypotheses','h2_persistent_directional_state_v1.json'));
  validateFrozenMechanism(shortBundle.model,freeze);
  validateFrozenMechanism(longBundle.model,freeze);
  if(shortBundle.model.id!==longBundle.model.id)throw new Error('H2 short and long treatments must use the same model candidate.');
  const shortRows=[],longRows=[];let firstShort=null,firstLong=null;
  for(let i=0;i<trials;i++){
    const seed=firstSeed+i,s=runOne(shortBundle,seed,dt),l=runOne(longBundle,seed,dt);
    if(i===0){firstShort=s;firstLong=l;}shortRows.push(s.summary);longRows.push(l.summary);
  }
  const metrics={};for(const k of METRICS){const s=mean(shortRows.map(r=>metric(r,k))),l=mean(longRows.map(r=>metric(r,k)));metrics[k]={short_mean:s,long_mean:l,predicted_short_minus_long:s-l};}
  return{schema_version:1,mechanism_id:freeze.id,model_id:firstShort.summary.model_id,model_hash:firstShort.summary.provenance.model_hash,trials_per_condition:trials,seed_range:[firstSeed,firstSeed+trials-1],dt_s:dt,common_random_numbers:true,fit_performed:false,reference_targets_accessed:false,ymaze_accessed:false,selection_performed:false,frozen_parameters:{lambda_mm:freeze.parameters.lambda_mm.value,tau_s:freeze.parameters.tau_s.value,rho:freeze.parameters.rho.value},initial_latent_state:{short:firstShort.initial[0],long:firstLong.initial[0]},metrics,interpretation:'Mechanism reachability only. These outputs must not be used to tune or select H2 parameters under v0.3.2b.'};
}
if(require.main===module){const report=runH2Mechanism({trials:Math.max(1,numArg('trials',200)),firstSeed:Math.max(1,numArg('seed',928491)),dt:numArg('dt',FIXED_DT)}),out=path.resolve(process.cwd(),textArg('out','h2-mechanism-results.json'));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log(`Saved ${out}`);}
module.exports={runH2Mechanism,validateFrozenMechanism,METRICS};
