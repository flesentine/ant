'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const bytes=p=>fs.statSync(path.join(root,p)).size;

const freezePath='hypotheses/p4_estimator_qualification_result_freeze_v1.json';
const qualificationPath='reports/p4_estimator_qualification_v1.json';
const browserPath='reports/p4_estimator_browser_audit_v1.json';
const f=read(freezePath),q=read(qualificationPath),b=read(browserPath);

assert.strictEqual(blob(freezePath),'635b64ff1bfe08f6f914e5fd8bef8306ee0b27d5');
assert.strictEqual(f.id,'P4_estimator_qualification_result_freeze_v1');
assert.strictEqual(f.status,'qualified_reference_free_P4_estimator_frozen_high_resolution_not_authorized');

assert.strictEqual(blob(qualificationPath),'33cf1216ade03b0f25ddf643cdc28fd5c3df0010');
assert.strictEqual(sha256(qualificationPath),'ab72e961e3ff33c4861cc36dbfe3e486585525fa5ebe6fb0fa16d911b1444890');
assert.strictEqual(bytes(qualificationPath),3893);
assert.strictEqual(q.status,'passed');
assert.strictEqual(Object.keys(q.checks).length,25);
for(const [k,v] of Object.entries(q.checks))assert.strictEqual(v,true,'qualification check '+k);

assert.strictEqual(blob(browserPath),'8ae7c0f8940502c64e720b5abafde4fc094a255c');
assert.strictEqual(sha256(browserPath),'2fa2b2860d4cd311b68861acd9bebe471100542e0666103483ed841278c2684f');
assert.strictEqual(bytes(browserPath),5517);
assert.strictEqual(b.status,'passed');
assert.strictEqual(b.browser,'Google Chrome 152.0.7977.82');
assert.strictEqual(b.P4_browser_parity.cases,10);
assert.strictEqual(b.P4_browser_parity.passed,true);
assert.strictEqual(b.P4_browser_parity.results.length,10);
for(const row of b.P4_browser_parity.results)assert.strictEqual(row.pass,true,row.name);

const first=f.qualification_history.first_audit_attempt;
assert.strictEqual(first.github_run_id,34566824501);
assert.strictEqual(first.github_job_id,103160553875);
assert.strictEqual(first.tested_head,'cd3b826568c8f46805dd2534de0d2a5f59e1b748');
assert.strictEqual(first.classification,'temporary_audit_harness_failure_before_qualification');
assert.strictEqual(first.estimator_or_scientific_change_required,false);
assert.strictEqual(first.response_target_semantics_accessed,false);
assert.strictEqual(first.scientific_search_executed,false);
assert.match(first.cause,/brittle string match/i);

const n=f.qualification_history.successful_reference_free_qualification;
assert.strictEqual(n.tested_head,'7c3d399e62bf1db6c95cea095ac01c90ac045d05');
assert.strictEqual(n.github_run_id,34567010355);
assert.strictEqual(n.github_job_id,103161097443);
assert.strictEqual(n.workflow_id,355518983);
assert.strictEqual(n.check_suite_id,93639690575);
assert.strictEqual(n.conclusion,'success');
assert.strictEqual(n.qualification_report_materialization_commit,'542a228fda027e51beadd41a8fb0d4a348d02867');
assert.strictEqual(n.artifact_id,10186372054);
assert.strictEqual(n.artifact_digest,'sha256:dc19b6ba0ebe3d20bfc13aebd43e5eaf6d5a60ca7d1f818e9aab904e044e9e43');

const c=f.qualification_history.successful_browser_firewall_audit;
assert.strictEqual(c.tested_head,'a692c8febb456447d7828478be4fa6f9c2158e93');
assert.strictEqual(c.github_run_id,34567197440);
assert.strictEqual(c.github_job_id,103161636644);
assert.strictEqual(c.workflow_id,355521569);
assert.strictEqual(c.check_suite_id,93640159345);
assert.strictEqual(c.conclusion,'success');
assert.strictEqual(c.browser_report_materialization_commit,'15a14ec0d5f15934d04a1994b6bebe43c2facb5c');
assert.strictEqual(c.artifact_id,10186440705);
assert.strictEqual(c.artifact_digest,'sha256:e16897f9fd4e13e43d35348a36274080a476f2cefefc08e38f0c0d1580cb4c4e');

