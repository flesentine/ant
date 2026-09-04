'use strict';

const assert=require('assert');
const path=require('path');
const fs=require('fs');
const h5est=require('../tools/run-h5-estimation.js');
const h3est=require('../tools/run-h3-estimation.js');
const geom=require('../tools/poissonnier2026-measurement-geometry.js');
const {readJson}=require('../tools/load-bundle.js');

const root=path.resolve(__dirname,'..');
const policy=readJson(path.resolve(root,h5est.POLICY_FILE));
const base=readJson(path.resolve(root,'models','lasius_niger_locomotion_h5_v1.json'));
const {geometry}=geom.loadFrozenMeasurementGeometry(root);

assert(h5est.assertPolicySemantics(policy));
assert.strictEqual(h5est.nullCandidate(0,policy).kappa,20/3);
const ks=Array.from({length:500},(_,i)=>h5est.nullCandidate(i,policy).kappa);
assert.strictEqual(Math.min(...ks),policy.search_protocol.safe_kappa_support.frozen_500_point_halton_min);
assert.strictEqual(Math.max(...ks),policy.search_protocol.safe_kappa_support.frozen_500_point_halton_max);

for(let i=0;i<498;i++){
  const n=h5est.nullCandidate(i,policy),c=h5est.commonCandidate(i,policy),h=h5est.historyCandidate(i,policy);
  assert.strictEqual(n.ell0,c.ell0);assert.strictEqual(n.ell0,h.ell0);
  assert.strictEqual(n.kappa,c.kappa);assert.strictEqual(n.kappa,h.kappa);
  assert.strictEqual(n.q,c.q);assert.strictEqual(n.q,h.q);
  assert(h.alpha1000<=h.alpha200);
}

const held=0,pool=geom.geometryPool(geometry.rows,held);
assert(pool.every(r=>r.colony!==held));

const nullSelected={ell0:30,kappa:2,q:.4,alpha200:0,alpha1000:0,_kind:'null',_source:'synthetic_null'};
const commonNull=h5est.commonNullAnchor(nullSelected);
const selectedCommon={ell0:27,kappa:3,q:.55,alpha200:.45,alpha1000:.45,alpha_common:.45,_kind:'common',_source:'synthetic_common'};
const histCommon=h5est.historyCommonAnchor(selectedCommon);
const histNull=h5est.historyNullAnchor(nullSelected);

const seed=710000,trials=4;
const nRows=h5est.simulateH5Candidate(nullSelected,trials,seed,base,pool);
const cnRows=h5est.simulateH5Candidate(commonNull,trials,seed,base,pool);
const cRows=h5est.simulateH5Candidate(selectedCommon,trials,seed,base,pool);
const hcRows=h5est.simulateH5Candidate(histCommon,trials,seed,base,pool);
const hnRows=h5est.simulateH5Candidate(histNull,trials,seed,base,pool);
assert.deepStrictEqual(cnRows,nRows,'common exact-null anchor must be trajectory-identical to H5 null');
assert.deepStrictEqual(hnRows,nRows,'history exact-null anchor must be trajectory-identical to H5 null');
assert.deepStrictEqual(hcRows,cRows,'history exact-common anchor must be trajectory-identical to H5 common');

const short=cRows.filter(r=>r.path_length==='s'),long=cRows.filter(r=>r.path_length==='l');
assert.strictEqual(short.length,trials);assert.strictEqual(long.length,trials);
for(let i=0;i<trials;i++){
  const a={...short[i],path_length:undefined},b={...long[i],path_length:undefined};
  assert.deepStrictEqual(a,b,'equal-strength common search must be short/long neutral');
}

for(const fi of [0,1,2,3,4,5]){
  const heldout=h5est.COLONIES[fi],p=geom.geometryPool(geometry.rows,heldout);
  for(const trialSeed of [990000+fi*10000,1490000+fi*10000]){
    const a=geom.sampleGeometry(p,trialSeed),b=geom.sampleGeometry(p,trialSeed);
    assert.strictEqual(a.row.ant_id,b.row.ant_id);
    assert(a.row.colony!==heldout);
  }
}

const h2=readJson(path.resolve(root,'reports','h2_parameter_estimation_500x60_v1.json'));
const h3=readJson(path.resolve(root,'reports','h3_parameter_estimation_500x60_v1.json'));
const h4=readJson(path.resolve(root,'reports','h4_parameter_estimation_500x60_v1.json'));
for(const heldout of h5est.COLONIES){
  assert(h5est.h2CandidateFromFold(h2.folds.find(f=>f.held_out_colony===heldout)));
  assert(h5est.h3CandidateFromFold(h3.folds.find(f=>f.held_out_colony===heldout)));
  assert(h5est.h4CandidateFromFold(h4.folds.find(f=>f.held_out_colony===heldout)));
}

const synthetic=[
  {path_length:'s',time_to_exit_s:1,middle_zone_fraction:.1,beeline_mm:10,exit_edge:'left'},
  {path_length:'s',time_to_exit_s:2,middle_zone_fraction:.2,beeline_mm:20,exit_edge:'timeout'},
  {path_length:'l',time_to_exit_s:3,middle_zone_fraction:.3,beeline_mm:30,exit_edge:'right'},
  {path_length:'l',time_to_exit_s:4,middle_zone_fraction:.4,beeline_mm:40,exit_edge:'bottom'}
];
const probs=h3est.edgeProbs(synthetic);
assert.strictEqual(probs.length,5);assert(Math.abs(probs.reduce((a,b)=>a+b,0)-1)<1e-12);assert.strictEqual(probs[4],.25);
assert.strictEqual(h3est.score(synthetic,synthetic,h3est.scoreScales(synthetic)).loss,0);

const source=fs.readFileSync(path.resolve(root,'tools','run-h5-estimation.js'),'utf8');
assert(!/loadBundle\(['"]neutral_y_maze/.test(source));
assert(!/experiments\/neutral_y_maze/.test(source));
assert(!base.colony && !base.origin_search.colony);

assert.throws(()=>h5est.assertSyntheticQualification(root),/synthetic qualification record is missing/);

console.log('h5-estimator-contract.test.js PASS '+JSON.stringify({
  exact_anchor_rows:nRows.length,
  geometry_pool_n:pool.length,
  comparator_folds:{H2:h2.folds.length,H3:h3.folds.length,H4:h4.folds.length},
  kappa_min:Math.min(...ks),
  kappa_max:Math.max(...ks)
}));
