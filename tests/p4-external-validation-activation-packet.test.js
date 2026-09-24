'use strict';

const assert=require('assert');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawnSync}=require('child_process');
const scaffolder=require('../tools/create-p4-external-validation-activation-packet');
const preflight=require('../tools/check-p4-external-validation-activation');

const root=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'antlab-p4-activation-packet-'));

try{
  const out=path.join(tmp,'packet');
  const result=scaffolder.writePacket({root:root,outDir:out});

  assert.strictEqual(result.ready_for_activation_commit,false);
  assert.strictEqual(result.collection_authorized,false);
  assert.ok(result.preflight_error_count>0);
  assert.deepStrictEqual(result.files,Array.from(scaffolder.OUTPUT_NAMES));

  const collector=JSON.parse(fs.readFileSync(path.join(out,'collector.json'),'utf8'));
  const frozenState=preflight.validateFrozenRepository(root);
  assert.deepStrictEqual(frozenState.errors,[]);

  if(frozenState.repository_state==='activation_active'){
    const authRel='hypotheses/p4_external_validation_collection_authorization_v1.json';
    const authPath=path.join(root,authRel);
    const authOriginal=fs.readFileSync(authPath,'utf8');
    try{
      const tampered=JSON.parse(authOriginal);
      tampered.semantic_firewall.may_change_candidate_307=true;
      fs.writeFileSync(authPath,JSON.stringify(tampered,null,2)+'\n','utf8');

      const worktreeDrift=preflight.validateFrozenRepository(root);
      assert.ok(worktreeDrift.errors.some(function(x){
        return x.includes('activated repository authorization working-tree blob drift');
      }));

      const stageTamper=spawnSync('git',['add','--',authRel],{cwd:root,encoding:'utf8'});
      assert.strictEqual(stageTamper.status,0,stageTamper.stderr);
      fs.writeFileSync(authPath,authOriginal,'utf8');

      const indexDrift=preflight.validateFrozenRepository(root);
      assert.ok(indexDrift.errors.some(function(x){
        return x.includes('activated repository authorization staged blob drift');
      }));
    }finally{
      fs.writeFileSync(authPath,authOriginal,'utf8');
      const resetIndex=spawnSync('git',['reset','HEAD','--',authRel],{cwd:root,encoding:'utf8'});
      assert.strictEqual(resetIndex.status,0,resetIndex.stderr);
    }
    assert.deepStrictEqual(preflight.validateFrozenRepository(root).errors,[]);
  }

  const frozenCollector=frozenState.frozenCollector;
  assert.deepStrictEqual(collector,frozenCollector,'collector scaffold must preserve the frozen fail-closed record exactly');
  assert.strictEqual(collector.collector_identity,null);
  assert.strictEqual(collector.collector_team_or_affiliation,null);
  assert.strictEqual(collector.identity_frozen,false);
  assert.strictEqual(collector.current_authorization_condition_satisfied,false);
  assert.ok(Object.values(collector.required_attestations_before_authorization).every(function(v){return v===null;}));

  const husbandry=JSON.parse(fs.readFileSync(path.join(out,'husbandry.json'),'utf8'));
  const template=JSON.parse(fs.readFileSync(
    path.join(root,'hypotheses/p4_external_validation_colony_husbandry_record_template_v1.json'),'utf8'
  ));
  assert.strictEqual(husbandry.records.length,12);
  const observed=new Set(template.collection_observed_or_derived_fields);
  for(let i=0;i<12;i++){
    const r=husbandry.records[i];
    assert.strictEqual(r.colony_id,'C'+String(i+1).padStart(2,'0'));
    assert.strictEqual(r.wild_source_colony_id,null);
    assert.strictEqual(r.source_nest_id,null);
    assert.strictEqual(r.lab_acclimation_start_timestamp_local,null);
    assert.strictEqual(r.food_deprivation_start_timestamp_local,null);
    assert.strictEqual(r.pre_deprivation_sucrose_molarity_M,0.5);
    assert.strictEqual(r.pre_deprivation_sucrose_ad_libitum,true);
    assert.strictEqual(r.pre_deprivation_chopped_cockroach_feedings_per_week,3);
    assert.strictEqual(r.water_ad_libitum_during_deprivation,true);
    assert.strictEqual(r.light_dark_cycle_hours,'12:12');
    assert.strictEqual(r.no_food_reward_present_in_test_maze,true);
    for(const key of observed){
      assert.ok(!(key in r),'observed/derived field must be absent from scaffold: '+key);
    }
  }

  const declaration=JSON.parse(fs.readFileSync(path.join(out,'precollection-declaration.json'),'utf8'));
  assert.strictEqual(declaration.attested_by,null);
  assert.strictEqual(declaration.attested_at_local,null);
  for(const key of preflight.DECLARATION_TRUE_FIELDS) assert.strictEqual(declaration[key],null);

  const readme=fs.readFileSync(path.join(out,'README.md'),'utf8');
  assert.match(readme,/not an activation record/i);
  assert.match(readme,/collection_authorized=false/);
  assert.match(readme,/Collector edits are limited to/);
  assert.match(readme,/Do not rewrite status, role, preregistration binding/);
  assert.match(readme,/Do not add future observed or derived fields before collection/);
  assert.match(readme,/--collector \/path\/to\/p4-activation-packet\/collector\.json/);
  assert.ok(!readme.includes('0.740889950913122'),'scaffold must not disclose Candidate 307 prediction');

  const evaluated=preflight.evaluatePreflight({
    root:root,
    collectorPath:path.join(out,'collector.json'),
    husbandryPath:path.join(out,'husbandry.json'),
    declarationPath:path.join(out,'precollection-declaration.json')
  });
  assert.strictEqual(evaluated.ready_for_activation_commit,false);
  assert.strictEqual(evaluated.collection_authorized,false);
  assert.ok(evaluated.errors.some(function(x){return x.includes('collector_identity');}));
  assert.ok(evaluated.errors.some(function(x){return x.includes('wild_source_colony_id');}));
  assert.ok(evaluated.errors.some(function(x){return x.includes('declaration');}));

  const serialized=[
    fs.readFileSync(path.join(out,'collector.json'),'utf8'),
    fs.readFileSync(path.join(out,'husbandry.json'),'utf8'),
    fs.readFileSync(path.join(out,'precollection-declaration.json'),'utf8'),
    readme
  ].join('\n');
  assert.ok(!serialized.includes('\"collection_authorized\": true'));

  assert.throws(
    function(){scaffolder.writePacket({root:root,outDir:out});},
    /refusing to overwrite existing activation packet files/
  );

  const cliOut=path.join(tmp,'cli-packet');
  const cli=spawnSync(process.execPath,[
    path.join(root,'tools/create-p4-external-validation-activation-packet.js'),
    '--out',cliOut,
    '--json'
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(cli.status,0,cli.stderr);
  const cliResult=JSON.parse(cli.stdout);
  assert.strictEqual(cliResult.ready_for_activation_commit,false);
  assert.strictEqual(cliResult.collection_authorized,false);
  assert.strictEqual(cliResult.files.length,4);

  const sentinelPath=path.join(cliOut,'collector.json');
  const sentinel=fs.readFileSync(sentinelPath,'utf8');
  const cliAgain=spawnSync(process.execPath,[
    path.join(root,'tools/create-p4-external-validation-activation-packet.js'),
    '--out',cliOut,
    '--json'
  ],{cwd:root,encoding:'utf8'});
  assert.strictEqual(cliAgain.status,1);
  assert.match(cliAgain.stderr,/refusing to overwrite existing activation packet files/);
  assert.strictEqual(fs.readFileSync(sentinelPath,'utf8'),sentinel,'refused overwrite must preserve existing packet');

  const frozenCollectorPath=path.join(root,'hypotheses/p4_external_validation_collector_independence_record_v1.json');
  const frozenCollectorOriginal=fs.readFileSync(frozenCollectorPath,'utf8');
  const driftOut=path.join(tmp,'drift-packet');
  try{
    const drifted=JSON.parse(frozenCollectorOriginal);
    drifted.firewall.collection_before_identity_freeze_authorized=true;
    fs.writeFileSync(frozenCollectorPath,JSON.stringify(drifted,null,2)+'\n','utf8');

    assert.throws(
      function(){scaffolder.writePacket({root:root,outDir:driftOut});},
      /frozen repository integrity check failed/
    );
    assert.ok(!fs.existsSync(path.join(driftOut,'collector.json')),'integrity failure must not emit collector scaffold');
    assert.ok(!fs.existsSync(path.join(driftOut,'husbandry.json')),'integrity failure must not emit husbandry scaffold');
    assert.ok(!fs.existsSync(path.join(driftOut,'precollection-declaration.json')),'integrity failure must not emit declaration scaffold');
    assert.ok(!fs.existsSync(path.join(driftOut,'README.md')),'integrity failure must not emit README');
  }finally{
    fs.writeFileSync(frozenCollectorPath,frozenCollectorOriginal,'utf8');
  }

  console.log('p4-external-validation-activation-packet.test.js PASS '+JSON.stringify({
    generated_files:4,
    colonies:12,
    protocol_defaults_prefilled:true,
    real_world_values_unset:true,
    observed_fields_prefilled:false,
    overwrite_refused:true,
    frozen_drift_rejected_before_output:true,
    activated_authorization_head_index_worktree_binding_enforced:true,
    ready_for_activation_commit:false,
    collection_authorized:false
  }));
}finally{
  fs.rmSync(tmp,{recursive:true,force:true});
}
