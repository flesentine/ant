'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const blob=p=>execFileSync('git',['hash-object',p],{cwd:root,encoding:'utf8'}).trim();

const interpretationRel='hypotheses/p4_Y_maze_consistency_stage_B_interpretation_v1.json';
const freezeRel='hypotheses/p4_Y_maze_consistency_stage_B_result_freeze_v1.json';
const reportRel='reports/frozen/p4_ymaze_consistency_comparison_v1.json';
const provenanceRel='reports/frozen/p4_ymaze_consistency_stage_B_execution_provenance_v1.json';
const transientReport='reports/p4_ymaze_consistency_comparison_v1.json';
const transientProvenance='reports/p4_ymaze_consistency_stage_B_execution_provenance_v1.json';
const runtimeAuth='hypotheses/p4_Y_maze_consistency_stage_B_authorization_v1.json';

assert.strictEqual(blob(interpretationRel),'6a9d837c81aa10fd8f53095fea0de7da2551c635','Stage-B interpretation blob drift');
assert.strictEqual(blob(freezeRel),'0a17dd6d536e3ccc9487afe44ec3daeb24454b94','Stage-B result-freeze blob drift');
assert.strictEqual(blob(reportRel),'afaf2603bbd4a02f19bfe5aebc5f932a1e0c1615','frozen Stage-B report blob drift');
assert.strictEqual(blob(provenanceRel),'55e7894b71b064fdaf5ee5b7812d632231eb29dc','frozen Stage-B provenance blob drift');
assert.ok(!fs.existsSync(path.join(root,transientReport)),'transient Stage-B report must remain absent');
assert.ok(!fs.existsSync(path.join(root,transientProvenance)),'transient Stage-B provenance must remain absent');
assert.ok(!fs.existsSync(path.join(root,runtimeAuth)),'runtime Stage-B authorization must remain absent');

const i=read(interpretationRel),f=read(freezeRel),r=read(reportRel);
assert.strictEqual(i.id,'P4_Y_maze_consistency_stage_B_interpretation_v1');
assert.strictEqual(i.status,'frozen_stage_B_descriptive_interpretation_only_canonical_promotion_locked');
assert.strictEqual(i.lineage.stage_B_result_freeze_file,freezeRel);
assert.strictEqual(i.lineage.stage_B_result_freeze_git_blob_sha,blob(freezeRel));
assert.strictEqual(i.lineage.frozen_stage_B_report_file,reportRel);
assert.strictEqual(i.lineage.frozen_stage_B_report_git_blob_sha,blob(reportRel));
assert.strictEqual(i.lineage.frozen_stage_B_provenance_file,provenanceRel);
assert.strictEqual(i.lineage.frozen_stage_B_provenance_git_blob_sha,blob(provenanceRel));
assert.strictEqual(i.lineage.qualified_result_freeze_main_commit,'30d36ce51a70c040bd6d7aeb8fe78cb52c48b0e4');
assert.strictEqual(i.lineage.qualified_result_freeze_main_run_id,34905959389);
assert.strictEqual(i.lineage.qualified_result_freeze_main_run_number,173);
assert.strictEqual(i.lineage.qualified_result_freeze_test_job_id,104182545484);
assert.strictEqual(i.lineage.qualified_result_freeze_deploy_job_id,104182750584);

assert.strictEqual(i.interpretation_scope.source,'exact_frozen_seven_row_stage_B_report_only');
for(const [k,v] of Object.entries(i.interpretation_scope))if(k!=='source')assert.strictEqual(v,false,k+' must remain false');
assert.strictEqual(r.row_count,7);
assert.strictEqual(r.rows.length,7);
assert.strictEqual(i.frozen_descriptive_findings.row_count,7);

const diffs=r.rows.map(x=>x.signed_difference_model_minus_observed);
const abs=r.rows.map(x=>x.absolute_difference);
assert.ok(r.rows.every(x=>x.model_prediction>0.5),'all frozen model predictions should favor the marked arm');
assert.ok(r.rows.every(x=>x.observed_rate>0.5),'all frozen observed rates should favor the marked arm');
assert.ok(diffs.every(x=>x<0),'every model-minus-observed discrepancy must be negative');
assert.strictEqual(i.frozen_descriptive_findings.all_model_predictions_above_neutral_half,true);
assert.strictEqual(i.frozen_descriptive_findings.all_observed_rates_above_neutral_half,true);
assert.strictEqual(i.frozen_descriptive_findings.all_signed_differences_model_minus_observed_negative,true);

