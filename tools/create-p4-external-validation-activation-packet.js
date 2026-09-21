'use strict';

const fs=require('fs');
const path=require('path');
const {
  DECLARATION_TRUE_FIELDS,
  validateFrozenRepository,
  evaluatePreflight
}=require('./check-p4-external-validation-activation');

const FROZEN_COLLECTOR_REL='hypotheses/p4_external_validation_collector_independence_record_v1.json';
const HUSBANDRY_TEMPLATE_REL='hypotheses/p4_external_validation_colony_husbandry_record_template_v1.json';

const EXPECTED_PROSPECTIVE_FIELDS=Object.freeze([
  'colony_id',
  'wild_source_colony_id',
  'source_nest_id',
  'lab_acclimation_start_timestamp_local',
  'pre_deprivation_sucrose_molarity_M',
  'pre_deprivation_sucrose_ad_libitum',
  'pre_deprivation_chopped_cockroach_feedings_per_week',
  'food_deprivation_start_timestamp_local',
  'water_ad_libitum_during_deprivation',
  'light_dark_cycle_hours',
  'no_food_reward_present_in_test_maze'
]);

const PROTOCOL_DEFAULTS=Object.freeze({
  pre_deprivation_sucrose_molarity_M:0.5,
  pre_deprivation_sucrose_ad_libitum:true,
  pre_deprivation_chopped_cockroach_feedings_per_week:3,
  water_ad_libitum_during_deprivation:true,
  light_dark_cycle_hours:'12:12',
  no_food_reward_present_in_test_maze:true
});

