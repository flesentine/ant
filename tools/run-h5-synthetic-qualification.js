#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const core=require('../src/sim-core.js');
const h3=require('../src/h3.js');
const h5=require('../src/h5.js');
const integrity=require('../src/integrity.js');
const h3est=require('./run-h3-estimation.js');
const h5est=require('./run-h5-estimation.js');
const geom=require('./poissonnier2026-measurement-geometry.js');
const {loadBundle,readJson}=require('./load-bundle.js');

const root=path.resolve(__dirname,'..');
function clone(v){return JSON.parse(JSON.stringify(v));}
function assert(cond,msg){if(!cond)throw new Error(msg);}
function sigRows(rows){return JSON.stringify(rows);}
function eventSig(sim){return sim.events.filter(e=>e.type==='h3_reorientation').map(e=>[e.time,e.angle_rad,e.x,e.y]);}

function makeHuge(historyMm,alpha200,alpha1000){
  const b=loadBundle('open_arena_short_control.json',{modelId:h5est.MODEL_ID});
  b.experiment.protocol.state_facts.recent_constrained_travel_mm=historyMm;
  b.experiment.protocol.state_facts.recent_travel_mm=historyMm;
  b.experiment.duration_s=8;
  b.apparatus=clone(b.apparatus);
  b.apparatus.world={width:100000,height:100000};
  b.apparatus.geometry={primitives:[{type:'rect',name:'a4_arena',x:0,y:0,width:100000,height:100000}]};
  b.apparatus.entry_points={default:{x:75000,y:50000,heading_rad:0},center:{x:75000,y:50000,heading_rad:0}};
  b.experiment.protocol.entry_point='center';
  b.experiment.protocol.entry_state={heading_rad:0,position_jitter_mm:0,heading_jitter_rad:0};
  b.model=clone(b.model);
  Object.assign(b.model.movement,{base_speed_mm_s:20,speed_sd_mm_s:0,speed_reversion_rate_s:0,speed_noise_sigma_sqrt_s:0,pause_rate_s:0,pause_min_s:.1,pause_max_s:.1});
  b.model.reorientation_gate.baseline.mean_free_path_mm=18;
  b.model.reorientation_gate.baseline.turn_concentration=2;
  b.model.reorientation_gate.effect.max_hazard_reduction_fraction=0;
  b.model.origin_search.history_response.alpha_search_200=alpha200;
  b.model.origin_search.history_response.alpha_search_1000=alpha1000;
  return b;
}

