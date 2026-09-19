'use strict';

const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');

const COLLECTOR_ATTESTATIONS=[
  'did_not_participate_in_P4_parameter_estimation',
  'did_not_participate_in_Candidate_307_selection',
  'will_not_participate_in_this_dataset_outcome_analysis',
  'has_not_been_given_Candidate_307_primary_prediction',
  'will_follow_frozen_marked_side_and_release_pose_schedules_without_regeneration',
  'will_not_monitor_or_adapt_protocol_to_interim_behavioral_outcomes',
  'will_preserve_all_attempts_exclusions_timeouts_and_protocol_deviations'
];

const COLLECTOR_FIREWALL_KEYS=[
  'placeholder_identity_counts_as_frozen_identity',
  'collection_before_identity_freeze_authorized',
  'collector_identity_change_after_collection_starts_authorized',
  'collector_participation_in_this_dataset_outcome_analysis_authorized',
  'candidate_prediction_disclosure_to_collector_before_dataset_hash_freeze_authorized'
];

const DECLARATION_TRUE_FIELDS=[
  'no_biological_collection_has_started',
  'no_new_biological_outcome_has_been_accessed',
  'candidate_307_prediction_has_not_been_disclosed_to_collector'
];

const POST_COMMIT_GATES=[
  'activation_regression_passes_on_exact_head',
  'fresh_codex_review_is_clean_on_exact_head',
  'activation_commit_is_qualified_on_permanent_main'
];

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

function gitBlob(root,rel){
  return execFileSync('git',['hash-object',rel],{cwd:root,encoding:'utf8'}).trim();
}

function isPlaceholder(value){
  if(typeof value!=='string'||!value.trim()) return true;
  const s=value.trim().toLowerCase();
  return ['tbd','todo','unknown','pending','placeholder','n/a','na','none','null'].includes(s);
}

function isOffsetTimestamp(value){
  return typeof value==='string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?[+-]\d{2}:\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function assertBlob(errors,root,rel,expected,label=rel){
  if(!rel||!expected){
    errors.push(`${label}: missing frozen file/blob contract`);
    return;
  }
  const abs=path.join(root,rel);
  if(!fs.existsSync(abs)){
    errors.push(`${label}: missing file ${rel}`);
    return;
  }
  const actual=gitBlob(root,rel);
  if(actual!==expected) errors.push(`${label}: blob drift ${actual} != ${expected}`);
}

function validateFrozenRepository(root){
  const errors=[];
  const authRel='hypotheses/p4_external_validation_collection_authorization_v1.json';
  const auth=readJson(path.join(root,authRel));

  if(auth.id!=='P4_external_validation_collection_authorization_v1') errors.push('authorization id mismatch');
  if(auth.collection_authorized!==false) errors.push('preflight requires collection_authorized=false before activation commit');
  if(auth.gate_checks?.new_biological_outcomes_known_to_exist_at_gate!==false) errors.push('authorization gate says biological outcomes are already known');
  if(auth.gate_checks?.new_biological_outcome_access_authorized_at_gate!==false) errors.push('authorization gate permits biological outcome access');
  if(auth.gate_checks?.candidate_307_prediction_disclosure_to_collector_authorized!==false) errors.push('authorization gate permits Candidate 307 prediction disclosure');

  assertBlob(
    errors,root,
    auth.qualified_preregistration?.file,
    auth.qualified_preregistration?.git_blob_sha,
    'qualified preregistration'
  );

  const frozen=auth.frozen_collection_inputs||{};
  const pinned=[
    ['marked_side_schedule_file','marked_side_schedule_git_blob_sha','marked-side schedule'],
    ['release_pose_schedule_manifest_file','release_pose_schedule_manifest_git_blob_sha','release-pose manifest'],
    ['chemical_batch_record_template_file','chemical_batch_record_template_git_blob_sha','chemical batch template'],
    ['colony_husbandry_record_template_file','colony_husbandry_record_template_git_blob_sha','colony husbandry template'],
    ['video_calibration_record_template_file','video_calibration_record_template_git_blob_sha','video calibration template'],
    ['trial_record_schema_file','trial_record_schema_git_blob_sha','trial record schema'],
    ['collection_activation_checklist_file','collection_activation_checklist_git_blob_sha','activation checklist']
  ];
  for(const [fileKey,shaKey,label] of pinned) assertBlob(errors,root,frozen[fileKey],frozen[shaKey],label);

  const releasePath=frozen.release_pose_schedule_manifest_file;
  if(releasePath && fs.existsSync(path.join(root,releasePath))){
    const release=readJson(path.join(root,releasePath));
    assertBlob(errors,root,release.simulation_initialization_file,release.simulation_initialization_git_blob_sha,'release initialization');
    assertBlob(errors,root,release.rng_file,release.rng_git_blob_sha,'release RNG');
    if(!Array.isArray(release.parts)||release.parts.length!==12) errors.push('release-pose manifest must bind exactly 12 parts');
    else{
      for(const part of release.parts) assertBlob(errors,root,part.file,part.git_blob_sha,`release-pose part colony ${part.colony}`);
    }
  }

  return {errors,authorization:auth};
}

