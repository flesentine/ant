'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
const REAL_AUTH=path.join(ROOT,'hypotheses','p4_Y_maze_consistency_stage_B_authorization_v1.json');
const OFFICIAL_STAGE_A_FILE='reports/p4_ymaze_consistency_simulation_v1.json';
const PUBLISHED_FILE='reference/poissonnier2026_published_targets.json';
const INVENTORY_FILE='reference/poissonnier2026_inventory.json';
const PUBLISHED_BLOB='5836b5011d765043f94683fa761f3016e86643dc';
const INVENTORY_BLOB='2ff7d9dcd27cf7609ce77b0f655a6520597c2432';
const CONDITION_IDS=['outwards_naive','outwards_experienced','return_experienced','return_naive'];
const CONDITION_CODES={outwards_naive:'ON',outwards_experienced:'OE',return_experienced:'RE',return_naive:'RN'};

function gitBlobSha(buffer){
  const b=Buffer.isBuffer(buffer)?buffer:Buffer.from(buffer);
  return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');
}
function readPinnedJson(rel,expectedBlob){
  const full=path.resolve(ROOT,rel),rootPrefix=ROOT+path.sep;
  if(full!==ROOT&&!full.startsWith(rootPrefix))throw new Error('Pinned path escapes repository root.');
  const bytes=fs.readFileSync(full),actual=gitBlobSha(bytes);
  if(actual!==expectedBlob)throw new Error(`${rel} blob drift: ${actual} != ${expectedBlob}`);
  return JSON.parse(bytes.toString('utf8'));
}
function rate(x,label){
  if(x===null||x===undefined||x==='')throw new Error(label+' must be a finite rate in [0,1]');
  const n=Number(x);if(!Number.isFinite(n)||n<0||n>1)throw new Error(label+' must be a finite rate in [0,1]');return n;
}
function rateFromCounts(correct,n,label){
  if(!Number.isInteger(correct)||!Number.isInteger(n)||n<=0||correct<0||correct>n)throw new Error(label+' counts are invalid');
  return correct/n;
}
function row(id,scope,model,observed){
  const m=rate(model,id+' model'),o=rate(observed,id+' observed'),signed=m-o;
  return{id,scope,model_prediction:m,observed_rate:o,signed_difference_model_minus_observed:signed,absolute_difference:Math.abs(signed)};
}
function normalizeFrozenObservedSources(published,inventory){
  if(!published||published.source!=='poissonnier2026_final_record'||!published.y_maze)throw new Error('Published Y-maze source schema mismatch.');
  if(!inventory||inventory.source!=='poissonnier2026_final_record'||!inventory.experiment_2)throw new Error('Inventory Experiment 2 source schema mismatch.');
  const py=published.y_maze,ie=inventory.experiment_2;
  if(py.n!==ie.rows||py.n!==ie.overall.n||py.pheromone_followed!==ie.overall.correct)throw new Error('Frozen Y-maze source totals disagree.');
  const conditions={};
  for(const id of CONDITION_IDS){
    const p=py.condition_results&&py.condition_results[id],i=ie.condition_counts&&ie.condition_counts[CONDITION_CODES[id]];
    if(!p||!i||p.n!==i.n||p.correct!==i.correct)throw new Error('Frozen Y-maze condition sources disagree for '+id);
    conditions[id]=rateFromCounts(p.correct,p.n,id);
  }
  const left=ie.pheromone_side_counts&&ie.pheromone_side_counts.Left,right=ie.pheromone_side_counts&&ie.pheromone_side_counts.Right;
  if(!left||!right||left.n+right.n!==py.n||left.correct+right.correct!==py.pheromone_followed)throw new Error('Frozen pheromone-side source counts disagree with totals.');
  return{
    overall:rateFromCounts(py.pheromone_followed,py.n,'overall'),
    conditions,
    pheromone_side:{left:rateFromCounts(left.correct,left.n,'pheromone left'),right:rateFromCounts(right.correct,right.n,'pheromone right')},
    provenance:{
      normalized_from_frozen_counts:true,
      published_targets:{file:PUBLISHED_FILE,git_blob_sha:PUBLISHED_BLOB},
      inventory:{file:INVENTORY_FILE,git_blob_sha:INVENTORY_BLOB}
    }
  };
}
function loadFrozenObservedSummary(){
  return normalizeFrozenObservedSources(readPinnedJson(PUBLISHED_FILE,PUBLISHED_BLOB),readPinnedJson(INVENTORY_FILE,INVENTORY_BLOB));
}
function compare(sim,observed){
  if(!sim||!sim.predeclared_fields)throw new Error('Simulation report missing predeclared_fields.');
  const f=sim.predeclared_fields;
  const shared=rate(f.side_balanced_marked_arm_choice_fraction,'side-balanced model');
  const left=rate(f.left_marked_marked_arm_choice_fraction_among_choices,'left-marked model');
  const right=rate(f.right_marked_marked_arm_choice_fraction_among_choices,'right-marked model');
  if(!observed||!observed.conditions||!observed.pheromone_side)throw new Error('Observed normalized summary is incomplete.');
  const rows=[row('overall','overall',shared,observed.overall)];
  for(const id of CONDITION_IDS)rows.push(row(id,'direction_experience_condition',shared,observed.conditions[id]));
  rows.push(row('pheromone_left','pheromone_side',left,observed.pheromone_side.left));
  rows.push(row('pheromone_right','pheromone_side',right,observed.pheromone_side.right));
  const report={
    schema_version:1,
    id:'P4_Y_maze_consistency_descriptive_comparison_v1',
    comparison_scope:'comprehensive_descriptive_only',
    row_count:rows.length,
    rows,
    all_predeclared_comparisons_reported:rows.length===7
  };
  if(observed.provenance)report.observed_source_provenance=observed.provenance;
  return report;
}
function requireRealAuthorization(){
  if(!fs.existsSync(REAL_AUTH))throw new Error('Real P4 Y-maze Stage B comparison is locked: authorization file is absent.');
  const a=JSON.parse(fs.readFileSync(REAL_AUTH,'utf8'));
  if(a.id!=='P4_Y_maze_consistency_stage_B_authorization_v1'||a.official_stage_B_comparison_authorized!==true)throw new Error('Real P4 Y-maze Stage B authorization is not active.');
  return a;
}
function validateOfficialStageAReport(report){
  if(!report||report.id!=='P4_Y_maze_consistency_stage_A_simulation_v1'||report.mode!=='official')throw new Error('Stage B requires the official frozen Stage A simulation report.');
  if(report.scientific_evidence!==false)throw new Error('Stage A scientific_evidence contract drift.');
  const c=report.frozen_candidate||{},s=report.seed_contract||{};
  if(c.index!==307||c.sigma_field_mm!==18.319554310908863||c.kappa_trail_per_s!==6.342935528120713||c.theta_detect!==0.9184)throw new Error('Stage A frozen candidate drift.');
  if(s.left_root!==8210000||s.right_root!==8210000||s.marked_count_per_side!==1000||s.neutral_root!==8310000||s.neutral_count!==1000||s.paired_left_right!==true)throw new Error('Stage A official seed contract drift.');
  for(const key of ['left_marked','right_marked','neutral']){
    const x=report[key];
    if(!x||x.left_choices+x.right_choices+x.timeouts!==x.trials)throw new Error('Stage A accounting drift for '+key);
  }
  if(report.left_marked.trials!==1000||report.right_marked.trials!==1000||report.neutral.trials!==1000)throw new Error('Stage A official trial-count drift.');
  return report;
}
function loadAuthorizedOfficialStageA(auth){
  const spec=auth&&auth.frozen_stage_A_artifact;
  if(!spec||spec.file!==OFFICIAL_STAGE_A_FILE||typeof spec.git_blob_sha!=='string'||!/^[0-9a-f]{40}$/.test(spec.git_blob_sha))throw new Error('Stage B authorization must pin the official Stage A file and git blob SHA.');
  return validateOfficialStageAReport(readPinnedJson(spec.file,spec.git_blob_sha));
}
function parseRealCliArgs(argv){
  for(const forbidden of ['--simulation','--observed','--synthetic'])if(argv.includes(forbidden))throw new Error(forbidden+' input override is forbidden for real Stage B.');
  if(argv.length===0)return{out:null};
  if(argv.length===2&&argv[0]==='--out'&&argv[1])return{out:argv[1]};
  throw new Error('Usage: [--out <file>]');
}
function main(argv=process.argv.slice(2)){
  const auth=requireRealAuthorization(),{out}=parseRealCliArgs(argv);
  const sim=loadAuthorizedOfficialStageA(auth),observed=loadFrozenObservedSummary();
  const report=compare(sim,observed),text=JSON.stringify(report,null,2)+'\n';
  if(out){const p=path.resolve(ROOT,out);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}else process.stdout.write(text);
  return report;
}
if(require.main===module)main();
module.exports={
  CONDITION_IDS,CONDITION_CODES,PUBLISHED_FILE,INVENTORY_FILE,PUBLISHED_BLOB,INVENTORY_BLOB,OFFICIAL_STAGE_A_FILE,
  gitBlobSha,readPinnedJson,rate,rateFromCounts,row,normalizeFrozenObservedSources,loadFrozenObservedSummary,
  compare,requireRealAuthorization,validateOfficialStageAReport,loadAuthorizedOfficialStageA,parseRealCliArgs,main
};
