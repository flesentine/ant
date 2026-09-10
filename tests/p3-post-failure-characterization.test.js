'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const c=read('hypotheses/p3_post_failure_characterization_v1.json');
const r=read('reports/p3_response_estimation_1000x60_v1.json');
const m=read('hypotheses/p3_painted_trail_mechanism_v1.json');

assert.strictEqual(blob('hypotheses/p3_post_failure_characterization_v1.json'),'541259b5f26cc475997b7b1a03d6b6f3cba6a332');
assert.strictEqual(blob('reports/p3_response_estimation_1000x60_v1.json'),'264d822c7e6180dc0c9a3da1b8045df3f0e2a03d');
assert.strictEqual(blob('hypotheses/p3_response_estimation_result_freeze_v1.json'),'aa69afda6d80cc9d4ea0b563470cffdf0762b941');
assert.strictEqual(blob('hypotheses/p3_response_estimation_v1.json'),'d86eb9936e993d188f2a28faab838ba158c40f3b');
assert.strictEqual(blob('hypotheses/p3_painted_trail_mechanism_v1.json'),'5d00ce0058ff388c9f57d7dce56ce465d82c5765');

assert.strictEqual(c.id,'P3_post_failure_characterization_v1');
assert.strictEqual(c.status,'posthoc_descriptive_characterization_frozen_no_rescue_no_p4_authorization');
for(const [k,v] of Object.entries(c.analysis_firewall)){
  if(k==='rule')continue;
  assert.strictEqual(v,false,k+' must remain false');
}

assert.strictEqual(c.frozen_primary_outcome.heldout_wins_vs_exact_null,r.internal_cv.P3_wins_vs_exact_null);
assert.strictEqual(c.frozen_primary_outcome.heldout_wins_vs_selected_absolute_benchmark,r.internal_cv.P3_wins_vs_selected_absolute_benchmark);
assert.strictEqual(c.frozen_primary_outcome.folds_total,r.internal_cv.total_folds);
assert.strictEqual(c.frozen_primary_outcome.median_relative_improvement_vs_exact_null,r.internal_cv.median_relative_improvement_vs_exact_null);
assert.strictEqual(c.frozen_primary_outcome.median_relative_improvement_vs_absolute_benchmark,r.internal_cv.median_relative_improvement_vs_absolute_benchmark);
assert.strictEqual(c.frozen_primary_outcome.canonical_null_survival_guard_passed,r.internal_cv.canonical_null_survival_guard_passed);
assert.strictEqual(c.frozen_primary_outcome.structural_increment_survival_guard_passed,r.internal_cv.structural_increment_survival_guard_passed);
assert.strictEqual(c.frozen_primary_outcome.dual_survival_guard_passed,r.internal_cv.P3_dual_survival_guard_passed);
assert.strictEqual(c.frozen_primary_outcome.final_all_data_fit_executed,r.final_all_data_fit!==null);
assert.strictEqual(r.final_all_data_fit,null);

const trans=m.mechanism.relative_transduction;
assert.strictEqual(trans.equation,'W(L,R) = 0 if L+R <= 0; otherwise (R-L)/(R+L)');
assert.strictEqual(trans.epsilon_or_regularization,0);
assert.strictEqual(trans.threshold_parameter,null);
assert.match(trans.positive_scale_invariance,/W\(aL,aR\)=W\(L,R\)/);
assert.strictEqual(c.structural_mechanism_facts.epsilon_or_regularization,0);
assert.strictEqual(c.structural_mechanism_facts.threshold_parameter_present,false);
assert.strictEqual(c.structural_mechanism_facts.absolute_concentration_attenuation_present,false);

