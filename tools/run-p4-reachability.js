'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const integrity=require('../src/integrity.js');
const p1=require('../src/p1.js');
const p4=require('../src/p4.js');
const {loadBundle,readJson}=require('./load-bundle.js');

const MODEL_ID='lasius_niger_painted_trail_p4_v1';
const BASE_MODEL_ID='lasius_niger_locomotion_v1';
const ZERO_EXPERIMENT='open_arena_p4_zero_dose_reachability.json';
const LOW_EXPERIMENT='open_arena_p4_low_dose_reachability.json';
const NOMINAL_EXPERIMENT='open_arena_p4_nominal_dose_reachability.json';
const POLICY_PATH='hypotheses/p4_reachability_execution_v1.json';

const PINS={
  mechanism:'609551836e540c341365db9cc987d2ca340cc053',
  candidateDecision:'ad7295ba6d466549c60c8ecac37e39d30006ec1c',
  evidence:'262f332062f271bbf111d0572f83b2faaf2cfd74',
  policy:'0d452f9c0d548ec962e0a6d9826648bf5e14a4ef',
  authorization:'42f8d51b06a20c0c6001a42b6021a134f2694e0d',
  runtime:'bf7d5781bd69ec4568450ebbd3bdc284897b6f61',
  model:'3d8460b6916a90d06e70768f696ee3f0d48fccf4',
  zeroExperiment:'a0ce8285448adacd18feebb3e82e76092e102eec',
  lowExperiment:'3d21c82250b7c27a382606fb45b247d4eef20fb7',
  nominalExperiment:'d7605792f6f0eb871d7b3999940e08f750784b64',
  p1Runtime:'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca',
  apparatus:'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4',
  canonicalModel:'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d',
  simCore:'24777aac3577d442893e4779d70aee4e27761fe8',
  integrity:'f23c68a6955832b70eeb3bd3e6893d71a3759018'
};

function gitBlob(root,rel){return execFileSync('git',['hash-object',rel],{cwd:root,encoding:'utf8'}).trim();}
function gitHead(root){return execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}
function mean(xs){const a=xs.filter(Number.isFinite);return a.length?a.reduce((s,x)=>s+x,0)/a.length:null;}
function near(a,b,t=1e-10,label='value'){if(Math.abs(a-b)>t)throw new Error(label+' mismatch '+a+' vs '+b);}
function same(a,b){return Object.is(a,b);}
function runFixed(sim,seconds,dt){for(let i=0;i<Math.round(seconds/dt)&&!sim.allFinished();i++)sim.step(dt);return sim;}
function sha256Text(s){return crypto.createHash('sha256').update(s).digest('hex');}

function assertExactAntIdentity(a,b,label){
  const keys=['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'];
  for(const k of keys)if(!same(a[k],b[k]))throw new Error(label+': ant.'+k+' drifted '+a[k]+' vs '+b[k]);
  if(a.rng.state!==b.rng.state)throw new Error(label+': biology RNG state drifted');
  if(a.state!==b.state||a.finished!==b.finished||a.outcome!==b.outcome||a.completedAt!==b.completedAt)throw new Error(label+': lifecycle state drifted');
  if(a.exitX!==b.exitX||a.exitY!==b.exitY)throw new Error(label+': exit coordinate drifted');
}

function exitEdge(ex,world){
  if(!ex)return'timeout';
  const d={left:Math.abs(ex.x),right:Math.abs(ex.x-world.width),top:Math.abs(ex.y),bottom:Math.abs(ex.y-world.height)};
  return Object.entries(d).sort((a,b)=>a[1]-b[1])[0][0];
}

