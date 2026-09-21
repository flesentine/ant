'use strict';

const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawnSync}=require('child_process');
const transition=require('../tools/build-p4-external-validation-activation-transition');

const root=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'antlab-p4-activation-transition-'));

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function offsetIso(ms){
  return new Date(ms).toISOString().replace('Z','+00:00');
}

function writeJson(file,value){
  fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n','utf8');
}

function validPacket(nowMs){
  const collector=clone(transition.TRUSTED_BASE_COLLECTOR);
  collector.collector_identity='Synthetic Fixture Collector';
  collector.collector_team_or_affiliation='Synthetic Fixture Independent Team';
  collector.identity_frozen=true;
  for(const key of Object.keys(collector.required_attestations_before_authorization)){
    collector.required_attestations_before_authorization[key]=true;
  }
  collector.current_authorization_condition_satisfied=true;

  const acclimation=nowMs-(6*24*60*60*1000);
  const deprivation=nowMs-(24*60*60*1000);
  const husbandry={records:[]};
  for(let i=1;i<=12;i++){
    husbandry.records.push({
      colony_id:'C'+String(i).padStart(2,'0'),
      wild_source_colony_id:'SYNTH-WILD-'+String(i).padStart(2,'0'),
      source_nest_id:'SYNTH-NEST-'+String(i).padStart(2,'0'),
      lab_acclimation_start_timestamp_local:offsetIso(acclimation),
      pre_deprivation_sucrose_molarity_M:0.5,
      pre_deprivation_sucrose_ad_libitum:true,
      pre_deprivation_chopped_cockroach_feedings_per_week:3,
      food_deprivation_start_timestamp_local:offsetIso(deprivation),
      water_ad_libitum_during_deprivation:true,
      light_dark_cycle_hours:'12:12',
      no_food_reward_present_in_test_maze:true
    });
  }

  const declaration={
    attested_by:'Synthetic Fixture Collector',
    attested_at_local:offsetIso(nowMs-(60*60*1000)),
    no_biological_collection_has_started:true,
    no_new_biological_outcome_has_been_accessed:true,
    candidate_307_prediction_has_not_been_disclosed_to_collector:true
  };
  return {collector:collector,husbandry:husbandry,declaration:declaration};
}

