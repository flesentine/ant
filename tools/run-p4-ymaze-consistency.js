'use strict';
const fs=require('fs'),path=require('path');
const p4=require('../src/p4.js');
const {loadBundle}=require('./load-bundle.js');

const ROOT=path.resolve(__dirname,'..');
const EXP={left:'y_maze_p4_left_consistency_v1.json',right:'y_maze_p4_right_consistency_v1.json',neutral:'y_maze_p4_neutral_consistency_v1.json'};
const OFFICIAL_AUTH=path.join(ROOT,'hypotheses','p4_Y_maze_consistency_official_execution_authorization_v1.json');
const PLAN={
  qualification:{leftRoot:8410000,rightRoot:8410000,markedCount:12,neutralRoot:8510000,neutralCount:12,scientificEvidence:false},
  official:{leftRoot:8210000,rightRoot:8210000,markedCount:1000,neutralRoot:8310000,neutralCount:1000,scientificEvidence:false}
};

function seeds(root,count){return Array.from({length:count},(_,i)=>root+i);}
function wilson95(success,n){
  if(!Number.isInteger(success)||!Number.isInteger(n)||success<0||n<0||success>n)throw new Error('Invalid Wilson inputs.');
  if(n===0)return null;
  const z=1.959963984540054,p=success/n,z2=z*z,den=1+z2/n;
  const center=(p+z2/(2*n))/den,half=z*Math.sqrt((p*(1-p)+z2/(4*n))/n)/den;
  return{low:Math.max(0,center-half),high:Math.min(1,center+half)};
}
function finiteFraction(num,den){return den?num/den:null;}
function runCondition(experimentFile,seedList,markedSide){
  const bundle=loadBundle(experimentFile);
  const counts={left:0,right:0,timeout:0};
  const diag={evaluation_samples:0,detected_samples:0,subthreshold_samples:0,nonzero_steering_samples:0};
  for(const seed of seedList){
    const sim=new p4.Simulation(bundle,seed);
    sim.runUntilComplete(bundle.experiment.duration_s,p4.FIXED_DT);
    const ant=sim.ants[0];
    const out=ant.outcome||'timeout';
    if(!Object.prototype.hasOwnProperty.call(counts,out))throw new Error('Unexpected Y-maze outcome '+out);
    counts[out]++;
    diag.evaluation_samples+=ant.p4EvaluationSamples;
    diag.detected_samples+=ant.p4DetectedSamples;
    diag.subthreshold_samples+=ant.p4SubthresholdSamples;
    diag.nonzero_steering_samples+=ant.p4NonzeroSteeringSamples;
  }
  const choices=counts.left+counts.right;
  const marked=markedSide==='left'?counts.left:markedSide==='right'?counts.right:null;
  return{
    trials:seedList.length,
    first_seed:seedList[0],
    last_seed:seedList[seedList.length-1],
    left_choices:counts.left,
    right_choices:counts.right,
    timeouts:counts.timeout,
    timeout_fraction:finiteFraction(counts.timeout,seedList.length),
    choices,
    marked_side:markedSide,
    marked_arm_choices:marked,
    marked_arm_choice_fraction_among_choices:markedSide?finiteFraction(marked,choices):null,
    left_fraction_among_choices:finiteFraction(counts.left,choices),
    wilson_95_marked_arm:markedSide?wilson95(marked,choices):null,
    wilson_95_left:!markedSide?wilson95(counts.left,choices):null,
    P4_diagnostics:{
      ...diag,
      detected_fraction_of_evaluations:finiteFraction(diag.detected_samples,diag.evaluation_samples),
      subthreshold_fraction_of_evaluations:finiteFraction(diag.subthreshold_samples,diag.evaluation_samples),
      nonzero_steering_fraction_of_evaluations:finiteFraction(diag.nonzero_steering_samples,diag.evaluation_samples)
    }
  };
}
function requireOfficialAuthorization(){
  if(!fs.existsSync(OFFICIAL_AUTH))throw new Error('Official P4 Y-maze Stage A execution is locked: authorization file is absent.');
  const a=JSON.parse(fs.readFileSync(OFFICIAL_AUTH,'utf8'));
  if(a.id!=='P4_Y_maze_consistency_official_execution_authorization_v1'||a.official_stage_A_execution_authorized!==true)throw new Error('Official P4 Y-maze Stage A authorization is not active.');
  return a;
}
function buildReport(mode='qualification'){
  if(!Object.prototype.hasOwnProperty.call(PLAN,mode))throw new Error('mode must be qualification or official');
  if(mode==='official')requireOfficialAuthorization();
  const plan=PLAN[mode];
  const left=runCondition(EXP.left,seeds(plan.leftRoot,plan.markedCount),'left');
  const right=runCondition(EXP.right,seeds(plan.rightRoot,plan.markedCount),'right');
  const neutral=runCondition(EXP.neutral,seeds(plan.neutralRoot,plan.neutralCount),null);
  const leftMarked=left.marked_arm_choice_fraction_among_choices;
  const rightMarked=right.marked_arm_choice_fraction_among_choices;
  const sideBalanced=leftMarked===null||rightMarked===null?null:(leftMarked+rightMarked)/2;
  const sideDifference=leftMarked===null||rightMarked===null?null:leftMarked-rightMarked;
  return{
    schema_version:1,
    id:mode==='official'?'P4_Y_maze_consistency_stage_A_simulation_v1':'P4_Y_maze_consistency_reference_free_qualification_simulation_v1',
    mode,
    scientific_evidence:plan.scientificEvidence,
    interpretation:mode==='official'?'posthoc_same_study_cross_apparatus_descriptive_consistency_only':'reference_free_implementation_qualification_only',
    frozen_candidate:{index:307,sigma_field_mm:18.319554310908863,kappa_trail_per_s:6.342935528120713,theta_detect:0.9184},
    seed_contract:{left_root:plan.leftRoot,right_root:plan.rightRoot,marked_count_per_side:plan.markedCount,neutral_root:plan.neutralRoot,neutral_count:plan.neutralCount,paired_left_right:true},
    left_marked:left,
    right_marked:right,
    neutral,
    predeclared_fields:{
      left_marked_trials:left.trials,
      left_marked_left_choices:left.left_choices,
      left_marked_right_choices:left.right_choices,
      left_marked_timeouts:left.timeouts,
      left_marked_marked_arm_choice_fraction_among_choices:leftMarked,
      right_marked_trials:right.trials,
      right_marked_left_choices:right.left_choices,
      right_marked_right_choices:right.right_choices,
      right_marked_timeouts:right.timeouts,
      right_marked_marked_arm_choice_fraction_among_choices:rightMarked,
      side_balanced_marked_arm_choice_fraction:sideBalanced,
      neutral_trials:neutral.trials,
      neutral_left_choices:neutral.left_choices,
      neutral_right_choices:neutral.right_choices,
      neutral_timeouts:neutral.timeouts,
      neutral_left_fraction_among_choices:neutral.left_fraction_among_choices,
      left_right_marked_side_difference:sideDifference,
      P4_detection_diagnostics_by_marked_side:{left:left.P4_diagnostics,right:right.P4_diagnostics}
    },
    decision_semantics:{validation_pass_fail_threshold:null,promotion_rule:null,canonical_update_authorized:false}
  };
}
function parseArgs(argv){
  const mode=argv.includes('--official')?'official':'qualification';
  const oi=argv.indexOf('--out');
  return{mode,out:oi>=0?argv[oi+1]:null};
}
function main(argv=process.argv.slice(2)){
  const {mode,out}=parseArgs(argv),report=buildReport(mode),text=JSON.stringify(report,null,2)+'\n';
  if(out){const p=path.resolve(ROOT,out);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text);}else process.stdout.write(text);
  return report;
}
if(require.main===module)main();
module.exports={EXP,PLAN,seeds,wilson95,runCondition,buildReport,requireOfficialAuthorization,main};
