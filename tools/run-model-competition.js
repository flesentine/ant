#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path');
const{Simulation,FIXED_DT}=require('../src/integrity.js');
const{loadBundle,readJson}=require('./load-bundle.js');
const METRICS=['mean_moving_speed_mm_s','total_distance_mm','time_to_arena_edge_s','path_straightness','central_zone_fraction'];
const PRIMARY=['total_distance_mm','time_to_arena_edge_s','path_straightness'];
function textArg(name,fallback){const i=process.argv.indexOf(`--${name}`);return i>=0&&process.argv[i+1]!=null?process.argv[i+1]:fallback;}
function numArg(name,fallback){return Number(textArg(name,fallback));}
function mean(xs){const v=xs.filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function clone(v){return JSON.parse(JSON.stringify(v));}
function runOne(bundle,seed,dt){const b=clone(bundle);b.observation.record_trajectories=false;return new Simulation(b,seed).runUntilComplete(b.experiment.duration_s,dt);}
function metricValue(summary,key){return summary.observed_metrics?.means?.[key];}
function inInterval(v,interval){return Number.isFinite(v)&&Array.isArray(interval)&&v>=interval[0]&&v<=interval[1];}
function validateScreeningInputs({hypothesis,reference,policy,sourceManifest}){
  const datasetId=hypothesis.reference_dataset,datasetPolicy=policy.datasets?.[datasetId];
  if(!datasetPolicy)throw new Error(`No calibration policy exists for screening dataset ${datasetId}.`);
  if(datasetPolicy.allowed_for_descriptive_model_screening!==true)throw new Error(`Dataset ${datasetId} is not allowed for descriptive model screening.`);
  if(hypothesis.rules?.fit_parameters!==false)throw new Error('Model competition must explicitly prohibit parameter fitting.');
  if(hypothesis.rules?.use_ymaze_for_model_selection!==false)throw new Error('Model competition must explicitly prohibit Y-maze model selection.');
  if(policy.datasets?.poissonnier2026_ymaze?.allowed_for_descriptive_model_screening!==false)throw new Error('Y-maze holdout must remain forbidden for descriptive model screening.');
  const published=sourceManifest.supplements?.find(s=>s.role==='published_dataset');
  if(!published?.sha256)throw new Error('Canonical source manifest lacks a published-dataset SHA-256.');
  if(reference.source_xlsx_sha256!==published.sha256)throw new Error(`Screening reference SHA-256 ${reference.source_xlsx_sha256} does not match canonical source ${published.sha256}.`);
  return datasetPolicy;
}
function runCompetition({trials=400,firstSeed=928491,dt=FIXED_DT}={}){
  const root=path.resolve(__dirname,'..'),shortBundle=loadBundle('open_arena_short_control.json'),longBundle=loadBundle('open_arena_long_control.json');
  const hypothesis=readJson(path.resolve(root,'hypotheses','open_arena_locomotion_context_v1.json'));
  const reference=readJson(path.resolve(root,'reference','poissonnier2026_control_effects.json'));
  const policy=readJson(path.resolve(root,'reference','calibration_manifest.json'));
  const sourceManifest=readJson(path.resolve(root,'reference','poissonnier2026_source_manifest.json'));
  validateScreeningInputs({hypothesis,reference,policy,sourceManifest});
  if(shortBundle.model.id!==longBundle.model.id)throw new Error('Model competition requires the same species model in both treatments.');
  const shortRows=[],longRows=[],pairedDiffs={};for(const k of METRICS)pairedDiffs[k]=[];
  for(let i=0;i<trials;i++){
    const seed=firstSeed+i,s=runOne(shortBundle,seed,dt),l=runOne(longBundle,seed,dt);shortRows.push(s);longRows.push(l);
    for(const k of METRICS){const a=metricValue(s,k),b=metricValue(l,k);if(Number.isFinite(a)&&Number.isFinite(b))pairedDiffs[k].push(a-b);}
  }
  const metrics={};
  for(const k of METRICS){const shortMean=mean(shortRows.map(r=>metricValue(r,k))),longMean=mean(longRows.map(r=>metricValue(r,k))),predicted=shortMean-longMean,target=reference.metrics[k],interval=target.bootstrap95_short_minus_long;metrics[k]={short_mean:shortMean,long_mean:longMean,predicted_short_minus_long:predicted,reference_short_minus_long:target.short_minus_long,reference_bootstrap95:interval,reference_loo_sign_stable:target.loo_sign_stable,classification:inInterval(predicted,interval)?'compatible_with_summary_contrast':'outside_summary_contrast_interval',max_abs_paired_seed_difference:pairedDiffs[k].length?Math.max(...pairedDiffs[k].map(Math.abs)):null};}
  const primaryOutside=PRIMARY.filter(k=>metrics[k].classification==='outside_summary_contrast_interval'&&reference.metrics[k].loo_sign_stable),first=shortRows[0];
  return{schema_version:1,competition_id:hypothesis.id,hypothesis_id:'H0_context_invariant',reference_dataset:hypothesis.reference_dataset,screening_only:true,fit_performed:false,ymaze_accessed:false,model_id:first.model_id,model_hash:first.provenance.model_hash,trials_per_condition:trials,seed_range:[firstSeed,firstSeed+trials-1],dt_s:dt,common_random_numbers:true,reference_source_xlsx_sha256:reference.source_xlsx_sha256,metrics,primary_outside:primaryOutside,conclusion:primaryOutside.length>=2?'H0_screening_incompatible':'H0_not_screened_out',interpretation:primaryOutside.length>=2?'The current context-invariant locomotion substrate cannot reproduce the robust short-vs-long differences in arena exploration without an additional justified mechanism or measured entry-condition difference.':'The null substrate was not clearly incompatible with the available summary contrasts.',restrictions:['No parameter optimization was performed.','The Y-maze holdout was not loaded or used.','Reference bootstrap intervals are descriptive and do not model colony clustering.']};
}
if(require.main===module){const report=runCompetition({trials:Math.max(1,numArg('trials',400)),firstSeed:Math.max(1,numArg('seed',928491)),dt:numArg('dt',FIXED_DT)}),out=path.resolve(process.cwd(),textArg('out','model-competition-results.json'));fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({competition:report.competition_id,hypothesis:report.hypothesis_id,model_hash:report.model_hash,trials_per_condition:report.trials_per_condition,primary_outside:report.primary_outside,conclusion:report.conclusion,metrics:report.metrics},null,2));console.log(`Saved ${out}`);}
module.exports={runCompetition,validateScreeningInputs,METRICS,PRIMARY};
