'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const e=read('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json');
assert.strictEqual(blob('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json'),'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
assert.strictEqual(e.status,'candidate_class_evidence_frozen_no_mechanism_selected_no_implementation_authorized');
assert.strictEqual(e.p1_dependency_boundary.p1_closed,true);
assert.strictEqual(e.p1_dependency_boundary.p1_rerun_authorized,false);
assert.strictEqual(e.p1_dependency_boundary.p1_result_freeze_git_blob_sha,'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(e.p1_dependency_boundary.p1_official_report_git_blob_sha,'561aca4a14346ebb4f062f30d0438d3115784172');

const sources=Object.fromEntries(e.independent_sources.map(s=>[s.source_id,s]));
assert.strictEqual(sources.koch_czaczkes_2021_lasius_niger_lapses.species,'Lasius niger');
assert.strictEqual(sources.koch_czaczkes_2021_lasius_niger_lapses.doi,'10.1111/een.12995');
assert.match(sources.koch_czaczkes_2021_lasius_niger_lapses.evidence_relevant_to_future_mechanism.join(' '),/around 20%/i);
assert.match(sources.koch_czaczkes_2021_lasius_niger_lapses.evidence_relevant_to_future_mechanism.join(' '),/not repeatable/i);

assert.strictEqual(sources.perna_et_al_2012_linepithema_weber.species,'Linepithema humile');
assert.strictEqual(sources.perna_et_al_2012_linepithema_weber.pubmed_id,'22829756');
assert.match(sources.perna_et_al_2012_linepithema_weber.evidence_relevant_to_future_mechanism.join(' '),/Weber/i);
assert.match(sources.perna_et_al_2012_linepithema_weber.forbidden_inference,/cross-species/i);

assert.strictEqual(sources.poissonnier_et_al_2026_lasius_niger_context.species,'Lasius niger');
assert.strictEqual(sources.poissonnier_et_al_2026_lasius_niger_context.doi,'10.1007/s00040-026-01106-9');
assert.match(sources.poissonnier_et_al_2026_lasius_niger_context.allowed_inference,/should not add path-history, travel-direction, or recent-food-experience/i);

assert.deepStrictEqual(e.candidate_mechanism_classes.map(x=>x.status),['plausible_class_not_selected','plausible_class_not_selected']);
assert.strictEqual(e.selection_firewall.candidate_class_selected,false);
assert.strictEqual(e.selection_firewall.p2_hypothesis_record_exists,false);
assert.strictEqual(e.selection_firewall.p2_runtime_authorized,false);
assert.strictEqual(e.selection_firewall.p2_parameter_policy_authorized,false);
assert.strictEqual(e.selection_firewall.p2_reference_target_search_authorized,false);
assert.strictEqual(e.selection_firewall.new_simulation_authorized,false);
assert.strictEqual(e.selection_firewall.ymaze_access_authorized,false);

const forbiddenPaths=[
  'hypotheses/p2_painted_trail_mechanism_v1.json',
  'hypotheses/p2_response_estimation_v1.json',
  'hypotheses/p2_highres_authorization_v1.json',
  'models/lasius_niger_painted_trail_p2_v1.json',
  'src/p2.js',
  'tools/run-p2-estimation.js'
];
for(const p of forbiddenPaths)assert.ok(!fs.existsSync(path.join(root,p)),p+' must not exist at evidence gate');

const neg=Object.fromEntries(e.negative_candidate_classes.map(x=>[x.class_id,x]));
assert.match(neg.path_history_direction_recent_experience_modulation.status,/not_independently_supported/);
assert.match(neg.stable_specialist_pheromone_ignorer_identity.status,/contradicted/);

console.log('p2-candidate-class-evidence.test.js PASS '+JSON.stringify({
  evidence_blob:blob('hypotheses/p2_painted_trail_candidate_class_evidence_v1.json'),
  sources:e.independent_sources.length,
  plausible_classes:e.candidate_mechanism_classes.length,
  selected:false,
  implementation_authorized:false,
  ymaze_authorized:false
}));
