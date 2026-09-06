'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const p=read('hypotheses/p1_response_estimation_v1.json');

assert.strictEqual(blob('hypotheses/p1_response_estimation_v1.json'),'50e00ed729d5f8421f55dcd763f27899f9f2fc8b','P1 response-estimation policy drifted');
assert.strictEqual(p.id,'P1_response_estimation_v1');
assert.strictEqual(p.status,'development_response_estimation_policy_frozen_before_estimator_implementation_or_parameter_search');

assert.strictEqual(p.frozen_inputs.evidence_freeze.git_blob_sha,'db89c879906aa1f35dc1d395cc3ebbb661b218b6');
assert.strictEqual(p.frozen_inputs.response_calibration_policy.git_blob_sha,'ec282928a095467c1082a25e0396c390c17cbdb8');
assert.strictEqual(p.frozen_inputs.response_target.git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(p.frozen_inputs.response_target.rows,102);
assert.strictEqual(p.frozen_inputs.mechanism_freeze.git_blob_sha,'90e86bce29bf45c6e390f7046a6c25a74f409c78');
assert.strictEqual(p.frozen_inputs.reachability_result_freeze.git_blob_sha,'e9187ff27fb04015ded038a5f98354995455e377');
assert.strictEqual(p.frozen_inputs.p1_runtime.git_blob_sha,'f8d8e07c92a2fe4ebdbfd640827fe4b5a489e8ca');
assert.strictEqual(p.frozen_inputs.p1_engineering_model.git_blob_sha,'73873fd6763838423ca27648136bb0b9ff062817');
assert.strictEqual(p.frozen_inputs.p1_apparatus.git_blob_sha,'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4');
assert.strictEqual(p.frozen_inputs.canonical_locomotion_model.git_blob_sha,'2fde196d6c8a9353c1c8c206d4fcef223e92ad1d');
assert.strictEqual(p.frozen_inputs.canonical_runtime.sim_core_git_blob_sha,'24777aac3577d442893e4779d70aee4e27761fe8');
assert.strictEqual(p.frozen_inputs.canonical_runtime.integrity_git_blob_sha,'f23c68a6955832b70eeb3bd3e6893d71a3759018');

assert.deepStrictEqual(p.response_parameter_surface.estimated_parameter_names_exact,['sigma_field_mm','kappa_trail_per_s']);
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameters.sigma_field_mm.bounds,[2,32]);
assert.strictEqual(p.response_parameter_surface.estimated_parameters.sigma_field_mm.scale,'log');
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.bounds,[0,16]);
assert.strictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.scale,'linear');
assert.strictEqual(p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.nested_null_value,0);
assert.deepStrictEqual(p.response_parameter_surface.nuisance_parameters,[]);

assert.strictEqual(p.exact_nested_null.null_anchor.sigma_field_mm,8);
assert.strictEqual(p.exact_nested_null.null_anchor.kappa_trail_per_s,0);
assert.strictEqual(p.exact_nested_null.required_bit_identity,true);
assert.strictEqual(p.exact_nested_null.positive_numeric_zero_required,true);

assert.deepStrictEqual(p.reference_partition.colonies,[0,7,16,20,21,27]);
assert.strictEqual(p.reference_partition.folds,6);
assert.deepStrictEqual(p.contrast_definition.paths,['s','l']);
assert.deepStrictEqual(p.contrast_definition.treatments,['dcm_control','pheromone']);
assert.match(p.contrast_definition.reference_contrast,/pheromone summary - reference DCM summary/);
assert.match(p.contrast_definition.simulation_contrast,/nominal-pheromone summary - simulated DCM summary/);

assert.deepStrictEqual(p.primary_fit_observables.map(x=>x.name),['middle_zone_fraction','trail_axis_exit']);
assert.strictEqual(p.primary_objective.candidate_ranking_uses_only_primary_objective,true);
assert.match(p.primary_objective.aggregation,/four squared component errors/);
assert.deepStrictEqual(p.secondary_guard_observables,['time_to_exit_s','beeline_mm']);
assert.strictEqual(p.secondary_guard_policy.ranking_use,false);
assert.strictEqual(p.secondary_guard_policy.selection_use,false);
assert.match(p.secondary_guard_policy.final_promotion_guard,/<= 1.0/);

