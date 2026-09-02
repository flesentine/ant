#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const{Simulation,FIXED_DT}=require('../src/integrity.js');
const{loadBundle}=require('./load-bundle.js');
function textArg(name,fallback){const i=process.argv.indexOf(`--${name}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:fallback;}
function numArg(name,fallback){return Number(textArg(name,fallback));}
const experimentFile=textArg('experiment','open_arena_short_control.json'),trials=Math.max(1,numArg('trials',20)),firstSeed=Math.max(1,numArg('seed',928491)),dt=numArg('dt',FIXED_DT),bundle=loadBundle(experimentFile);
// Streaming measurement remains enabled; this flag only prevents retaining every frame.
bundle.observation.record_trajectories=false;
const rows=[];
for(let i=0;i<trials;i++){const sim=new Simulation(bundle,firstSeed+i);rows.push(sim.runUntilComplete(bundle.experiment.duration_s,dt));}
const first=rows[0],report={model_id:first.model_id,state_id:first.state_id,apparatus_id:first.apparatus_id,observation_id:first.observation_id,scoring_id:first.scoring_id,experiment_id:first.experiment_id,calibration_role:first.calibration_role,provenance:first.provenance,trials,fixed_dt_s:dt,seed_range:[firstSeed,firstSeed+trials-1],outcomes:{},observed_metric_means:{},trials_data:rows};
for(const r of rows)for(const[k,v]of Object.entries(r.outcomes))report.outcomes[k]=(report.outcomes[k]||0)+v;
for(const key of ['central_zone_fraction','mean_moving_speed_mm_s','total_distance_mm','time_to_arena_edge_s','path_straightness']){const vals=rows.map(r=>r.observed_metrics?.means?.[key]).filter(Number.isFinite);report.observed_metric_means[key]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;}
const out=path.resolve(process.cwd(),'benchmark-results.json');fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({experiment:report.experiment_id,model_hash:report.provenance.model_hash,resolved_state_hash:report.provenance.resolved_state_hash,observation_hash:report.provenance.observation_hash,outcomes:report.outcomes,observed_metric_means:report.observed_metric_means},null,2));console.log(`Saved ${out}`);
