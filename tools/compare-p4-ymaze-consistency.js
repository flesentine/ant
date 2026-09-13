'use strict';
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const REAL_AUTH=path.join(ROOT,'hypotheses','p4_Y_maze_consistency_stage_B_authorization_v1.json');
const CONDITION_IDS=['outwards_naive','outwards_experienced','return_experienced','return_naive'];

function rate(x,label){const n=Number(x);if(!Number.isFinite(n)||n<0||n>1)throw new Error(label+' must be a finite rate in [0,1]');return n;}
function row(id,scope,model,observed){
  const m=rate(model,id+' model'),o=rate(observed,id+' observed'),signed=m-o;
  return{id,scope,model_prediction:m,observed_rate:o,signed_difference_model_minus_observed:signed,absolute_difference:Math.abs(signed)};
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
  return{
    schema_version:1,
    id:'P4_Y_maze_consistency_descriptive_comparison_v1',
    comparison_scope:'comprehensive_descriptive_only',
    row_count:rows.length,
    rows,
    all_predeclared_comparisons_reported:rows.length===7
  };
}
function requireRealAuthorization(){
  if(!fs.existsSync(REAL_AUTH))throw new Error('Real P4 Y-maze Stage B comparison is locked: authorization file is absent.');
  const a=JSON.parse(fs.readFileSync(REAL_AUTH,'utf8'));
  if(a.id!=='P4_Y_maze_consistency_stage_B_authorization_v1'||a.official_stage_B_comparison_authorized!==true)throw new Error('Real P4 Y-maze Stage B authorization is not active.');
  return a;
}
function arg(argv,name){const i=argv.indexOf(name);return i>=0?argv[i+1]:null;}
function main(argv=process.argv.slice(2)){
  const simulation=arg(argv,'--simulation'),observedPath=arg(argv,'--observed'),out=arg(argv,'--out'),synthetic=argv.includes('--synthetic');
  if(!simulation||!observedPath)throw new Error('Usage: --simulation <stage-A.json> --observed <normalized-summary.json> [--synthetic] [--out <file>]');
  if(!synthetic)requireRealAuthorization();
  const sim=JSON.parse(fs.readFileSync(path.resolve(ROOT,simulation),'utf8'));
  const observed=JSON.parse(fs.readFileSync(path.resolve(ROOT,observedPath),'utf8'));
  const report=compare(sim,observed),text=JSON.stringify(report,null,2)+'\n';
  if(out){const p=path.resolve(ROOT,out);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}else process.stdout.write(text);
  return report;
}
if(require.main===module)main();
module.exports={CONDITION_IDS,rate,row,compare,requireRealAuthorization,main};