function validateFrozenInputs(root){
  const policy=readJson(path.join(root,POLICY_PATH));
  const model=readJson(path.join(root,'models',MODEL_ID+'.json'));
  const base=readJson(path.join(root,'models',BASE_MODEL_ID+'.json'));
  if(policy.id!=='P4_reference_free_reachability_execution_v1'||policy.status!=='execution_policy_frozen_before_P4_runtime_implementation_or_execution')throw new Error('Unexpected P4 reachability policy.');
  if(policy.mechanism_freeze.git_blob_sha!==PINS.mechanism)throw new Error('P4 mechanism pin drifted.');
  if(policy.candidate_class_decision.git_blob_sha!==PINS.candidateDecision||policy.independent_evidence.git_blob_sha!==PINS.evidence)throw new Error('P4 evidence/decision lineage drifted.');
  const fw=policy.reference_firewall;
  if(fw.poissonnier2026_pheromone_response_targets_may_be_loaded!==false||fw.any_reference_outcomes_may_be_loaded!==false||fw.P1_official_result_semantics_may_be_loaded!==false||fw.P2_official_result_semantics_may_be_loaded!==false||fw.P3_official_result_semantics_may_be_loaded!==false||fw.fit_or_parameter_search!==false||fw.reserved_ymaze_may_be_loaded!==false)throw new Error('P4 reference firewall is not closed.');
  const pins={
    'hypotheses/p4_painted_trail_mechanism_v1.json':PINS.mechanism,
    'hypotheses/p4_painted_trail_candidate_class_decision_v1.json':PINS.candidateDecision,
    'hypotheses/p4_painted_trail_candidate_class_evidence_v1.json':PINS.evidence,
    'hypotheses/p4_reachability_execution_v1.json':PINS.policy,
    'hypotheses/p4_implementation_authorization_v1.json':PINS.authorization,
    'src/p4.js':PINS.runtime,
    'models/lasius_niger_painted_trail_p4_v1.json':PINS.model,
    'experiments/open_arena_p4_zero_dose_reachability.json':PINS.zeroExperiment,
    'experiments/open_arena_p4_low_dose_reachability.json':PINS.lowExperiment,
    'experiments/open_arena_p4_nominal_dose_reachability.json':PINS.nominalExperiment,
    'src/p1.js':PINS.p1Runtime,
    'apparatus/poissonnier2026_open_arena_p1_v1.json':PINS.apparatus,
    'models/lasius_niger_locomotion_v1.json':PINS.canonicalModel,
    'src/sim-core.js':PINS.simCore,
    'src/integrity.js':PINS.integrity
  };
  for(const[rel,expected]of Object.entries(pins)){
    const actual=gitBlob(root,rel);if(actual!==expected)throw new Error('P4 provenance drift: '+rel+' '+actual+' != '+expected);
  }
  if(JSON.stringify(model.movement)!==JSON.stringify(base.movement))throw new Error('P4 movement block must exactly match canonical locomotion.');
  const cfg=p4.paintedTrailResponseConfig(model),eng=policy.frozen_execution.engineering_values;
  if(cfg.sigma!==eng.sigma_field_mm||cfg.kappa!==eng.kappa_trail_per_s||cfg.theta!==eng.theta_detect||cfg.radius!==eng.sector_radius_mm||cfg.radialBins!==eng.radial_bins||cfg.angularBins!==eng.angular_bins_per_sector||cfg.samplesPerSector!==eng.samples_per_sector)throw new Error('P4 model does not match frozen engineering values.');
  return{policy,model,base,cfg,pins};
}

function exactIdentityPanel(root,policy){
  const dt=policy.frozen_execution.physics_dt_s,seconds=policy.frozen_execution.exact_identity_panel.fixed_time_s,rows=[];
  for(const seed of policy.frozen_execution.exact_identity_panel.seeds){
    const bz=loadBundle(ZERO_EXPERIMENT,{modelId:BASE_MODEL_ID}),pz=loadBundle(ZERO_EXPERIMENT,{modelId:MODEL_ID});
    const a=runFixed(new integrity.Simulation(bz,seed),seconds,dt),b=runFixed(new p4.Simulation(pz,seed),seconds,dt);
    assertExactAntIdentity(a.ants[0],b.ants[0],'zero dose seed '+seed);
    if(b.ants[0].p4EvaluationSamples!==0)throw new Error('zero dose should bypass P4 evaluation '+seed);

    const bk=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID}),pk=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    pk.model.painted_trail_response.steering.kappa_trail_per_s=0;
    const c=runFixed(new integrity.Simulation(bk,seed),seconds,dt),d=runFixed(new p4.Simulation(pk,seed),seconds,dt);
    assertExactAntIdentity(c.ants[0],d.ants[0],'zero kappa seed '+seed);
    if(d.ants[0].p4EvaluationSamples!==0)throw new Error('zero kappa should bypass P4 evaluation '+seed);

    const bl=loadBundle(LOW_EXPERIMENT,{modelId:BASE_MODEL_ID}),pl=loadBundle(LOW_EXPERIMENT,{modelId:MODEL_ID});
    const e=runFixed(new integrity.Simulation(bl,seed),seconds,dt),f=runFixed(new p4.Simulation(pl,seed),seconds,dt);
    assertExactAntIdentity(e.ants[0],f.ants[0],'global subthreshold seed '+seed);
    if(f.ants[0].p4DetectedSamples!==0)throw new Error('0.10 dose ratio crossed detection threshold '+seed);
    if(f.ants[0].p4EvaluationSamples!==f.ants[0].p4SubthresholdSamples)throw new Error('low-dose gate accounting drift '+seed);
    if(f.ants[0].p4LastSignalSum!==null&&!(f.ants[0].p4LastSignalSum<policy.frozen_execution.engineering_values.theta_detect))throw new Error('low-dose last signal sum not subthreshold '+seed);
    rows.push({seed,zero_dose_canonical_identity:true,zero_kappa_canonical_identity:true,global_subthreshold_canonical_identity:true,low_dose_evaluations:f.ants[0].p4EvaluationSamples});
  }
  return rows;
}

