'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();
const sha256=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

const freeze=read('hypotheses/p1_reachability_result_freeze_v1.json');
const report=read('reports/p1_reference_free_reachability_v1.json');

assert.strictEqual(blob('hypotheses/p1_reachability_result_freeze_v1.json'),'e9187ff27fb04015ded038a5f98354995455e377','P1 reachability result-freeze record drifted');
assert.strictEqual(blob('reports/p1_reference_free_reachability_v1.json'),'5a8da255db2eb8a9e2b6dc51a7bd8d30a0e429ed','P1 reachability report blob drifted');
assert.strictEqual(sha256('reports/p1_reference_free_reachability_v1.json'),'6a992cd0a19fefd5d3afbd5fc0b919c55d0b24fbeda9dc5c6d047a758e747fcb','P1 reachability report SHA-256 drifted');

assert.strictEqual(freeze.id,'P1_reference_free_reachability_result_freeze_v1');
assert.strictEqual(freeze.status,'reference_free_reachability_passed_frozen');
assert.strictEqual(freeze.result.git_blob_sha,'5a8da255db2eb8a9e2b6dc51a7bd8d30a0e429ed');
assert.strictEqual(freeze.result.sha256,'6a992cd0a19fefd5d3afbd5fc0b919c55d0b24fbeda9dc5c6d047a758e747fcb');
assert.strictEqual(freeze.official_execution.run_id,34055700128);
assert.strictEqual(freeze.official_execution.job_id,101547080088);
assert.strictEqual(freeze.official_execution.attempt,1);
assert.strictEqual(freeze.official_execution.execution_head,'da177e90b270d0ed62f627ec1621f7fe2e2ed1ed');
assert.strictEqual(freeze.official_execution.artifact_id,9995881229);
assert.strictEqual(freeze.official_execution.artifact_digest,'sha256:b89a0860f56daffa00c676768d3e951fa02055492d10a3b1eb93f1f8a7859197');
assert.strictEqual(freeze.official_execution.one_official_frozen_execution,true);

assert.strictEqual(freeze.implementation_qualification.run_id,34055606885);
assert.strictEqual(freeze.implementation_qualification.job_id,101546830143);
assert.strictEqual(freeze.implementation_qualification.conclusion,'success');
assert.strictEqual(freeze.implementation_qualification.artifact_id,9995854425);
assert.strictEqual(freeze.implementation_qualification.artifact_digest,'sha256:0ecb9fd22ce17e9897d17688ab9960eb2c873a95b05fec6a5c8d806110c7b61d');
assert.strictEqual(freeze.implementation_qualification.low_volume_smoke_scientific_evidence,false);
assert.strictEqual(freeze.implementation_qualification.chromium_parity_cases,4);
assert.strictEqual(freeze.implementation_qualification.browser_exceptions,0);
assert.strictEqual(freeze.implementation_qualification.console_errors,0);
assert.strictEqual(freeze.implementation_qualification.ymaze_requests,0);
assert.strictEqual(freeze.implementation_qualification.response_target_requests,0);

