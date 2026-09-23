'use strict';

const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawnSync}=require('child_process');
const transition=require('../tools/build-p4-external-validation-activation-transition');

const root=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'antlab-p4-activation-transition-'));
const canonicalCollectorPath=path.join(root,transition.CANONICAL_COLLECTOR_REL);
const canonicalCollectorCheckoutOriginal=fs.readFileSync(canonicalCollectorPath);
const canonicalAuthPath=path.join(root,transition.CANONICAL_AUTHORIZATION_REL);
const canonicalAuthCheckoutOriginal=fs.readFileSync(canonicalAuthPath);
const canonicalHusbandryPath=path.join(root,transition.CANONICAL_HUSBANDRY_REL);
const canonicalHusbandryCheckoutOriginal=fs.readFileSync(canonicalHusbandryPath);
const canonicalDeclarationPath=path.join(root,transition.CANONICAL_DECLARATION_REL);
const canonicalDeclarationCheckoutOriginal=fs.readFileSync(canonicalDeclarationPath);
const activationDocPath=path.join(root,'docs/P4_EXTERNAL_VALIDATION_ACTIVATION.md');
const activationDocCheckoutOriginal=fs.readFileSync(activationDocPath);

function trustedFrozenBytes(rel,expectedBlob){
  for(const rev of ['HEAD','HEAD^1']){
    const buffer=transition.gitRevBuffer(root,rev,rel);
    if(buffer&&transition.gitBlobShaForBuffer(buffer)===expectedBlob) return buffer;
  }
  throw new Error('unable to load trusted frozen bytes for '+rel+' at blob '+expectedBlob);
}