function invariancePanel(model){
  const cfg=p4.paintedTrailResponseConfig(model);
  const apparatus=readJson(path.resolve(__dirname,'..','apparatus','poissonnier2026_open_arena_p1_v1.json'));
  const field=p1.paintedTrailApparatusConfig(apparatus),theta=cfg.theta;

  const eq=p4.gatedRelativeSignal(.10,.15,theta);
  if(eq.detected||eq.signal!==0||eq.sum!==.25)throw new Error('threshold equality must be off');
  const above=p4.gatedRelativeSignal(.10,.16,theta);
  if(!above.detected||!(above.signal>0))throw new Error('just-above-threshold right turn failed');
  const equal=p4.gatedRelativeSignal(.40,.40,theta);
  if(!equal.detected||equal.signal!==0)throw new Error('above-threshold equal signal failed');
  const lr=p4.gatedRelativeSignal(.10,.40,theta),rl=p4.gatedRelativeSignal(.40,.10,theta);
  if(!lr.detected||!rl.detected)throw new Error('antisymmetry pair must be detected');
  near(lr.signal,-rl.signal,1e-15,'left-right antisymmetry');
  const q1=p4.gatedRelativeSignal(.20,.60,theta),q2=p4.gatedRelativeSignal(.40,1.20,theta);
  if(!q1.detected||!q2.detected)throw new Error('conditional scale pair must remain above threshold');
  near(q1.signal,q2.signal,1e-15,'conditional scale invariance');
  const off=p4.gatedRelativeSignal(.02,.08,theta),on=p4.gatedRelativeSignal(.08,.32,theta);
  if(off.detected||off.signal!==0||!on.detected||on.signal===0)throw new Error('scale-crossing detection boundary failed');

  const centered=p4.trailSteeringRate(100,105,0,cfg,field,1);
  if(Math.abs(centered.left-centered.right)>1e-10||Math.abs(centered.omega)>1e-10)throw new Error('centered parallel symmetry failed');

  const sideA=p4.trailSteeringRate(100,95,0,cfg,field,1),sideB=p4.trailSteeringRate(100,115,0,cfg,field,1);
  if(!sideA.detected||!sideB.detected||!(sideA.omega>0&&sideB.omega<0))throw new Error('above-threshold local steering sign failed');
  near(sideA.left,sideB.right,1e-10,'reflection left/right');near(sideA.right,sideB.left,1e-10,'reflection right/left');near(sideA.omega,-sideB.omega,1e-10,'reflection omega');

  const reversed={a:field.b,b:field.a,nominalDose:field.nominalDose};
  for(const[x,y,h]of[[100,95,.3],[140,110,-1],[20,103,2.1]]){
    const q=p4.trailSteeringRate(x,y,h,cfg,field,1),r=p4.trailSteeringRate(x,y,h,cfg,reversed,1);
    near(q.left,r.left);near(q.right,r.right);near(q.sum,r.sum);near(q.omega,r.omega);if(q.detected!==r.detected)throw new Error('endpoint reversal detection drift');
  }

  const shift={x:31.25,y:-17.5},sf={a:{x:field.a.x+shift.x,y:field.a.y+shift.y},b:{x:field.b.x+shift.x,y:field.b.y+shift.y},nominalDose:field.nominalDose};
  const q=p4.trailSteeringRate(117,96,.37,cfg,field,1),tr=p4.trailSteeringRate(117+shift.x,96+shift.y,.37,cfg,sf,1);
  near(q.left,tr.left);near(q.right,tr.right);near(q.sum,tr.sum);near(q.omega,tr.omega);if(q.detected!==tr.detected)throw new Error('translation detection drift');

  const phi=.71,rot=pt=>({x:Math.cos(phi)*pt.x-Math.sin(phi)*pt.y,y:Math.sin(phi)*pt.x+Math.cos(phi)*pt.y});
  const rf={a:rot(field.a),b:rot(field.b),nominalDose:field.nominalDose},rp=rot({x:117,y:96});
  const rr=p4.trailSteeringRate(rp.x,rp.y,.37+phi,cfg,rf,1);
  near(q.left,rr.left);near(q.right,rr.right);near(q.sum,rr.sum);near(q.omega,rr.omega);if(q.detected!==rr.detected)throw new Error('rotation detection drift');

  const pts=p4.sectorSamplePoints(0,0,0,cfg);
  if(pts.left.length!==32||pts.right.length!==32)throw new Error('sector sample count drift');
  for(let i=0;i<32;i++){near(pts.left[i].x,pts.right[i].x,1e-15);near(pts.left[i].y,-pts.right[i].y,1e-15);}

  return{threshold_boundary_off:true,just_above_threshold_right_turn:true,above_threshold_equal_signal_zero:true,above_threshold_left_right_antisymmetry:true,conditional_above_threshold_positive_scale_invariance:true,scale_crossing_detection_boundary:true,endpoint_reversal:true,translation:true,rotation:true,left_right_reflection:true,centered_parallel_trail_zero_steering:true,sector_geometry_4x8:true};
}