const pins=freeze.frozen_implementation_chain;
assert.strictEqual(pins.mechanism_freeze_git_blob_sha,'90e86bce29bf45c6e390f7046a6c25a74f409c78');
assert.strictEqual(pins.reachability_execution_policy_git_blob_sha,'282a95ec6761acd8d94163b25f712f191181f2ff');
assert.strictEqual(pins.implementation_authorization_git_blob_sha,'f9fbaeb63c72de7a639d54b597f5c1247d354e20');
assert.strictEqual(pins.runtime_git_blob_sha,'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(pins.model_git_blob_sha,'73873fd6763838423ca27648136bb0b9ff062817');
assert.strictEqual(pins.apparatus_git_blob_sha,'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4');
assert.strictEqual(pins.zero_experiment_git_blob_sha,'6e47fa91143ed5d4d2b52bf2c555246b7d216297');
assert.strictEqual(pins.nominal_experiment_git_blob_sha,'8232d378195304f2a15aa76da8abf108d94f2c58');
assert.strictEqual(pins.reachability_runner_git_blob_sha,'42f2a4c27bec95394052fd080ce58bdf70db337b');
assert.strictEqual(pins.canonical_model_git_blob_sha,'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');
assert.strictEqual(pins.sim_core_git_blob_sha,'24777aac3577d442893e4779d70aee4e27761fe8');
assert.strictEqual(pins.integrity_git_blob_sha,'f23c68a6955832b70eeb3bd3e6893d71a3759018');

assert.strictEqual(report.status,'reference_free_reachability_passed');
assert.strictEqual(report.execution_repo_commit,'da177e90b270d0ed62f627ec1621f7fe2e2ed1ed');
assert.strictEqual(report.runtime_git_blob_sha,pins.runtime_git_blob_sha);
assert.strictEqual(report.model_git_blob_sha,pins.model_git_blob_sha);
assert.strictEqual(report.apparatus_git_blob_sha,pins.apparatus_git_blob_sha);
assert.strictEqual(report.reachability_runner_git_blob_sha,pins.reachability_runner_git_blob_sha);
assert.strictEqual(report.identity_panel.seeds.length,32);
assert.strictEqual(report.identity_panel.seeds[0],1333001);
assert.strictEqual(report.identity_panel.seeds[31],1333032);
assert.strictEqual(report.identity_panel.fixed_time_s,2);
assert.strictEqual(report.identity_panel.all_zero_dose_exact,true);
assert.strictEqual(report.identity_panel.all_kappa_zero_exact,true);
assert.strictEqual(report.identity_panel.all_nonzero_dose_speed_biology_exact,true);
assert.strictEqual(report.attraction_panel.trials_per_condition,400);
assert.deepStrictEqual(report.attraction_panel.seed_range,[1334001,1334400]);
assert.strictEqual(report.attraction_panel.common_random_numbers,true);
assert.strictEqual(report.structural_checks.overall_pass,true);
for(const [key,val] of Object.entries(report.structural_checks))assert.strictEqual(val,true,`P1 reachability structural check failed: ${key}`);

const z=report.attraction_panel.zero_dose,n=report.attraction_panel.nominal_dose,d=report.attraction_panel.differences;
assert(Math.abs(z.mean_central_zone_fraction-0.27026144848339956)<1e-15);
assert(Math.abs(n.mean_central_zone_fraction-0.3314171517139278)<1e-15);
assert(Math.abs(d.central_zone_fraction-0.06115570323052827)<1e-15);
assert(Math.abs(z.trail_axis_exit_rate-0.415)<1e-15);
assert(Math.abs(n.trail_axis_exit_rate-0.4775)<1e-15);
assert(Math.abs(d.trail_axis_exit_rate-0.0625)<1e-15);
assert(Math.abs(d.mean_moving_speed_mm_s-0.00035953480419337325)<1e-15);

for(const k of ['fit_performed','parameter_search_performed','reference_targets_accessed','reference_outcomes_accessed','ymaze_accessed','selection_performed','canonical_model_updated'])assert.strictEqual(report[k],false,`${k} must remain false`);
for(const k of ['fit_performed','parameter_search_performed','reference_targets_accessed','reference_outcomes_accessed','ymaze_accessed','selection_performed','canonical_model_updated'])assert.strictEqual(freeze.firewalls[k],false,`freeze firewall ${k} must remain false`);
assert.strictEqual(freeze.interpretation.engineering_values_may_be_retuned_from_this_outcome,false);
assert.strictEqual(freeze.interpretation.response_parameter_search_authorized,false);
assert.strictEqual(freeze.interpretation.canonical_promotion_authorized,false);
assert.strictEqual(freeze.interpretation.ymaze_unlock_authorized,false);

assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p1-official-reachability.yml')),'one-shot P1 reachability workflow must be absent after official execution');
assert.ok(!fs.existsSync(path.join(root,'.github','workflows','p1-install-reachability-result.yml')),'P1 result installer workflow must remove itself');

console.log('p1-reachability-result.test.js PASS '+JSON.stringify({freeze_blob:blob('hypotheses/p1_reachability_result_freeze_v1.json'),report_blob:blob('reports/p1_reference_free_reachability_v1.json'),status:report.status,central_zone_delta:d.central_zone_fraction,trail_axis_delta:d.trail_axis_exit_rate}));
