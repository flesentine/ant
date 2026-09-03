'use strict';
const assert=require('assert'),path=require('path');
const h4=require('../tools/run-h4-estimation.js');
const h3=require('../tools/run-h3-estimation.js');
const root=path.resolve(__dirname,'..');
const pinned=h4.assertExactPolicyBlob(root),policy=pinned.policy;
assert.strictEqual(pinned.sha,h4.POLICY_GIT_BLOB_SHA,'estimator must pin the exact frozen H4 policy Git blob');
h4.assertPolicySemantics(policy);

// Deterministic Halton mapping and exact nuisance-coordinate pairing.
for(const i of [0,10,498]){
  const n=h4.nullCandidate(i,policy),c=h4.contextCandidate(i,policy);
  assert.strictEqual(n.base_speed_mm_s,c.base_speed_mm_s);
  assert.strictEqual(n.angular_sigma_rad_sqrt_s,c.angular_sigma_rad_sqrt_s);
  assert.strictEqual(n.q,c.q);
  assert(n.base_speed_mm_s>=12&&n.base_speed_mm_s<=36);
  assert(n.angular_sigma_rad_sqrt_s>=.35&&n.angular_sigma_rad_sqrt_s<=2.4);
  assert(c.lambda_activation_mm>=100&&c.lambda_activation_mm<=3000);
  assert(c.tau_activation_s>=.5&&c.tau_activation_s<=40);
  assert(c.rho_speed>=0&&c.rho_speed<=.95);
}
const c0=h4.contextCandidate(0,policy);
assert(Math.abs(c0.base_speed_mm_s-24)<1e-12,'prime-2 first coordinate should map base speed to 24');
assert(Math.abs(c0.q-.2)<1e-12,'prime-5 first coordinate should map q to 0.2');

// Exact fitted-null anchor is nested without pretending lambda/tau are null estimates.
const n=h4.nullCandidate(17,policy),anchor=h4.nullAnchor(n),anchorReport=h4.reportCandidate(anchor,'context','exact_null_anchor');
assert.strictEqual(anchor.rho_speed,0);assert.strictEqual(anchor.base_speed_mm_s,n.base_speed_mm_s);assert.strictEqual(anchor.angular_sigma_rad_sqrt_s,n.angular_sigma_rad_sqrt_s);assert.strictEqual(anchor.q,n.q);
assert.strictEqual(anchorReport.lambda_activation_mm,null);assert.strictEqual(anchorReport.tau_activation_s,null);assert.strictEqual(anchorReport.rho_speed,0);assert.strictEqual(anchorReport.null_equivalent_anchor,true);

// H4 estimator delegates scoring to the already-audited H3 scorer exactly.
assert.strictEqual(h4.score,h3.score);assert.strictEqual(h4.scoreScales,h3.scoreScales);assert.strictEqual(h4.edgeProbs,h3.edgeProbs);
const ep=h4.edgeProbs([{exit_edge:'left'},{exit_edge:'timeout'}]);assert.deepStrictEqual(ep,[.5,0,0,0,.5]);assert(Math.abs(ep.reduce((a,b)=>a+b,0)-1)<1e-15);

// Reference validation pins the exact target and frozen H2/H3 comparator folds, but qualification itself is reference-free.
const inputs=h4.loadReferenceInputs(root,policy);
assert.strictEqual(h4.gitBlobShaFile(inputs.targetPath),policy.reference_target_git_blob_sha);
assert.deepStrictEqual(inputs.colonies,[0,7,16,20,21,27]);
const h2c=h4.h2CandidateFromReportFold(inputs.h2Report.folds[0]),h3c=h4.h3CandidateFromReportFold(inputs.h3Report.folds[0]);
assert(Number.isFinite(h2c.sigma0)&&Number.isFinite(h2c.q));assert(Number.isFinite(h3c.ell0)&&Number.isFinite(h3c.kappa)&&Number.isFinite(h3c.rho));
const badCal=JSON.parse(JSON.stringify(inputs.cal));badCal.datasets.poissonnier2026_ymaze.allowed_for_development_parameter_estimation=true;
assert.throws(()=>h4.validateReferenceInputs({policy,target:inputs.target,cal:badCal,sourceManifest:inputs.sourceManifest,h2Report:inputs.h2Report,h3Report:inputs.h3Report,targetPath:inputs.targetPath}),/Y-maze/);

// Synthetic estimator qualification exercises null equivalence, parameter wiring, exact H4 boundary timing, RNG cadence and scoring without reference outcomes.
const q=h4.qualify({root,policy,trials:2});
assert.strictEqual(q.status,'passed');assert.strictEqual(q.reference_outcomes_accessed,false);assert.strictEqual(q.ymaze_accessed,false);assert.strictEqual(q.scientific_evidence,false);
for(const [name,passed] of Object.entries(q.checks))assert.strictEqual(passed,true,`qualification check failed: ${name}`);

// High-resolution preflight must itself be reference-free and pass before any real target is loaded.
const preflight=h4.highResolutionPreflight({root,policy});
assert.strictEqual(preflight.status,'passed');
assert.strictEqual(preflight.reference_outcomes_accessed,false);
assert.strictEqual(preflight.ymaze_accessed,false);
assert.strictEqual(preflight.scientific_evidence,false);

// Tiny search-path exercise: context search reserves one slot for the exact selected-null anchor.
const synthetic=h4.simulateCandidate(n,2,883000,inputs.base),ns=h4.searchNull(synthetic,policy,inputs.base,{count:2,trials:2,seed0:883000}),cs=h4.searchContext(synthetic,policy,inputs.base,{count:2,trials:2,seed0:883000,nullSelected:ns.selectedCandidate});
assert.strictEqual(cs.anchor.source,'exact_null_anchor');assert.strictEqual(cs.anchor.candidate.lambda_activation_mm,null);assert.strictEqual(cs.anchor.candidate.tau_activation_s,null);assert.strictEqual(cs.anchor.candidate.rho_speed,0);
assert(!cs.anchor.near_search_bounds.includes('rho_speed'),'fixed rho=0 null anchor must not be reported as a fitted boundary hit');
assert(cs.best.loss<=cs.anchor.loss+1e-15,'best context candidate may not be worse than its included null anchor on training loss');

console.log('h4-estimation.test.js PASS '+JSON.stringify({policy_blob:pinned.sha,qualification:q.status,preflight:preflight.status,colonies:inputs.colonies.length}));
