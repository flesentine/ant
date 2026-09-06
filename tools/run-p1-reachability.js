'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const core=require('../src/sim-core.js');
const integrity=require('../src/integrity.js');
const p1=require('../src/p1.js');
const{loadBundle,readJson}=require('./load-bundle.js');

const MODEL_ID='lasius_niger_painted_trail_p1_v1';
const BASE_MODEL_ID='lasius_niger_locomotion_v1';
const ZERO_EXPERIMENT='open_arena_p1_zero_dose_reachability.json';
const NOMINAL_EXPERIMENT='open_arena_p1_nominal_dose_reachability.json';
const POLICY_PATH='hypotheses/p1_reachability_execution_v1.json';

function clone(v){return JSON.parse(JSON.stringify(v));}
function mean(xs){const v=xs.filter(Number.isFinite);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}
function sha256File(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
function sameNumber(a,b){return Object.is(a,b);}
function assertExactAntIdentity(a,b,label){
  const keys=['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'];
  for(const k of keys)if(!sameNumber(a[k],b[k]))throw new Error(`${label}: ant.${k} drifted (${a[k]} vs ${b[k]})`);
  if(a.rng.state!==b.rng.state)throw new Error(`${label}: biology RNG state drifted`);
  if(a.state!==b.state)throw new Error(`${label}: ant state drifted`);
  if(a.finished!==b.finished)throw new Error(`${label}: finished state drifted`);
}
function assertSpeedBiologyIdentity(a,b,label){
  for(const k of ['speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale'])if(!sameNumber(a[k],b[k]))throw new Error(`${label}: ${k} drifted`);
  if(a.rng.state!==b.rng.state)throw new Error(`${label}: biology RNG state drifted`);
  if(a.state!==b.state)throw new Error(`${label}: pause/move state drifted`);
}
function runFixed(sim,seconds,dt){const n=Math.round(seconds/dt);for(let i=0;i<n;i++)sim.step(dt);return sim;}
function exitEdge(ex,world){
  if(!ex)return'timeout';
  const d={left:Math.abs(ex.x),right:Math.abs(ex.x-world.width),top:Math.abs(ex.y),bottom:Math.abs(ex.y-world.height)};
  return Object.entries(d).sort((a,b)=>a[1]-b[1])[0][0];
}
function validateFrozenInputs(root,policy,model,base,apparatus){
  if(policy.id!=='P1_reference_free_reachability_execution_v1'||policy.status!=='execution_policy_frozen_before_P1_runtime_execution')throw new Error('Unexpected P1 reachability execution policy.');
  if(policy.mechanism_freeze.git_blob_sha!=='90e86bce29bf45c6e390f7046a6c25a74f409c78')throw new Error('P1 mechanism freeze pin drifted.');
  if(policy.reference_firewall.poissonnier2026_pheromone_response_targets_may_be_loaded!==false||policy.reference_firewall.any_reference_outcomes_may_be_loaded!==false||policy.reference_firewall.ymaze_may_be_loaded!==false||policy.reference_firewall.fit_or_parameter_search!==false)throw new Error('P1 reference firewall is not closed.');
  const cfg=p1.paintedTrailResponseConfig(model),field=p1.paintedTrailApparatusConfig(apparatus),eng=policy.frozen_execution.engineering_values;
  if(model.id!==MODEL_ID)throw new Error('Unexpected P1 model id.');
  if(JSON.stringify(model.movement)!==JSON.stringify(base.movement))throw new Error('P1 movement block must exactly match canonical locomotion.');
  if(model.provenance.mechanism_freeze_git_blob_sha!=='90e86bce29bf45c6e390f7046a6c25a74f409c78')throw new Error('P1 model mechanism pin drifted.');
  if(model.provenance.reachability_execution_freeze_git_blob_sha!=='282a95ec6761acd8d94163b25f712f191181f2ff')throw new Error('P1 model execution-policy pin drifted.');
  if(cfg.sigma!==eng.sigma_field_mm||cfg.kappa!==eng.kappa_trail_per_s||cfg.forward!==eng.sensor_forward_offset_mm||cfg.half!==eng.sensor_lateral_half_separation_mm)throw new Error('P1 model does not match frozen engineering values.');
  if(Math.abs(field.nominalDose-0.0048)>1e-15)throw new Error('P1 nominal apparatus dose drifted.');
  if(JSON.stringify(field.a)!==JSON.stringify({x:0,y:105})||JSON.stringify(field.b)!==JSON.stringify({x:297,y:105}))throw new Error('P1 trail geometry drifted.');
  return{cfg,field};
}
function exactIdentityPanel(policy){
  const dt=policy.frozen_execution.physics_dt_s,seconds=policy.frozen_execution.exact_identity_panel.fixed_time_s,rows=[];
  for(const seed of policy.frozen_execution.exact_identity_panel.seeds){
    const baseZero=loadBundle(ZERO_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const p1Zero=loadBundle(ZERO_EXPERIMENT,{modelId:MODEL_ID});
    const a=runFixed(new integrity.Simulation(baseZero,seed),seconds,dt),b=runFixed(new p1.Simulation(p1Zero,seed),seconds,dt);
    assertExactAntIdentity(a.ants[0],b.ants[0],`zero-dose seed ${seed}`);
    if(b.ants[0].p1SteeringSamples!==0)throw new Error(`zero-dose seed ${seed}: sensor/steering evaluation occurred`);

    const baseK0=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const p1K0=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    p1K0.model.painted_trail_response.steering.kappa_trail_per_s=0;
    const c=runFixed(new integrity.Simulation(baseK0,seed),seconds,dt),d=runFixed(new p1.Simulation(p1K0,seed),seconds,dt);
    assertExactAntIdentity(c.ants[0],d.ants[0],`kappa0 seed ${seed}`);
    if(d.ants[0].p1SteeringSamples!==0)throw new Error(`kappa0 seed ${seed}: sensor/steering evaluation occurred`);

    const baseNom=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const p1Nom=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    const e=runFixed(new integrity.Simulation(baseNom,seed),seconds,dt),f=runFixed(new p1.Simulation(p1Nom,seed),seconds,dt);
    assertSpeedBiologyIdentity(e.ants[0],f.ants[0],`nonzero-dose speed biology seed ${seed}`);
    rows.push({seed,zero_dose_identity:true,kappa_zero_identity:true,nonzero_dose_speed_biology_identity:true,nonzero_dose_steering_samples:f.ants[0].p1SteeringSamples});
  }
  return rows;
}
function invariancePanel(model,apparatus){
  const cfg=p1.paintedTrailResponseConfig(model),field=p1.paintedTrailApparatusConfig(apparatus),near=(a,b,t=2e-12)=>{if(Math.abs(a-b)>t)throw new Error(`invariance mismatch ${a} vs ${b}`);};
  const above=p1.trailSteeringRate(100,95,0,cfg,field,1),below=p1.trailSteeringRate(100,115,0,cfg,field,1),on=p1.trailSteeringRate(100,105,0,cfg,field,1);
  if(!(above.omega>0&&below.omega<0))throw new Error('P1 local steering sign check failed.');
  near(above.omega,-below.omega);near(on.omega,0);
  const reversed={a:field.b,b:field.a,nominalDose:field.nominalDose};
  for(const [x,y,h] of [[100,95,.3],[140,110,-1],[20,103,2.1]]){
    const q=p1.trailSteeringRate(x,y,h,cfg,field,1),r=p1.trailSteeringRate(x,y,h,cfg,reversed,1);
    near(q.left,r.left);near(q.right,r.right);near(q.omega,r.omega);
  }
  const shift={x:31.25,y:-17.5},shiftField={a:{x:field.a.x+shift.x,y:field.a.y+shift.y},b:{x:field.b.x+shift.x,y:field.b.y+shift.y},nominalDose:field.nominalDose};
  const q=p1.trailSteeringRate(117,96,.37,cfg,field,1),tr=p1.trailSteeringRate(117+shift.x,96+shift.y,.37,cfg,shiftField,1);
  near(q.left,tr.left);near(q.right,tr.right);near(q.omega,tr.omega);
  const phi=.71,rot=pt=>({x:Math.cos(phi)*pt.x-Math.sin(phi)*pt.y,y:Math.sin(phi)*pt.x+Math.cos(phi)*pt.y}),rf={a:rot(field.a),b:rot(field.b),nominalDose:field.nominalDose},rp=rot({x:117,y:96});
  const rr=p1.trailSteeringRate(rp.x,rp.y,.37+phi,cfg,rf,1);
  near(q.left,rr.left,8e-12);near(q.right,rr.right,8e-12);near(q.omega,rr.omega,8e-12);
  const d0=p1.trailSteeringRate(117,96,.37,cfg,field,0),k0=p1.trailSteeringRate(117,96,.37,Object.assign({},cfg,{kappa:0}),field,1);
  if(d0.omega!==0||k0.omega!==0||Object.is(d0.omega,-0)||Object.is(k0.omega,-0)||!d0.bypass||!k0.bypass)throw new Error('P1 exact +0 bypass failed.');
  return{above_omega_per_s:above.omega,below_omega_per_s:below.omega,on_trail_omega_per_s:on.omega,endpoint_reversal:true,translation:true,rotation:true,zero_dose_plus_zero:true,kappa_zero_plus_zero:true};
}
function runAttractionCondition(experiment,seeds,dt){
  const rows=[];
  for(const seed of seeds){
    const bundle=loadBundle(experiment,{modelId:MODEL_ID}),sim=new p1.Simulation(bundle,seed),summary=sim.runUntilComplete(bundle.experiment.duration_s,dt),obs=summary.observed_metrics.ants[0],ex=obs.exit_coordinate_mm,edge=exitEdge(ex,sim.apparatus.world);
    rows.push({seed,central_zone_fraction:obs.central_zone_fraction,trail_axis_exit:edge==='left'||edge==='right',exit_edge:edge,mean_moving_speed_mm_s:obs.mean_moving_speed_mm_s,time_to_exit_s:obs.time_to_arena_edge_s,steering_samples:sim.ants[0].p1SteeringSamples});
  }
  return rows;
}
function summarizeAttraction(rows){
  return{
    trials:rows.length,
    mean_central_zone_fraction:mean(rows.map(r=>r.central_zone_fraction)),
    trail_axis_exit_rate:mean(rows.map(r=>r.trail_axis_exit?1:0)),
    mean_moving_speed_mm_s:mean(rows.map(r=>r.mean_moving_speed_mm_s)),
    mean_time_to_exit_s:mean(rows.map(r=>r.time_to_exit_s)),
    mean_steering_samples:mean(rows.map(r=>r.steering_samples))
  };
}
function runP1Reachability({root=path.resolve(__dirname,'..')}={}){
  const policy=readJson(path.join(root,POLICY_PATH)),model=readJson(path.join(root,'models',MODEL_ID+'.json')),base=readJson(path.join(root,'models',BASE_MODEL_ID+'.json')),apparatus=readJson(path.join(root,'apparatus','poissonnier2026_open_arena_p1_v1.json'));
  validateFrozenInputs(root,policy,model,base,apparatus);
  const dt=policy.frozen_execution.physics_dt_s,identity=exactIdentityPanel(policy),invariances=invariancePanel(model,apparatus),a=policy.frozen_execution.attraction_panel,seeds=Array.from({length:a.trials_per_condition},(_,i)=>a.first_seed+i);
  if(seeds[seeds.length-1]!==a.last_seed)throw new Error('Frozen attraction seed range is inconsistent.');
  const zeroRows=runAttractionCondition(ZERO_EXPERIMENT,seeds,dt),nominalRows=runAttractionCondition(NOMINAL_EXPERIMENT,seeds,dt),zero=summarizeAttraction(zeroRows),nominal=summarizeAttraction(nominalRows);
  const checks={
    exact_zero_dose_identity:identity.every(r=>r.zero_dose_identity),
    exact_kappa_zero_identity:identity.every(r=>r.kappa_zero_identity),
    nonzero_dose_speed_biology_identity:identity.every(r=>r.nonzero_dose_speed_biology_identity),
    local_steering_sign:invariances.above_omega_per_s>0&&invariances.below_omega_per_s<0,
    on_trail_zero_steering:invariances.on_trail_omega_per_s===0,
    endpoint_reversal_invariant:invariances.endpoint_reversal,
    translation_invariant:invariances.translation,
    rotation_invariant:invariances.rotation,
    pheromone_increases_central_zone_fraction:nominal.mean_central_zone_fraction>zero.mean_central_zone_fraction,
    pheromone_increases_trail_axis_exit_rate:nominal.trail_axis_exit_rate>zero.trail_axis_exit_rate
  };
  checks.overall_pass=Object.values(checks).every(Boolean);
  return{
    schema_version:1,
    id:'P1_reference_free_reachability_result_v1',
    status:checks.overall_pass?'reference_free_reachability_passed':'reference_free_reachability_failed',
    mechanism_id:'P1_egocentric_painted_trail_gradient_steering_v1',
    model_id:MODEL_ID,
    mechanism_freeze_git_blob_sha:'90e86bce29bf45c6e390f7046a6c25a74f409c78',
    reachability_execution_policy_git_blob_sha:'282a95ec6761acd8d94163b25f712f191181f2ff',
    runtime_git_blob_sha:null,
    model_git_blob_sha:null,
    apparatus_git_blob_sha:null,
    fit_performed:false,
    parameter_search_performed:false,
    reference_targets_accessed:false,
    reference_outcomes_accessed:false,
    ymaze_accessed:false,
    selection_performed:false,
    canonical_model_updated:false,
    physics_dt_s:dt,
    identity_panel:{seeds:policy.frozen_execution.exact_identity_panel.seeds,fixed_time_s:policy.frozen_execution.exact_identity_panel.fixed_time_s,all_zero_dose_exact:checks.exact_zero_dose_identity,all_kappa_zero_exact:checks.exact_kappa_zero_identity,all_nonzero_dose_speed_biology_exact:checks.nonzero_dose_speed_biology_identity},
    invariance_panel:invariances,
    attraction_panel:{trials_per_condition:a.trials_per_condition,seed_range:[a.first_seed,a.last_seed],common_random_numbers:true,zero_dose:zero,nominal_dose:nominal,differences:{central_zone_fraction:nominal.mean_central_zone_fraction-zero.mean_central_zone_fraction,trail_axis_exit_rate:nominal.trail_axis_exit_rate-zero.trail_axis_exit_rate,mean_moving_speed_mm_s:nominal.mean_moving_speed_mm_s-zero.mean_moving_speed_mm_s}},
    structural_checks:checks,
    restrictions:[
      'No reference response target or reference outcome file was loaded.',
      'No parameter search, ranking, fitting, or adaptive refinement was performed.',
      'Only the frozen engineering P1 values were executed.',
      'The Y-maze was not loaded.',
      'Canonical locomotion files were not modified.',
      'Reachability is mechanism wiring evidence only, not biological fit evidence.'
    ]
  };
}
if(require.main===module){
  const outArg=process.argv.indexOf('--out'),out=path.resolve(process.cwd(),outArg>=0&&process.argv[outArg+1]?process.argv[outArg+1]:'p1-reachability-results.json'),report=runP1Reachability();
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  console.log(`Saved ${out}`);
  if(!report.structural_checks.overall_pass)process.exitCode=2;
}
module.exports={MODEL_ID,BASE_MODEL_ID,ZERO_EXPERIMENT,NOMINAL_EXPERIMENT,validateFrozenInputs,exactIdentityPanel,invariancePanel,runAttractionCondition,summarizeAttraction,runP1Reachability};