function validateCollector(record,preregBlob){
  const errors=[];
  if(!record||typeof record!=='object'||Array.isArray(record)) return ['collector record must be a JSON object'];
  if(record.schema_version!==1) errors.push('collector schema_version must be 1');
  if(record.id!=='P4_external_validation_collector_independence_record_v1') errors.push('collector id mismatch');
  if(record.preregistration_git_blob_sha!==preregBlob) errors.push('collector preregistration blob mismatch');
  if(record.role!=='physical collection of the 480 preregistered biological trials') errors.push('collector role contract changed');
  if(isPlaceholder(record.collector_identity)) errors.push('collector_identity must be a real non-placeholder nonempty identity');
  if(isPlaceholder(record.collector_team_or_affiliation)) errors.push('collector_team_or_affiliation must be recorded and non-placeholder');
  if(record.identity_frozen!==true) errors.push('collector identity_frozen must be true');

  const attest=record.required_attestations_before_authorization;
  if(!attest||typeof attest!=='object'||Array.isArray(attest)) errors.push('collector required attestations object missing');
  else{
    for(const key of COLLECTOR_ATTESTATIONS){
      if(attest[key]!==true) errors.push(`collector attestation must be true: ${key}`);
    }
  }

  const firewall=record.firewall;
  if(!firewall||typeof firewall!=='object'||Array.isArray(firewall)) errors.push('collector firewall object missing');
  else{
    for(const key of COLLECTOR_FIREWALL_KEYS){
      if(firewall[key]!==false) errors.push(`collector firewall must remain false: ${key}`);
    }
  }

  if(record.current_authorization_condition_satisfied!==true){
    errors.push('collector current_authorization_condition_satisfied must be true after identity/attestations are completed');
  }

  return errors;
}

function husbandryRecords(value){
  if(Array.isArray(value)) return value;
  if(value&&typeof value==='object'&&Array.isArray(value.records)) return value.records;
  return null;
}

function validateHusbandry(input,template){
  const errors=[];
  const records=husbandryRecords(input);
  if(!records) return ['husbandry input must be an array or an object with a records array'];
  if(records.length!==12) errors.push(`exactly 12 husbandry records required; got ${records.length}`);

  const requiredIds=Array.from({length:12},(_,i)=>`C${String(i+1).padStart(2,'0')}`);
  const ids=[];
  const wild=[];
  const nests=[];
  const prospective=template.activation_required_prospective_fields||[];
  const observed=template.collection_observed_or_derived_fields||[];

  for(let i=0;i<records.length;i++){
    const r=records[i];
    const where=`husbandry[${i}]`;
    if(!r||typeof r!=='object'||Array.isArray(r)){
      errors.push(`${where} must be an object`);
      continue;
    }
    ids.push(r.colony_id);
    wild.push(r.wild_source_colony_id);
    nests.push(r.source_nest_id);

    for(const field of prospective){
      if(!(field in r)||r[field]===null||r[field]===undefined||r[field]==='') errors.push(`${where} missing prospective field ${field}`);
    }

    if(!requiredIds.includes(r.colony_id)) errors.push(`${where}.colony_id must be C01..C12`);
    if(isPlaceholder(r.wild_source_colony_id)) errors.push(`${where}.wild_source_colony_id must be non-placeholder`);
    if(isPlaceholder(r.source_nest_id)) errors.push(`${where}.source_nest_id must be non-placeholder`);
    if(!isOffsetTimestamp(r.lab_acclimation_start_timestamp_local)) errors.push(`${where}.lab_acclimation_start_timestamp_local must be ISO-8601 with explicit offset`);
    if(r.pre_deprivation_sucrose_molarity_M!==0.5) errors.push(`${where}.pre_deprivation_sucrose_molarity_M must equal 0.5`);
    if(r.pre_deprivation_sucrose_ad_libitum!==true) errors.push(`${where}.pre_deprivation_sucrose_ad_libitum must be true`);
    if(r.pre_deprivation_chopped_cockroach_feedings_per_week!==3) errors.push(`${where}.pre_deprivation_chopped_cockroach_feedings_per_week must equal 3`);
    if(!isOffsetTimestamp(r.food_deprivation_start_timestamp_local)) errors.push(`${where}.food_deprivation_start_timestamp_local must be ISO-8601 with explicit offset`);
    if(r.water_ad_libitum_during_deprivation!==true) errors.push(`${where}.water_ad_libitum_during_deprivation must be true`);
    if(r.light_dark_cycle_hours!=='12:12') errors.push(`${where}.light_dark_cycle_hours must equal 12:12`);
    if(r.no_food_reward_present_in_test_maze!==true) errors.push(`${where}.no_food_reward_present_in_test_maze must be true`);

    for(const field of observed){
      if(field in r && r[field]!==null && r[field]!==undefined){
        errors.push(`${where} must not prefill future observed/derived field ${field}`);
      }
    }
  }

  if(new Set(ids).size!==ids.length) errors.push('colony_id values must be unique');
  if(records.length===12 && requiredIds.some(id=>!ids.includes(id))) errors.push('husbandry records must contain exactly one each of C01..C12');
  if(wild.some(isPlaceholder)) errors.push('all wild_source_colony_id values must be real non-placeholder identifiers');
  if(new Set(wild).size!==wild.length) errors.push('all wild_source_colony_id values must be distinct');
  if(nests.some(isPlaceholder)) errors.push('all source_nest_id values must be real non-placeholder identifiers');
  if(new Set(nests).size!==nests.length) errors.push('all 12 source_nest_id values must be distinct');

  return errors;
}