try{
  const nowMs=Date.parse('2026-09-21T04:00:00Z');
  const packet=validPacket(nowMs);
  const collectorPath=path.join(tmp,'collector.json');
  const husbandryPath=path.join(tmp,'husbandry.json');
  const declarationPath=path.join(tmp,'declaration.json');
  writeJson(collectorPath,packet.collector);
  writeJson(husbandryPath,packet.husbandry);
  writeJson(declarationPath,packet.declaration);

  const built=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath,
    preflightTimeMs:nowMs
  });

  assert.strictEqual(built.ready_for_activation_commit,true,built.errors.join('\n'));
  assert.strictEqual(built.candidate_collection_authorized,true);
  assert.strictEqual(built.biological_collection_may_begin,false);
  assert.deepStrictEqual(built.errors,[]);
  assert.deepStrictEqual(built.mutable_authorization_paths,Array.from(transition.MUTABLE_AUTHORIZATION_PATHS));
  assert.strictEqual(built.post_commit_gates_remaining.length,3);

  const candidate=built.candidate_authorization;
  assert.strictEqual(candidate.status,transition.ACTIVE_STATUS);
  assert.strictEqual(candidate.collection_authorized,true);
  assert.strictEqual(candidate.authorization_blocker,null);
  assert.strictEqual(candidate.next_action,transition.ACTIVE_NEXT_ACTION);
  assert.strictEqual(candidate.gate_checks.collector_identity_frozen,true);
  assert.strictEqual(candidate.gate_checks.collector_independence_attestations_all_true,true);
  assert.strictEqual(candidate.gate_checks.all_12_colony_husbandry_prospective_setup_fields_complete_and_valid,true);
  assert.strictEqual(candidate.gate_checks.new_biological_outcomes_known_to_exist_at_gate,false);
  assert.strictEqual(candidate.gate_checks.new_biological_outcome_access_authorized_at_gate,false);
  assert.strictEqual(candidate.gate_checks.candidate_307_prediction_disclosure_to_collector_authorized,false);
  assert.deepStrictEqual(
    transition.normalizeCandidateAuthorization(candidate),
    transition.TRUSTED_BASE_AUTHORIZATION
  );

  const metadata=candidate.activation_metadata;
  assert.deepStrictEqual(Object.keys(metadata).sort(),Array.from(transition.ACTIVATION_METADATA_KEYS).sort());
  assert.strictEqual(metadata.collector_record_git_blob_sha,transition.gitBlobShaForFile(collectorPath));
  assert.strictEqual(metadata.husbandry_records_git_blob_sha,transition.gitBlobShaForFile(husbandryPath));
  assert.strictEqual(metadata.precollection_declaration_git_blob_sha,transition.gitBlobShaForFile(declarationPath));
  assert.strictEqual(metadata.preflight_ready_for_activation_commit,true);
  assert.strictEqual(metadata.collection_authorized_in_candidate,true);
  assert.strictEqual(metadata.collection_effective_only_after_permanent_main_qualification_before_trial_1,true);
  assert.strictEqual(metadata.no_biological_collection_has_started,true);
  assert.strictEqual(metadata.no_new_biological_outcome_has_been_accessed,true);
  assert.strictEqual(metadata.candidate_307_prediction_has_not_been_disclosed_to_collector,true);

  const candidatePath=path.join(tmp,'candidate.json');
  writeJson(candidatePath,candidate);
  const validated=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath,
    candidateAuthorizationPath:candidatePath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(validated.ready_for_activation_commit,true,validated.errors.join('\n'));

  const immutableTamper=clone(candidate);
  immutableTamper.semantic_firewall.may_change_candidate_307=true;
  const immutableTamperPath=path.join(tmp,'candidate-immutable-tamper.json');
  writeJson(immutableTamperPath,immutableTamper);
  const immutableResult=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath,
    candidateAuthorizationPath:immutableTamperPath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(immutableResult.ready_for_activation_commit,false);
  assert.ok(immutableResult.errors.some(function(x){return x.includes('immutable frozen fields');}));

  const extraMetadata=clone(candidate);
  extraMetadata.activation_metadata.observed_choice_rate=0.99;
  const extraMetadataPath=path.join(tmp,'candidate-extra-metadata.json');
  writeJson(extraMetadataPath,extraMetadata);
  const extraMetadataResult=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath,
    candidateAuthorizationPath:extraMetadataPath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(extraMetadataResult.ready_for_activation_commit,false);
  assert.ok(extraMetadataResult.errors.some(function(x){return x.includes('activation_metadata keys');}));

  const badGate=clone(candidate);
  badGate.gate_checks.collector_identity_frozen=false;
  const badGatePath=path.join(tmp,'candidate-bad-gate.json');
  writeJson(badGatePath,badGate);
  const badGateResult=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath,
    candidateAuthorizationPath:badGatePath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(badGateResult.ready_for_activation_commit,false);
  assert.ok(badGateResult.errors.some(function(x){return x.includes('collector_identity_frozen');}));

  const badStatus=clone(candidate);
  badStatus.status='active';
  const badStatusPath=path.join(tmp,'candidate-bad-status.json');
  writeJson(badStatusPath,badStatus);
  const badStatusResult=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath,
    candidateAuthorizationPath:badStatusPath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(badStatusResult.ready_for_activation_commit,false);
  assert.ok(badStatusResult.errors.some(function(x){return x.includes('status must equal');}));

  const canonicalAuthPath=path.join(root,transition.CANONICAL_AUTHORIZATION_REL);
  const canonicalAuthOriginal=fs.readFileSync(canonicalAuthPath,'utf8');
  try{
    const driftedAuth=JSON.parse(canonicalAuthOriginal);
    driftedAuth.semantic_firewall.may_change_candidate_307=true;
    fs.writeFileSync(canonicalAuthPath,JSON.stringify(driftedAuth,null,2)+'\n','utf8');

    const repoDriftResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(repoDriftResult.ready_for_activation_commit,false);
    assert.ok(repoDriftResult.errors.some(function(x){return x.includes('frozen preauthorization record: working-tree blob drift');}));
  }finally{
    fs.writeFileSync(canonicalAuthPath,canonicalAuthOriginal,'utf8');
  }

  const canonicalCandidatePath=path.join(root,transition.CANONICAL_AUTHORIZATION_REL);
  const canonicalOriginal=fs.readFileSync(canonicalCandidatePath,'utf8');
  const externalCandidatePath=path.join(tmp,'external-valid-candidate.json');
  writeJson(externalCandidatePath,candidate);
  try{
    fs.rmSync(canonicalCandidatePath);
    fs.symlinkSync(externalCandidatePath,canonicalCandidatePath);

    const symlinkResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      candidateAuthorizationPath:canonicalCandidatePath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(symlinkResult.ready_for_activation_commit,false);
    assert.ok(symlinkResult.errors.some(function(x){
      return x.includes('canonical authorization: canonical path must be a regular file');
    }));
  }finally{
    try{fs.rmSync(canonicalCandidatePath);}catch(_err){}
    fs.writeFileSync(canonicalCandidatePath,canonicalOriginal,'utf8');
  }

  const hypothesesPath=path.join(root,'hypotheses');
  const hypothesesBackup=path.join(root,'.p4-hypotheses-backup-for-transition-test');
  const externalHypotheses=path.join(tmp,'external-hypotheses');
  fs.cpSync(hypothesesPath,externalHypotheses,{recursive:true});
  writeJson(path.join(externalHypotheses,'p4_external_validation_collection_authorization_v1.json'),candidate);
  try{
    fs.renameSync(hypothesesPath,hypothesesBackup);
    fs.symlinkSync(externalHypotheses,hypothesesPath,'dir');

    const ancestorSymlinkResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      candidateAuthorizationPath:path.join(hypothesesPath,'p4_external_validation_collection_authorization_v1.json'),
      preflightTimeMs:nowMs
    });
    assert.strictEqual(ancestorSymlinkResult.ready_for_activation_commit,false);
    assert.ok(ancestorSymlinkResult.errors.some(function(x){
      return x.includes('canonical path component must not be a symlink: hypotheses');
    }));
  }finally{
    try{fs.rmSync(hypothesesPath,{recursive:true,force:true});}catch(_err){}
    if(fs.existsSync(hypothesesBackup)) fs.renameSync(hypothesesBackup,hypothesesPath);
  }

  const badDeclaration=clone(packet.declaration);
  badDeclaration.no_biological_collection_has_started=false;
  const badDeclarationPath=path.join(tmp,'bad-declaration.json');
  writeJson(badDeclarationPath,badDeclaration);
  const declarationResult=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:badDeclarationPath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(declarationResult.ready_for_activation_commit,false);
  assert.ok(declarationResult.errors.some(function(x){return x.includes('no_biological_collection_has_started');}));

  const observedHusbandry=clone(packet.husbandry);
  observedHusbandry.records[0].first_trial_timestamp_local=offsetIso(nowMs+(72*60*60*1000));
  const observedHusbandryPath=path.join(tmp,'observed-husbandry.json');
  writeJson(observedHusbandryPath,observedHusbandry);
  const observedResult=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:observedHusbandryPath,
    declarationPath:declarationPath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(observedResult.ready_for_activation_commit,false);
  assert.ok(observedResult.errors.some(function(x){return x.includes('must not prefill future observed/derived field');}));

  const cliPacket=validPacket(Date.now());
  const cliCollector=path.join(tmp,'cli-collector.json');
  const cliHusbandry=path.join(tmp,'cli-husbandry.json');
  const cliDeclaration=path.join(tmp,'cli-declaration.json');
  const cliCandidate=path.join(tmp,'cli-candidate.json');
  writeJson(cliCollector,cliPacket.collector);
  writeJson(cliHusbandry,cliPacket.husbandry);
  writeJson(cliDeclaration,cliPacket.declaration);

  const buildCli=spawnSync(process.execPath,[
    path.join(root,'tools/build-p4-external-validation-activation-transition.js'),
    '--collector',cliCollector,
    '--husbandry',cliHusbandry,
    '--declaration',cliDeclaration,
    '--out',cliCandidate,
    '--json'
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(buildCli.status,0,buildCli.stderr+'\n'+buildCli.stdout);
  const buildCliResult=JSON.parse(buildCli.stdout);
  assert.strictEqual(buildCliResult.ready_for_activation_commit,true);
  assert.strictEqual(buildCliResult.candidate_collection_authorized,true);
  assert.strictEqual(buildCliResult.biological_collection_may_begin,false);
  assert.ok(fs.existsSync(cliCandidate));

  const validateCli=spawnSync(process.execPath,[
    path.join(root,'tools/build-p4-external-validation-activation-transition.js'),
    '--collector',cliCollector,
    '--husbandry',cliHusbandry,
    '--declaration',cliDeclaration,
    '--candidate',cliCandidate,
    '--json'
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(validateCli.status,0,validateCli.stderr+'\n'+validateCli.stdout);
  assert.strictEqual(JSON.parse(validateCli.stdout).ready_for_activation_commit,true);

  const sentinel=fs.readFileSync(cliCandidate,'utf8');
  const overwriteCli=spawnSync(process.execPath,[
    path.join(root,'tools/build-p4-external-validation-activation-transition.js'),
    '--collector',cliCollector,
    '--husbandry',cliHusbandry,
    '--declaration',cliDeclaration,
    '--out',cliCandidate,
    '--json'
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(overwriteCli.status,1);
  assert.match(overwriteCli.stderr,/refusing to overwrite existing candidate authorization/);
  assert.strictEqual(fs.readFileSync(cliCandidate,'utf8'),sentinel);

  const blockedDeclaration=clone(cliPacket.declaration);
  blockedDeclaration.no_new_biological_outcome_has_been_accessed=false;
  const blockedDeclarationPath=path.join(tmp,'cli-blocked-declaration.json');
  const blockedOut=path.join(tmp,'blocked-candidate.json');
  writeJson(blockedDeclarationPath,blockedDeclaration);
  const blockedCli=spawnSync(process.execPath,[
    path.join(root,'tools/build-p4-external-validation-activation-transition.js'),
    '--collector',cliCollector,
    '--husbandry',cliHusbandry,
    '--declaration',blockedDeclarationPath,
    '--out',blockedOut,
    '--json'
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(blockedCli.status,2,blockedCli.stderr+'\n'+blockedCli.stdout);
  assert.strictEqual(fs.existsSync(blockedOut),false,'blocked transition must not emit candidate authorization');

  console.log('p4-external-validation-activation-transition.test.js PASS '+JSON.stringify({
    immutable_scientific_fields_normalized:true,
    mutable_authorization_paths:transition.MUTABLE_AUTHORIZATION_PATHS.length,
    packet_blobs_bound:true,
    synthetic_valid_candidate_ready:true,
    immutable_tamper_rejected:true,
    frozen_repository_auth_drift_rejected:true,
    canonical_authorization_symlink_rejected:true,
    canonical_ancestor_symlink_rejected:true,
    outcome_like_metadata_rejected:true,
    future_observed_husbandry_rejected:true,
    overwrite_refused:true,
    blocked_transition_emits_no_candidate:true,
    candidate_collection_authorized:true,
    biological_collection_may_begin:false,
    remaining_post_commit_gates:built.post_commit_gates_remaining.length
  }));
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}
