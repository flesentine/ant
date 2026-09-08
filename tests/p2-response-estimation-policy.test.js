'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const p=read('hypotheses/p2_response_estimation_v1.json');
assert.strictEqual(blob('hypotheses/p2_response_estimation_v1.json'),'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
assert.strictEqual(p.id,'P2_response_estimation_v1');
assert.strictEqual(p.status,'development_response_estimation_policy_frozen_before_estimator_implementation_or_response_target_semantic_access');

assert.strictEqual(p.frozen_inputs.candidate_class_evidence.git_blob_sha,'f7eb9fe38f8955c0227501e2d257ff32a40eaf74');
assert.strictEqual(p.frozen_inputs.mechanism_freeze.git_blob_sha,'70f51e5cab5db0024947ed71cf760590089f8aea');
assert.strictEqual(p.frozen_inputs.reachability_execution_policy.git_blob_sha,'8431ada87724953128104077f4ce1c11b569b1cf');
assert.strictEqual(p.frozen_inputs.implementation_authorization.git_blob_sha,'462997ea7399d98efca5a6b19a0e38160fbddbaf');
assert.strictEqual(p.frozen_inputs.reachability_result_freeze.git_blob_sha,'8dddaf083d4af046051fc1b7412b9f22cda8618a');
assert.strictEqual(p.frozen_inputs.reachability_report.git_blob_sha,'78a5e0ac4a3dd536a0e2d06ece2e9e37cdb2aefa');
assert.strictEqual(p.frozen_inputs.p2_runtime.git_blob_sha,'f91a2f7ede1b8119acc1fd57ac94a9718d074e15');
assert.strictEqual(p.frozen_inputs.p2_engineering_model.git_blob_sha,'7d3eecc44cb2eaf727249083a6fcfa21986fd475');
assert.strictEqual(p.frozen_inputs.p1_closure.p1_v1_closed,true);
assert.strictEqual(p.frozen_inputs.p1_closure.p1_rerun_authorized,false);
assert.strictEqual(p.frozen_inputs.response_target.git_blob_sha,'81910c5bd3ec7b1f7728c2c9f100b0e8a6db29ed');
assert.strictEqual(p.frozen_inputs.response_target.rows,102);
assert.match(p.frozen_inputs.response_target.use_rule,/must not parse target rows or response semantics/i);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.commit,'d35a1bb35bd508066bb62a3785b48b4e492cfa0a');
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.permanent_main_workflow_run_id,34089969439);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.test_job_id,101641287230);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.deploy_job_id,101641470203);
assert.strictEqual(p.frozen_inputs.main_checkpoint_before_policy.conclusion,'success');

const params=p.response_parameter_surface.estimated_parameters;
assert.deepStrictEqual(params.sigma_field_mm.bounds,[2,32]);
assert.strictEqual(params.sigma_field_mm.scale,'log');
assert.deepStrictEqual(params.kappa_trail_per_s.bounds,[0,16]);
assert.strictEqual(params.kappa_trail_per_s.nested_canonical_null_value,0);
assert.deepStrictEqual(params.p_lapse.bounds,[0,1]);
assert.strictEqual(params.p_lapse.scale,'linear');
assert.strictEqual(params.p_lapse.nested_no_lapse_value,0);
assert.strictEqual(params.p_lapse.all_lapse_canonical_endpoint,1);
assert.match(params.p_lapse.provenance,/full mathematical probability domain/i);
assert.deepStrictEqual(p.response_parameter_surface.estimated_parameter_names_exact,['sigma_field_mm','kappa_trail_per_s','p_lapse']);
assert.deepStrictEqual(p.response_parameter_surface.nuisance_parameters,[]);
assert.match(p.response_parameter_surface.sharing_rule,/all six colonies/i);
assert.match(p.response_parameter_surface.sharing_rule,/forbidden/i);

const nullDef=p.nested_models_and_comparators.exact_canonical_null;
assert.deepStrictEqual(nullDef.anchor,{sigma_field_mm:8,kappa_trail_per_s:0,p_lapse:0.2});
assert.strictEqual(nullDef.required_bit_identity,true);
assert.strictEqual(nullDef.positive_numeric_zero_required,true);
assert.match(p.nested_models_and_comparators.nested_no_lapse_submodel.definition,/p_lapse = 0/);
assert.match(p.nested_models_and_comparators.nested_no_lapse_submodel.definition,/bit-identical to the frozen P1 local-kernel trajectory/i);
assert.match(p.nested_models_and_comparators.nested_no_lapse_submodel.purpose,/beyond the best no-lapse local-kernel submodel/i);

