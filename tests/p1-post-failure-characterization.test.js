'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const c=read('hypotheses/p1_post_failure_characterization_v1.json');
const r=read('reports/p1_response_estimation_500x60_v1.json');

assert.strictEqual(blob('hypotheses/p1_post_failure_characterization_v1.json'),'1befbcb097959ba698d316adea1eb0c735eccc7f');
assert.strictEqual(blob('reports/p1_response_estimation_500x60_v1.json'),'561aca4a14346ebb4f062f30d0438d3115784172');
assert.strictEqual(c.status,'posthoc_descriptive_characterization_frozen_no_rescue_no_p2_authorization');
assert.strictEqual(c.frozen_inputs.official_report.git_blob_sha,'561aca4a14346ebb4f062f30d0438d3115784172');
assert.strictEqual(c.frozen_inputs.result_freeze.git_blob_sha,'1d99ebfaa378aeb1b98963f63b3a513a616a6617');
assert.strictEqual(c.frozen_inputs.response_estimation_policy.git_blob_sha,'628d17f6eb69fd11216aff33d1356d184365aedd');

for(const [k,v] of Object.entries(c.analysis_firewall)){
  if(k==='rule')continue;
  assert.strictEqual(v,false,k+' must remain false');
}
assert.strictEqual(c.frozen_primary_outcome.heldout_wins_vs_exact_null,r.internal_cv.P1_wins_vs_exact_null);
assert.strictEqual(c.frozen_primary_outcome.folds_total,r.internal_cv.total_folds);
assert.strictEqual(c.frozen_primary_outcome.primary_survival_guard_passed,r.internal_cv.P1_survival_guard_passed);
assert.strictEqual(c.frozen_primary_outcome.median_relative_improvement_vs_exact_null,r.internal_cv.median_relative_improvement_vs_exact_null);
assert.strictEqual(c.frozen_primary_outcome.final_all_data_fit_executed,r.final_all_data_fit!==null);
assert.strictEqual(r.final_all_data_fit,null);

assert.deepStrictEqual(c.fold_descriptors.map(x=>x.held_out_colony),r.folds.map(x=>x.held_out_colony));
for(const d of c.fold_descriptors){
  const f=r.folds.find(x=>x.held_out_colony===d.held_out_colony);
  assert(f,'missing fold '+d.held_out_colony);
  assert.strictEqual(d.selected_sigma_field_mm,f.selected_training_fit.candidate.sigma_field_mm);
  assert.strictEqual(d.selected_kappa_trail_per_s,f.selected_training_fit.candidate.kappa_trail_per_s);
  assert.strictEqual(d.heldout_relative_improvement_vs_exact_null,f.heldout_relative_improvement_vs_exact_null);
}

const getRef=(colony,pathLen)=>{
  const f=r.folds.find(x=>x.held_out_colony===colony);
  return f.heldout_selected.primary_components.find(x=>x.path_length===pathLen&&x.metric==='trail_axis_exit').reference_contrast;
};
for(const [colony,val] of Object.entries(c.recorded_reference_contrast_heterogeneity.trail_axis_exit.short_path_by_colony))
  assert.strictEqual(val,getRef(Number(colony),'s'));
for(const [colony,val] of Object.entries(c.recorded_reference_contrast_heterogeneity.trail_axis_exit.long_path_by_colony))
  assert.strictEqual(val,getRef(Number(colony),'l'));

assert.match(c.conclusions_forbidden.join(' '),/outlier/i);
assert.match(c.conclusions_forbidden.join(' '),/rerun/i);
assert.match(c.next_gate,/independently grounded P2 evidence gate/i);

console.log('p1-post-failure-characterization.test.js PASS '+JSON.stringify({
  characterization_blob:blob('hypotheses/p1_post_failure_characterization_v1.json'),
  wins:r.internal_cv.P1_wins_vs_exact_null,
  median:r.internal_cv.median_relative_improvement_vs_exact_null,
  folds:r.folds.length,
  p2_selected:false
}));
