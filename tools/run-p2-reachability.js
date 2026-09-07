'use strict';
const fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const core=require('../src/sim-core.js');
const integrity=require('../src/integrity.js');
const p1=require('../src/p1.js');
const p2=require('../src/p2.js');
const {loadBundle,readJson}=require('./load-bundle.js');

const MODEL_ID='lasius_niger_painted_trail_p2_v1';
const P1_MODEL_ID='lasius_niger_painted_trail_p1_v1';
const BASE_MODEL_ID='lasius_niger_locomotion_v1';
const ZERO_EXPERIMENT='open_arena_p2_zero_dose_reachability.json';
const NOMINAL_EXPERIMENT='open_arena_p2_nominal_dose_reachability.json';
const POLICY_PATH='hypotheses/p2_reachability_execution_v1.json';

const PINS={
  mechanism:'70f51e5cab5db0024947ed71cf760590089f8aea',
  policy:'8431ada87724953128104077f4ce1c11b569b1cf',
  authorization:'462997ea7399d98efca5a6b19a0e38160fbddbaf',
  runtime:'f91a2f7ede1b8119acc1fd57ac94a9718d074e15',
  model:'7d3eecc44cb2eaf727249083a6fcfa21986fd475',
  zeroExperiment:'322b27e3bd92ed7ba7b6f2056b6d7f9dd34a4333',
  nominalExperiment:'cacfd5514232cd240cd86de126b03f45fb81b8ba',
  p1Runtime:'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca',
  p1Model:'73873fd6763838423ca27648136bb0b9ff062817',
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

function assertExactAntIdentity(a,b,label){
  const keys=['x','y','heading','speedFactor','pauseRemaining','baseSpeed','turnScale','pauseScale','distanceTravelled','movingTime'];
  for(const k of keys)if(!same(a[k],b[k]))throw new Error(`${label}: ant.${k} drifted (${a[k]} vs ${b[k]})`);
  if(a.rng.state!==b.rng.state)throw new Error(`${label}: biology RNG state drifted`);
  if(a.state!==b.state||a.finished!==b.finished||a.outcome!==b.outcome||a.completedAt!==b.completedAt)throw new Error(`${label}: lifecycle state drifted`);
  if(a.exitX!==b.exitX||a.exitY!==b.exitY)throw new Error(`${label}: exit coordinate drifted`);
}
function runFixed(sim,seconds,dt){const n=Math.round(seconds/dt);for(let i=0;i<n&&!sim.allFinished();i++)sim.step(dt);return sim;}
function exitEdge(ex,world){
  if(!ex)return'timeout';
  const d={left:Math.abs(ex.x),right:Math.abs(ex.x-world.width),top:Math.abs(ex.y),bottom:Math.abs(ex.y-world.height)};
  return Object.entries(d).sort((a,b)=>a[1]-b[1])[0][0];
}

function validateFrozenInputs(root){
  const policy=readJson(path.join(root,POLICY_PATH));
  const model=readJson(path.join(root,'models',MODEL_ID+'.json'));
  const p1Model=readJson(path.join(root,'models',P1_MODEL_ID+'.json'));
  const base=readJson(path.join(root,'models',BASE_MODEL_ID+'.json'));
  if(policy.id!=='P2_reference_free_reachability_execution_v1'||policy.status!=='execution_policy_frozen_before_P2_runtime_implementation_or_execution')throw new Error('Unexpected P2 reachability policy.');
  if(policy.mechanism_freeze.git_blob_sha!==PINS.mechanism)throw new Error('P2 mechanism pin drifted.');
  if(policy.reference_firewall.poissonnier2026_pheromone_response_targets_may_be_loaded!==false||
     policy.reference_firewall.any_reference_outcomes_may_be_loaded!==false||
     policy.reference_firewall.fit_or_parameter_search!==false||
     policy.reference_firewall.ymaze_may_be_loaded!==false)throw new Error('P2 reference firewall is not closed.');
  const filePins={
    'hypotheses/p2_painted_trail_mechanism_v1.json':PINS.mechanism,
    'hypotheses/p2_reachability_execution_v1.json':PINS.policy,
    'hypotheses/p2_implementation_authorization_v1.json':PINS.authorization,
    'src/p2.js':PINS.runtime,
    'models/lasius_niger_painted_trail_p2_v1.json':PINS.model,
    'experiments/open_arena_p2_zero_dose_reachability.json':PINS.zeroExperiment,
    'experiments/open_arena_p2_nominal_dose_reachability.json':PINS.nominalExperiment,
    'src/p1.js':PINS.p1Runtime,
    'models/lasius_niger_painted_trail_p1_v1.json':PINS.p1Model,
    'apparatus/poissonnier2026_open_arena_p1_v1.json':PINS.apparatus,
    'models/lasius_niger_locomotion_v1.json':PINS.canonicalModel,
    'src/sim-core.js':PINS.simCore,
    'src/integrity.js':PINS.integrity
  };
  for(const[rel,expected]of Object.entries(filePins)){
    const actual=gitBlob(root,rel);
    if(actual!==expected)throw new Error(`P2 provenance drift: ${rel} ${actual} != ${expected}`);
  }
  if(JSON.stringify(model.movement)!==JSON.stringify(base.movement))throw new Error('P2 movement block must exactly match canonical locomotion.');
  const cfg=p2.paintedTrailResponseConfig(model),p1cfg=p1.paintedTrailResponseConfig(p1Model),eng=policy.frozen_execution.engineering_values;
  if(cfg.sigma!==eng.sigma_field_mm||cfg.kappa!==eng.kappa_trail_per_s||cfg.pLapse!==eng.p_lapse||cfg.forward!==eng.sensor_forward_offset_mm||cfg.half!==eng.sensor_lateral_half_separation_mm)throw new Error('P2 model does not match frozen engineering values.');
  if(cfg.sigma!==p1cfg.sigma||cfg.kappa!==p1cfg.kappa||cfg.forward!==p1cfg.forward||cfg.half!==p1cfg.half)throw new Error('P2 engaged local kernel must match frozen P1 engineering kernel.');
  return{policy,model,p1Model,base,cfg};
}

function exactIdentityPanel(root,policy){
  const dt=policy.frozen_execution.physics_dt_s,seconds=policy.frozen_execution.exact_identity_panel.fixed_time_s,rows=[];
  for(const seed of policy.frozen_execution.exact_identity_panel.seeds){
    const baseZero=loadBundle(ZERO_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const p2Zero=loadBundle(ZERO_EXPERIMENT,{modelId:MODEL_ID});
    const a=runFixed(new integrity.Simulation(baseZero,seed),seconds,dt),b=runFixed(new p2.Simulation(p2Zero,seed),seconds,dt);
    assertExactAntIdentity(a.ants[0],b.ants[0],`zero dose seed ${seed}`);
    if(b.ants[0].p2ResponseDraws!==0||b.ants[0].p2SteeringSamples!==0)throw new Error(`zero dose seed ${seed}: P2 bypass consumed response RNG or steering`);

    const baseK0=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const p2K0=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    p2K0.model.painted_trail_response.steering.kappa_trail_per_s=0;
    const c=runFixed(new integrity.Simulation(baseK0,seed),seconds,dt),d=runFixed(new p2.Simulation(p2K0,seed),seconds,dt);
    assertExactAntIdentity(c.ants[0],d.ants[0],`kappa zero seed ${seed}`);
    if(d.ants[0].p2ResponseDraws!==0||d.ants[0].p2SteeringSamples!==0)throw new Error(`kappa zero seed ${seed}: P2 bypass consumed response RNG or steering`);

    const baseAll=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const p2All=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    p2All.model.painted_trail_response.engagement.p_lapse=1;
    const e=runFixed(new integrity.Simulation(baseAll,seed),seconds,dt),f=runFixed(new p2.Simulation(p2All,seed),seconds,dt);
    assertExactAntIdentity(e.ants[0],f.ants[0],`all lapse seed ${seed}`);
    if(f.ants[0].p2Engaged!==false||f.ants[0].p2ResponseDraws!==0||f.ants[0].p2SteeringSamples!==0)throw new Error(`all lapse seed ${seed}: endpoint identity failed`);

    const p1Bundle=loadBundle(NOMINAL_EXPERIMENT,{modelId:P1_MODEL_ID});
    const p2P0=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    p2P0.model.painted_trail_response.engagement.p_lapse=0;
    const g=runFixed(new p1.Simulation(p1Bundle,seed),seconds,dt),h=runFixed(new p2.Simulation(p2P0,seed),seconds,dt);
    assertExactAntIdentity(g.ants[0],h.ants[0],`always engaged nested P1 seed ${seed}`);
    if(h.ants[0].p2Engaged!==true||h.ants[0].p2ResponseDraws!==0)throw new Error(`always engaged seed ${seed}: endpoint state failed`);
    if(h.ants[0].p2SteeringSamples!==g.ants[0].p1SteeringSamples||!same(h.ants[0].p2LastOmega,g.ants[0].p1LastOmega))throw new Error(`always engaged seed ${seed}: P1 local-kernel diagnostics drifted`);

    rows.push({seed,zero_dose_canonical_identity:true,zero_kappa_canonical_identity:true,all_lapse_canonical_identity:true,always_engaged_nested_p1_identity:true});
  }
  return rows;
}

function invariancePanel(model){
  const cfg=p2.paintedTrailResponseConfig(model);
  const apparatus=readJson(path.resolve(__dirname,'..','apparatus','poissonnier2026_open_arena_p1_v1.json'));
  const field=p1.paintedTrailApparatusConfig(apparatus),near=(a,b,t=8e-12)=>{if(Math.abs(a-b)>t)throw new Error(`invariance mismatch ${a} vs ${b}`);};
  const above=p1.trailSteeringRate(100,95,0,cfg,field,1),below=p1.trailSteeringRate(100,115,0,cfg,field,1),on=p1.trailSteeringRate(100,105,0,cfg,field,1);
  if(!(above.omega>0&&below.omega<0))throw new Error('P2 reused local steering sign failed.'); near(above.omega,-below.omega); near(on.omega,0);
  const reversed={a:field.b,b:field.a,nominalDose:field.nominalDose};
  for(const[x,y,h]of[[100,95,.3],[140,110,-1],[20,103,2.1]]){
    const q=p1.trailSteeringRate(x,y,h,cfg,field,1),r=p1.trailSteeringRate(x,y,h,cfg,reversed,1);
    near(q.left,r.left);near(q.right,r.right);near(q.omega,r.omega);
  }
  const shift={x:31.25,y:-17.5},sf={a:{x:field.a.x+shift.x,y:field.a.y+shift.y},b:{x:field.b.x+shift.x,y:field.b.y+shift.y},nominalDose:field.nominalDose};
  const q=p1.trailSteeringRate(117,96,.37,cfg,field,1),tr=p1.trailSteeringRate(117+shift.x,96+shift.y,.37,cfg,sf,1);
  near(q.left,tr.left);near(q.right,tr.right);near(q.omega,tr.omega);
  const phi=.71,rot=pt=>({x:Math.cos(phi)*pt.x-Math.sin(phi)*pt.y,y:Math.sin(phi)*pt.x+Math.cos(phi)*pt.y}),rf={a:rot(field.a),b:rot(field.b),nominalDose:field.nominalDose},rp=rot({x:117,y:96});
  const rr=p1.trailSteeringRate(rp.x,rp.y,.37+phi,cfg,rf,1);near(q.left,rr.left);near(q.right,rr.right);near(q.omega,rr.omega);
  return{local_steering_sign:true,on_trail_zero_steering:true,endpoint_reversal:true,translation:true,rotation:true};
}

function stochasticPanel(policy){
  const p=policy.frozen_execution.stochastic_engagement_panel,dt=policy.frozen_execution.physics_dt_s;
  const seeds=Array.from({length:p.trials},(_,i)=>p.first_seed+i);
  if(seeds[seeds.length-1]!==p.last_seed)throw new Error('P2 stochastic seed range drifted.');
  const rows=[];let lapses=0,engagedCount=0;
  for(const seed of seeds){
    const p2b=loadBundle(NOMINAL_EXPERIMENT,{modelId:MODEL_ID});
    const p1b=loadBundle(NOMINAL_EXPERIMENT,{modelId:P1_MODEL_ID});
    const baseb=loadBundle(NOMINAL_EXPERIMENT,{modelId:BASE_MODEL_ID});
    const sim2=new p2.Simulation(p2b,seed),sim1=new p1.Simulation(p1b,seed),base=new integrity.Simulation(baseb,seed);
    const ant2=sim2.ants[0],initialBiology=ant2.rng.state,initialP1=sim1.ants[0].rng.state,initialBase=base.ants[0].rng.state;
    if(initialBiology!==initialP1||initialBiology!==initialBase)throw new Error(`seed ${seed}: P2 response setup perturbed canonical biology RNG`);
    const expectedSeed=p2.responseSeed(seed,0),expectedU=new core.RNG(expectedSeed).next();
    if(ant2.p2ResponseSeed!==expectedSeed||!same(ant2.p2ResponseU,expectedU)||ant2.p2ResponseDraws!==1)throw new Error(`seed ${seed}: dedicated response RNG mismatch`);
    const engagedBefore=ant2.p2Engaged;
    const s2=sim2.runUntilComplete(p2b.experiment.duration_s,dt),s1=sim1.runUntilComplete(p1b.experiment.duration_s,dt),sb=base.runUntilComplete(baseb.experiment.duration_s,dt);
    if(ant2.p2Engaged!==engagedBefore)throw new Error(`seed ${seed}: engagement state changed within trial`);
    if(engagedBefore){assertExactAntIdentity(sim1.ants[0],ant2,`stochastic engaged seed ${seed}`);engagedCount++;}
    else{assertExactAntIdentity(base.ants[0],ant2,`stochastic lapsed seed ${seed}`);lapses++;}
    const obs=s2.observed_metrics.ants[0],ex=obs.exit_coordinate_mm,edge=exitEdge(ex,sim2.apparatus.world);
    rows.push({seed,engaged:engagedBefore,response_seed:ant2.p2ResponseSeed,response_u:ant2.p2ResponseU,response_draws:ant2.p2ResponseDraws,steering_samples:ant2.p2SteeringSamples,central_zone_fraction:obs.central_zone_fraction,trail_axis_exit:edge==='left'||edge==='right',mean_moving_speed_mm_s:obs.mean_moving_speed_mm_s,time_to_exit_s:obs.time_to_arena_edge_s});
  }
  if(!(lapses>0&&engagedCount>0))throw new Error('P2 p_lapse=0.20 stochastic panel degenerated to one state.');
  const responseSeeds=new Set(Array.from({length:8},(_,id)=>p2.responseSeed(p.first_seed,id)));
  if(responseSeeds.size!==8)throw new Error('P2 response seed namespace collided across ant ids 0..7.');
  return{
    trials:rows.length,lapses,engaged:engagedCount,observed_lapse_fraction:lapses/rows.length,
    mean_central_zone_fraction:mean(rows.map(r=>r.central_zone_fraction)),
    trail_axis_exit_rate:mean(rows.map(r=>r.trail_axis_exit?1:0)),
    mean_moving_speed_mm_s:mean(rows.map(r=>r.mean_moving_speed_mm_s)),
    mean_time_to_exit_s:mean(rows.map(r=>r.time_to_exit_s)),
    mean_steering_samples:mean(rows.map(r=>r.steering_samples)),
    response_seed_namespace_unique_for_ant_ids_0_to_7:true,
    all_trials_exact_component_identity:true,
    all_trials_exactly_one_response_draw:true,
    all_trials_engagement_state_fixed:true
  };
}

function runP2Reachability({root=path.resolve(__dirname,'..')}={}){
  const {policy,model}=validateFrozenInputs(root);
  const identity=exactIdentityPanel(root,policy),invariances=invariancePanel(model),stochastic=stochasticPanel(policy);
  const checks={
    exact_zero_dose_canonical_identity:identity.every(r=>r.zero_dose_canonical_identity),
    exact_zero_kappa_canonical_identity:identity.every(r=>r.zero_kappa_canonical_identity),
    exact_all_lapse_canonical_identity:identity.every(r=>r.all_lapse_canonical_identity),
    exact_always_engaged_nested_p1_identity:identity.every(r=>r.always_engaged_nested_p1_identity),
    stochastic_exact_component_identity:stochastic.all_trials_exact_component_identity,
    stochastic_exact_one_response_draw:stochastic.all_trials_exactly_one_response_draw,
    stochastic_engagement_fixed_within_trial:stochastic.all_trials_engagement_state_fixed,
    response_seed_namespace_unique:stochastic.response_seed_namespace_unique_for_ant_ids_0_to_7,
    stochastic_panel_non_degenerate:stochastic.lapses>0&&stochastic.engaged>0,
    local_steering_sign:invariances.local_steering_sign,
    on_trail_zero_steering:invariances.on_trail_zero_steering,
    endpoint_reversal_invariant:invariances.endpoint_reversal,
    translation_invariant:invariances.translation,
    rotation_invariant:invariances.rotation
  };
  checks.overall_pass=Object.values(checks).every(Boolean);
  return{
    schema_version:1,
    id:'P2_reference_free_reachability_result_v1',
    status:checks.overall_pass?'reference_free_reachability_passed':'reference_free_reachability_failed',
    mechanism_id:'P2_trial_level_transient_trail_engagement_v1',
    model_id:MODEL_ID,
    mechanism_freeze_git_blob_sha:PINS.mechanism,
    reachability_execution_policy_git_blob_sha:PINS.policy,
    implementation_authorization_git_blob_sha:PINS.authorization,
    runtime_git_blob_sha:gitBlob(root,'src/p2.js'),
    model_git_blob_sha:gitBlob(root,'models/lasius_niger_painted_trail_p2_v1.json'),
    zero_experiment_git_blob_sha:gitBlob(root,'experiments/open_arena_p2_zero_dose_reachability.json'),
    nominal_experiment_git_blob_sha:gitBlob(root,'experiments/open_arena_p2_nominal_dose_reachability.json'),
    p1_component_runtime_git_blob_sha:PINS.p1Runtime,
    canonical_model_git_blob_sha:PINS.canonicalModel,
    execution_repo_commit:gitHead(root),
    fit_performed:false,
    parameter_search_performed:false,
    candidate_ranking_performed:false,
    reference_targets_accessed:false,
    reference_outcomes_accessed:false,
    p1_official_result_used_for_tuning:false,
    ymaze_accessed:false,
    canonical_model_updated:false,
    candidate_B_implemented:false,
    physics_dt_s:policy.frozen_execution.physics_dt_s,
    engineering_values:clone(policy.frozen_execution.engineering_values),
    identity_panel:{seeds:policy.frozen_execution.exact_identity_panel.seeds,fixed_time_s:policy.frozen_execution.exact_identity_panel.fixed_time_s,rows:identity},
    invariance_panel:invariances,
    stochastic_engagement_panel:stochastic,
    structural_checks:checks,
    interpretation:"Reference-free implementation/reachability qualification only. The observed lapse fraction and behavioral summaries are descriptive consequences of the pre-frozen RNG/seeds and engineering p_lapse=0.20 anchor; they are not fitted evidence.",
    restrictions:[
      'No response target or reference outcome file was loaded.',
      'No P1 failed-fold outcome was used for tuning.',
      'No parameter search, ranking, fitting, or adaptive refinement was performed.',
      'Candidate B relative/Weber transduction was not implemented.',
      'The Y-maze was not loaded.',
      'Canonical locomotion files were not modified.',
      'Reachability may not retune sigma, kappa, p_lapse, sensors, seeds, dt, or trial count.'
    ]
  };
}

if(require.main===module){
  const outArg=process.argv.indexOf('--out'),out=path.resolve(process.cwd(),outArg>=0&&process.argv[outArg+1]?process.argv[outArg+1]:'p2-reachability-results.json');
  const report=runP2Reachability();fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));console.log(`Saved ${out}`);
  if(!report.structural_checks.overall_pass)process.exitCode=2;
}
module.exports={MODEL_ID,P1_MODEL_ID,BASE_MODEL_ID,ZERO_EXPERIMENT,NOMINAL_EXPERIMENT,PINS,validateFrozenInputs,exactIdentityPanel,invariancePanel,stochasticPanel,runP2Reachability};
