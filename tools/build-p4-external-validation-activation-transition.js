'use strict';

const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const {isDeepStrictEqual}=require('util');

const {
  COLLECTOR_ATTESTATIONS,
  DECLARATION_TRUE_FIELDS,
  POST_COMMIT_GATES,
  TRUSTED_PREAUTHORIZATION_RECORD,
  TRUSTED_QUALIFIED_PREREGISTRATION,
  TRUSTED_FROZEN_COLLECTION_INPUTS,
  validateFrozenAuthorizationContract,
  validateCollector,
  validateHusbandry,
  validateDeclaration
}=require('./check-p4-external-validation-activation');

const CANONICAL_AUTHORIZATION_REL=TRUSTED_PREAUTHORIZATION_RECORD.file;
const CANONICAL_COLLECTOR_REL=TRUSTED_FROZEN_COLLECTION_INPUTS.find(function(x){return x.fileKey==='collector_independence_record_file';}).file;
const CANONICAL_COLLECTOR_BLOB=TRUSTED_FROZEN_COLLECTION_INPUTS.find(function(x){return x.fileKey==='collector_independence_record_file';}).git_blob_sha;

const ACTIVE_STATUS='active_collection_authorization_prospective_effective_only_after_permanent_main_qualification_before_trial_1';
const ACTIVE_NEXT_ACTION='Biological collection may begin only after this exact activation commit has clean exact-head regression and Codex review, is merged, and its permanent-main test and deploy both succeed before trial 1. Until then collection remains forbidden; once effective, record all observation-dependent husbandry and trial provenance prospectively under the frozen contracts.';