const OUTPUT_NAMES=Object.freeze([
  'collector.json',
  'husbandry.json',
  'precollection-declaration.json',
  'README.md'
]);

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function readJson(file){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

function sorted(values){
  return Array.from(values).sort();
}

function assertFrozenScaffoldContracts(root){
  const collector=readJson(path.join(root,FROZEN_COLLECTOR_REL));
  if(collector.id!=='P4_external_validation_collector_independence_record_v1'){
    throw new Error('unexpected frozen collector record id');
  }
  if(collector.collector_identity!==null||
     collector.collector_team_or_affiliation!==null||
     collector.identity_frozen!==false||
     collector.current_authorization_condition_satisfied!==false){
    throw new Error('frozen collector baseline no longer represents fail-closed preauthorization');
  }
  const attest=collector.required_attestations_before_authorization||{};
  if(Object.values(attest).some(function(v){return v!==null;})){
    throw new Error('frozen collector attestations are no longer all unset');
  }

  const template=readJson(path.join(root,HUSBANDRY_TEMPLATE_REL));
  const prospective=template.activation_required_prospective_fields;
  if(!Array.isArray(prospective)||
     JSON.stringify(sorted(prospective))!==JSON.stringify(sorted(EXPECTED_PROSPECTIVE_FIELDS))){
    throw new Error('frozen husbandry prospective-field contract differs from scaffolder expectation');
  }
  for(const key of Object.keys(PROTOCOL_DEFAULTS)){
    if(!prospective.includes(key)) throw new Error('protocol default is not an activation prospective field: '+key);
  }
  return {collector:collector,template:template};
}

function buildCollector(root){
  const contracts=assertFrozenScaffoldContracts(root);
  return clone(contracts.collector);
}

function buildHusbandry(root){
  const contracts=assertFrozenScaffoldContracts(root);
  const template=contracts.template;
  const observed=new Set(template.collection_observed_or_derived_fields||[]);
  const records=[];
  for(let i=1;i<=12;i++){
    const record={
      colony_id:'C'+String(i).padStart(2,'0'),
      wild_source_colony_id:null,
      source_nest_id:null,
      lab_acclimation_start_timestamp_local:null,
      pre_deprivation_sucrose_molarity_M:0.5,
      pre_deprivation_sucrose_ad_libitum:true,
      pre_deprivation_chopped_cockroach_feedings_per_week:3,
      food_deprivation_start_timestamp_local:null,
      water_ad_libitum_during_deprivation:true,
      light_dark_cycle_hours:'12:12',
      no_food_reward_present_in_test_maze:true
    };
    for(const key of Object.keys(record)){
      if(observed.has(key)) throw new Error('scaffold must not prefill observed/derived field '+key);
    }
    records.push(record);
  }
  return {records:records};
}

function buildDeclaration(){
  const declaration={
    attested_by:null,
    attested_at_local:null
  };
  for(const field of DECLARATION_TRUE_FIELDS) declaration[field]=null;
  return declaration;
}

function scaffoldReadme(){
  return [
    '# P4 external-validation activation packet scaffold',
    '',
    'This directory is an editable scaffold only. It is not an activation record and does not authorize biological collection.',
    '',
    'The generator intentionally leaves real-world identity, source, timestamp, and attestation values unset. Fill them only from truthful prospective records before trial 1. Do not prefill fields that can only be observed or derived during collection.',
    '',
    'The husbandry file pre-populates only immutable protocol constants from the already-frozen husbandry contract.',
    '',
    'Collector edits are limited to the real collector identity and affiliation, identity_frozen=true, the seven required attestations=true, and current_authorization_condition_satisfied=true. Do not rewrite status, role, preregistration binding, authorization_rule, or firewall fields.',
    '',
    'For each husbandry row, supply only the real wild-source colony ID, distinct source-nest ID, lab acclimation start timestamp, and food-deprivation start timestamp. Do not add future observed or derived fields before collection.',
    '',
    'Complete the precollection declaration only when its identity, timestamp, and all three assertions are truthful.',
    '',
    'After the real prospective values are complete, run this from the ANTLAB repository root using the packet paths:',
    '',
    '~~~bash',
    'node tools/check-p4-external-validation-activation.js \\',
    '  --collector /path/to/p4-activation-packet/collector.json \\',
    '  --husbandry /path/to/p4-activation-packet/husbandry.json \\',
    '  --declaration /path/to/p4-activation-packet/precollection-declaration.json \\',
    '  --json',
    '~~~',
    '',
    'A successful preflight can only make a separate activation commit eligible. It must still report:',
    '',
    '~~~text',
    'collection_authorized=false',
    '~~~',
    '',
    'Exact-head regression, fresh Codex review, and permanent-main qualification remain mandatory before the first biological trial.',
    ''
  ].join('\n');
}

function targetPaths(outDir){
  const out={};
  for(const name of OUTPUT_NAMES) out[name]=path.join(outDir,name);
  return out;
}

function writeJson(file,value){
  fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n',{encoding:'utf8',flag:'wx'});
}

function writePacket(options){
  const root=options&&options.root;
  const outDir=options&&options.outDir;
  if(!root) throw new Error('root is required');
  if(!outDir) throw new Error('outDir is required');

  const resolvedRoot=path.resolve(root);
  const resolvedOut=path.resolve(outDir);
  const targets=targetPaths(resolvedOut);

  const frozen=validateFrozenRepository(resolvedRoot);
  if(frozen.errors.length){
    throw new Error('frozen repository integrity check failed: '+frozen.errors.join('; '));
  }

  const existing=Object.entries(targets).filter(function(entry){
    return fs.existsSync(entry[1]);
  }).map(function(entry){return entry[0];});
  if(existing.length){
    throw new Error('refusing to overwrite existing activation packet files: '+existing.join(', '));
  }

  const collector=buildCollector(resolvedRoot);
  const husbandry=buildHusbandry(resolvedRoot);
  const declaration=buildDeclaration();
  const readme=scaffoldReadme();

  fs.mkdirSync(resolvedOut,{recursive:true});
  const created=[];
  let preflight;
  try{
    writeJson(targets['collector.json'],collector);
    created.push(targets['collector.json']);
    writeJson(targets['husbandry.json'],husbandry);
    created.push(targets['husbandry.json']);
    writeJson(targets['precollection-declaration.json'],declaration);
    created.push(targets['precollection-declaration.json']);
    fs.writeFileSync(targets['README.md'],readme,{encoding:'utf8',flag:'wx'});
    created.push(targets['README.md']);

    preflight=evaluatePreflight({
      root:resolvedRoot,
      collectorPath:targets['collector.json'],
      husbandryPath:targets['husbandry.json'],
      declarationPath:targets['precollection-declaration.json']
    });

    if(preflight.ready_for_activation_commit!==false||preflight.collection_authorized!==false){
      throw new Error('generated scaffold unexpectedly passed activation preflight');
    }
  }catch(err){
    for(const file of created){
      try{fs.rmSync(file,{force:true});}catch(_err){}
    }
    throw err;
  }

  return {
    schema_version:1,
    id:'P4_external_validation_activation_packet_scaffold_v1',
    output_directory:resolvedOut,
    files:Array.from(OUTPUT_NAMES),
    ready_for_activation_commit:false,
    collection_authorized:false,
    preflight_error_count:preflight.errors.length,
    note:'Scaffold created fail-closed. Real prospective inputs are still required before any activation commit can become eligible.'
  };
}

function parseArgs(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--json'){out.json=true;continue;}
    if(arg==='--out'){
      const value=argv[++i];
      if(!value||value.startsWith('--')) throw new Error('missing value for --out');
      out.out=value;
      continue;
    }
    throw new Error('unexpected argument: '+arg);
  }
  return out;
}

function main(){
  try{
    const args=parseArgs(process.argv.slice(2));
    if(!args.out){
      throw new Error('usage: node tools/create-p4-external-validation-activation-packet.js --out <directory> [--json]');
    }
    const root=path.resolve(__dirname,'..');
    const result=writePacket({root:root,outDir:args.out});
    if(args.json) process.stdout.write(JSON.stringify(result,null,2)+'\n');
    else{
      console.log('P4 ACTIVATION PACKET SCAFFOLD CREATED');
      console.log('output_directory='+result.output_directory);
      console.log('ready_for_activation_commit=false');
      console.log('collection_authorized=false');
      console.log('real prospective inputs are still required');
    }
  }catch(err){
    console.error(String(err&&err.stack||err));
    process.exitCode=1;
  }
}

if(require.main===module) main();

module.exports={
  EXPECTED_PROSPECTIVE_FIELDS:EXPECTED_PROSPECTIVE_FIELDS,
  PROTOCOL_DEFAULTS:PROTOCOL_DEFAULTS,
  OUTPUT_NAMES:OUTPUT_NAMES,
  assertFrozenScaffoldContracts:assertFrozenScaffoldContracts,
  buildCollector:buildCollector,
  buildHusbandry:buildHusbandry,
  buildDeclaration:buildDeclaration,
  scaffoldReadme:scaffoldReadme,
  writePacket:writePacket
};
