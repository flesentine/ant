'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const freeze=read('hypotheses/p1_painted_trail_response_evidence_v1.json');
const target=read('reference/poissonnier2026_pheromone_response_targets.json');
const calibration=read('reference/calibration_manifest.json');
const p1cal=read('reference/p1_painted_trail_calibration_policy_v1.json');

assert.strictEqual(blob('hypotheses/p1_painted_trail_response_evidence_v1.json'),'13ade699b67402cf146d653f0c6342ee8fc450fc','P1 evidence freeze blob drifted');
assert.strictEqual(blob('reference/poissonnier2026_pheromone_response_targets.json'),'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed','P1 target blob drifted');
assert.strictEqual(blob('tools/derive-pheromone-response-targets.py'),'d44fee2d176eb6dcdfea625d4280059d499cf80b','P1 target generator drifted');
assert.strictEqual(blob('reference/calibration_manifest.json'),'29044577af38dced5cccb83c687117ee878fd66c','historical calibration manifest drifted');
assert.strictEqual(blob('reference/p1_painted_trail_calibration_policy_v1.json'),'ec282928a095467c1082a25e0396c390c17cbdb8','P1 calibration addendum drifted');

assert.strictEqual(freeze.id,'P1_painted_trail_response_evidence_v1');
assert.strictEqual(freeze.status,'evidence_and_protocol_frozen_before_sensor_mechanism_implementation_or_parameter_search');
assert.strictEqual(freeze.source.source_xlsx_sha256,'b311d5fdc89eac56724bb5195743cf4bb52a6cff4040b18704353091e1fe6318');
assert.strictEqual(freeze.source.target_git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(freeze.source.target_generator_git_blob_sha,'d44fee2d176eb6dcdfea625d4280059d499cf80b');
assert.strictEqual(freeze.source.calibration_manifest_git_blob_sha,'29044577af38dced5cccb83c687117ee878fd66c');
assert.strictEqual(freeze.source.response_calibration_policy_git_blob_sha,'ec282928a095467c1082a25e0396c390c17cbdb8');
assert.strictEqual(freeze.published_painted_trail_protocol.pheromone_solution.gland_equivalents_per_ml,4);
assert.strictEqual(freeze.published_painted_trail_protocol.open_arena_application.nominal_solution_volume_ul,36);
assert.strictEqual(freeze.published_painted_trail_protocol.open_arena_application.nominal_line_length_mm,300);
assert.strictEqual(freeze.published_painted_trail_protocol.open_arena_application.nominal_solution_ul_per_cm,1.2);
assert.strictEqual(freeze.published_painted_trail_protocol.open_arena_application.nominal_hindgut_equivalents_per_cm,0.0048);
assert.deepStrictEqual(freeze.published_painted_trail_protocol.antlab_coordinate_representation.line_segment_mm,{x1:0,y1:105,x2:297,y2:105});
assert.strictEqual(freeze.response_estimation_firewall.baseline_locomotion_parameters_fixed,true);
assert.strictEqual(freeze.response_estimation_firewall.H2_H3_H4_H5_parameters_fixed_and_not_reopened,true);
assert.strictEqual(freeze.response_estimation_firewall.shared_response_parameters_across_short_and_long,true);
assert.strictEqual(freeze.response_estimation_firewall.treatment_specific_or_path_specific_response_parameters_forbidden,true);
assert.strictEqual(freeze.response_estimation_firewall.ymaze_access_for_fitting_ranking_stopping_or_model_selection,false);
assert.strictEqual(freeze.response_estimation_firewall.ymaze_holdout_remains_locked,true);
assert.strictEqual(freeze.implementation_gate.chemical_sensor_code_authorized,false);
assert.strictEqual(freeze.implementation_gate.response_parameter_search_authorized,false);
for(const v of Object.values(freeze.not_yet_frozen))assert.strictEqual(v,true);

assert.strictEqual(target.source_xlsx_sha256,'b311d5fdc89eac56724bb5195743cf4bb52a6cff4040b18704353091e1fe6318');
assert.strictEqual(target.status,'development_response_estimation_only_not_external_validation');
assert.strictEqual(target.rows.length,102);
assert.deepStrictEqual(target.treatment_groups,{dcm_control_long:26,dcm_control_short:25,pheromone_long:25,pheromone_short:26});
assert.deepStrictEqual([...new Set(target.rows.map(r=>r.colony))].sort((a,b)=>a-b),[0,7,16,20,21,27]);
assert.deepStrictEqual(target.primary_response_observables,['middle_zone_fraction','trail_axis_exit']);
assert.deepStrictEqual(target.secondary_guard_observables,['time_to_exit_s','beeline_mm']);
assert.ok(target.excluded_from_response_estimation.includes('Average_Speed_Moving'));
assert.ok(target.excluded_from_response_estimation.includes('Straightness'));
assert.match(target.contrast_rule,/within each path-length stratum/);
for(const r of target.rows){
  assert.ok(['s','l'].includes(r.path_length));
  assert.ok(['dcm_control','pheromone'].includes(r.treatment));
  assert.strictEqual(r.trail_present,r.treatment==='pheromone');
  assert.ok(['left','right','top','bottom'].includes(r.exit_edge));
  assert.strictEqual(r.trail_axis_exit,['left','right'].includes(r.exit_edge));
  assert(r.middle_zone_fraction>=0&&r.middle_zone_fraction<=1);
}

const mean=(t,p,k)=>{const a=target.rows.filter(r=>r.treatment===t&&r.path_length===p);return a.reduce((s,r)=>s+(typeof r[k]==='boolean'?(r[k]?1:0):r[k]),0)/a.length;};
assert(Math.abs(mean('dcm_control','s','middle_zone_fraction')-0.23722146122573837)<1e-15);
assert(Math.abs(mean('dcm_control','l','middle_zone_fraction')-0.23178885330710766)<1e-15);
assert(Math.abs(mean('pheromone','s','middle_zone_fraction')-0.5389219360790827)<1e-15);
assert(Math.abs(mean('pheromone','l','middle_zone_fraction')-0.4713420196066253)<1e-15);
assert(Math.abs(mean('dcm_control','s','trail_axis_exit')-0.64)<1e-15);
assert(Math.abs(mean('dcm_control','l','trail_axis_exit')-(10/26))<1e-15);
assert(Math.abs(mean('pheromone','s','trail_axis_exit')-(22/26))<1e-15);
assert(Math.abs(mean('pheromone','l','trail_axis_exit')-0.68)<1e-15);

assert.strictEqual(calibration.schema_version,5);
assert.strictEqual(calibration.datasets.poissonnier2026_open_arena.allowed_for_fitting,false);
assert.strictEqual(calibration.datasets.poissonnier2026_ymaze.allowed_for_development_parameter_estimation,false);
assert.strictEqual(p1cal.status,'development_response_estimation_scope_frozen_without_mutating_historical_calibration_manifest');
assert.strictEqual(p1cal.base_calibration_manifest.git_blob_sha,'29044577af38dced5cccb83c687117ee878fd66c');
assert.strictEqual(p1cal.response_target.git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(p1cal.allowed_for_canonical_biological_fitting,false);
assert.strictEqual(p1cal.allowed_for_development_painted_trail_response_estimation,true);
assert(p1cal.constraints.some(x=>/Baseline locomotion.*H2\/H3\/H4\/H5/i.test(x)));
assert(p1cal.constraints.some(x=>/pheromone-vs-DCM treatment contrasts within each path-length stratum/i.test(x)));
assert.strictEqual(p1cal.ymaze.allowed_for_p1_model_selection,false);
assert.strictEqual(p1cal.implementation_gate.chemical_sensor_code_authorized,false);
assert.strictEqual(p1cal.implementation_gate.response_parameter_search_authorized,false);

assert.ok(!fs.existsSync(path.join(root,'src','p1.js')),'P1 chemical sensor code must not exist at the evidence-freeze gate');
assert.ok(!fs.existsSync(path.join(root,'models','lasius_niger_painted_trail_p1_v1.json')),'P1 model must not exist at the evidence-freeze gate');

console.log('p1-painted-trail-evidence.test.js PASS '+JSON.stringify({evidence_blob:blob('hypotheses/p1_painted_trail_response_evidence_v1.json'),target_blob:blob('reference/poissonnier2026_pheromone_response_targets.json'),rows:target.rows.length}));
