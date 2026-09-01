#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const{Simulation,FIXED_DT}=require('../src/integrity.js');
const{loadBundle}=require('./load-bundle.js');
function textArg(name,fallback){const i=process.argv.indexOf(`--${name}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:fallback;}
function numArg(name,fallback){return Number(textArg(name,fallback));}
const experimentFile=textArg('experiment','open_arena_short_control.json'),trials=Math.max(1,numArg('trials',20)),firstSeed=Math.max(1,numArg('seed',928491)),dt=numArg('dt',FIXED_DT),bundle=loadBundle(experimentFile);
bundle.observation.record_trajectories=false;
const rows=[];
for(let i=0;i<trials;i++){const sim=new Simulation(bundle,firstSeed+i);rows.push(sim.runUntilComplete(bundle.experiment.duration_s,dt));}
const first=rows[0],report={model_id:first.model_id,state_id:first.state_id,apparatus_id:first.apparatus_id,observation_id:first.observation_id,scoring_id:first.scoring_id,experiment_id:first.experiment_id,calibration_role:first.calibration_role,provenance:first.provenance,trials,fixed_dt_s:dt,seed_range:[firstSeed,firstSeed+trials-1],outcomes:{},trials_data:rows};
for(const r of rows)for(const[k,v]of Object.entries(r.outcomes))report.outcomes[k]=(report.outcomes[k]||0)+v;
const out=path.resolve(process.cwd(),'benchmark-results.json');fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(JSON.stringify({experiment:report.experiment_id,model_hash:report.provenance.model_hash,state_hash:report.provenance.state_hash,scoring_hash:report.provenance.scoring_hash,outcomes:report.outcomes},null,2));console.log(`Saved ${out}`);