const TRUSTED_BASE_AUTHORIZATION=Object.freeze(JSON.parse(String.raw`{
  "schema_version": 1,
  "id": "P4_external_validation_collection_authorization_v1",
  "status": "preauthorization_frozen_pending_collector_identity_and_colony_husbandry_setup",
  "freeze_date_local": "2026-09-14",
  "qualified_preregistration": {
    "file": "hypotheses/p4_external_validation_new_dataset_preregistration_v1.json",
    "git_blob_sha": "b8a683e0199e6564a1fedc6f54391a535c32e0e4",
    "qualified_main_commit": "913a0e7e93092779059e6b9967dc97c503e4c9e7",
    "qualified_main_run_id": 34934333396,
    "qualified_main_run_number": 176,
    "qualified_test_job_id": 104268917214,
    "qualified_test_job_conclusion": "success",
    "qualified_deploy_job_id": 104269108607,
    "qualified_deploy_job_conclusion": "success"
  },
  "frozen_collection_inputs": {
    "marked_side_schedule_file": "experiments/p4_external_validation_replication_randomization_v1.json",
    "marked_side_schedule_git_blob_sha": "9ffd7ef45a611c93eac35626399632b4f822225a",
    "release_pose_schedule_manifest_file": "experiments/p4_external_validation_replication_release_pose_schedule_v1.json",
    "release_pose_schedule_manifest_git_blob_sha": "ee5f1b46bbca780196117d554f8b708b3f2ed34e",
    "chemical_batch_record_template_file": "hypotheses/p4_external_validation_chemical_batch_record_template_v1.json",
    "chemical_batch_record_template_git_blob_sha": "7fc4188e5b4c454c944d555e957f3c2885ab4a30",
    "colony_husbandry_record_template_file": "hypotheses/p4_external_validation_colony_husbandry_record_template_v1.json",
    "colony_husbandry_record_template_git_blob_sha": "b0a3a9bac49093c8650e5625666be387519895a4",
    "video_calibration_record_template_file": "hypotheses/p4_external_validation_video_calibration_record_template_v1.json",
    "video_calibration_record_template_git_blob_sha": "231fd746f5aae187e67e7959c9907791a1cc07de",
    "trial_record_schema_file": "hypotheses/p4_external_validation_trial_record_schema_v1.json",
    "trial_record_schema_git_blob_sha": "4072b72f7c3ea2de3a4eb24a37c850bd8b1d1193",
    "collector_independence_record_file": "hypotheses/p4_external_validation_collector_independence_record_v1.json",
    "collector_independence_record_git_blob_sha": "02289bed5ef4785bbadc584ef5077b633779d089",
    "collection_activation_checklist_file": "hypotheses/p4_external_validation_collection_activation_checklist_v1.json",
    "collection_activation_checklist_git_blob_sha": "1d983b319dc3946e6942a019981a490b20c3d049"
  },
  "gate_checks": {
    "preregistration_qualified_on_permanent_main": true,
    "marked_side_schedule_materialized_and_frozen": true,
    "release_pose_schedule_materialized_and_frozen": true,
    "chemical_batch_record_template_frozen": true,
    "colony_husbandry_record_template_frozen": true,
    "video_calibration_record_template_frozen": true,
    "trial_record_schema_frozen": true,
    "collection_activation_checklist_frozen": true,
    "collector_identity_frozen": false,
    "collector_independence_attestations_all_true": false,
    "new_biological_outcomes_known_to_exist_at_gate": false,
    "new_biological_outcome_access_authorized_at_gate": false,
    "candidate_307_prediction_disclosure_to_collector_authorized": false,
    "all_12_colony_husbandry_prospective_setup_fields_complete_and_valid": false
  },
  "collection_authorized": false,
  "authorization_blocker": "A real independent collector or collection team has not yet been identified and frozen, and the 12 colonies' prospective husbandry/source setup fields have not yet been completed. Collection must not begin until collector identity/affiliation is nonempty and frozen, every independence attestation is true including complete exclusion from this dataset's outcome analysis, all 12 prospective colony setup records satisfy the frozen source-nest/acclimation/feeding/deprivation/water/light-cycle setup requirements, the single master-stock batch and all failure-provenance rules remain frozen, regression/Codex review is clean on the exact head, and the activation change is qualified on permanent main before the first biological trial. Observed first-trial/test-day/lights-on-window evidence is recorded during collection rather than prefilled at activation.",
  "activation_rule": {
    "checklist_file": "hypotheses/p4_external_validation_collection_activation_checklist_v1.json",
    "checklist_git_blob_sha": "1d983b319dc3946e6942a019981a490b20c3d049",
    "requires_real_collector_identity": true,
    "requires_collector_affiliation_or_team_record": true,
    "requires_all_independence_attestations_true": true,
    "requires_collector_exclusion_from_this_dataset_outcome_analysis": true,
    "requires_chemical_session_batch_binding": true,
    "requires_failed_video_provenance_without_fabrication": true,
    "requires_one_local_test_day_per_colony": true,
    "requires_no_biological_collection_before_activation": true,
    "requires_no_new_biological_outcome_access_before_activation": true,
    "requires_exact_frozen_schedule_and_template_blobs_unchanged": true,
    "requires_exact_head_regression_and_code_review": true,
    "requires_permanent_main_qualification_before_first_trial": true,
    "requires_worker_assay_naivety_field_and_enforcement_frozen_at_activation": true,
    "requires_per_trial_fresh_substrate_and_cleaning_fields_and_enforcement_frozen_at_activation": true,
    "requires_per_trial_naivety_substrate_and_cleaning_evidence_recorded_prospectively_during_collection": true,
    "requires_complete_valid_12_colony_husbandry_prospective_setup_fields": true,
    "requires_exactly_one_chemical_master_stock_batch": true,
    "requires_failed_chemical_application_provenance_without_fabrication": true,
    "requires_failed_calibration_provenance_without_fabrication": true,
    "requires_husbandry_observed_fields_recorded_during_collection_not_prefilled": true
  },
  "semantic_firewall": {
    "may_change_preregistration": false,
    "may_change_candidate_307": false,
    "may_rerun_model_prediction": false,
    "may_regenerate_marked_side_schedule": false,
    "may_regenerate_release_pose_schedule": false,
    "may_use_interim_outcomes": false,
    "may_adapt_protocol_from_behavioral_outcomes": false,
    "may_access_candidate_prediction_during_collection": false,
    "may_authorize_canonical_promotion": false
  },
  "next_action": "Prospectively bind a real independent collector/team and complete the 12 colonies' activation-time husbandry/source setup fields under the frozen template; then activate collection under the unchanged schedules/templates. Record first-trial timestamps, observed test dates/lights-on compliance, and other observation-dependent husbandry fields prospectively as collection occurs."
}`));