const median=a=>{const b=[...a].sort((x,y)=>x-y),n=b.length;return n%2?b[(n-1)/2]:(b[n/2-1]+b[n/2])/2};
const p3K=r.folds.map(f=>f.selected_P3_training_fit.candidate.kappa_trail_per_s);
const p3S=r.folds.map(f=>f.selected_P3_training_fit.candidate.sigma_field_mm);
const absK=r.folds.map(f=>f.selected_absolute_training_fit.candidate.kappa_trail_per_s);
assert.strictEqual(c.selected_candidate_descriptors.P3_kappa_trail_per_s.min,Math.min(...p3K));
assert.strictEqual(c.selected_candidate_descriptors.P3_kappa_trail_per_s.median,median(p3K));
assert.strictEqual(c.selected_candidate_descriptors.P3_kappa_trail_per_s.max,Math.max(...p3K));
assert.strictEqual(c.selected_candidate_descriptors.P3_sigma_field_mm.min,Math.min(...p3S));
assert.strictEqual(c.selected_candidate_descriptors.P3_sigma_field_mm.median,median(p3S));
assert.strictEqual(c.selected_candidate_descriptors.P3_sigma_field_mm.max,Math.max(...p3S));
assert.strictEqual(c.selected_candidate_descriptors.absolute_comparator_selected_kappa_trail_per_s.min,Math.min(...absK));
assert.strictEqual(c.selected_candidate_descriptors.absolute_comparator_selected_kappa_trail_per_s.median,median(absK));
assert.strictEqual(c.selected_candidate_descriptors.absolute_comparator_selected_kappa_trail_per_s.max,Math.max(...absK));
assert.deepStrictEqual(c.selected_candidate_descriptors.P3_distinct_selected_candidate_indices,[108,648,864]);

let globalAbsTopMin=Infinity;
for(const f of r.folds){
  for(const z of f.P3_training_top_candidates)
    assert(z.candidate.kappa_trail_per_s<1,'recorded P3 top-12 kappa must remain below 1/s');
  for(const z of f.absolute_training_top_candidates)
    globalAbsTopMin=Math.min(globalAbsTopMin,z.candidate.kappa_trail_per_s);
}
assert.strictEqual(c.selected_candidate_descriptors.P3_top12_kappa_by_fold.all_recorded_top12_candidates_below_1_per_s,true);
assert.strictEqual(c.selected_candidate_descriptors.absolute_comparator_top12_global_min_kappa_per_s,globalAbsTopMin);

for(const d of c.fold_descriptors){
  const f=r.folds.find(x=>x.held_out_colony===d.held_out_colony);
  assert(f,'missing fold '+d.held_out_colony);
  assert.strictEqual(d.selected_P3_sigma_field_mm,f.selected_P3_training_fit.candidate.sigma_field_mm);
  assert.strictEqual(d.selected_P3_kappa_trail_per_s,f.selected_P3_training_fit.candidate.kappa_trail_per_s);
  assert.strictEqual(d.selected_absolute_sigma_field_mm,f.selected_absolute_training_fit.candidate.sigma_field_mm);
  assert.strictEqual(d.selected_absolute_kappa_trail_per_s,f.selected_absolute_training_fit.candidate.kappa_trail_per_s);
  assert.strictEqual(d.P3_training_loss,f.selected_P3_training_fit.loss);
  assert.strictEqual(d.absolute_training_loss,f.selected_absolute_training_fit.loss);
  assert.strictEqual(d.P3_heldout_primary_loss,f.heldout_selected_P3.primary_loss);
  assert.strictEqual(d.absolute_heldout_primary_loss,f.heldout_selected_absolute_benchmark.primary_loss);
  assert.strictEqual(d.null_heldout_primary_loss,f.heldout_exact_null.primary_loss);
  assert.strictEqual(d.relative_improvement_vs_null,f.heldout_relative_improvement_vs_exact_null);
  assert.strictEqual(d.relative_improvement_vs_absolute,f.heldout_relative_improvement_vs_absolute_benchmark);
  assert(f.selected_absolute_training_fit.loss<f.selected_P3_training_fit.loss,'absolute comparator training loss must remain lower');
  assert.strictEqual(
    c.training_fit_descriptors.P3_to_absolute_training_loss_ratio_by_heldout_colony[String(d.held_out_colony)],
    f.selected_P3_training_fit.loss/f.selected_absolute_training_fit.loss
  );
}

