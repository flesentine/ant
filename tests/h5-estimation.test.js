'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const h5e=require('../tools/run-h5-estimation.js');
const h4e=require('../tools/run-h4-estimation.js');
const root=path.resolve(__dirname,'..');
const pinned=h5e.assertExactPolicyBlob(root),policy=pinned.policy;
assert.strictEqual(h5e.gitBlobShaFile(path.join(root,'tools','run-h5-estimation.js')),'e3172bb051de3fab350a7a63746d3e870fbaa0fc','qualified H5 estimator blob drifted');
assert.strictEqual(h5e.gitBlobShaFile(path.join(root,'reports','h5_estimator_qualification_v1.json')),'8ee978588c97d56a9660693bc08ed4ba0600d961','H5 qualification report blob drifted');
assert.strictEqual(pinned.sha,h5e.POLICY_GIT_BLOB_SHA);
h5e.assertPolicySemantics(policy);
const runtime=h5e.assertFrozenRuntimeBlobs(root),refs=h5e.assertFrozenReferenceComparatorBlobs(root);
assert.strictEqual(runtime['src/h5.js'],'b43f8e9fcaa4b2cc9981ed4f2922a833cc1a3177');
assert.strictEqual(runtime['tools/run-h4-estimation.js'],'d417c62a4ef4f97c338a1da2f1ff10f49e18c175');
assert.strictEqual(refs['reports/h4_parameter_estimation_500x60_v1.json'],'8619b96bb3a02e78b905320ac96585bec08b2918');
assert.throws(()=>h5e.assertSafeReportOutput(root,path.join(root,'models','lasius_niger_locomotion_v1.json')),/reports\//);
assert.strictEqual(h5e.assertSafeReportOutput(root,'/tmp/h5-safe-report.json'),'/tmp/h5-safe-report.json');

for(const i of [0,10,498]){
  const n=h5e.nullCandidate(i,policy),c=h5e.contextCandidate(i,policy);
  assert.strictEqual(n.angular_sigma_rad_sqrt_s,c.angular_sigma_rad_sqrt_s);
  assert.strictEqual(n.q,c.q);
  assert(n.angular_sigma_rad_sqrt_s>=.7&&n.angular_sigma_rad_sqrt_s<=2.4);
  assert(c.lambda_commitment_mm>=100&&c.lambda_commitment_mm<=3000);
  assert(c.tau_commitment_s>=.5&&c.tau_commitment_s<=40);
  assert(c.kappa_restore_per_s>=0&&c.kappa_restore_per_s<=2);
}
const c0=h5e.contextCandidate(0,policy);
assert(Math.abs(c0.angular_sigma_rad_sqrt_s-1.55)<1e-12);
assert(Math.abs(c0.q-1/3)<1e-12);

const n=h5e.nullCandidate(17,policy),anchor=h5e.nullAnchor(n),ar=h5e.reportCandidate(anchor,'context','exact_null_anchor');
assert.strictEqual(anchor.kappa_restore_per_s,0);assert.strictEqual(anchor.angular_sigma_rad_sqrt_s,n.angular_sigma_rad_sqrt_s);assert.strictEqual(anchor.q,n.q);
assert.strictEqual(ar.lambda_commitment_mm,null);assert.strictEqual(ar.tau_commitment_s,null);assert.strictEqual(ar.kappa_restore_per_s,0);assert.strictEqual(ar.null_equivalent_anchor,true);

assert.strictEqual(h5e.score,h4e.score);assert.strictEqual(h5e.scoreScales,h4e.scoreScales);assert.strictEqual(h5e.edgeProbs,h4e.edgeProbs);
const ep=h5e.edgeProbs([{exit_edge:'left'},{exit_edge:'timeout'}]);assert.deepStrictEqual(ep,[.5,0,0,0,.5]);

const base=JSON.parse(fs.readFileSync(path.join(root,'models/lasius_niger_locomotion_h5_v1.json'),'utf8')),m=h5e.configuredModel(base,c0);
assert.strictEqual(m.movement.base_speed_mm_s,24);assert.strictEqual(m.movement.angular_sigma_rad_sqrt_s,c0.angular_sigma_rad_sqrt_s);
assert.strictEqual(m.heading_restoration.effect.kappa_restore_per_s,c0.kappa_restore_per_s);

const q=h5e.qualify({root,policy,trials:2});
assert.strictEqual(q.status,'passed');assert.strictEqual(q.reference_outcomes_accessed,false);assert.strictEqual(q.reference_files_semantically_loaded,false);assert.strictEqual(q.ymaze_accessed,false);assert.strictEqual(q.scientific_evidence,false);
for(const[name,passed]of Object.entries(q.checks))assert.strictEqual(passed,true,`qualification check failed: ${name}`);

assert.throws(()=>h5e.assertHighResolutionAuthorized(root),/not authorized|missing post-qualification/i);

const synthetic=h5e.simulateCandidate(n,2,885000,base),ns=h5e.searchNull(synthetic,policy,base,{count:2,trials:2,seed0:885000}),cs=h5e.searchContext(synthetic,policy,base,{count:2,trials:2,seed0:885000,nullSelected:ns.selectedCandidate});
assert.strictEqual(cs.anchor.source,'exact_null_anchor');assert.strictEqual(cs.anchor.candidate.lambda_commitment_mm,null);assert.strictEqual(cs.anchor.candidate.tau_commitment_s,null);assert.strictEqual(cs.anchor.candidate.kappa_restore_per_s,0);
assert(!cs.anchor.near_search_bounds.includes('kappa_restore_per_s'));
assert(cs.best.loss<=cs.anchor.loss+1e-15);

const inputs=h5e.loadReferenceInputs(root,policy);
assert.deepStrictEqual(inputs.colonies,[0,7,16,20,21,27]);
const h4c=h5e.h4CandidateFromReportFold(inputs.h4Report.folds.find(f=>f.held_out_colony===20));
assert(Number.isFinite(h4c.base_speed_mm_s)&&Number.isFinite(h4c.angular_sigma_rad_sqrt_s)&&Number.isFinite(h4c.q)&&Number.isFinite(h4c.lambda_activation_mm)&&Number.isFinite(h4c.tau_activation_s)&&Number.isFinite(h4c.rho_speed));

console.log('h5-estimation.test.js PASS '+JSON.stringify({policy_blob:pinned.sha,qualification:q.status,estimator_blob:q.estimator_git_blob_sha,colonies:inputs.colonies.length}));
