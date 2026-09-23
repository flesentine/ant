'use strict';

const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const {isDeepStrictEqual}=require('util');

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


const TRUSTED_PREAUTHORIZATION_RECORD=Object.freeze({
  file:'hypotheses/p4_external_validation_collection_authorization_v1.json',
  git_blob_sha:'1a40e684313df4259c94a13ef4382eeeb45f391e'
});

const TRUSTED_QUALIFIED_PREREGISTRATION=Object.freeze({
  file:'hypotheses/p4_external_validation_new_dataset_preregistration_v1.json',
  git_blob_sha:'b8a683e0199e6564a1fedc6f54391a535c32e0e4'
});

const ACTIVE_STATUS='active_collection_authorization_prospective_effective_only_after_permanent_main_qualification_before_trial_1';

const TRUSTED_FROZEN_COLLECTION_INPUTS=Object.freeze([
  Object.freeze({fileKey:'marked_side_schedule_file',shaKey:'marked_side_schedule_git_blob_sha',label:'marked-side schedule',file:'experiments/p4_external_validation_replication_randomization_v1.json',git_blob_sha:'9ffd7ef45a611c93eac35626399632b4f822225a'}),
  Object.freeze({fileKey:'release_pose_schedule_manifest_file',shaKey:'release_pose_schedule_manifest_git_blob_sha',label:'release-pose manifest',file:'experiments/p4_external_validation_replication_release_pose_schedule_v1.json',git_blob_sha:'ee5f1b46bbca780196117d554f8b708b3f2ed34e'}),
  Object.freeze({fileKey:'chemical_batch_record_template_file',shaKey:'chemical_batch_record_template_git_blob_sha',label:'chemical batch template',file:'hypotheses/p4_external_validation_chemical_batch_record_template_v1.json',git_blob_sha:'7fc4188e5b4c454c944d555e957f3c2885ab4a30'}),
  Object.freeze({fileKey:'colony_husbandry_record_template_file',shaKey:'colony_husbandry_record_template_git_blob_sha',label:'colony husbandry template',file:'hypotheses/p4_external_validation_colony_husbandry_record_template_v1.json',git_blob_sha:'b0a3a9bac49093c8650e5625666be387519895a4'}),
  Object.freeze({fileKey:'video_calibration_record_template_file',shaKey:'video_calibration_record_template_git_blob_sha',label:'video calibration template',file:'hypotheses/p4_external_validation_video_calibration_record_template_v1.json',git_blob_sha:'231fd746f5aae187e67e7959c9907791a1cc07de'}),
  Object.freeze({fileKey:'trial_record_schema_file',shaKey:'trial_record_schema_git_blob_sha',label:'trial record schema',file:'hypotheses/p4_external_validation_trial_record_schema_v1.json',git_blob_sha:'4072b72f7c3ea2de3a4eb24a37c850bd8b1d1193'}),
  Object.freeze({fileKey:'collector_independence_record_file',shaKey:'collector_independence_record_git_blob_sha',label:'collector independence record',file:'hypotheses/p4_external_validation_collector_independence_record_v1.json',git_blob_sha:'02289bed5ef4785bbadc584ef5077b633779d089'}),
  Object.freeze({fileKey:'collection_activation_checklist_file',shaKey:'collection_activation_checklist_git_blob_sha',label:'activation checklist',file:'hypotheses/p4_external_validation_collection_activation_checklist_v1.json',git_blob_sha:'1d983b319dc3946e6942a019981a490b20c3d049'})
]);

function trustedFrozenInput(fileKey){
  return TRUSTED_FROZEN_COLLECTION_INPUTS.find(x=>x.fileKey===fileKey);
}

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

function gitBlob(root,rel){
  return execFileSync('git',['hash-object',rel],{cwd:root,encoding:'utf8'}).trim();
}

