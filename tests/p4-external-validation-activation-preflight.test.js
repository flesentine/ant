'use strict';

const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawnSync}=require('child_process');
const preflight=require('../tools/check-p4-external-validation-activation.js');

const root=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ant-p4-activation-'));

function write(name,value){
  const p=path.join(tmp,name);
  fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n');
  return p;
}
function clone(v){return JSON.parse(JSON.stringify(v));}

const collectorTemplate=JSON.parse(fs.readFileSync(path.join(root,'hypotheses/p4_external_validation_collector_independence_record_v1.json'),'utf8'));
const collector=clone(collectorTemplate);
collector.collector_identity='Independent Collector Example';
collector.collector_team_or_affiliation='Independent Replication Team Example';
collector.identity_frozen=true;
for(const key of preflight.COLLECTOR_ATTESTATIONS) collector.required_attestations_before_authorization[key]=true;
collector.current_authorization_condition_satisfied=true;

const records=[];
for(let i=1;i<=12;i++){
  const id='C'+String(i).padStart(2,'0');
  records.push({
    colony_id:id,
    wild_source_colony_id:'WILD-'+String(i).padStart(2,'0'),
    source_nest_id:'NEST-'+String(i).padStart(2,'0'),
    lab_acclimation_start_timestamp_local:`2026-10-${String(i).padStart(2,'0')}T09:00:00-07:00`,
    pre_deprivation_sucrose_molarity_M:0.5,
    pre_deprivation_sucrose_ad_libitum:true,
    pre_deprivation_chopped_cockroach_feedings_per_week:3,
    food_deprivation_start_timestamp_local:`2026-10-${String(i+7).padStart(2,'0')}T09:00:00-07:00`,
    water_ad_libitum_during_deprivation:true,
    light_dark_cycle_hours:'12:12',
    no_food_reward_present_in_test_maze:true
  });
}

const declaration={
  attested_by:'Precollection Gatekeeper Example',
  attested_at_local:'2026-10-01T08:00:00-07:00',
  no_biological_collection_has_started:true,
  no_new_biological_outcome_has_been_accessed:true,
  candidate_307_prediction_has_not_been_disclosed_to_collector:true
};

const validPaths={
  collectorPath:write('collector.json',collector),
  husbandryPath:write('husbandry.json',{records}),
  declarationPath:write('declaration.json',declaration)
};

const frozen=preflight.validateFrozenRepository(root);
assert.deepStrictEqual(frozen.errors,[],'frozen repository preflight contracts must still match exact pinned blobs');

const ready=preflight.evaluatePreflight({root,...validPaths});
assert.strictEqual(ready.ready_for_activation_commit,true);
assert.strictEqual(ready.collection_authorized,false);
assert.deepStrictEqual(ready.errors,[]);
assert.deepStrictEqual(ready.post_commit_gates_remaining,[
  'activation_regression_passes_on_exact_head',
  'fresh_codex_review_is_clean_on_exact_head',
  'activation_commit_is_qualified_on_permanent_main'
]);
assert.ok(ready.manual_verification_required.includes('collector_identity_and_affiliation_are_real_and_truthful'));

const cli=spawnSync(process.execPath,[
  path.join(root,'tools/check-p4-external-validation-activation.js'),
  '--collector',validPaths.collectorPath,
  '--husbandry',validPaths.husbandryPath,
  '--declaration',validPaths.declarationPath,
  '--json'
],{cwd:root,encoding:'utf8'});
assert.strictEqual(cli.status,0,cli.stderr);
const cliResult=JSON.parse(cli.stdout);
assert.strictEqual(cliResult.ready_for_activation_commit,true);
assert.strictEqual(cliResult.collection_authorized,false);

const badCollector=clone(collector);
badCollector.collector_identity='TBD';
const badCollectorResult=preflight.evaluatePreflight({
  root,
  collectorPath:write('bad-collector.json',badCollector),
  husbandryPath:validPaths.husbandryPath,
  declarationPath:validPaths.declarationPath
});
assert.strictEqual(badCollectorResult.ready_for_activation_commit,false);
assert.ok(badCollectorResult.errors.some(x=>x.includes('collector_identity')));

const rewrittenCollector=clone(collector);
rewrittenCollector.authorization_rule='collection may begin unconditionally';
const rewrittenCollectorResult=preflight.evaluatePreflight({
  root,
  collectorPath:write('rewritten-collector.json',rewrittenCollector),
  husbandryPath:validPaths.husbandryPath,
  declarationPath:validPaths.declarationPath
});
assert.strictEqual(rewrittenCollectorResult.ready_for_activation_commit,false);
assert.ok(rewrittenCollectorResult.errors.some(x=>x.includes('immutable frozen fields')));