const overall=r.rows.find(x=>x.id==='overall');
assert.deepStrictEqual(i.frozen_descriptive_findings.overall,{
  model_prediction:overall.model_prediction,
  observed_rate:overall.observed_rate,
  signed_difference_model_minus_observed:overall.signed_difference_model_minus_observed,
  absolute_difference:overall.absolute_difference,
  percentage_point_gap:overall.absolute_difference*100
});
const min=Math.min(...abs),max=Math.max(...abs);
assert.strictEqual(i.frozen_descriptive_findings.absolute_difference_range.minimum,min);
assert.strictEqual(i.frozen_descriptive_findings.absolute_difference_range.minimum_row,r.rows[abs.indexOf(min)].id);
assert.strictEqual(i.frozen_descriptive_findings.absolute_difference_range.maximum,max);
assert.strictEqual(i.frozen_descriptive_findings.absolute_difference_range.maximum_row,r.rows[abs.indexOf(max)].id);
const mean=x=>x.reduce((a,b)=>a+b,0)/x.length;
const d=i.frozen_descriptive_findings.diagnostic_equal_row_weight_summary;
assert.strictEqual(d.role,'descriptive_diagnostic_only_not_a_predeclared_validation_metric');
assert.strictEqual(d.mean_signed_difference_model_minus_observed,mean(diffs));
assert.strictEqual(d.mean_absolute_difference,mean(abs));
assert.strictEqual(d.direction_experience_rows_mean_absolute_difference,mean(abs.slice(1,5)));
assert.strictEqual(d.pheromone_side_rows_mean_absolute_difference,mean(abs.slice(5,7)));

assert.strictEqual(i.scientific_interpretation.qualitative_preference_direction,'consistent_with_observed_marked_arm_preference_across_all_predeclared_rows');
assert.strictEqual(i.scientific_interpretation.quantitative_effect_magnitude,'systematically_weaker_than_observed_across_all_predeclared_rows');
assert.strictEqual(i.scientific_interpretation.what_this_supports,'descriptive_cross_apparatus_consistency_in_preference_direction');
assert.ok(i.scientific_interpretation.what_this_does_not_support.includes('canonical promotion'));
assert.ok(i.scientific_interpretation.what_this_does_not_support.includes('an external-validation claim'));

assert.strictEqual(i.decision.validation_pass_fail_threshold,null);
assert.strictEqual(i.decision.validation_pass_fail_verdict,null);
assert.strictEqual(i.decision.canonical_update_authorized,false);
assert.strictEqual(i.decision.candidate_307_promoted,false);
assert.strictEqual(i.decision.candidate_307_rejected,false);
assert.strictEqual(i.decision.candidate_307_retuning_authorized,false);
assert.strictEqual(i.decision.stage_B_result_must_remain_exactly_frozen,true);
assert.strictEqual(f.result_immutability.valid_stage_B_rerun_authorized,false);

assert.strictEqual(i.next_gate.id,'P4_external_validation_source_discovery_v1');
assert.strictEqual(i.next_gate.source_must_be_independent_of_current_fit_and_same_study_Y_maze_summary,true);
assert.strictEqual(i.next_gate.source_selection_may_not_optimize_for_candidate_307,true);
assert.strictEqual(i.next_gate.candidate_or_protocol_change_before_source_freeze_authorized,false);
assert.strictEqual(i.next_gate.canonical_promotion_before_independent_validation_authorized,false);

console.log('p4-ymaze-consistency-stage-B-interpretation.test.js PASS '+JSON.stringify({interpretation_blob:blob(interpretationRel),freeze_blob:blob(freezeRel),report_blob:blob(reportRel),all_signed_differences_negative:true,overall_gap:overall.absolute_difference,mean_absolute_difference:mean(abs),minimum_gap:min,maximum_gap:max,validation_verdict:null,canonical_promotion:false,next_gate:i.next_gate.id}));