function validateDeclaration(record){
  const errors=[];
  if(!record||typeof record!=='object'||Array.isArray(record)) return ['precollection declaration must be a JSON object'];
  if(isPlaceholder(record.attested_by)) errors.push('declaration attested_by must be non-placeholder');
  if(!isOffsetTimestamp(record.attested_at_local)) errors.push('declaration attested_at_local must be ISO-8601 with explicit offset');
  for(const field of DECLARATION_TRUE_FIELDS){
    if(record[field]!==true) errors.push(`declaration must be true: ${field}`);
  }
  return errors;
}

function evaluatePreflight({root,collectorPath,husbandryPath,declarationPath}){
  const frozen=validateFrozenRepository(root);
  const auth=frozen.authorization;
  const husbandryTemplate=readJson(path.join(root,auth.frozen_collection_inputs.colony_husbandry_record_template_file));
  const collector=readJson(collectorPath);
  const husbandry=readJson(husbandryPath);
  const declaration=readJson(declarationPath);

  const errors=[...frozen.errors];
  errors.push(...validateCollector(collector,auth.qualified_preregistration.git_blob_sha));
  errors.push(...validateHusbandry(husbandry,husbandryTemplate));
  errors.push(...validateDeclaration(declaration));

  return {
    schema_version:1,
    id:'P4_external_validation_collection_activation_preflight_v1',
    ready_for_activation_commit:errors.length===0,
    collection_authorized:false,
    errors,
    manual_verification_required:[
      'collector_identity_and_affiliation_are_real_and_truthful',
      'all_collector_independence_attestations_are_truthful',
      'all_12_colony_source_identifiers_correspond_to_distinct_real_wild_source_nests',
      'precollection_declaration_is_truthful'
    ],
    post_commit_gates_remaining:[...POST_COMMIT_GATES],
    note:'This preflight can only make an activation commit eligible. Biological collection remains unauthorized until a separate activation commit is clean on exact-head regression/Codex review and qualified on permanent main before trial 1.'
  };
}

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const a=argv[i];
    if(a==='--json'){out.json=true;continue;}
    if(a.startsWith('--')){
      const key=a.slice(2);
      const value=argv[++i];
      if(!value||value.startsWith('--')) throw new Error(`missing value for ${a}`);
      out[key]=value;
      continue;
    }
    throw new Error(`unexpected argument: ${a}`);
  }
  return out;
}

function main(){
  try{
    const args=parseArgs(process.argv.slice(2));
    if(!args.collector||!args.husbandry||!args.declaration){
      throw new Error('usage: node tools/check-p4-external-validation-activation.js --collector <json> --husbandry <json> --declaration <json> [--json]');
    }
    const root=path.resolve(__dirname,'..');
    const result=evaluatePreflight({
      root,
      collectorPath:path.resolve(args.collector),
      husbandryPath:path.resolve(args.husbandry),
      declarationPath:path.resolve(args.declaration)
    });
    if(args.json) process.stdout.write(JSON.stringify(result,null,2)+'\n');
    else{
      console.log(result.ready_for_activation_commit?'P4 ACTIVATION PREFLIGHT READY':'P4 ACTIVATION PREFLIGHT BLOCKED');
      for(const e of result.errors) console.log('- '+e);
      console.log('collection_authorized=false');
      console.log('remaining post-commit gates: '+result.post_commit_gates_remaining.join(', '));
    }
    process.exitCode=result.ready_for_activation_commit?0:2;
  }catch(err){
    console.error(String(err&&err.stack||err));
    process.exitCode=1;
  }
}

if(require.main===module) main();

module.exports={
  COLLECTOR_ATTESTATIONS,
  DECLARATION_TRUE_FIELDS,
  POST_COMMIT_GATES,
  isPlaceholder,
  isOffsetTimestamp,
  validateFrozenRepository,
  validateCollector,
  validateHusbandry,
  validateDeclaration,
  evaluatePreflight
};