const TRUSTED_BASE_COLLECTOR=Object.freeze(JSON.parse(String.raw`{
  "schema_version": 1,
  "id": "P4_external_validation_collector_independence_record_v1",
  "status": "identity_pending_collection_not_authorized",
  "preregistration_git_blob_sha": "b8a683e0199e6564a1fedc6f54391a535c32e0e4",
  "collector_identity": null,
  "collector_team_or_affiliation": null,
  "role": "physical collection of the 480 preregistered biological trials",
  "identity_frozen": false,
  "required_attestations_before_authorization": {
    "did_not_participate_in_P4_parameter_estimation": null,
    "did_not_participate_in_Candidate_307_selection": null,
    "will_not_participate_in_this_dataset_outcome_analysis": null,
    "has_not_been_given_Candidate_307_primary_prediction": null,
    "will_follow_frozen_marked_side_and_release_pose_schedules_without_regeneration": null,
    "will_not_monitor_or_adapt_protocol_to_interim_behavioral_outcomes": null,
    "will_preserve_all_attempts_exclusions_timeouts_and_protocol_deviations": null
  },
  "authorization_rule": "collection may be authorized only after collector_identity is nonempty, collector_team_or_affiliation is recorded, identity_frozen=true, and every required attestation is exactly true before any biological trial begins; promotion-grade independence requires the collector not to participate in this dataset's outcome analysis at any time",
  "current_authorization_condition_satisfied": false,
  "firewall": {
    "placeholder_identity_counts_as_frozen_identity": false,
    "collection_before_identity_freeze_authorized": false,
    "collector_identity_change_after_collection_starts_authorized": false,
    "collector_participation_in_this_dataset_outcome_analysis_authorized": false,
    "candidate_prediction_disclosure_to_collector_before_dataset_hash_freeze_authorized": false
  }
}`));

const MUTABLE_AUTHORIZATION_PATHS=Object.freeze([
  'status',
  'gate_checks.collector_identity_frozen',
  'gate_checks.collector_independence_attestations_all_true',
  'gate_checks.all_12_colony_husbandry_prospective_setup_fields_complete_and_valid',
  'collection_authorized',
  'authorization_blocker',
  'next_action',
  'activation_metadata'
]);

const ACTIVATION_METADATA_KEYS=Object.freeze([
  'schema_version',
  'activation_candidate_kind',
  'frozen_preauthorization_git_blob_sha',
  'collector_record_git_blob_sha',
  'husbandry_records_git_blob_sha',
  'precollection_declaration_git_blob_sha',
  'preflight_ready_for_activation_commit',
  'collection_authorized_in_candidate',
  'collection_effective_only_after_permanent_main_qualification_before_trial_1',
  'no_biological_collection_has_started',
  'no_new_biological_outcome_has_been_accessed',
  'candidate_307_prediction_has_not_been_disclosed_to_collector',
  'post_commit_gates_required'
]);

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

function gitBlobShaForBuffer(buffer){
  const header=Buffer.from('blob '+buffer.length+'\0','utf8');
  return crypto.createHash('sha1').update(header).update(buffer).digest('hex');
}

function gitBlobShaForFile(file){
  return gitBlobShaForBuffer(fs.readFileSync(file));
}