function nominalPanel(policy){
  const p=policy.frozen_execution.nominal_reachability_panel,dt=policy.frozen_execution.physics_dt_s;
  const rows=[];let anyDetected=false,anySubthreshold=false,allFinite=true,biologyConstructionIdentity=true;
  for(let seed=p.first_seed;seed<=p.last_seed;seed++){
    const pb=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID}),bb=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const sim=new p4.Simulation(pb,seed),base=new integrity.Simulation(bb,seed);
    if(sim.ants[0].rng.state!==base.ants[0].rng.state)biologyConstructionIdentity=false;
    const s=sim.runUntilComplete(pb.experiment.duration_s,dt),ant=sim.ants[0],obs=s.observed_metrics.ants[0],ex=obs.exit_coordinate_mm,edge=exitEdge(ex,sim.apparatus.world);
    anyDetected=anyDetected||ant.p4DetectedSamples>0;anySubthreshold=anySubthreshold||ant.p4SubthresholdSamples>0;
    const vals=[ant.x,ant.y,ant.heading,ant.p4LastOmega,ant.p4LastSignalSum,ant.p4LastRelativeSignal,obs.central_zone_fraction,obs.mean_moving_speed_mm_s,obs.time_to_arena_edge_s];
    if(vals.some(v=>v!==null&&!Number.isFinite(v)))allFinite=false;
    rows.push({seed,evaluation_samples:ant.p4EvaluationSamples,detected_samples:ant.p4DetectedSamples,subthreshold_samples:ant.p4SubthresholdSamples,nonzero_steering_samples:ant.p4NonzeroSteeringSamples,last_signal_sum:ant.p4LastSignalSum,last_relative_signal:ant.p4LastRelativeSignal,central_zone_fraction:obs.central_zone_fraction,trail_axis_exit:edge==='left'||edge==='right',mean_moving_speed_mm_s:obs.mean_moving_speed_mm_s,time_to_exit_s:obs.time_to_arena_edge_s});
  }
  if(rows.length!==p.trials||rows[0].seed!==p.first_seed||rows[rows.length-1].seed!==p.last_seed)throw new Error('P4 nominal seed panel drifted');
  return{trials:rows.length,all_trials_finite:allFinite,any_trial_with_detected_response:anyDetected,any_trial_with_subthreshold_evaluation:anySubthreshold,biology_rng_identical_at_construction:biologyConstructionIdentity,mean_central_zone_fraction:mean(rows.map(r=>r.central_zone_fraction)),trail_axis_exit_rate:mean(rows.map(r=>r.trail_axis_exit?1:0)),mean_moving_speed_mm_s:mean(rows.map(r=>r.mean_moving_speed_mm_s)),mean_time_to_exit_s:mean(rows.map(r=>r.time_to_exit_s)),mean_evaluation_samples:mean(rows.map(r=>r.evaluation_samples)),mean_detected_samples:mean(rows.map(r=>r.detected_samples)),mean_subthreshold_samples:mean(rows.map(r=>r.subthreshold_samples)),mean_nonzero_steering_samples:mean(rows.map(r=>r.nonzero_steering_samples)),rows};
}