function main(){
  h5est.assertBlob(root,h5est.POLICY_FILE,h5est.POLICY_GIT_BLOB_SHA);
  const policy=readJson(path.resolve(root,h5est.POLICY_FILE));
  h5est.assertPolicySemantics(policy);
  const {geometry}=geom.loadFrozenMeasurementGeometry(root);
  const base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h5_v1.json'));

  const checks={};
  const perFold={};

  // Candidate mapping and supported history domain.
  for(let i=0;i<498;i++){
    const n=h5est.nullCandidate(i,policy),c=h5est.commonCandidate(i,policy),h=h5est.historyCandidate(i,policy);
    assert(n.ell0===c.ell0&&n.ell0===h.ell0,'nuisance ell0 pairing');
    assert(n.kappa===c.kappa&&n.kappa===h.kappa,'nuisance kappa pairing');
    assert(n.q===c.q&&n.q===h.q,'nuisance q pairing');
    assert(h.alpha1000<=h.alpha200,'history monotonicity');
  }
  checks.halton_mapping=true;
  const cfg=h5.originSearchConfig(base);
  assert(h5.historyAmplitude(200,cfg)===base.origin_search.history_response.alpha_search_200,'history 200 lookup');
  assert(h5.historyAmplitude(1000,cfg)===base.origin_search.history_response.alpha_search_1000,'history 1000 lookup');
  let unsupported=false;try{h5.historyAmplitude(600,cfg);}catch(e){unsupported=/only 200 and 1000/.test(String(e.message));}
  assert(unsupported,'unsupported L=600 must reject');
  checks.history_domain=true;

  // Exact nesting, same geometry short/long, and held-out geometry exclusion in every fold.
  for(let fi=0;fi<h5est.COLONIES.length;fi++){
    const held=h5est.COLONIES[fi],pool=geom.geometryPool(geometry.rows,held);
    assert(pool.every(r=>r.colony!==held),'heldout geometry leakage');
    const nullC={ell0:24+fi,kappa:2+fi*.15,q:.35+fi*.04,alpha200:0,alpha1000:0,_kind:'null',_source:'synthetic_null'};
    const commonC={ell0:27+fi,kappa:2.5+fi*.1,q:.25+fi*.05,alpha200:.4,alpha1000:.4,alpha_common:.4,_kind:'common',_source:'synthetic_common'};
    const cn=h5est.commonNullAnchor(nullC),hn=h5est.historyNullAnchor(nullC),hc=h5est.historyCommonAnchor(commonC);
    const seed=730000+fi*1000,trials=3;
    const n=h5est.simulateH5Candidate(nullC,trials,seed,base,pool);
    const cnr=h5est.simulateH5Candidate(cn,trials,seed,base,pool);
    const hnr=h5est.simulateH5Candidate(hn,trials,seed,base,pool);
    const c=h5est.simulateH5Candidate(commonC,trials,seed,base,pool);
    const hcr=h5est.simulateH5Candidate(hc,trials,seed,base,pool);
    assert(sigRows(n)===sigRows(cnr),'common null anchor mismatch');
    assert(sigRows(n)===sigRows(hnr),'history null anchor mismatch');
    assert(sigRows(c)===sigRows(hcr),'history common anchor mismatch');
    const s=c.filter(r=>r.path_length==='s'),l=c.filter(r=>r.path_length==='l');
    for(let i=0;i<trials;i++){
      const a={...s[i],path_length:null},b={...l[i],path_length:null};
      assert(JSON.stringify(a)===JSON.stringify(b),'common short/long mismatch');
      const gs=geom.sampleGeometry(pool,seed+i).row,gl=geom.sampleGeometry(pool,seed+i).row;
      assert(gs.ant_id===gl.ant_id,'short/long geometry pairing mismatch');
    }
    perFold[held]={pool_n:pool.length,exact_anchor_trials:trials};
  }
  checks.exact_nesting=true;
  checks.geometry_pairing_and_loco_exclusion=true;

  // Active H5 can change direction, but never the H3 event clock/baseline turn stream.
  let reachabilitySelections=0,eventComparisons=0;
  for(let seed=810000;seed<810040;seed++){
    const active=new integrity.Simulation(makeHuge(200,1,1),seed);
    const nullPeer=new integrity.Simulation(makeHuge(200,0,0),seed);
    active.runFor(6,.02);nullPeer.runFor(6,.02);
    const ae=eventSig(active),ne=eventSig(nullPeer);
    assert(ae.length===ne.length,'active/null H3 event count changed');
    for(let i=0;i<ae.length;i++){
      eventComparisons++;
      assert(Math.abs(ae[i][0]-ne[i][0])<1e-10,'H5 changed event time');
      assert(Math.abs(ae[i][1]-ne[i][1])<1e-12,'H5 changed baseline angle stream');
    }
    assert(active.ants[0].h5ChoiceDrawCount===active.ants[0].h3TurnCount,'choice cadence mismatch');
    assert(active.ants[0].h5AngleDrawCount===active.ants[0].h3TurnCount,'angle cadence mismatch');
    reachabilitySelections+=active.ants[0].h5SearchSelections;
  }
  assert(reachabilitySelections>0,'persistent H5 runtime failed directional reachability');
  checks.direction_only_event_timing=true;
  checks.search_reachability=true;

  // Shared kappa and dedicated RNG replay.
  const replaySim=new integrity.Simulation(makeHuge(200,1,1),820001);
  replaySim.runFor(4,.02);
  const ev=replaySim.events.find(e=>e.type==='h3_reorientation');
  assert(ev,'shared-kappa replay needs event');
  const rr=new core.RNG(replaySim.ants[0].h5StreamSeeds.angle);
  assert(ev.h5_search_angle_rad===h3.sampleVonMises(rr,replaySim.h3Config.kappa),'H5 search angle not shared-kappa replay');
  assert(replaySim.ants[0].h5StreamSeeds.angle!==replaySim.ants[0].h3StreamSeeds.angle,'H5/H3 angle stream collision');
  assert(replaySim.ants[0].h5StreamSeeds.choice!==replaySim.ants[0].h3StreamSeeds.event,'H5 choice/H3 event stream collision');
  checks.shared_kappa_and_rng_isolation=true;

  // Synthetic scorer only: no reference target file is loaded.
  const train=[
    {path_length:'s',time_to_exit_s:2,middle_zone_fraction:.10,beeline_mm:20,exit_edge:'left'},
    {path_length:'s',time_to_exit_s:4,middle_zone_fraction:.20,beeline_mm:30,exit_edge:'timeout'},
    {path_length:'s',time_to_exit_s:6,middle_zone_fraction:.30,beeline_mm:40,exit_edge:'top'},
    {path_length:'l',time_to_exit_s:3,middle_zone_fraction:.15,beeline_mm:25,exit_edge:'right'},
    {path_length:'l',time_to_exit_s:5,middle_zone_fraction:.25,beeline_mm:35,exit_edge:'bottom'},
    {path_length:'l',time_to_exit_s:7,middle_zone_fraction:.35,beeline_mm:45,exit_edge:'timeout'}
  ];
  const heldout=train.map(r=>({...r,time_to_exit_s:r.time_to_exit_s+100,middle_zone_fraction:r.middle_zone_fraction+.5,beeline_mm:r.beeline_mm+100}));
  const scales=h3est.scoreScales(train),sameScales=h3est.scoreScales(train);
  assert(JSON.stringify(scales)===JSON.stringify(sameScales),'synthetic heldout affected training scales');
  assert(h3est.edgeProbs(train).length===5,'five-category exit scorer missing');
  assert(Math.abs(h3est.edgeProbs(train).reduce((a,b)=>a+b,0)-1)<1e-12,'exit probabilities not normalized');
  assert(h3est.score(train,train,scales).loss===0,'identical synthetic scorer nonzero');
  assert(h3est.score(heldout,train,scales).loss>0,'synthetic perturbation not detected');
  checks.synthetic_scoring=true;

  // Historical comparator extraction and geometry-aware wrapper execution, no comparison to reference outcomes.
  const h2Report=readJson(path.resolve(root,'reports','h2_parameter_estimation_500x60_v1.json'));
  const h3Report=readJson(path.resolve(root,'reports','h3_parameter_estimation_500x60_v1.json'));
  const h4Report=readJson(path.resolve(root,'reports','h4_parameter_estimation_500x60_v1.json'));
  const h2Base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h2_v1.json'));
  const h3Base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h3_v1.json'));
  const h4Base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h4_v1.json'));
  for(let fi=0;fi<h5est.COLONIES.length;fi++){
    const held=h5est.COLONIES[fi],pool=geom.geometryPool(geometry.rows,held),seed=840000+fi*1000;
    const h2c=h5est.h2CandidateFromFold(h2Report.folds.find(f=>f.held_out_colony===held));
    const h3c=h5est.h3CandidateFromFold(h3Report.folds.find(f=>f.held_out_colony===held));
    const h4c=h5est.h4CandidateFromFold(h4Report.folds.find(f=>f.held_out_colony===held));
    assert(h5est.simulateH2CandidateGeometryAware(h2c,1,seed,h2Base,pool).length===2,'H2 geometry wrapper failed');
    assert(h5est.simulateH3CandidateGeometryAware(h3c,1,seed,h3Base,pool).length===2,'H3 geometry wrapper failed');
    assert(h5est.simulateH4CandidateGeometryAware(h4c,1,seed,h4Base,pool).length===2,'H4 geometry wrapper failed');
  }
  checks.comparator_extraction_and_geometry_wrappers=true;

  // Biology cannot receive colony identity.
  assert(!Object.prototype.hasOwnProperty.call(base,'colony'),'H5 model contains colony identity');
  assert(!Object.prototype.hasOwnProperty.call(base.origin_search,'colony'),'H5 origin_search contains colony identity');
  checks.colony_not_biological_input=true;

  // The estimator has no direct Y-maze experiment load path.
  const estimatorSource=fs.readFileSync(path.resolve(root,'tools','run-h5-estimation.js'),'utf8');
  assert(!/loadBundle\(['"]neutral_y_maze/.test(estimatorSource),'H5 estimator contains Y-maze load');
  assert(!/experiments\/neutral_y_maze/.test(estimatorSource),'H5 estimator contains Y-maze experiment path');
  checks.ymaze_inaccessible=true;

  const implementationBlobs=h5est.currentImplementationBlobs(root);
  const report={
    schema_version:1,
    id:'H5_synthetic_qualification_v1_candidate',
    status:'synthetic_qualification_passed_pending_browser_and_permanent_record',
    reference_outcomes_used:false,
    reference_target_file_loaded:false,
    ymaze_accessed:false,
    canonical_parameters_updated:false,
    implementation_blobs:implementationBlobs,
    policy_blob:h5est.POLICY_GIT_BLOB_SHA,
    checks,
    per_fold_geometry:perFold,
    event_prefix_comparisons:eventComparisons,
    active_search_selections:reachabilitySelections,
    synthetic_training_scales:scales,
    historical_comparator_parameter_records_loaded:{H2:h2Report.folds.length,H3:h3Report.folds.length,H4:h4Report.folds.length}
  };
  const out=path.resolve(process.cwd(),process.argv.find(x=>x.startsWith('--out='))?.slice(6)||'h5-synthetic-qualification.json');
  fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  console.log(`Saved ${out}`);
}

if(require.main===module)main();