for(const forbidden of ['Average_Speed_Moving','Traveled_Dist_Moving','Straightness','Prop_time_moving','Average_Speed','Traveled_Dist','any Y-maze quantity']){
  assert(p.forbidden_fit_observables.includes(forbidden),forbidden+' must remain forbidden');
}

assert.strictEqual(p.search_protocol.candidate_budget_per_fold_total,500);
assert.strictEqual(p.search_protocol.positive_context_candidates,499);
assert.strictEqual(p.search_protocol.exact_null_anchor_candidates,1);
assert.strictEqual(p.search_protocol.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(p.search_protocol.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(p.search_protocol.physics_dt_s,0.02);
assert.strictEqual(p.search_protocol.root_fit_seed,2210000);
assert.strictEqual(p.search_protocol.root_evaluation_seed,2810000);
assert.strictEqual(p.search_protocol.common_random_numbers,true);
assert.deepStrictEqual(p.search_protocol.halton_mapping.map(x=>[x.prime,x.parameter]),[[2,'sigma_field_mm'],[3,'kappa_trail_per_s']]);

assert.strictEqual(p.cross_validation_and_survival.primary_survival_guard.minimum_heldout_fold_wins,5);
assert.strictEqual(p.cross_validation_and_survival.primary_survival_guard.folds_total,6);
assert.strictEqual(p.cross_validation_and_survival.primary_survival_guard.median_relative_improvement_must_be_strictly_positive,true);

assert.strictEqual(p.final_all_data_fit.authorized_only_if_primary_survival_guard_passes,true);
assert.strictEqual(p.final_all_data_fit.training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(p.final_all_data_fit.fit_seed,3210000);
assert.strictEqual(p.final_all_data_fit.final_check_trials_per_treatment_path,240);
assert.strictEqual(p.final_all_data_fit.final_check_seed,3610000);

assert.strictEqual(p.promotion_rule.canonical_locomotion_update_authorized,false);
assert.strictEqual(p.promotion_rule.ymaze_unlock_authorized,false);
assert.strictEqual(p.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
assert.strictEqual(p.estimator_implementation_gate.high_resolution_response_search_authorized,false);

for(const [k,v] of Object.entries(p.global_firewalls))assert.strictEqual(v,false,'firewall '+k+' must remain false');

assert.ok(!fs.existsSync(path.join(root,'tools','run-p1-estimation.js')),'P1 estimator must not exist at policy-freeze checkpoint');
assert.ok(!fs.existsSync(path.join(root,'hypotheses','p1_highres_authorization_v1.json')),'P1 high-resolution authorization must not exist at policy-freeze checkpoint');

const runtime=fs.readFileSync(path.join(root,'src','p1.js'),'utf8');
assert.ok(!runtime.includes('poissonnier2026_pheromone_response_targets.json'),'P1 runtime must not load response target');
assert.ok(!/(?:loadBundle|readJson|require)\s*\([^\n)]*y[_-]?maze/i.test(runtime),'P1 runtime must not load Y-maze content');

console.log('p1-response-estimation-policy.test.js PASS '+JSON.stringify({
  policy_blob:blob('hypotheses/p1_response_estimation_v1.json'),
  sigma_bounds:p.response_parameter_surface.estimated_parameters.sigma_field_mm.bounds,
  kappa_bounds:p.response_parameter_surface.estimated_parameters.kappa_trail_per_s.bounds,
  candidates:p.search_protocol.candidate_budget_per_fold_total,
  folds:p.reference_partition.folds,
  highres_authorized:p.estimator_implementation_gate.high_resolution_response_search_authorized,
  ymaze_authorized:p.promotion_rule.ymaze_unlock_authorized
}));