const canonicalCollectorBaselineOriginal=trustedFrozenBytes(
  transition.CANONICAL_COLLECTOR_REL,
  transition.CANONICAL_COLLECTOR_BLOB
);
const canonicalAuthBaselineOriginal=trustedFrozenBytes(
  transition.CANONICAL_AUTHORIZATION_REL,
  transition.CANONICAL_AUTHORIZATION_BLOB
);
const canonicalHusbandryBaselineOriginal=trustedFrozenBytes(
  transition.CANONICAL_HUSBANDRY_REL,
  transition.CANONICAL_HUSBANDRY_BLOB
);
const canonicalDeclarationBaselineOriginal=trustedFrozenBytes(
  transition.CANONICAL_DECLARATION_REL,
  transition.CANONICAL_DECLARATION_BLOB
);
const husbandryTemplateRel=transition.TRUSTED_BASE_AUTHORIZATION.frozen_collection_inputs.colony_husbandry_record_template_file;
const husbandryTemplateBlob=transition.TRUSTED_BASE_AUTHORIZATION.frozen_collection_inputs.colony_husbandry_record_template_git_blob_sha;
const husbandryTemplateFrozenBytes=trustedFrozenBytes(husbandryTemplateRel,husbandryTemplateBlob);

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
  const baselineRepo=path.join(tmp,'committed-baseline-repo');
  fs.mkdirSync(path.join(baselineRepo,path.dirname(transition.CANONICAL_AUTHORIZATION_REL)),{recursive:true});
  fs.writeFileSync(
    path.join(baselineRepo,transition.CANONICAL_AUTHORIZATION_REL),
    canonicalAuthBaselineOriginal
  );
  fs.writeFileSync(
    path.join(baselineRepo,transition.CANONICAL_COLLECTOR_REL),
    canonicalCollectorBaselineOriginal
  );
  fs.writeFileSync(
    path.join(baselineRepo,transition.CANONICAL_HUSBANDRY_REL),
    canonicalHusbandryBaselineOriginal
  );
  fs.writeFileSync(
    path.join(baselineRepo,transition.CANONICAL_DECLARATION_REL),
    canonicalDeclarationBaselineOriginal
  );
  fs.mkdirSync(path.join(baselineRepo,path.dirname(husbandryTemplateRel)),{recursive:true});
  fs.writeFileSync(path.join(baselineRepo,husbandryTemplateRel),husbandryTemplateFrozenBytes);
  let git=spawnSync('git',['init'],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['config','user.email','antlab-test@example.invalid'],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['config','user.name','ANTLAB Test'],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['add','.'],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['commit','-m','baseline'],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  assert.deepStrictEqual(transition.validateCommittedActivationBaselines(baselineRepo),[]);

  const driftedHeadAuth=JSON.parse(canonicalAuthBaselineOriginal.toString('utf8'));
  driftedHeadAuth.semantic_firewall.may_change_candidate_307=true;
  writeJson(path.join(baselineRepo,transition.CANONICAL_AUTHORIZATION_REL),driftedHeadAuth);
  git=spawnSync('git',['add',transition.CANONICAL_AUTHORIZATION_REL],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['commit','-m','drift auth'],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  const authHeadDrift=transition.validateCommittedActivationBaselines(baselineRepo);
  assert.ok(authHeadDrift.some(function(x){
    return x.includes('activation commit surface:');
  }));

  fs.writeFileSync(path.join(baselineRepo,transition.CANONICAL_AUTHORIZATION_REL),canonicalAuthBaselineOriginal);
  const driftedHeadCollector=JSON.parse(canonicalCollectorBaselineOriginal.toString('utf8'));
  driftedHeadCollector.collector_identity='Prematurely Committed Collector';
  writeJson(path.join(baselineRepo,transition.CANONICAL_COLLECTOR_REL),driftedHeadCollector);
  git=spawnSync('git',['add',transition.CANONICAL_AUTHORIZATION_REL,transition.CANONICAL_COLLECTOR_REL],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['commit','-m','restore auth drift collector'],{cwd:baselineRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  const collectorHeadDrift=transition.validateCommittedActivationBaselines(baselineRepo);
  assert.ok(collectorHeadDrift.length>0);
  assert.ok(collectorHeadDrift.some(function(x){
    return x.includes('parent blob drift')||x.includes('activation HEAD collector:');
  }));

  // Fresh isolated repository: an activation HEAD may differ from the frozen blobs
  // only when its first parent is exactly the reviewed frozen baseline.
  const activationRepo=path.join(tmp,'activation-head-repo');
  fs.mkdirSync(path.join(activationRepo,path.dirname(transition.CANONICAL_AUTHORIZATION_REL)),{recursive:true});
  fs.writeFileSync(
    path.join(activationRepo,transition.CANONICAL_AUTHORIZATION_REL),
    canonicalAuthBaselineOriginal
  );
  fs.writeFileSync(
    path.join(activationRepo,transition.CANONICAL_COLLECTOR_REL),
    canonicalCollectorBaselineOriginal
  );
  fs.writeFileSync(
    path.join(activationRepo,transition.CANONICAL_HUSBANDRY_REL),
    canonicalHusbandryBaselineOriginal
  );
  fs.writeFileSync(
    path.join(activationRepo,transition.CANONICAL_DECLARATION_REL),
    canonicalDeclarationBaselineOriginal
  );
  fs.mkdirSync(path.join(activationRepo,path.dirname(husbandryTemplateRel)),{recursive:true});
  fs.writeFileSync(path.join(activationRepo,husbandryTemplateRel),husbandryTemplateFrozenBytes);
  fs.writeFileSync(path.join(activationRepo,'unrelated-model-note.txt'),'baseline\n','utf8');
  git=spawnSync('git',['init'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['config','user.email','antlab-test@example.invalid'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['config','user.name','ANTLAB Test'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['add','.'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['commit','-m','frozen baseline'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);

  const activationNowMs=Date.parse('2026-09-21T04:00:00Z');
  const activationPacket=validPacket(activationNowMs);
  const activatedCollectorBytes=Buffer.from(JSON.stringify(activationPacket.collector,null,2)+'\n','utf8');
  const activatedHusbandryBytes=Buffer.from(JSON.stringify(activationPacket.husbandry,null,2)+'\n','utf8');
  const activatedDeclarationBytes=Buffer.from(JSON.stringify(activationPacket.declaration,null,2)+'\n','utf8');
  const activatedCollectorBlob=transition.gitBlobShaForBuffer(activatedCollectorBytes);
  const activatedHusbandryBlob=transition.gitBlobShaForBuffer(activatedHusbandryBytes);
  const activatedDeclarationBlob=transition.gitBlobShaForBuffer(activatedDeclarationBytes);

  const badHashAuth=transition.buildCandidateAuthorization({
    collectorGitBlobSha:activatedCollectorBlob,
    husbandryGitBlobSha:'1111111111111111111111111111111111111111',
    declarationGitBlobSha:activatedDeclarationBlob
  });
  fs.writeFileSync(
    path.join(activationRepo,transition.CANONICAL_AUTHORIZATION_REL),
    JSON.stringify(badHashAuth,null,2)+'\n','utf8'
  );
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_COLLECTOR_REL),activatedCollectorBytes);
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_HUSBANDRY_REL),activatedHusbandryBytes);
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_DECLARATION_REL),activatedDeclarationBytes);
  git=spawnSync('git',['add','.'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  const activationCommitEnv=Object.assign({},process.env,{
    GIT_AUTHOR_DATE:'2026-09-21T04:00:00Z',
    GIT_COMMITTER_DATE:'2026-09-21T04:00:00Z'
  });
  git=spawnSync('git',['commit','-m','bad activation head packet hash'],{
    cwd:activationRepo,encoding:'utf8',env:activationCommitEnv
  });
  assert.strictEqual(git.status,0,git.stderr);
  const badHashHead=transition.validateCommittedActivationBaselines(activationRepo);
  assert.ok(badHashHead.some(function(x){
    return x.includes('activation HEAD authorization:')&&
      x.includes('husbandry_records_git_blob_sha');
  }));

  git=spawnSync('git',['reset','--hard','HEAD^'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);

  const activatedAuth=transition.buildCandidateAuthorization({
    collectorGitBlobSha:activatedCollectorBlob,
    husbandryGitBlobSha:activatedHusbandryBlob,
    declarationGitBlobSha:activatedDeclarationBlob
  });

  fs.writeFileSync(
    path.join(activationRepo,transition.CANONICAL_AUTHORIZATION_REL),
    JSON.stringify(activatedAuth,null,2)+'\n','utf8'
  );
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_COLLECTOR_REL),activatedCollectorBytes);
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_HUSBANDRY_REL),activatedHusbandryBytes);
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_DECLARATION_REL),activatedDeclarationBytes);
  fs.writeFileSync(path.join(activationRepo,'unrelated-model-note.txt'),'changed with activation\n','utf8');
  git=spawnSync('git',['add','.'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['commit','-m','activation head with forbidden fifth path'],{
    cwd:activationRepo,encoding:'utf8',env:activationCommitEnv
  });
  assert.strictEqual(git.status,0,git.stderr);
  const extraCommittedPath=transition.validateCommittedActivationBaselines(activationRepo);
  assert.ok(extraCommittedPath.some(function(x){
    return x.includes('activation commit surface: unexpected committed path unrelated-model-note.txt');
  }));

  git=spawnSync('git',['reset','--hard','HEAD^'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);

  const activatedAuthForValidCommit=transition.buildCandidateAuthorization({
    collectorGitBlobSha:activatedCollectorBlob,
    husbandryGitBlobSha:activatedHusbandryBlob,
    declarationGitBlobSha:activatedDeclarationBlob
  });
  fs.writeFileSync(
    path.join(activationRepo,transition.CANONICAL_AUTHORIZATION_REL),
    JSON.stringify(activatedAuthForValidCommit,null,2)+'\n','utf8'
  );
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_COLLECTOR_REL),activatedCollectorBytes);
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_HUSBANDRY_REL),activatedHusbandryBytes);
  fs.writeFileSync(path.join(activationRepo,transition.CANONICAL_DECLARATION_REL),activatedDeclarationBytes);
  git=spawnSync('git',['add','.'],{cwd:activationRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['commit','-m','activation head'],{
    cwd:activationRepo,encoding:'utf8',env:activationCommitEnv
  });
  assert.strictEqual(git.status,0,git.stderr);
  assert.deepStrictEqual(
    transition.validateCommittedActivationBaselines(activationRepo),
    [],
    'exact activation HEAD must independently verify all four committed activation records'
  );

  const stagedRaceRepo=path.join(tmp,'staged-surface-race-repo');
  for(const rel of transition.ACTIVATION_COMMIT_PATHS){
    fs.mkdirSync(path.join(stagedRaceRepo,path.dirname(rel)),{recursive:true});
    fs.writeFileSync(path.join(stagedRaceRepo,rel),'baseline '+rel+'\n','utf8');
  }
  git=spawnSync('git',['init'],{cwd:stagedRaceRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['config','user.email','antlab-test@example.invalid'],{cwd:stagedRaceRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['config','user.name','ANTLAB Test'],{cwd:stagedRaceRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['add','.'],{cwd:stagedRaceRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);
  git=spawnSync('git',['commit','-m','baseline'],{cwd:stagedRaceRepo,encoding:'utf8'});
  assert.strictEqual(git.status,0,git.stderr);

  const stagedRaceSnapshots=[];
  for(const rel of transition.ACTIVATION_COMMIT_PATHS){
    fs.writeFileSync(path.join(stagedRaceRepo,rel),'valid staged '+rel+'\n','utf8');
    git=spawnSync('git',['add','--',rel],{cwd:stagedRaceRepo,encoding:'utf8'});
    assert.strictEqual(git.status,0,git.stderr);
    const blobResult=spawnSync('git',['rev-parse',':'+rel],{cwd:stagedRaceRepo,encoding:'utf8'});
    assert.strictEqual(blobResult.status,0,blobResult.stderr);
    stagedRaceSnapshots.push({rel:rel,label:'race '+rel,git_blob_sha:blobResult.stdout.trim()});
  }

  const realGit=spawnSync('sh',['-lc','command -v git'],{encoding:'utf8'}).stdout.trim();
  assert.ok(realGit,'real git executable must be discoverable');
  const wrapperDir=path.join(tmp,'git-race-wrapper');
  fs.mkdirSync(wrapperDir,{recursive:true});
  const wrapperPath=path.join(wrapperDir,'git');
  const raceMarker=path.join(tmp,'surface-race-fired');
  const raceCollectorAbs=path.join(stagedRaceRepo,transition.CANONICAL_COLLECTOR_REL);
  const wrapperSource=`#!/usr/bin/env node
const fs=require('fs');
const cp=require('child_process');
const args=process.argv.slice(2);
if(args[0]==='diff'&&args.includes('--cached')&&!fs.existsSync(process.env.ANTLAB_RACE_MARKER)){
  fs.writeFileSync(process.env.ANTLAB_RACE_COLLECTOR,'tampered during surface check\\n','utf8');
  const add=cp.spawnSync(process.env.ANTLAB_REAL_GIT,['add','--',process.env.ANTLAB_RACE_COLLECTOR_REL],{cwd:process.env.ANTLAB_RACE_ROOT,stdio:'inherit'});
  if(add.status!==0) process.exit(add.status||1);
  fs.writeFileSync(process.env.ANTLAB_RACE_MARKER,'fired\\n','utf8');
}
const result=cp.spawnSync(process.env.ANTLAB_REAL_GIT,args,{cwd:process.cwd(),encoding:null});
if(result.stdout) process.stdout.write(result.stdout);
if(result.stderr) process.stderr.write(result.stderr);
process.exit(result.status===null?1:result.status);
`;
  fs.writeFileSync(wrapperPath,wrapperSource,'utf8');
  fs.chmodSync(wrapperPath,0o755);
  const originalPath=process.env.PATH;
  const raceEnv={
    ANTLAB_REAL_GIT:realGit,
    ANTLAB_RACE_ROOT:stagedRaceRepo,
    ANTLAB_RACE_MARKER:raceMarker,
    ANTLAB_RACE_COLLECTOR:raceCollectorAbs,
    ANTLAB_RACE_COLLECTOR_REL:transition.CANONICAL_COLLECTOR_REL
  };
  const oldRaceEnv={};
  try{
    for(const key of Object.keys(raceEnv)){
      oldRaceEnv[key]=process.env[key];
      process.env[key]=raceEnv[key];
    }
    process.env.PATH=wrapperDir+path.delimiter+originalPath;
    const stagedSurfaceRaceErrors=transition.validateFinalStagedBindings(
      stagedRaceRepo,
      stagedRaceSnapshots,
      {requireActivationSurface:true}
    );
    assert.strictEqual(fs.existsSync(raceMarker),true,'surface race injection must fire');
    assert.ok(stagedSurfaceRaceErrors.some(function(x){
      return x.includes('final staged binding check: stage-0 index tree changed during final validation');
    }));
  }finally{
    process.env.PATH=originalPath;
    for(const key of Object.keys(raceEnv)){
      if(oldRaceEnv[key]===undefined) delete process.env[key];
      else process.env[key]=oldRaceEnv[key];
    }
  }

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

  assert.strictEqual(built.candidate_ready_for_staging,true,built.errors.join('\n'));
  assert.strictEqual(built.ready_for_activation_commit,false);
  assert.ok(built.errors.some(function(x){
    return x.includes('canonical authorization activation record: staged canonical authorization blob')&&
      x.includes('!= validated candidate blob');
  }));
  assert.strictEqual(built.candidate_collection_authorized,true);
  assert.strictEqual(built.biological_collection_may_begin,false);
  assert.deepStrictEqual(built.mutable_authorization_paths,Array.from(transition.MUTABLE_AUTHORIZATION_PATHS));
  assert.strictEqual(built.post_commit_gates_remaining.length,3);
  assert.ok(built.errors.some(function(x){
    return x.includes('canonical collector activation record: staged canonical blob')&&
      x.includes('!= validated source blob');
  }));

  // Candidate generation must work before any mutable activation record is staged.
  writeJson(canonicalCollectorPath,packet.collector);
  writeJson(canonicalHusbandryPath,packet.husbandry);
  writeJson(canonicalDeclarationPath,packet.declaration);
  const stageCanonicalPacket=spawnSync('git',[
    'add','--',
    transition.CANONICAL_COLLECTOR_REL,
    transition.CANONICAL_HUSBANDRY_REL,
    transition.CANONICAL_DECLARATION_REL
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(stageCanonicalPacket.status,0,stageCanonicalPacket.stderr);

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

  const canonicalCollectorValidBytes=fs.readFileSync(canonicalCollectorPath);
  try{
    fs.writeFileSync(canonicalCollectorPath,canonicalCollectorBaselineOriginal);
    const stagePlaceholderCollector=spawnSync('git',['add','--',transition.CANONICAL_COLLECTOR_REL],{cwd:root,encoding:'utf8'});
    assert.strictEqual(stagePlaceholderCollector.status,0,stagePlaceholderCollector.stderr);

    const externalOnlyCollectorResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(externalOnlyCollectorResult.ready_for_activation_commit,false);
    assert.ok(externalOnlyCollectorResult.errors.some(function(x){
      return x.includes('canonical collector activation record: staged canonical blob')&&
        x.includes('!= validated source blob');
    }));
  }finally{
    fs.writeFileSync(canonicalCollectorPath,canonicalCollectorValidBytes);
    const restageValidCollector=spawnSync('git',['add','--',transition.CANONICAL_COLLECTOR_REL],{cwd:root,encoding:'utf8'});
    assert.strictEqual(restageValidCollector.status,0,restageValidCollector.stderr);
  }

  const candidatePath=path.join(tmp,'candidate.json');
  writeJson(candidatePath,candidate);

  const canonicalAuthCandidateBytes=fs.readFileSync(candidatePath);
  fs.writeFileSync(canonicalAuthPath,canonicalAuthCandidateBytes);
  const stageCanonicalAuth=spawnSync('git',['add','--',transition.CANONICAL_AUTHORIZATION_REL],{cwd:root,encoding:'utf8'});
  assert.strictEqual(stageCanonicalAuth.status,0,stageCanonicalAuth.stderr);

  const validated=transition.evaluateActivationTransition({
    root:root,
    collectorPath:collectorPath,
    husbandryPath:husbandryPath,
    declarationPath:declarationPath,
    candidateAuthorizationPath:candidatePath,
    preflightTimeMs:nowMs
  });
  assert.strictEqual(validated.ready_for_activation_commit,true,validated.errors.join('\n'));
  assert.deepStrictEqual(
    validated.activation_commit_paths.slice().sort(),
    Array.from(transition.ACTIVATION_COMMIT_PATHS).sort()
  );

  try{
    fs.writeFileSync(activationDocPath,Buffer.concat([
      activationDocCheckoutOriginal,
      Buffer.from('\n<!-- staged-surface-regression -->\n','utf8')
    ]));
    const stageExtra=spawnSync('git',['add','--','docs/P4_EXTERNAL_VALIDATION_ACTIVATION.md'],{cwd:root,encoding:'utf8'});
    assert.strictEqual(stageExtra.status,0,stageExtra.stderr);
    const extraStagedResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      candidateAuthorizationPath:candidatePath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(extraStagedResult.ready_for_activation_commit,false);
    assert.ok(extraStagedResult.errors.some(function(x){
      return x.includes('activation staged surface: unexpected staged path docs/P4_EXTERNAL_VALIDATION_ACTIVATION.md');
    }));
  }finally{
    fs.writeFileSync(activationDocPath,activationDocCheckoutOriginal);
    const unstageExtra=spawnSync('git',['add','--','docs/P4_EXTERNAL_VALIDATION_ACTIVATION.md'],{cwd:root,encoding:'utf8'});
    assert.strictEqual(unstageExtra.status,0,unstageExtra.stderr);
  }

  try{
    fs.writeFileSync(canonicalAuthPath,canonicalAuthBaselineOriginal);
    const stageFrozenAuth=spawnSync('git',['add','--',transition.CANONICAL_AUTHORIZATION_REL],{cwd:root,encoding:'utf8'});
    assert.strictEqual(stageFrozenAuth.status,0,stageFrozenAuth.stderr);

    const externalOnlyCandidateResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      candidateAuthorizationPath:candidatePath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(externalOnlyCandidateResult.candidate_ready_for_staging,true);
    assert.strictEqual(externalOnlyCandidateResult.ready_for_activation_commit,false);
    assert.ok(externalOnlyCandidateResult.errors.some(function(x){
      return x.includes('canonical authorization activation record: staged canonical authorization blob')&&
        x.includes('!= validated candidate blob');
    }));
  }finally{
    fs.writeFileSync(canonicalAuthPath,canonicalAuthCandidateBytes);
    const restageCandidateAuth=spawnSync('git',['add','--',transition.CANONICAL_AUTHORIZATION_REL],{cwd:root,encoding:'utf8'});
    assert.strictEqual(restageCandidateAuth.status,0,restageCandidateAuth.stderr);
  }

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
    assert.ok(repoDriftResult.errors.some(function(x){
      return x.includes('canonical authorization activation record')||
        (x.includes('canonical authorization candidate')&&x.includes('does not match staged blob'));
    }));
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
      return x.includes('canonical path component must not be a symlink');
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

  const candidateReadRaceOriginal=fs.readFileSync(canonicalCandidatePath);
  const candidateReadRaceExternal=path.join(tmp,'candidate-read-race-external.json');
  writeJson(candidateReadRaceExternal,candidate);
  const originalOpenSyncForCandidate=fs.openSync;
  let candidateSwapInjected=false;
  try{
    fs.openSync=function(file,flags,...args){
      if(!candidateSwapInjected&&path.resolve(String(file))===path.resolve(canonicalCandidatePath)){
        candidateSwapInjected=true;
        fs.rmSync(canonicalCandidatePath);
        fs.symlinkSync(candidateReadRaceExternal,canonicalCandidatePath);
      }
      return originalOpenSyncForCandidate.call(fs,file,flags,...args);
    };
    const candidateReadRaceResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      candidateAuthorizationPath:canonicalCandidatePath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(candidateReadRaceResult.ready_for_activation_commit,false);
    assert.ok(candidateReadRaceResult.errors.some(function(x){
      return x.includes('candidate authorization snapshot');
    }));
  }finally{
    fs.openSync=originalOpenSyncForCandidate;
    try{fs.rmSync(canonicalCandidatePath);}catch(_err){}
    fs.writeFileSync(canonicalCandidatePath,candidateReadRaceOriginal);
  }

  const raceHusbandryTemplateRel='hypotheses/p4_external_validation_colony_husbandry_record_template_v1.json';
  const husbandryTemplatePath=path.join(root,raceHusbandryTemplateRel);
  const husbandryTemplateOriginal=fs.readFileSync(husbandryTemplatePath);
  const tamperedTemplate=JSON.parse(husbandryTemplateOriginal.toString('utf8'));
  tamperedTemplate.collection_observed_or_derived_fields=[];
  const tamperedTemplateBytes=Buffer.from(JSON.stringify(tamperedTemplate,null,2)+'\n','utf8');
  const originalOpenSyncForTemplate=fs.openSync;
  let templateSwapInjected=false;
  try{
    fs.openSync=function(file,flags,...args){
      if(!templateSwapInjected&&path.resolve(String(file))===path.resolve(husbandryTemplatePath)){
        templateSwapInjected=true;
        fs.writeFileSync(husbandryTemplatePath,tamperedTemplateBytes);
      }
      return originalOpenSyncForTemplate.call(fs,file,flags,...args);
    };
    const observedPacket=clone(packet.husbandry);
    observedPacket.records[0].first_trial_timestamp_local=offsetIso(nowMs+(72*60*60*1000));
    const observedPacketPath=path.join(tmp,'template-race-observed-husbandry.json');
    writeJson(observedPacketPath,observedPacket);
    const templateRaceResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:observedPacketPath,
      declarationPath:declarationPath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(templateRaceResult.ready_for_activation_commit,false);
    assert.ok(templateRaceResult.errors.some(function(x){
      return x.includes('colony husbandry template: canonical snapshot blob')&&x.includes('does not match staged blob');
    }));
  }finally{
    fs.openSync=originalOpenSyncForTemplate;
    fs.writeFileSync(husbandryTemplatePath,husbandryTemplateOriginal);
  }

  const stagedMismatchOriginal=fs.readFileSync(canonicalCandidatePath);
  try{
    fs.writeFileSync(canonicalCandidatePath,JSON.stringify(candidate)+'\n','utf8');
    const stagedMismatchResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      candidateAuthorizationPath:canonicalCandidatePath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(stagedMismatchResult.ready_for_activation_commit,false);
    assert.ok(stagedMismatchResult.errors.some(function(x){
      return x.includes('canonical snapshot blob')&&x.includes('does not match staged blob');
    }));
  }finally{
    fs.writeFileSync(canonicalCandidatePath,stagedMismatchOriginal);
  }

  const markedSideRel='experiments/p4_external_validation_replication_randomization_v1.json';
  const markedSidePath=path.join(root,markedSideRel);
  const markedSideOriginal=fs.readFileSync(markedSidePath);
  const markedSideTampered=Buffer.from(markedSideOriginal.toString('utf8').replace(/\n?$/,'')+' \n','utf8');
  const originalOpenSyncForFrozenInput=fs.openSync;
  let frozenInputSwapInjected=false;
  try{
    fs.openSync=function(file,flags,...args){
      if(!frozenInputSwapInjected&&path.resolve(String(file))===path.resolve(markedSidePath)){
        frozenInputSwapInjected=true;
        fs.writeFileSync(markedSidePath,markedSideTampered);
      }
      return originalOpenSyncForFrozenInput.call(fs,file,flags,...args);
    };
    const frozenInputRaceResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:collectorPath,
      husbandryPath:husbandryPath,
      declarationPath:declarationPath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(frozenInputRaceResult.ready_for_activation_commit,false);
    assert.ok(frozenInputRaceResult.errors.some(function(x){
      return x.includes('marked-side schedule')||x.includes('snapshot blob');
    }));
  }finally{
    fs.openSync=originalOpenSyncForFrozenInput;
    fs.writeFileSync(markedSidePath,markedSideOriginal);
  }

  const canonicalCollectorOriginal=fs.readFileSync(canonicalCollectorPath);
  const canonicalCollectorValid=validPacket(nowMs).collector;
  const canonicalCollectorLateTamper=clone(canonicalCollectorValid);
  canonicalCollectorLateTamper.collector_identity=null;
  const lateRaceHusbandryPath=path.join(tmp,'late-index-race-husbandry.json');
  const lateRaceDeclarationPath=path.join(tmp,'late-index-race-declaration.json');
  writeJson(lateRaceHusbandryPath,packet.husbandry);
  writeJson(lateRaceDeclarationPath,packet.declaration);
  const originalReadFileSyncForLateIndex=fs.readFileSync;
  let lateIndexMutationInjected=false;
  try{
    writeJson(canonicalCollectorPath,canonicalCollectorValid);
    let staged=spawnSync('git',['add','--',transition.CANONICAL_COLLECTOR_REL],{cwd:root,encoding:'utf8'});
    assert.strictEqual(staged.status,0,staged.stderr);

    fs.readFileSync=function(file,...args){
      const value=originalReadFileSyncForLateIndex.call(fs,file,...args);
      if(!lateIndexMutationInjected&&path.resolve(String(file))===path.resolve(lateRaceDeclarationPath)){
        lateIndexMutationInjected=true;
        writeJson(canonicalCollectorPath,canonicalCollectorLateTamper);
        staged=spawnSync('git',['add','--',transition.CANONICAL_COLLECTOR_REL],{cwd:root,encoding:'utf8'});
        assert.strictEqual(staged.status,0,staged.stderr);
      }
      return value;
    };

    const lateIndexRaceResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:canonicalCollectorPath,
      husbandryPath:lateRaceHusbandryPath,
      declarationPath:lateRaceDeclarationPath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(lateIndexMutationInjected,true);
    assert.strictEqual(lateIndexRaceResult.ready_for_activation_commit,false);
    assert.ok(lateIndexRaceResult.errors.some(function(x){
      return x.includes('canonical collector activation record: staged canonical blob')&&
        x.includes('!= validated source blob');
    }));
  }finally{
    fs.readFileSync=originalReadFileSyncForLateIndex;
    fs.writeFileSync(canonicalCollectorPath,canonicalCollectorOriginal);
    const restored=spawnSync('git',['add','--',transition.CANONICAL_COLLECTOR_REL],{cwd:root,encoding:'utf8'});
    assert.strictEqual(restored.status,0,restored.stderr);
  }

  const racePacket=validPacket(nowMs);
  const raceCollectorPath=path.join(tmp,'race-collector.json');
  const raceHusbandryPath=path.join(tmp,'race-husbandry.json');
  const raceDeclarationPath=path.join(tmp,'race-declaration.json');
  writeJson(raceCollectorPath,racePacket.collector);
  writeJson(raceHusbandryPath,racePacket.husbandry);
  writeJson(raceDeclarationPath,racePacket.declaration);

  const validatedCollectorBytes=fs.readFileSync(raceCollectorPath);
  const validatedCollectorBlob=transition.gitBlobShaForBuffer(validatedCollectorBytes);
  const replacementCollector=clone(racePacket.collector);
  replacementCollector.collector_identity=null;
  const replacementBytes=Buffer.from(JSON.stringify(replacementCollector,null,2)+'\n','utf8');

  const originalReadFileSync=fs.readFileSync;
  let collectorReadCount=0;
  try{
    fs.readFileSync=function(file,...args){
      const value=originalReadFileSync.call(fs,file,...args);
      if(path.resolve(String(file))===path.resolve(raceCollectorPath)){
        collectorReadCount++;
        if(collectorReadCount===1){
          fs.writeFileSync(raceCollectorPath,replacementBytes);
        }
      }
      return value;
    };

    const raceResult=transition.evaluateActivationTransition({
      root:root,
      collectorPath:raceCollectorPath,
      husbandryPath:raceHusbandryPath,
      declarationPath:raceDeclarationPath,
      preflightTimeMs:nowMs
    });
    assert.strictEqual(raceResult.ready_for_activation_commit,true,raceResult.errors.join('\n'));
    assert.strictEqual(collectorReadCount,1,'collector packet must be read exactly once');
    assert.strictEqual(
      raceResult.candidate_authorization.activation_metadata.collector_record_git_blob_sha,
      validatedCollectorBlob,
      'candidate must bind the same collector bytes that were parsed and validated'
    );
    assert.notStrictEqual(
      raceResult.candidate_authorization.activation_metadata.collector_record_git_blob_sha,
      transition.gitBlobShaForBuffer(replacementBytes),
      'candidate must not bind replacement bytes written after validation read'
    );
  }finally{
    fs.readFileSync=originalReadFileSync;
  }

  const cliPacket=validPacket(Date.now());
  const cliCollector=path.join(tmp,'cli-collector.json');
  const cliHusbandry=path.join(tmp,'cli-husbandry.json');
  const cliDeclaration=path.join(tmp,'cli-declaration.json');
  const cliCandidate=path.join(tmp,'cli-candidate.json');
  writeJson(cliCollector,cliPacket.collector);
  writeJson(cliHusbandry,cliPacket.husbandry);
  writeJson(cliDeclaration,cliPacket.declaration);

  fs.writeFileSync(canonicalCollectorPath,canonicalCollectorBaselineOriginal);
  fs.writeFileSync(canonicalHusbandryPath,canonicalHusbandryBaselineOriginal);
  fs.writeFileSync(canonicalDeclarationPath,canonicalDeclarationBaselineOriginal);
  fs.writeFileSync(canonicalAuthPath,canonicalAuthBaselineOriginal);
  const stageCliBaselines=spawnSync('git',[
    'add','--',
    transition.CANONICAL_COLLECTOR_REL,
    transition.CANONICAL_HUSBANDRY_REL,
    transition.CANONICAL_DECLARATION_REL,
    transition.CANONICAL_AUTHORIZATION_REL
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(stageCliBaselines.status,0,stageCliBaselines.stderr);

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
  assert.strictEqual(buildCliResult.candidate_ready_for_staging,true);
  assert.strictEqual(buildCliResult.ready_for_activation_commit,false);
  assert.strictEqual(buildCliResult.candidate_collection_authorized,true);
  assert.strictEqual(buildCliResult.biological_collection_may_begin,false);
  assert.ok(fs.existsSync(cliCandidate));

  fs.writeFileSync(canonicalCollectorPath,fs.readFileSync(cliCollector));
  fs.writeFileSync(canonicalHusbandryPath,fs.readFileSync(cliHusbandry));
  fs.writeFileSync(canonicalDeclarationPath,fs.readFileSync(cliDeclaration));
  fs.writeFileSync(canonicalAuthPath,fs.readFileSync(cliCandidate));
  const stageCliCandidate=spawnSync('git',[
    'add','--',
    transition.CANONICAL_COLLECTOR_REL,
    transition.CANONICAL_HUSBANDRY_REL,
    transition.CANONICAL_DECLARATION_REL,
    transition.CANONICAL_AUTHORIZATION_REL
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(stageCliCandidate.status,0,stageCliCandidate.stderr);

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
    synthetic_valid_candidate_ready_for_staging:true,
    immutable_tamper_rejected:true,
    frozen_repository_auth_drift_rejected:true,
    committed_activation_parent_baselines_required:true,
    exact_activation_head_allowed_when_parent_is_frozen:true,
    activation_head_packet_hashes_independently_verified:true,
    baseline_fixture_seeded_from_trusted_frozen_git_bytes:true,
    canonical_authorization_symlink_rejected:true,
    canonical_ancestor_symlink_rejected:true,
    canonical_candidate_read_race_rejected:true,
    pinned_husbandry_template_snapshot_enforced:true,
    canonical_snapshot_must_match_staged_blob:true,
    every_frozen_input_uses_guarded_pinned_snapshot:true,
    final_staged_bindings_rechecked_together:true,
    staged_activation_surface_allowlisted:true,
    committed_activation_surface_allowlisted:true,
    staged_surface_bound_inside_final_index_tree_bracket:true,
    candidate_build_before_canonical_staging:true,
    durable_husbandry_and_declaration_staged_canonically:true,
    validated_collector_must_be_staged_canonically:true,
    validated_candidate_must_be_staged_canonically:true,
    validated_packet_bytes_bound_without_reopen:true,
    outcome_like_metadata_rejected:true,
    future_observed_husbandry_rejected:true,
    overwrite_refused:true,
    blocked_transition_emits_no_candidate:true,
    candidate_collection_authorized:true,
    biological_collection_may_begin:false,
    remaining_post_commit_gates:built.post_commit_gates_remaining.length
  }));
}finally{
  try{
    fs.writeFileSync(canonicalCollectorPath,canonicalCollectorCheckoutOriginal);
    fs.writeFileSync(canonicalAuthPath,canonicalAuthCheckoutOriginal);
    fs.writeFileSync(canonicalHusbandryPath,canonicalHusbandryCheckoutOriginal);
    fs.writeFileSync(canonicalDeclarationPath,canonicalDeclarationCheckoutOriginal);
    fs.writeFileSync(activationDocPath,activationDocCheckoutOriginal);
    spawnSync('git',[
      'add','--',
      transition.CANONICAL_COLLECTOR_REL,
      transition.CANONICAL_AUTHORIZATION_REL,
      transition.CANONICAL_HUSBANDRY_REL,
      transition.CANONICAL_DECLARATION_REL,
      'docs/P4_EXTERNAL_VALIDATION_ACTIVATION.md'
    ],{cwd:root,encoding:'utf8'});
  }catch(_err){}
  fs.rmSync(tmp,{recursive:true,force:true});
}