assert.strictEqual(p.reference_partition.type,'leave_one_colony_out');
assert.deepStrictEqual(p.reference_partition.colonies,[0,7,16,20,21,27]);
assert.strictEqual(p.reference_partition.folds,6);
assert.match(p.reference_partition.colony_weighting_rule,/1\/5/);
assert.match(p.reference_partition.colony_weighting_rule,/1\/6/);
assert.deepStrictEqual(p.primary_fit_observables.map(x=>x.name),['middle_zone_fraction','trail_axis_exit']);
assert.strictEqual(p.primary_objective.candidate_ranking_uses_only_primary_objective,true);
assert.strictEqual(p.primary_objective.same_objective_for_P2_and_no_lapse_benchmark,true);
assert.deepStrictEqual(p.secondary_guard_observables,['time_to_exit_s','beeline_mm']);
assert.strictEqual(p.secondary_guard_policy.ranking_use,false);
assert.strictEqual(p.secondary_guard_policy.selection_use,false);
assert.strictEqual(p.secondary_guard_policy.sample_sd_denominator,'n-1');
assert(p.forbidden_fit_observables.includes('P2 engaged/lapsed assignment'));
assert(p.forbidden_fit_observables.includes('P2 response RNG U or response seed'));
assert(p.forbidden_fit_observables.includes('P1 official heldout relative-improvement values'));
assert(p.forbidden_fit_observables.includes('any Y-maze quantity'));

function halton(index,base){let f=1,r=0,i=index;while(i>0){f/=base;r+=f*(i%base);i=Math.floor(i/base);}return r;}
function sigmaFrom(u){return Math.exp(Math.log(2)+u*(Math.log(32)-Math.log(2)));}
function kappaFrom(u){return 16*u;}
const c1={sigma:sigmaFrom(halton(1,2)),kappa:kappaFrom(halton(1,3)),p:halton(1,5)};
const c2={sigma:sigmaFrom(halton(2,2)),kappa:kappaFrom(halton(2,3)),p:halton(2,5)};
assert(Math.abs(c1.sigma-8)<1e-12);
assert(Math.abs(c1.kappa-(16/3))<1e-12);
assert(Math.abs(c1.p-.2)<1e-12);
assert(Math.abs(c2.sigma-4)<1e-12);
assert(Math.abs(c2.kappa-(32/3))<1e-12);
assert(Math.abs(c2.p-.4)<1e-12);

const s=p.search_protocol;
assert.strictEqual(s.method,'deterministic 3D Halton low-discrepancy panel plus exact canonical null');
assert.strictEqual(s.candidate_budget_per_fold_total,1000);
assert.strictEqual(s.positive_P2_candidates,999);
assert.strictEqual(s.exact_canonical_null_candidates,1);
assert.deepStrictEqual(s.halton_mapping.map(x=>[x.prime,x.parameter]),[[2,'sigma_field_mm'],[3,'kappa_trail_per_s'],[5,'p_lapse']]);
assert.match(s.P2_candidate_panel_rule,/indices 1\.\.999/);
assert.strictEqual(s.nested_no_lapse_benchmark_panel.candidate_budget_per_fold_total,1000);
assert.strictEqual(s.nested_no_lapse_benchmark_panel.projected_no_lapse_candidates,999);
assert.match(s.nested_no_lapse_benchmark_panel.rule,/force p_lapse=0/);
assert.strictEqual(s.training_trials_per_treatment_path_per_candidate,60);
assert.strictEqual(s.heldout_evaluation_trials_per_treatment_path,120);
assert.strictEqual(s.physics_dt_s,.02);
assert.strictEqual(s.root_fit_seed,4210000);
assert.strictEqual(s.root_evaluation_seed,4810000);
assert.strictEqual(s.trial_seed_pairing.short_path_offset,0);
assert.strictEqual(s.trial_seed_pairing.long_path_offset,1000);
assert.match(s.response_rng_common_random_numbers,/exact same frozen response_seed and underlying U/i);
assert.strictEqual(s.common_random_numbers,true);
assert(s.search_firewall.some(x=>/No adaptive second-stage search/.test(x)));
assert(s.search_firewall.some(x=>/No Candidate B/.test(x)));
assert(s.search_firewall.some(x=>/No P1 failed-fold-driven refinement/.test(x)));

