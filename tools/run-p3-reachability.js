'use strict';
const fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const integrity=require('../src/integrity.js');
const p1=require('../src/p1.js');
const p3=require('../src/p3.js');
const {loadBundle,readJson}=require('./load-bundle.js');

const MODEL_ID='lasius_niger_painted_trail_p3_v1';
const BASE_MODEL_ID='lasius_niger_locomotion_v1';
const ZERO_EXPERIMENT='open_arena_p3_zero_dose_reachability.json';
const NOMINAL_EXPERIMENT='open_arena_p3_nominal_dose_reachability.json';
const POLICY_PATH='hypotheses/p3_reachability_execution_v1.json';

const PINS={
  mechanism:'5d00ce0058ff388c9f57d7dce56ce465d82c5765',
  candidateDecision:'e8da07f6f73934e0120fd41d4668ae4039108336',
  policy:'55494a3190964d24ded2ae0d1faf3b355cc7835f',
  authorization:'128afcbdb10d3254240c5074e1e997cee7d7fe51',
  runtime:'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8',
  model:'9107de0c71641c4037bbedbb498b9fa868c1ef00',
  zeroExperiment:'f2a97691e604bbb086216221da1c776cc74e9dbb',
  nominalExperiment:'e3c3d7c4c58c885b99654e8797b8570ef91f7cde',
  p1Runtime:'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca',
  apparatus:'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4',
  canonicalModel:'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d',
  simCore:'24777aac3577d442893e4779d70aee4e27761fe8',
  integrity:'f23c68a6955832b70eeb3bd3e6893d71a3759018'
};

function clone(v){return JSON.parse(JSON.stringify(v));}
function gitBlob(root,rel){return execFileSync('git',['hash-object',rel],{cwd:root,encoding:'utf8'}).trim();}
function gitHead(root){return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}
function same(a,b){return Object.is(a,b);}
function mean(xs){const a=xs.filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;}
function near(a,b,t=1e-10){if(Math.abs(a-b)>t)throw new Error('invariance mismatch '+a+' vs '+b);}

function assertExactAntIdentity(a,b,label){
  const keys=['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'];
  for(const k of keys)if(!same(a[k],b[k]))throw new Error(label+': ant.'+k+' drifted');
  if(a.rng.state!==b.rng.state)throw new Error(label+': biology RNG state drifted');
  if(a.state!==b.state||a.finished!==b.finished||a.outcome!==b.outcome||a.completedAt!==b.completedAt)throw new Error(label+': lifecycle state drifted');
  if(a.exitX!==b.exitX||a.exitY!==b.exitY)throw new Error(label+': exit coordinate drifted');
}
function runFixed(sim,seconds,dt){for(let i=0;i<Math.round(seconds/dt)&&!sim.allFinished();i++)sim.step(dt);return sim;}
function exitEdge(ex,world){
  if(!ex)return'timeout';
  const d={left:Math.abs(ex.x),right:Math.abs(ex.x-world.width),top:Math.abs(ex.y),bottom:Math.abs(ex.y-world.height)};
  return Object.entries(d).sort((a,b)=>a[1]-b[1])[0][0];
}