function gitHeadBlob(root,rel){
  try{
    return execFileSync('git',['rev-parse',`HEAD:${rel}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch{
    return null;
  }
}

function gitIndexBlob(root,rel){
  try{
    return execFileSync('git',['rev-parse',`:${rel}`],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch{
    return null;
  }
}

function gitRevBlob(root,rev,rel){
  try{
    return execFileSync('git',['rev-parse',rev+':'+rel],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch{
    return null;
  }
}

function gitRevJson(root,rev,rel){
  try{
    return JSON.parse(execFileSync(
      'git',
      ['show',rev+':'+rel],
      {cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}
    ));
  }catch{
    return null;
  }
}

function isPlaceholder(value){
  if(typeof value!=='string'||!value.trim()) return true;
  const s=value.trim().toLowerCase();
  if(['tbd','todo','unknown','pending','placeholder','n/a','na','none','null'].includes(s)) return true;
  return /^(?:tbd|todo|unknown|pending|placeholder|n\/a|na|none|null)(?:\b|[-_:])/i.test(s);
}

function hasOuterWhitespace(value){
  return typeof value==='string' && value!==value.trim();
}

function normalizedIdentifier(value){
  return typeof value==='string'?value.trim():value;
}

function isOffsetTimestamp(value){
  if(typeof value!=='string') return false;
  const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?([+-])(\d{2}):(\d{2})$/.exec(value);
  if(!m) return false;
  const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]);
  const hour=Number(m[4]),minute=Number(m[5]),second=Number(m[6]||0);
  const offsetHour=Number(m[9]),offsetMinute=Number(m[10]);
  if(month<1||month>12||hour>23||minute>59||second>59||offsetMinute>59) return false;
  if(offsetHour>14||(offsetHour===14&&offsetMinute!==0)) return false;
  const calendar=new Date(Date.UTC(year,month-1,day,hour,minute,second));
  if(calendar.getUTCFullYear()!==year||
     calendar.getUTCMonth()!==month-1||
     calendar.getUTCDate()!==day||
     calendar.getUTCHours()!==hour||
     calendar.getUTCMinutes()!==minute||
     calendar.getUTCSeconds()!==second) return false;
  return Number.isFinite(Date.parse(value));
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
  const committed=gitHeadBlob(root,rel);
  if(committed===null) errors.push(`${label}: file is not present at committed HEAD: ${rel}`);
  else if(committed!==expected) errors.push(`${label}: committed blob drift ${committed} != ${expected}`);
  const staged=gitIndexBlob(root,rel);
  if(staged===null) errors.push(`${label}: file is not present in the Git index: ${rel}`);
  else if(staged!==expected) errors.push(`${label}: staged blob drift ${staged} != ${expected}`);
  const actual=gitBlob(root,rel);
  if(actual!==expected) errors.push(`${label}: working-tree blob drift ${actual} != ${expected}`);
}

function validateFrozenAuthorizationContract(auth){
  const errors=[];
  if(!auth||typeof auth!=='object'||Array.isArray(auth)) return ['authorization record must be a JSON object'];
  if(auth.id!=='P4_external_validation_collection_authorization_v1') errors.push('authorization id mismatch');
  if(auth.qualified_preregistration?.file!==TRUSTED_QUALIFIED_PREREGISTRATION.file){
    errors.push('authorization qualified preregistration file differs from trusted frozen contract');
  }
  if(auth.qualified_preregistration?.git_blob_sha!==TRUSTED_QUALIFIED_PREREGISTRATION.git_blob_sha){
    errors.push('authorization qualified preregistration blob differs from trusted frozen contract');
  }

  const frozen=auth.frozen_collection_inputs||{};
  for(const item of TRUSTED_FROZEN_COLLECTION_INPUTS){
    if(frozen[item.fileKey]!==item.file){
      errors.push(`authorization ${item.fileKey} differs from trusted frozen contract`);
    }
    if(frozen[item.shaKey]!==item.git_blob_sha){
      errors.push(`authorization ${item.shaKey} differs from trusted frozen contract`);
    }
  }

  const checklist=trustedFrozenInput('collection_activation_checklist_file');
  if(auth.activation_rule?.checklist_file!==checklist.file){
    errors.push('authorization activation_rule checklist file differs from trusted frozen contract');
  }
  if(auth.activation_rule?.checklist_git_blob_sha!==checklist.git_blob_sha){
    errors.push('authorization activation_rule checklist blob differs from trusted frozen contract');
  }
  return errors;
}

function validateFrozenRepository(root){
  const errors=[];
  const authRel=TRUSTED_PREAUTHORIZATION_RECORD.file;
  const collectorContract=trustedFrozenInput('collector_independence_record_file');
  const collectorRel=collectorContract.file;
  const auth=readJson(path.join(root,authRel));
  const currentAuthBlob=gitHeadBlob(root,authRel);
  const currentCollectorBlob=gitHeadBlob(root,collectorRel);
  const preactivation=
    currentAuthBlob===TRUSTED_PREAUTHORIZATION_RECORD.git_blob_sha&&
    currentCollectorBlob===collectorContract.git_blob_sha;

  let frozenCollector;
  if(preactivation){
    assertBlob(
      errors,root,
      TRUSTED_PREAUTHORIZATION_RECORD.file,
      TRUSTED_PREAUTHORIZATION_RECORD.git_blob_sha,
      'frozen preauthorization record'
    );
    frozenCollector=readJson(path.join(root,collectorRel));
  }else{
    const parentAuth=gitRevBlob(root,'HEAD^1',authRel);
    const parentCollector=gitRevBlob(root,'HEAD^1',collectorRel);
    if(parentAuth!==TRUSTED_PREAUTHORIZATION_RECORD.git_blob_sha){
      errors.push(
        'activated repository requires frozen preauthorization at HEAD^1: '+
        String(parentAuth)+' != '+TRUSTED_PREAUTHORIZATION_RECORD.git_blob_sha
      );
    }
    if(parentCollector!==collectorContract.git_blob_sha){
      errors.push(
        'activated repository requires frozen collector at HEAD^1: '+
        String(parentCollector)+' != '+collectorContract.git_blob_sha
      );
    }
    frozenCollector=gitRevJson(root,'HEAD^1',collectorRel);
    if(!frozenCollector) errors.push('activated repository frozen collector baseline is unreadable at HEAD^1');
    if(auth.status!==ACTIVE_STATUS) errors.push('activated repository authorization status mismatch');
    if(auth.collection_authorized!==true) errors.push('activated repository authorization must have collection_authorized=true');
    const gates=auth.gate_checks||{};
    for(const key of [
      'collector_identity_frozen',
      'collector_independence_attestations_all_true',
      'all_12_colony_husbandry_prospective_setup_fields_complete_and_valid'
    ]){
      if(gates[key]!==true) errors.push('activated repository gate must be true: '+key);
    }
  }

  errors.push(...validateFrozenAuthorizationContract(auth));
  if(preactivation&&auth.collection_authorized!==false){
    errors.push('preflight requires collection_authorized=false before activation commit');
  }
  if(auth.gate_checks?.new_biological_outcomes_known_to_exist_at_gate!==false) errors.push('authorization gate says biological outcomes are already known');
  if(auth.gate_checks?.new_biological_outcome_access_authorized_at_gate!==false) errors.push('authorization gate permits biological outcome access');
  if(auth.gate_checks?.candidate_307_prediction_disclosure_to_collector_authorized!==false) errors.push('authorization gate permits Candidate 307 prediction disclosure');

  assertBlob(
    errors,root,
    TRUSTED_QUALIFIED_PREREGISTRATION.file,
    TRUSTED_QUALIFIED_PREREGISTRATION.git_blob_sha,
    'qualified preregistration'
  );

  for(const item of TRUSTED_FROZEN_COLLECTION_INPUTS){
    if(!preactivation&&item.fileKey==='collector_independence_record_file') continue;
    assertBlob(errors,root,item.file,item.git_blob_sha,item.label);
  }

  if(!preactivation&&frozenCollector){
    const activeCollector=readJson(path.join(root,collectorRel));
    errors.push(...validateCollector(
      activeCollector,
      frozenCollector,
      TRUSTED_QUALIFIED_PREREGISTRATION.git_blob_sha
    ).map(function(e){return 'activated repository collector: '+e;}));
    if(auth.activation_metadata?.collector_record_git_blob_sha!==currentCollectorBlob){
      errors.push('activated repository authorization collector blob binding mismatch');
    }
  }

  const releaseContract=trustedFrozenInput('release_pose_schedule_manifest_file');
  const releasePath=releaseContract.file;
  if(fs.existsSync(path.join(root,releasePath))){
    const release=readJson(path.join(root,releasePath));
    assertBlob(errors,root,release.simulation_initialization_file,release.simulation_initialization_git_blob_sha,'release initialization');
    assertBlob(errors,root,release.rng_file,release.rng_git_blob_sha,'release RNG');
    if(!Array.isArray(release.parts)||release.parts.length!==12) errors.push('release-pose manifest must bind exactly 12 parts');
    else{
      for(const part of release.parts) assertBlob(errors,root,part.file,part.git_blob_sha,`release-pose part colony ${part.colony}`);
    }
  }

  return {
    errors,
    authorization:auth,
    frozenCollector,
    repository_state:preactivation?'preactivation_frozen':'activation_head'
  };
}

function validateCollector(record,frozenRecord,preregBlob){
  const errors=[];
  if(!record||typeof record!=='object'||Array.isArray(record)) return ['collector record must be a JSON object'];
  if(record.schema_version!==1) errors.push('collector schema_version must be 1');
  if(record.id!=='P4_external_validation_collector_independence_record_v1') errors.push('collector id mismatch');
  if(record.preregistration_git_blob_sha!==preregBlob) errors.push('collector preregistration blob mismatch');
  if(record.role!=='physical collection of the 480 preregistered biological trials') errors.push('collector role contract changed');
  if(isPlaceholder(record.status)) errors.push('collector status must be present and non-placeholder');
  if(hasOuterWhitespace(record.collector_identity)) errors.push('collector_identity must not contain leading or trailing whitespace');
  if(hasOuterWhitespace(record.collector_team_or_affiliation)) errors.push('collector_team_or_affiliation must not contain leading or trailing whitespace');
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

  if(frozenRecord&&typeof frozenRecord==='object'&&!Array.isArray(frozenRecord)){
    const expectedKeys=Object.keys(frozenRecord.required_attestations_before_authorization||{}).sort();
    const actualKeys=Object.keys(record.required_attestations_before_authorization||{}).sort();
    if(!isDeepStrictEqual(actualKeys,expectedKeys)) errors.push('collector attestation keys must exactly match the frozen record');

    const normalized=JSON.parse(JSON.stringify(record));
    const frozenNormalized=JSON.parse(JSON.stringify(frozenRecord));
    for(const key of ['collector_identity','collector_team_or_affiliation','identity_frozen','current_authorization_condition_satisfied']){
      normalized[key]=frozenNormalized[key];
    }
    if(normalized.required_attestations_before_authorization&&frozenNormalized.required_attestations_before_authorization){
      for(const key of expectedKeys){
        normalized.required_attestations_before_authorization[key]=frozenNormalized.required_attestations_before_authorization[key];
      }
    }
    if(!isDeepStrictEqual(normalized,frozenNormalized)){
      errors.push('collector record changes immutable frozen fields outside identity, affiliation, attestations, or authorization state');
    }
  }

  return errors;
}

function husbandryRecords(value){
  if(Array.isArray(value)) return value;
  if(value&&typeof value==='object'&&Array.isArray(value.records)) return value.records;
  return null;
}

function validateHusbandry(input,template,preflightTimeMs=Date.now()){
  const errors=[];
  const records=husbandryRecords(input);
  if(!records) return ['husbandry input must be an array or an object with a records array'];
  if(!Array.isArray(input)){
    for(const key of Object.keys(input)){
      if(key!=='records') errors.push(`husbandry input contains unknown top-level field ${key}`);
    }
  }
  if(records.length!==12) errors.push(`exactly 12 husbandry records required; got ${records.length}`);

  const requiredIds=Array.from({length:12},(_,i)=>`C${String(i+1).padStart(2,'0')}`);
  const ids=[];
  const wild=[];
  const nests=[];
  const prospective=template.activation_required_prospective_fields||[];
  const observed=template.collection_observed_or_derived_fields||[];
  const allowedFields=new Set(Object.keys(template.required_fields||{}));

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

    for(const key of Object.keys(r)){
      if(!allowedFields.has(key)) errors.push(`${where} contains unknown field ${key}`);
    }

    for(const field of prospective){
      if(!(field in r)||r[field]===null||r[field]===undefined||r[field]==='') errors.push(`${where} missing prospective field ${field}`);
    }

    if(!requiredIds.includes(r.colony_id)) errors.push(`${where}.colony_id must be C01..C12`);
    if(hasOuterWhitespace(r.wild_source_colony_id)) errors.push(`${where}.wild_source_colony_id must not contain leading or trailing whitespace`);
    if(hasOuterWhitespace(r.source_nest_id)) errors.push(`${where}.source_nest_id must not contain leading or trailing whitespace`);
    if(isPlaceholder(r.wild_source_colony_id)) errors.push(`${where}.wild_source_colony_id must be non-placeholder`);
    if(isPlaceholder(r.source_nest_id)) errors.push(`${where}.source_nest_id must be non-placeholder`);
    if(!isOffsetTimestamp(r.lab_acclimation_start_timestamp_local)) errors.push(`${where}.lab_acclimation_start_timestamp_local must be ISO-8601 with explicit offset and a valid calendar date`);
    if(r.pre_deprivation_sucrose_molarity_M!==0.5) errors.push(`${where}.pre_deprivation_sucrose_molarity_M must equal 0.5`);
    if(r.pre_deprivation_sucrose_ad_libitum!==true) errors.push(`${where}.pre_deprivation_sucrose_ad_libitum must be true`);
    if(r.pre_deprivation_chopped_cockroach_feedings_per_week!==3) errors.push(`${where}.pre_deprivation_chopped_cockroach_feedings_per_week must equal 3`);
    if(!isOffsetTimestamp(r.food_deprivation_start_timestamp_local)) errors.push(`${where}.food_deprivation_start_timestamp_local must be ISO-8601 with explicit offset and a valid calendar date`);
    if(isOffsetTimestamp(r.lab_acclimation_start_timestamp_local)&&isOffsetTimestamp(r.food_deprivation_start_timestamp_local)){
      const acclimationStart=Date.parse(r.lab_acclimation_start_timestamp_local);
      const deprivationStart=Date.parse(r.food_deprivation_start_timestamp_local);
      const minimumSeparationMs=70*60*60*1000;
      if(deprivationStart-acclimationStart<minimumSeparationMs){
        errors.push(`${where} has no feasible first-trial time satisfying both >=7 days acclimation and 94-98 hours food deprivation; deprivation start must be at least 70 hours after acclimation start`);
      }
      const latestFirstTrialMs=deprivationStart+(98*60*60*1000);
      if(latestFirstTrialMs<=preflightTimeMs){
        errors.push(`${where} has no feasible first-trial time remaining at preflight; the 98-hour food-deprivation window has already expired`);
      }
    }
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
  if(new Set(wild.map(normalizedIdentifier)).size!==wild.length) errors.push('all wild_source_colony_id values must be distinct');
  if(nests.some(isPlaceholder)) errors.push('all source_nest_id values must be real non-placeholder identifiers');
  if(new Set(nests.map(normalizedIdentifier)).size!==nests.length) errors.push('all 12 source_nest_id values must be distinct');

  return errors;
}

function validateDeclaration(record,preflightTimeMs=Date.now()){
  const errors=[];
  if(!record||typeof record!=='object'||Array.isArray(record)) return ['precollection declaration must be a JSON object'];
  const allowedFields=new Set(['attested_by','attested_at_local',...DECLARATION_TRUE_FIELDS]);
  for(const key of Object.keys(record)){
    if(!allowedFields.has(key)) errors.push(`declaration contains unknown field ${key}`);
  }
  if(hasOuterWhitespace(record.attested_by)) errors.push('declaration attested_by must not contain leading or trailing whitespace');
  if(isPlaceholder(record.attested_by)) errors.push('declaration attested_by must be non-placeholder');
  if(!isOffsetTimestamp(record.attested_at_local)) errors.push('declaration attested_at_local must be ISO-8601 with explicit offset');
  else if(Date.parse(record.attested_at_local)>preflightTimeMs) errors.push('declaration attested_at_local must not be in the future relative to preflight');
  for(const field of DECLARATION_TRUE_FIELDS){
    if(record[field]!==true) errors.push(`declaration must be true: ${field}`);
  }
  return errors;
}

function evaluatePreflight({root,collectorPath,husbandryPath,declarationPath,preflightTimeMs=Date.now()}){
  const frozen=validateFrozenRepository(root);
  const auth=frozen.authorization;
  const husbandryTemplate=readJson(path.join(root,trustedFrozenInput('colony_husbandry_record_template_file').file));
  const frozenCollector=frozen.frozenCollector||
    readJson(path.join(root,trustedFrozenInput('collector_independence_record_file').file));
  const collector=readJson(collectorPath);
  const husbandry=readJson(husbandryPath);
  const declaration=readJson(declarationPath);

  const errors=[...frozen.errors];
  if(!Number.isFinite(preflightTimeMs)) errors.push('preflightTimeMs must be a finite epoch-millisecond number');
  errors.push(...validateCollector(collector,frozenCollector,TRUSTED_QUALIFIED_PREREGISTRATION.git_blob_sha));
  errors.push(...validateHusbandry(husbandry,husbandryTemplate,preflightTimeMs));
  errors.push(...validateDeclaration(declaration,preflightTimeMs));

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
  TRUSTED_PREAUTHORIZATION_RECORD,
  TRUSTED_QUALIFIED_PREREGISTRATION,
  TRUSTED_FROZEN_COLLECTION_INPUTS,
  ACTIVE_STATUS,
  validateFrozenAuthorizationContract,
  isPlaceholder,
  hasOuterWhitespace,
  normalizedIdentifier,
  isOffsetTimestamp,
  validateFrozenRepository,
  validateCollector,
  validateHusbandry,
  validateDeclaration,
  evaluatePreflight
};