const componentMean=(fitKey,pathLen,metric)=>{
  const a=r.folds.map(f=>f[fitKey].components.find(x=>x.path_length===pathLen&&x.metric===metric).error);
  return a.reduce((x,y)=>x+y,0)/a.length;
};
const p3Means=c.training_fit_descriptors.selected_P3_training_component_mean_error_across_folds;
assert.strictEqual(p3Means.short_middle_zone_fraction,componentMean('selected_P3_training_fit','s','middle_zone_fraction'));
assert.strictEqual(p3Means.short_trail_axis_exit,componentMean('selected_P3_training_fit','s','trail_axis_exit'));
assert.strictEqual(p3Means.long_middle_zone_fraction,componentMean('selected_P3_training_fit','l','middle_zone_fraction'));
assert.strictEqual(p3Means.long_trail_axis_exit,componentMean('selected_P3_training_fit','l','trail_axis_exit'));
const absMeans=c.training_fit_descriptors.selected_absolute_training_component_mean_error_across_folds;
assert.strictEqual(absMeans.short_middle_zone_fraction,componentMean('selected_absolute_training_fit','s','middle_zone_fraction'));
assert.strictEqual(absMeans.short_trail_axis_exit,componentMean('selected_absolute_training_fit','s','trail_axis_exit'));
assert.strictEqual(absMeans.long_middle_zone_fraction,componentMean('selected_absolute_training_fit','l','middle_zone_fraction'));
assert.strictEqual(absMeans.long_trail_axis_exit,componentMean('selected_absolute_training_fit','l','trail_axis_exit'));

const getRef=(colony,pathLen)=>{
  const f=r.folds.find(x=>x.held_out_colony===colony);
  return f.heldout_exact_null.primary_components.find(x=>x.path_length===pathLen&&x.metric==='trail_axis_exit').reference_contrast;
};
for(const [colony,val] of Object.entries(c.recorded_reference_contrast_heterogeneity.trail_axis_exit.short_path_by_colony))
  assert.strictEqual(val,getRef(Number(colony),'s'));
for(const [colony,val] of Object.entries(c.recorded_reference_contrast_heterogeneity.trail_axis_exit.long_path_by_colony))
  assert.strictEqual(val,getRef(Number(colony),'l'));

const f27=r.folds.find(x=>x.held_out_colony===27);
const c27=f27.heldout_selected_P3.primary_components.find(x=>x.path_length==='s'&&x.metric==='trail_axis_exit');
assert.strictEqual(c27.reference_contrast,-0.33333333333333337);
assert.strictEqual(c27.simulation_contrast,0.5583333333333333);
assert.strictEqual(c27.squared_error,0.7950694444444445);

assert.match(c.conclusions_forbidden.join(' '),/outlier/i);
assert.match(c.conclusions_forbidden.join(' '),/rerun/i);
assert.match(c.conclusions_forbidden.join(' '),/epsilon/i);
assert.match(c.conclusions_forbidden.join(' '),/absolute comparator should be promoted/i);
assert.match(c.conclusions_forbidden.join(' '),/P4 mechanism is selected/i);
assert.match(c.next_gate,/independent-evidence gate/i);
assert.match(c.next_gate,/must not use P3 target-ranked outcomes to tune/i);

console.log('p3-post-failure-characterization.test.js PASS '+JSON.stringify({
  characterization_blob:blob('hypotheses/p3_post_failure_characterization_v1.json'),
  wins_vs_null:r.internal_cv.P3_wins_vs_exact_null,
  wins_vs_absolute:r.internal_cv.P3_wins_vs_selected_absolute_benchmark,
  median_kappa:median(p3K),
  distinct_selected_candidates:[...new Set(r.folds.map(f=>f.selected_P3_training_fit.candidate_index))],
  p4_selected:false
}));