function validateFrozenInputs(root){
  const policy=readJson(path.join(root,POLICY_PATH));
  const model=readJson(path.join(root,'models',MODEL_ID+'.json'));
  const base=readJson(path.join(root,'models',BASE_MODEL_ID+'.json'));
  if(policy.id!=='P3_reference_free_reachability_execution_v1'||policy.status!=='execution_policy_frozen_before_P3_runtime_implementation_or_execution')throw new Error('Unexpected P3 reachability policy.');
  if(policy.mechanism_freeze.git_blob_sha!==PINS.mechanism)throw new Error('P3 mechanism pin drifted.');
  if(policy.reference_firewall.poissonnier2026_pheromone_response_targets_may_be_loaded!==false||
     policy.reference_firewall.any_reference_outcomes_may_be_loaded!==false||
     policy.reference_firewall.fit_or_parameter_search!==false||
     policy.reference_firewall.ymaze_may_be_loaded!==false)throw new Error('P3 reference firewall is not closed.');
  const pins={
    'hypotheses/p3_painted_trail_mechanism_v1.json':PINS.mechanism,
    'hypotheses/p3_painted_trail_candidate_class_decision_v1.json':PINS.candidateDecision,
    'hypotheses/p3_reachability_execution_v1.json':PINS.policy,
    'hypotheses/p3_implementation_authorization_v1.json':PINS.authorization,
    'src/p3.js':PINS.runtime,
    'models/lasius_niger_painted_trail_p3_v1.json':PINS.model,
    'experiments/open_arena_p3_zero_dose_reachability.json':PINS.zeroExperiment,
    'experiments/open_arena_p3_nominal_dose_reachability.json':PINS.nominalExperiment,
    'src/p1.js':PINS.p1Runtime,
    'apparatus/poissonnier2026_open_arena_p1_v1.json':PINS.apparatus,
    'models/lasius_niger_locomotion_v1.json':PINS.canonicalModel,
    'src/sim-core.js':PINS.simCore,
    'src/integrity.js':PINS.integrity
  };
  for(const[rel,expected]of Object.entries(pins)){
    const actual=gitBlob(root,rel);if(actual!==expected)throw new Error('P3 provenance drift: '+rel+' '+actual+' != '+expected);
  }
  if(JSON.stringify(model.movement)!==JSON.stringify(base.movement))throw new Error('P3 movement block must exactly match canonical locomotion.');
  const cfg=p3.paintedTrailResponseConfig(model),eng=policy.frozen_execution.engineering_values;
  if(cfg.sigma!==eng.sigma_field_mm||cfg.kappa!==eng.kappa_trail_per_s||cfg.radius!==eng.sector_radius_mm||
     cfg.radialBins!==eng.radial_bins||cfg.angularBins!==eng.angular_bins_per_sector||cfg.samplesPerSector!==eng.samples_per_sector)throw new Error('P3 model does not match frozen engineering values.');
  return{policy,model,base,cfg};
}

function exactIdentityPanel(root,policy){
  const dt=policy.frozen_execution.physics_dt_s,seconds=policy.frozen_execution.exact_identity_panel.fixed_time_s,rows=[];
  for(const seed of policy.frozen_execution.exact_identity_panel.seeds){
    const bz=loadBundle(ZERO_EXPERIMENT,{modelId:BASE_MODEL_ID}),pz=loadBundle(ZERO_EXPERIMENT,{modelId:MODEL_ID});
    const a=runFixed(new integrity.Simulation(bz,seed),seconds,dt),b=runFixed(new p3.Simulation(pz,seed),seconds,dt);
    assertExactAntIdentity(a.ants[0],b.ants[0],'zero dose seed '+seed);
    if(b.ants[0].p3SteeringSamples!==0)throw new Error('zero dose steering evaluation '+seed);

    const bk=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID}),pk=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    pk.model.painted_trail_response.steering.kappa_trail_per_s=0;
    const c=runFixed(new integrity.Simulation(bk,seed),seconds,dt),d=runFixed(new p3.Simulation(pk,seed),seconds,dt);
    assertExactAntIdentity(c.ants[0],d.ants[0],'zero kappa seed '+seed);
    if(d.ants[0].p3SteeringSamples!==0)throw new Error('zero kappa steering evaluation '+seed);
    rows.push({seed,zero_dose_canonical_identity:true,zero_kappa_canonical_identity:true});
  }
  return rows;
}