const pins={
  'hypotheses/p4_response_estimation_v1.json':'2d0bdfaba74ad08f8424870f37a48399428ae8b7',
  'hypotheses/p4_estimator_implementation_authorization_v1.json':'e8f26731412d8693a5596da4374de932745b9392',
  'tools/p4-estimation-core.js':'4d985cd7258fc26eb06be75f09bdac4b92325ff0',
  'tools/run-p4-estimation.js':'e57b554c0ad56a0034f4f79ec8090d3e863e3d11',
  'src/p4.js':'bf7d5781bd69ec4568450ebbd3bdc284897b6f61',
  'models/lasius_niger_painted_trail_p4_v1.json':'3d8460b6916a90d06e70768f696ee3f0d48fccf4',
  'hypotheses/p4_reachability_result_freeze_v1.json':'f2074ae3157f22208ff98ebc620c00006549cab6',
  'reports/p4_reference_free_reachability_v1.json':'f6e77596eb25cc7bca3bf0dde1da712511a1d0d0',
  'src/p3.js':'4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8',
  'models/lasius_niger_painted_trail_p3_v1.json':'9107de0c71641c4037bbedbb498b9fa868c1ef00',
  'reference/poissonnier2026_pheromone_response_targets.json':'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed'
};
for(const [p,s] of Object.entries(pins))assert.strictEqual(blob(p),s,p);

assert.strictEqual(q.scientific_evidence,false);
assert.strictEqual(q.reference_outcomes_accessed,false);
assert.strictEqual(q.response_target_semantics_loaded,false);
assert.strictEqual(q.response_target_hash_verified_only,true);
assert.strictEqual(q.P1_official_result_semantics_loaded,false);
assert.strictEqual(q.P2_official_result_semantics_loaded,false);
assert.strictEqual(q.P3_official_result_semantics_loaded,false);
assert.strictEqual(q.ymaze_accessed,false);
assert.strictEqual(q.high_resolution_search_executed,false);
assert.strictEqual(b.response_target_semantics_loaded,false);
assert.strictEqual(b.P1_official_result_semantics_loaded,false);
assert.strictEqual(b.P2_official_result_semantics_loaded,false);
assert.strictEqual(b.P3_official_result_semantics_loaded,false);
assert.strictEqual(b.high_resolution_search_executed,false);
assert.strictEqual(b.ymaze_accessed_by_P4_estimator,false);

assert.strictEqual(b.canonical_app.initial.status,'PAUSED');
assert.strictEqual(b.canonical_app.initial.model,'lasius_niger_locomotion_v1');
assert.strictEqual(b.canonical_app.initial.simTime,'0.0 s');
assert.strictEqual(b.canonical_app.afterStep.simTime,'1.0 s');
assert.strictEqual(b.canonical_app.duringRun.status,'RUNNING');
assert.strictEqual(b.canonical_app.afterLongSwitch.experiment,'open_arena_long_control.json');
assert.strictEqual(b.canonical_app.afterLongSwitch.status,'PAUSED');
assert.strictEqual(b.canonical_app.afterLongSwitch.model,'lasius_niger_locomotion_v1');
assert.match(b.canonical_app.afterLongSwitch.note,/Approach: 1000 mm/);
assert.strictEqual(b.canonical_requests.length,16);
for(const [k,v] of Object.entries(b.canonical_forbidden_request_counts))assert.strictEqual(v,0,'browser forbidden request '+k);

for(const v of Object.values(f.qualified_checks))assert.strictEqual(v,true);
for(const v of Object.values(f.browser_parity_cases))assert.strictEqual(v,true);
assert.strictEqual(f.qualification_consequence.P4_estimator_reference_free_qualified,true);
assert.strictEqual(f.qualification_consequence.ungated_P3_structural_comparator_qualified,true);
assert.strictEqual(f.qualification_consequence.scientific_response_result_exists,false);
assert.strictEqual(f.qualification_consequence.response_target_semantic_access_authorized,false);
assert.strictEqual(f.qualification_consequence.high_resolution_response_search_authorized,false);
assert.strictEqual(f.qualification_consequence.P1_official_result_semantic_access_authorized,false);
assert.strictEqual(f.qualification_consequence.P2_official_result_semantic_access_authorized,false);
assert.strictEqual(f.qualification_consequence.P3_official_result_semantic_access_authorized,false);
assert.strictEqual(f.qualification_consequence.canonical_locomotion_update_authorized,false);
assert.strictEqual(f.qualification_consequence.H2_H3_H4_H5_refit_or_combination_authorized,false);
assert.strictEqual(f.qualification_consequence.cross_apparatus_validation_authorized,false);
assert.strictEqual(f.qualification_consequence.Y_maze_access_authorized,false);
assert.strictEqual(fs.existsSync(path.join(root,'hypotheses/p4_highres_authorization_v1.json')),false,'P4 high-resolution authorization must remain absent at estimator qualification freeze');
assert.match(f.next_gate,/separate post-qualification P4 high-resolution authorization/i);
assert.match(f.next_gate,/one frozen P4 high-resolution response search/i);

console.log('p4-estimator-qualification-result.test.js PASS '+JSON.stringify({freeze_blob:blob(freezePath),qualification_blob:blob(qualificationPath),qualification_sha256:sha256(qualificationPath),browser_blob:blob(browserPath),browser_sha256:sha256(browserPath),qualification_run:n.github_run_id,browser_run:c.github_run_id,checks:Object.keys(q.checks).length,chromium_cases:b.P4_browser_parity.cases,highres_authorized:false,target_semantics:false,ymaze:false}));