const cv=p.cross_validation_and_survival;
assert.strictEqual(cv.canonical_null_survival_guard.minimum_heldout_fold_wins,5);
assert.strictEqual(cv.canonical_null_survival_guard.folds_total,6);
assert.strictEqual(cv.canonical_null_survival_guard.median_relative_improvement_must_be_strictly_positive,true);
assert.strictEqual(cv.structural_increment_survival_guard.minimum_heldout_fold_wins_vs_selected_no_lapse_benchmark,5);
assert.strictEqual(cv.structural_increment_survival_guard.folds_total,6);
assert.strictEqual(cv.structural_increment_survival_guard.median_relative_improvement_vs_no_lapse_must_be_strictly_positive,true);
assert.match(cv.primary_survival_guard,/Both the canonical-null survival guard and the structural-increment survival guard must pass/);
assert.match(cv.failure_rule,/closes P2-v1 response estimation/);

const fin=p.final_all_data_fit;
assert.strictEqual(fin.authorized_only_if_both_survival_guards_pass,true);
assert.strictEqual(fin.training_trials_per_treatment_path_per_candidate,120);
assert.strictEqual(fin.fit_seed,5210000);
assert.strictEqual(fin.final_check_trials_per_treatment_path,240);
assert.strictEqual(fin.final_check_seed,5610000);
assert.match(fin.final_primary_increment_guard,/strictly lower than both selected no-lapse benchmark primary loss and exact canonical-null primary loss/);

const id=p.identifiability_guards;
assert.match(id.normalized_coordinates.p_lapse,/p_lapse=0/);
assert(id.requirements_for_parameter_promotion.some(x=>/best all-data projected no-lapse benchmark loss/.test(x)));
assert(id.requirements_for_parameter_promotion.some(x=>/at least 0\.02/.test(x)));
assert(id.requirements_for_parameter_promotion.some(x=>/span is <= 0\.60 for p_lapse/.test(x)));

assert.match(p.promotion_rule.P2_mechanism_survives_internal_development,/both 5-of-6 heldout survival guards/i);
assert.match(p.promotion_rule.fixed_P2_parameter_triple_eligible_for_future_freeze,/identifiability guards/i);
assert.strictEqual(p.promotion_rule.engineering_p_lapse_0_20_promoted_automatically,false);
assert.strictEqual(p.promotion_rule.canonical_locomotion_update_authorized,false);
assert.strictEqual(p.promotion_rule.Candidate_B_implementation_authorized,false);
assert.strictEqual(p.promotion_rule.ymaze_unlock_authorized,false);

assert.strictEqual(p.estimator_implementation_gate.estimator_status,'not_implemented_at_policy_freeze');
assert.strictEqual(p.estimator_implementation_gate.high_resolution_response_search_authorized,false);
assert.strictEqual(p.estimator_implementation_gate.response_target_semantic_access_authorized,false);
assert.match(p.estimator_implementation_gate.authorization_rule,/Only a later authorization artifact/);
for(const v of Object.values(p.global_firewalls))assert.strictEqual(v,false);

const estimatorPath=path.join(root,'tools','run-p2-estimation.js');
const laterEstimatorPresent=fs.existsSync(estimatorPath);
if(laterEstimatorPresent){
  assert.strictEqual(blob('tools/run-p2-estimation.js'),'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
  const est=require('../tools/run-p2-estimation.js');
  assert.strictEqual(est.POLICY_GIT_BLOB_SHA,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
}
const laterAuthorizationPath=path.join(root,'hypotheses','p2_highres_authorization_v1.json');
const laterAuthorizationPresent=fs.existsSync(laterAuthorizationPath);
if(laterAuthorizationPresent){
  assert.strictEqual(blob('hypotheses/p2_highres_authorization_v1.json'),'de361b15b9600bd92a35baf30fa71c2a7c61003c');
  const a=read('hypotheses/p2_highres_authorization_v1.json');
  assert.strictEqual(a.policy_git_blob_sha,'eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce');
  assert.strictEqual(a.estimator_git_blob_sha,'38d66d28e94d2f532e9c8a20bd6553d6d11be8a6');
  assert.strictEqual(a.effective_when_merged_to_main,true);
  assert.strictEqual(a.high_resolution_response_search_authorized,true);
  assert.strictEqual(a.ymaze_access_authorized,false);
}

console.log('p2-response-estimation-policy.test.js PASS '+JSON.stringify({
  policy_blob:blob('hypotheses/p2_response_estimation_v1.json'),
  parameters:p.response_parameter_surface.estimated_parameter_names_exact,
  candidates:s.candidate_budget_per_fold_total,
  nested_no_lapse_candidates:s.nested_no_lapse_benchmark_panel.candidate_budget_per_fold_total,
  fit_seed:s.root_fit_seed,
  eval_seed:s.root_evaluation_seed,
  dual_survival:true,
  historical_policy_freeze_estimator_exists:false,
  later_estimator_present:laterEstimatorPresent,
  target_semantics_authorized:false,
  ymaze:false
}));