function runP4Reachability({root=path.resolve(__dirname,'..')}={}){
  const {policy,model}=validateFrozenInputs(root),identity=exactIdentityPanel(root,policy),inv=invariancePanel(model),nom=nominalPanel(policy);
  const checks={
    exact_zero_dose_canonical_identity:identity.every(r=>r.zero_dose_canonical_identity),
    exact_zero_kappa_canonical_identity:identity.every(r=>r.zero_kappa_canonical_identity),
    exact_global_subthreshold_canonical_identity:identity.every(r=>r.global_subthreshold_canonical_identity),
    zero_response_rng_and_biology_rng_construction_identity:nom.biology_rng_identical_at_construction,
    threshold_boundary_off:inv.threshold_boundary_off,
    just_above_threshold_right_turn:inv.just_above_threshold_right_turn,
    above_threshold_equal_signal_zero:inv.above_threshold_equal_signal_zero,
    above_threshold_left_right_antisymmetry:inv.above_threshold_left_right_antisymmetry,
    conditional_above_threshold_positive_scale_invariance:inv.conditional_above_threshold_positive_scale_invariance,
    scale_crossing_detection_boundary:inv.scale_crossing_detection_boundary,
    endpoint_reversal_invariant:inv.endpoint_reversal,
    translation_invariant:inv.translation,
    rotation_invariant:inv.rotation,
    left_right_reflection:inv.left_right_reflection,
    centered_parallel_trail_zero_steering:inv.centered_parallel_trail_zero_steering,
    sector_geometry_4x8:inv.sector_geometry_4x8,
    nominal_panel_all_finite:nom.all_trials_finite,
    nominal_panel_reaches_detected_response:nom.any_trial_with_detected_response,
    nominal_panel_reaches_subthreshold_state:nom.any_trial_with_subthreshold_evaluation
  };
  const passed=Object.values(checks).every(Boolean);
  const report={schema_version:1,id:'P4_reference_free_reachability_report_v1',status:passed?'reference_free_reachability_passed':'reference_free_reachability_failed',generated_from_git_head:gitHead(root),scientific_claim:'implementation_and_reference_free_reachability_only_not_biological_fit',frozen_provenance:{mechanism_git_blob_sha:PINS.mechanism,reachability_policy_git_blob_sha:PINS.policy,implementation_authorization_git_blob_sha:PINS.authorization,runtime_git_blob_sha:PINS.runtime,model_git_blob_sha:PINS.model,zero_experiment_git_blob_sha:PINS.zeroExperiment,low_dose_experiment_git_blob_sha:PINS.lowExperiment,nominal_experiment_git_blob_sha:PINS.nominalExperiment},engineering_values:policy.frozen_execution.engineering_values,identity_panel:identity,invariance_panel:inv,nominal_panel:Object.assign({},nom,{rows:undefined}),checks,reference_firewall:policy.reference_firewall,downstream_authorization:{biological_fit_claim:false,response_estimation_policy:false,parameter_promotion:false,canonical_update:false,reserved_ymaze_unlock:false}};
  report.report_content_sha256=sha256Text(JSON.stringify(report));
  if(!passed)throw new Error('P4 reference-free reachability failed: '+JSON.stringify(checks));
  return report;
}

if(require.main===module){
  const args=process.argv.slice(2);let out=null;
  for(let i=0;i<args.length;i++){if(args[i]==='--out')out=args[++i];else throw new Error('Unknown argument '+args[i]);}
  const report=runP4Reachability();
  const text=JSON.stringify(report,null,2)+'\n';
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,text);}
  process.stdout.write(text);
}

module.exports={PINS,validateFrozenInputs,exactIdentityPanel,invariancePanel,nominalPanel,runP4Reachability};