function invariancePanel(model){
  const cfg=p3.paintedTrailResponseConfig(model);
  const apparatus=readJson(path.resolve(__dirname,'..','apparatus','poissonnier2026_open_arena_p1_v1.json'));
  const field=p1.paintedTrailApparatusConfig(apparatus);

  const zero=p3.relativeSignal(0,0),equal=p3.relativeSignal(2,2),baseW=p3.relativeSignal(2,6);
  if(zero!==0||equal!==0)throw new Error('zero/equal Weber signal failed');
  near(baseW,p3.relativeSignal(20,60));near(baseW,-p3.relativeSignal(6,2));

  const on=p3.trailSteeringRate(100,105,0,cfg,field,1);
  if(Math.abs(on.left-on.right)>1e-10||Math.abs(on.omega)>1e-10)throw new Error('centered parallel symmetry failed');

  const above=p3.trailSteeringRate(100,95,0,cfg,field,1),below=p3.trailSteeringRate(100,115,0,cfg,field,1);
  if(!(above.omega>0&&below.omega<0))throw new Error('local steering sign failed');
  near(above.left,below.right);near(above.right,below.left);near(above.omega,-below.omega);

  const q25=p3.trailSteeringRate(117,96,.37,cfg,field,.25),q1=p3.trailSteeringRate(117,96,.37,cfg,field,1),q4=p3.trailSteeringRate(117,96,.37,cfg,field,4);
  near(q25.signal,q1.signal,1e-12);near(q1.signal,q4.signal,1e-12);

  const reversed={a:field.b,b:field.a,nominalDose:field.nominalDose};
  for(const[x,y,h]of[[100,95,.3],[140,110,-1],[20,103,2.1]]){
    const q=p3.trailSteeringRate(x,y,h,cfg,field,1),r=p3.trailSteeringRate(x,y,h,cfg,reversed,1);
    near(q.left,r.left);near(q.right,r.right);near(q.omega,r.omega);
  }

  const shift={x:31.25,y:-17.5},sf={a:{x:field.a.x+shift.x,y:field.a.y+shift.y},b:{x:field.b.x+shift.x,y:field.b.y+shift.y},nominalDose:field.nominalDose};
  const q=p3.trailSteeringRate(117,96,.37,cfg,field,1),tr=p3.trailSteeringRate(117+shift.x,96+shift.y,.37,cfg,sf,1);
  near(q.left,tr.left);near(q.right,tr.right);near(q.omega,tr.omega);

  const phi=.71,rot=pt=>({x:Math.cos(phi)*pt.x-Math.sin(phi)*pt.y,y:Math.sin(phi)*pt.x+Math.cos(phi)*pt.y});
  const rf={a:rot(field.a),b:rot(field.b),nominalDose:field.nominalDose},rp=rot({x:117,y:96});
  const rr=p3.trailSteeringRate(rp.x,rp.y,.37+phi,cfg,rf,1);
  near(q.left,rr.left);near(q.right,rr.right);near(q.omega,rr.omega);

  const pts=p3.sectorSamplePoints(0,0,0,cfg);
  if(pts.left.length!==32||pts.right.length!==32)throw new Error('sector sample count drift');
  for(let i=0;i<32;i++){near(pts.left[i].x,pts.right[i].x,1e-15);near(pts.left[i].y,-pts.right[i].y,1e-15);}

  return{
    zero_equal_signal:true,positive_scale_invariance:true,left_right_antisymmetry:true,
    endpoint_reversal:true,translation:true,rotation:true,left_right_reflection:true,
    centered_parallel_trail_zero_steering:true,sector_geometry_4x8:true
  };
}

function nominalPanel(policy){
  const p=policy.frozen_execution.nominal_reachability_panel,dt=policy.frozen_execution.physics_dt_s;
  const rows=[];let anySteering=false,allFinite=true,biologyConstructionIdentity=true;
  for(let seed=p.first_seed;seed<=p.last_seed;seed++){
    const pb=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID}),bb=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const sim=new p3.Simulation(pb,seed),base=new integrity.Simulation(bb,seed);
    if(sim.ants[0].rng.state!==base.ants[0].rng.state)biologyConstructionIdentity=false;
    const s=sim.runUntilComplete(pb.experiment.duration_s,dt),ant=sim.ants[0],obs=s.observed_metrics.ants[0],ex=obs.exit_coordinate_mm,edge=exitEdge(ex,sim.apparatus.world);
    anySteering=anySteering||ant.p3SteeringSamples>0;
    const vals=[ant.x,ant.y,ant.heading,ant.p3LastOmega,ant.p3LastRelativeSignal,obs.central_zone_fraction,obs.mean_moving_speed_mm_s,obs.time_to_arena_edge_s];
    if(vals.some(v=>v!==null&&!Number.isFinite(v)))allFinite=false;
    rows.push({seed,steering_samples:ant.p3SteeringSamples,last_relative_signal:ant.p3LastRelativeSignal,
      central_zone_fraction:obs.central_zone_fraction,trail_axis_exit:edge==='left'||edge==='right',
      mean_moving_speed_mm_s:obs.mean_moving_speed_mm_s,time_to_exit_s:obs.time_to_arena_edge_s});
  }
  if(rows.length!==p.trials||rows[0].seed!==p.first_seed||rows[rows.length-1].seed!==p.last_seed)throw new Error('P3 nominal seed panel drifted');
  return{
    trials:rows.length,all_trials_finite:allFinite,any_trial_with_steering:anySteering,
    biology_rng_identical_at_construction:biologyConstructionIdentity,
    mean_central_zone_fraction:mean(rows.map(r=>r.central_zone_fraction)),
    trail_axis_exit_rate:mean(rows.map(r=>r.trail_axis_exit?1:0)),
    mean_moving_speed_mm_s:mean(rows.map(r=>r.mean_moving_speed_mm_s)),
    mean_time_to_exit_s:mean(rows.map(r=>r.time_to_exit_s)),
    mean_steering_samples:mean(rows.map(r=>r.steering_samples)),
    mean_last_relative_signal:mean(rows.map(r=>r.last_relative_signal))
  };
}