function gitHeadBlob(root,rel){
  try{
    return execFileSync('git',['rev-parse','HEAD:'+rel],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch(_err){
    return null;
  }
}

function gitIndexBlob(root,rel){
  try{
    return execFileSync('git',['rev-parse',':'+rel],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch(_err){
    return null;
  }
}

function gitWorkingBlob(root,rel){
  try{
    return execFileSync('git',['hash-object',rel],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
  }catch(_err){
    return null;
  }
}

function gitIndexMode(root,rel){
  try{
    const out=execFileSync('git',['ls-files','-s','--',rel],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
    if(!out) return null;
    const first=out.split(/\s+/)[0];
    return first||null;
  }catch(_err){
    return null;
  }
}

function assertCanonicalTrackedRegularFile(errors,root,rel,label){
  const abs=path.join(root,rel);
  let stat;
  try{
    stat=fs.lstatSync(abs);
  }catch(_err){
    errors.push((label||rel)+': missing canonical file '+rel);
    return;
  }
  if(!stat.isFile()){
    errors.push((label||rel)+': canonical path must be a regular file, not symlink/directory/special file');
  }
  const mode=gitIndexMode(root,rel);
  if(mode!=='100644'&&mode!=='100755'){
    errors.push((label||rel)+': canonical path must be tracked as a regular Git file; index mode='+String(mode));
  }
}

function assertPinnedBlob(errors,root,rel,expected,label){
  const abs=path.join(root,rel);
  if(!fs.existsSync(abs)){
    errors.push((label||rel)+': missing file '+rel);
    return;
  }
  const head=gitHeadBlob(root,rel);
  const index=gitIndexBlob(root,rel);
  const working=gitWorkingBlob(root,rel);
  if(head!==expected) errors.push((label||rel)+': committed blob drift '+head+' != '+expected);
  if(index!==expected) errors.push((label||rel)+': staged blob drift '+index+' != '+expected);
  if(working!==expected) errors.push((label||rel)+': working-tree blob drift '+working+' != '+expected);
}

function trustedFrozenInput(fileKey){
  return TRUSTED_FROZEN_COLLECTION_INPUTS.find(function(x){return x.fileKey===fileKey;});
}

function validateTransitionRepository(root,options){
  const errors=[];
  const opts=options||{};
  const canonicalAuthAbs=path.resolve(root,CANONICAL_AUTHORIZATION_REL);
  const canonicalCollectorAbs=path.resolve(root,CANONICAL_COLLECTOR_REL);
  const suppliedCollectorAbs=opts.collectorPath?path.resolve(opts.collectorPath):null;
  const suppliedCandidateAuthAbs=opts.candidateAuthorizationPath?path.resolve(opts.candidateAuthorizationPath):null;

  const baselineAuthErrors=validateFrozenAuthorizationContract(TRUSTED_BASE_AUTHORIZATION);
  if(baselineAuthErrors.length) errors.push(...baselineAuthErrors.map(function(e){return 'trusted baseline authorization: '+e;}));

  assertCanonicalTrackedRegularFile(errors,root,CANONICAL_AUTHORIZATION_REL,'canonical authorization');
  assertCanonicalTrackedRegularFile(errors,root,CANONICAL_COLLECTOR_REL,'canonical collector');

  if(suppliedCandidateAuthAbs!==canonicalAuthAbs){
    assertPinnedBlob(
      errors,root,
      CANONICAL_AUTHORIZATION_REL,
      TRUSTED_PREAUTHORIZATION_RECORD.git_blob_sha,
      'frozen preauthorization record'
    );
  }
  if(suppliedCollectorAbs!==canonicalCollectorAbs){
    assertPinnedBlob(
      errors,root,
      CANONICAL_COLLECTOR_REL,
      CANONICAL_COLLECTOR_BLOB,
      'frozen collector baseline'
    );
  }

  assertPinnedBlob(
    errors,root,
    TRUSTED_QUALIFIED_PREREGISTRATION.file,
    TRUSTED_QUALIFIED_PREREGISTRATION.git_blob_sha,
    'qualified preregistration'
  );

  for(const item of TRUSTED_FROZEN_COLLECTION_INPUTS){
    if(item.fileKey==='collector_independence_record_file') continue;
    assertPinnedBlob(errors,root,item.file,item.git_blob_sha,item.label);
  }

  const releaseContract=trustedFrozenInput('release_pose_schedule_manifest_file');
  const releasePath=releaseContract.file;
  if(fs.existsSync(path.join(root,releasePath))){
    const release=readJson(path.join(root,releasePath));
    assertPinnedBlob(errors,root,release.simulation_initialization_file,release.simulation_initialization_git_blob_sha,'release initialization');
    assertPinnedBlob(errors,root,release.rng_file,release.rng_git_blob_sha,'release RNG');
    if(!Array.isArray(release.parts)||release.parts.length!==12){
      errors.push('release-pose manifest must bind exactly 12 parts');
    }else{
      for(const part of release.parts){
        assertPinnedBlob(errors,root,part.file,part.git_blob_sha,'release-pose part colony '+part.colony);
      }
    }
  }

  return errors;
}

function buildActivationMetadata(options){
  return {
    schema_version:1,
    activation_candidate_kind:'prospective_collection_activation',
    frozen_preauthorization_git_blob_sha:TRUSTED_PREAUTHORIZATION_RECORD.git_blob_sha,
    collector_record_git_blob_sha:gitBlobShaForFile(options.collectorPath),
    husbandry_records_git_blob_sha:gitBlobShaForFile(options.husbandryPath),
    precollection_declaration_git_blob_sha:gitBlobShaForFile(options.declarationPath),
    preflight_ready_for_activation_commit:true,
    collection_authorized_in_candidate:true,
    collection_effective_only_after_permanent_main_qualification_before_trial_1:true,
    no_biological_collection_has_started:true,
    no_new_biological_outcome_has_been_accessed:true,
    candidate_307_prediction_has_not_been_disclosed_to_collector:true,
    post_commit_gates_required:Array.from(POST_COMMIT_GATES)
  };
}

function buildCandidateAuthorization(options){
  const candidate=clone(TRUSTED_BASE_AUTHORIZATION);
  candidate.status=ACTIVE_STATUS;
  candidate.gate_checks.collector_identity_frozen=true;
  candidate.gate_checks.collector_independence_attestations_all_true=true;
  candidate.gate_checks.all_12_colony_husbandry_prospective_setup_fields_complete_and_valid=true;
  candidate.collection_authorized=true;
  candidate.authorization_blocker=null;
  candidate.next_action=ACTIVE_NEXT_ACTION;
  candidate.activation_metadata=buildActivationMetadata(options);
  return candidate;
}

function normalizeCandidateAuthorization(candidate){
  const normalized=clone(candidate);
  normalized.status=TRUSTED_BASE_AUTHORIZATION.status;
  if(normalized.gate_checks){
    normalized.gate_checks.collector_identity_frozen=TRUSTED_BASE_AUTHORIZATION.gate_checks.collector_identity_frozen;
    normalized.gate_checks.collector_independence_attestations_all_true=TRUSTED_BASE_AUTHORIZATION.gate_checks.collector_independence_attestations_all_true;
    normalized.gate_checks.all_12_colony_husbandry_prospective_setup_fields_complete_and_valid=
      TRUSTED_BASE_AUTHORIZATION.gate_checks.all_12_colony_husbandry_prospective_setup_fields_complete_and_valid;
  }
  normalized.collection_authorized=TRUSTED_BASE_AUTHORIZATION.collection_authorized;
  normalized.authorization_blocker=TRUSTED_BASE_AUTHORIZATION.authorization_blocker;
  normalized.next_action=TRUSTED_BASE_AUTHORIZATION.next_action;
  delete normalized.activation_metadata;
  return normalized;
}

function validateActivationMetadata(metadata,options){
  const errors=[];
  if(!metadata||typeof metadata!=='object'||Array.isArray(metadata)){
    return ['candidate authorization activation_metadata must be an object'];
  }
  const actualKeys=Object.keys(metadata).sort();
  const expectedKeys=Array.from(ACTIVATION_METADATA_KEYS).sort();
  if(!isDeepStrictEqual(actualKeys,expectedKeys)){
    errors.push('candidate authorization activation_metadata keys must exactly match the transition contract');
  }

  const expected=buildActivationMetadata(options);
  for(const key of ACTIVATION_METADATA_KEYS){
    if(!isDeepStrictEqual(metadata[key],expected[key])){
      errors.push('candidate authorization activation_metadata mismatch: '+key);
    }
  }
  return errors;
}

function validateCandidateAuthorization(candidate,options){
  const errors=[];
  if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)){
    return ['candidate authorization must be a JSON object'];
  }

  if(candidate.status!==ACTIVE_STATUS){
    errors.push('candidate authorization status must equal '+ACTIVE_STATUS);
  }
  if(candidate.collection_authorized!==true){
    errors.push('candidate authorization collection_authorized must be true');
  }
  if(candidate.authorization_blocker!==null){
    errors.push('candidate authorization authorization_blocker must be null after all prospective input blockers are satisfied');
  }
  if(candidate.next_action!==ACTIVE_NEXT_ACTION){
    errors.push('candidate authorization next_action must preserve the permanent-main-before-trial-1 activation rule');
  }

  const gates=candidate.gate_checks||{};
  for(const key of [
    'collector_identity_frozen',
    'collector_independence_attestations_all_true',
    'all_12_colony_husbandry_prospective_setup_fields_complete_and_valid'
  ]){
    if(gates[key]!==true) errors.push('candidate authorization gate must be true: '+key);
  }

  errors.push(...validateActivationMetadata(candidate.activation_metadata,options));

  const normalized=normalizeCandidateAuthorization(candidate);
  if(!isDeepStrictEqual(normalized,TRUSTED_BASE_AUTHORIZATION)){
    errors.push('candidate authorization changes immutable frozen fields outside the explicit activation transition surface');
  }

  return errors;
}

function evaluateActivationTransition(options){
  const root=path.resolve(options.root);
  const collectorPath=path.resolve(options.collectorPath);
  const husbandryPath=path.resolve(options.husbandryPath);
  const declarationPath=path.resolve(options.declarationPath);
  const preflightTimeMs=options.preflightTimeMs===undefined?Date.now():options.preflightTimeMs;

  const errors=validateTransitionRepository(root,{
    collectorPath:collectorPath,
    candidateAuthorizationPath:options.candidateAuthorizationPath?path.resolve(options.candidateAuthorizationPath):null
  });
  if(!Number.isFinite(preflightTimeMs)) errors.push('preflightTimeMs must be a finite epoch-millisecond number');

  const husbandryTemplate=readJson(path.join(root,trustedFrozenInput('colony_husbandry_record_template_file').file));
  const collector=readJson(collectorPath);
  const husbandry=readJson(husbandryPath);
  const declaration=readJson(declarationPath);

  errors.push(...validateCollector(
    collector,
    TRUSTED_BASE_COLLECTOR,
    TRUSTED_QUALIFIED_PREREGISTRATION.git_blob_sha
  ));
  errors.push(...validateHusbandry(husbandry,husbandryTemplate,preflightTimeMs));
  errors.push(...validateDeclaration(declaration,preflightTimeMs));

  let candidate;
  if(options.candidateAuthorizationPath){
    candidate=readJson(path.resolve(options.candidateAuthorizationPath));
  }else{
    candidate=buildCandidateAuthorization({collectorPath:collectorPath,husbandryPath:husbandryPath,declarationPath:declarationPath});
  }

  errors.push(...validateCandidateAuthorization(candidate,{
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath
  }));

  return {
    schema_version:1,
    id:'P4_external_validation_activation_transition_candidate_v1',
    ready_for_activation_commit:errors.length===0,
    candidate_collection_authorized:candidate&&candidate.collection_authorized===true,
    biological_collection_may_begin:false,
    errors:errors,
    mutable_authorization_paths:Array.from(MUTABLE_AUTHORIZATION_PATHS),
    manual_verification_required:[
      'collector_identity_and_affiliation_are_real_and_truthful',
      'all_collector_independence_attestations_are_truthful',
      'all_12_colony_source_identifiers_correspond_to_distinct_real_wild_source_nests',
      'precollection_declaration_is_truthful'
    ],
    post_commit_gates_remaining:Array.from(POST_COMMIT_GATES),
    candidate_authorization:candidate,
    note:'A passing transition only validates a prospective activation commit candidate. Biological collection remains forbidden until that exact activation commit receives clean exact-head regression/Codex review, is merged, and is qualified by successful permanent-main test and deploy before trial 1.'
  };
}

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--json'){out.json=true;continue;}
    if(arg.startsWith('--')){
      const key=arg.slice(2);
      const value=argv[++i];
      if(!value||value.startsWith('--')) throw new Error('missing value for '+arg);
      out[key]=value;
      continue;
    }
    throw new Error('unexpected argument: '+arg);
  }
  return out;
}

function main(){
  try{
    const args=parseArgs(process.argv.slice(2));
    if(!args.collector||!args.husbandry||!args.declaration){
      throw new Error('usage: node tools/build-p4-external-validation-activation-transition.js --collector <json> --husbandry <json> --declaration <json> (--out <candidate-authorization.json> | --candidate <candidate-authorization.json>) [--json]');
    }
    if(Boolean(args.out)===Boolean(args.candidate)){
      throw new Error('exactly one of --out or --candidate is required');
    }

    const root=path.resolve(__dirname,'..');
    const collectorPath=path.resolve(args.collector);
    const husbandryPath=path.resolve(args.husbandry);
    const declarationPath=path.resolve(args.declaration);
    const candidatePath=args.candidate?path.resolve(args.candidate):null;

    const result=evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      candidateAuthorizationPath:candidatePath
    });

    if(args.out&&result.ready_for_activation_commit){
      const outPath=path.resolve(args.out);
      if(fs.existsSync(outPath)) throw new Error('refusing to overwrite existing candidate authorization: '+outPath);
      fs.mkdirSync(path.dirname(outPath),{recursive:true});
      fs.writeFileSync(outPath,JSON.stringify(result.candidate_authorization,null,2)+'\n',{encoding:'utf8',flag:'wx'});
    }

    const printable=clone(result);
    delete printable.candidate_authorization;
    if(args.json){
      process.stdout.write(JSON.stringify(printable,null,2)+'\n');
    }else{
      console.log(result.ready_for_activation_commit?'P4 ACTIVATION TRANSITION CANDIDATE READY':'P4 ACTIVATION TRANSITION CANDIDATE BLOCKED');
      for(const e of result.errors) console.log('- '+e);
      console.log('candidate_collection_authorized='+(result.candidate_collection_authorized?'true':'false'));
      console.log('biological_collection_may_begin=false');
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
  CANONICAL_AUTHORIZATION_REL:CANONICAL_AUTHORIZATION_REL,
  CANONICAL_COLLECTOR_REL:CANONICAL_COLLECTOR_REL,
  CANONICAL_COLLECTOR_BLOB:CANONICAL_COLLECTOR_BLOB,
  ACTIVE_STATUS:ACTIVE_STATUS,
  ACTIVE_NEXT_ACTION:ACTIVE_NEXT_ACTION,
  TRUSTED_BASE_AUTHORIZATION:TRUSTED_BASE_AUTHORIZATION,
  TRUSTED_BASE_COLLECTOR:TRUSTED_BASE_COLLECTOR,
  MUTABLE_AUTHORIZATION_PATHS:MUTABLE_AUTHORIZATION_PATHS,
  ACTIVATION_METADATA_KEYS:ACTIVATION_METADATA_KEYS,
  gitBlobShaForBuffer:gitBlobShaForBuffer,
  gitBlobShaForFile:gitBlobShaForFile,
  gitIndexMode:gitIndexMode,
  assertCanonicalTrackedRegularFile:assertCanonicalTrackedRegularFile,
  validateTransitionRepository:validateTransitionRepository,
  buildActivationMetadata:buildActivationMetadata,
  buildCandidateAuthorization:buildCandidateAuthorization,
  normalizeCandidateAuthorization:normalizeCandidateAuthorization,
  validateActivationMetadata:validateActivationMetadata,
  validateCandidateAuthorization:validateCandidateAuthorization,
  evaluateActivationTransition:evaluateActivationTransition
};