const invalidCalendar=clone(records);
invalidCalendar[0].lab_acclimation_start_timestamp_local='2026-02-30T09:00:00-07:00';
const invalidCalendarResult=preflight.evaluatePreflight({
  root,
  collectorPath:validPaths.collectorPath,
  husbandryPath:write('invalid-calendar.json',{records:invalidCalendar}),
  declarationPath:validPaths.declarationPath
});
assert.strictEqual(invalidCalendarResult.ready_for_activation_commit,false);
assert.ok(invalidCalendarResult.errors.some(x=>x.includes('valid calendar date')));

const impossibleTiming=clone(records);
impossibleTiming[0].food_deprivation_start_timestamp_local=impossibleTiming[0].lab_acclimation_start_timestamp_local;
const impossibleTimingResult=preflight.evaluatePreflight({
  root,
  collectorPath:validPaths.collectorPath,
  husbandryPath:write('impossible-timing.json',{records:impossibleTiming}),
  declarationPath:validPaths.declarationPath
});
assert.strictEqual(impossibleTimingResult.ready_for_activation_commit,false);
assert.ok(impossibleTimingResult.errors.some(x=>x.includes('no feasible first-trial time')));

const duplicateNest=clone(records);
duplicateNest[11].source_nest_id=duplicateNest[0].source_nest_id;
const duplicateResult=preflight.evaluatePreflight({
  root,
  collectorPath:validPaths.collectorPath,
  husbandryPath:write('duplicate-nest.json',{records:duplicateNest}),
  declarationPath:validPaths.declarationPath
});
assert.strictEqual(duplicateResult.ready_for_activation_commit,false);
assert.ok(duplicateResult.errors.some(x=>x.includes('source_nest_id values must be distinct')));

const prefilled=clone(records);
prefilled[0].first_trial_timestamp_local='2026-10-20T10:00:00-07:00';
const prefilledResult=preflight.evaluatePreflight({
  root,
  collectorPath:validPaths.collectorPath,
  husbandryPath:write('prefilled.json',{records:prefilled}),
  declarationPath:validPaths.declarationPath
});
assert.strictEqual(prefilledResult.ready_for_activation_commit,false);
assert.ok(prefilledResult.errors.some(x=>x.includes('must not prefill future observed/derived field first_trial_timestamp_local')));

const wrongFeeding=clone(records);
wrongFeeding[1].pre_deprivation_chopped_cockroach_feedings_per_week=2;
const wrongFeedingResult=preflight.evaluatePreflight({
  root,
  collectorPath:validPaths.collectorPath,
  husbandryPath:write('wrong-feeding.json',{records:wrongFeeding}),
  declarationPath:validPaths.declarationPath
});
assert.strictEqual(wrongFeedingResult.ready_for_activation_commit,false);
assert.ok(wrongFeedingResult.errors.some(x=>x.includes('feedings_per_week must equal 3')));

const badDeclaration=clone(declaration);
badDeclaration.no_new_biological_outcome_has_been_accessed=false;
const badDeclarationPath=write('bad-declaration.json',badDeclaration);
const badDeclarationResult=preflight.evaluatePreflight({
  root,
  collectorPath:validPaths.collectorPath,
  husbandryPath:validPaths.husbandryPath,
  declarationPath:badDeclarationPath
});
assert.strictEqual(badDeclarationResult.ready_for_activation_commit,false);
assert.ok(badDeclarationResult.errors.some(x=>x.includes('no_new_biological_outcome_has_been_accessed')));

const blockedCli=spawnSync(process.execPath,[
  path.join(root,'tools/check-p4-external-validation-activation.js'),
  '--collector',validPaths.collectorPath,
  '--husbandry',validPaths.husbandryPath,
  '--declaration',badDeclarationPath,
  '--json'
],{cwd:root,encoding:'utf8'});
assert.strictEqual(blockedCli.status,2);
assert.strictEqual(JSON.parse(blockedCli.stdout).ready_for_activation_commit,false);

fs.rmSync(tmp,{recursive:true,force:true});
console.log('p4-external-validation-activation-preflight.test.js PASS '+JSON.stringify({
  frozen_repository:true,
  valid_preflight_ready:true,
  collection_authorized:false,
  negative_cases:8,
  remaining_post_commit_gates:ready.post_commit_gates_remaining.length
}));