function runP3Reachability({root=path.resolve(__dirname,'..')}={}){
  const {policy,model}=validateFrozenInputs(root),identity=exactIdentityPanel(root,policy),inv=invariancePanel(model),nom=nominalPanel(policy);
  const checks={
    exact_zero_dose_canonical_identity:identity.every(r=>r.zero_dose_canonical_identity),
    exact_zero_kappa_canonical_identity:identity.every(r=>r.zero_kappa_canonical_identity),
    zero_response_rng_and_biology_rng_construction_identity:nom.biology_rng_identical_at_construction,
    sector_geometry_4x8:inv.sector_geometry_4x8,
    zero_equal_signal:inv.zero_equal_signal,
    positive_scale_invariance:inv.positive_scale_invariance,
    left_right_antisymmetry:inv.left_right_antisymmetry,
    endpoint_reversal_invariant:inv.endpoint_reversal,
    translation_invariant:inv.translation,
    rotation_invariant:inv.rotation,
    left_right_reflection:inv.left_right_reflection,
    centered_parallel_trail_zero_steering:inv.centered_parallel_trail_zero_steering,
    nominal_panel_all_finite:nom.all_trials_finite,
    nominal_panel_reaches_steering:nom.any_trial_with_steering
  };
  checks.overall_pass=Object.values(checks).every(Boolean);
  return{
    schema_version:1,id:'P3_reference_free_reachability_result_v1',
    status:checks.overall_pass?'reference_free_reachability_passed':'reference_free_reachability_failed',
    mechanism_id:'P3_local_sector_weber_steering_v1',model_id:MODEL_ID,
    mechanism_freeze_git_blob_sha:PINS.mechanism,candidate_class_decision_git_blob_sha:PINS.candidateDecision,
    reachability_execution_policy_git_blob_sha:PINS.policy,implementation_authorization_git_blob_sha:PINS.authorization,
    runtime_git_blob_sha:gitBlob(root,'src/p3.js'),model_git_blob_sha:gitBlob(root,'models/'+MODEL_ID+'.json'),
    zero_experiment_git_blob_sha:gitBlob(root,'experiments/'+ZERO_EXPERIMENT),nominal_experiment_git_blob_sha:gitBlob(root,'experiments/'+NOMINAL_EXPERIMENT),
    p1_helper_runtime_git_blob_sha:PINS.p1Runtime,canonical_model_git_blob_sha:PINS.canonicalModel,execution_repo_commit:gitHead(root),
    fit_performed:false,parameter_search_performed:false,candidate_ranking_performed:false,
    reference_targets_accessed:false,reference_outcomes_accessed:false,p1_official_result_semantics_loaded:false,p2_official_result_semantics_loaded:false,
    ymaze_accessed:false,canonical_model_updated:false,p2_lapse_implemented:false,response_rng_present:false,
    physics_dt_s:policy.frozen_execution.physics_dt_s,engineering_values:clone(policy.frozen_execution.engineering_values),
    identity_panel:{seeds:policy.frozen_execution.exact_identity_panel.seeds,fixed_time_s:policy.frozen_execution.exact_identity_panel.fixed_time_s,rows:identity},
    invariance_panel:inv,nominal_reachability_panel:nom,structural_checks:checks,
    interpretation:'Reference-free P3 implementation/reachability qualification only. Behavioral summaries are descriptive consequences of pre-frozen engineering values and seeds; they are not fitted evidence.',
    restrictions:[
      'No response target or reference outcome file was loaded.',
      'No P1 or P2 official result semantics were used for tuning.',
      'No parameter search, ranking, fitting, or adaptive refinement was performed.',
      'No P2 lapse state or response RNG was implemented.',
      'The Y-maze was not loaded.',
      'Canonical locomotion files were not modified.',
      'Reachability may not retune sigma, kappa, sector geometry, seeds, dt, or trial count.'
    ]
  };
}

if(require.main===module){
  const i=process.argv.indexOf('--out'),out=path.resolve(process.cwd(),i>=0&&process.argv[i+1]?process.argv[i+1]:'p3-reachability-results.json');
  const report=runP3Reachability();fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log('Saved '+out);
  if(!report.structural_checks.overall_pass)process.exitCode=2;
}
module.exports={MODEL_ID,BASE_MODEL_ID,ZERO_EXPERIMENT,NOMINAL_EXPERIMENT,PINS,validateFrozenInputs,exactIdentityPanel,invariancePanel,nominalPanel,runP3Reachability};
