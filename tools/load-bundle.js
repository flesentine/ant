'use strict';
const fs=require('fs'),path=require('path');
function readJson(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function loadBundle(experimentPath,options={}){
  const root=path.resolve(__dirname,'..');
  const full=path.isAbsolute(experimentPath)?experimentPath:path.resolve(root,'experiments',experimentPath);
  const experiment=readJson(full);
  const modelId=options.modelId||experiment.model;
  if(options.modelId)experiment.model=modelId;
  const model=readJson(path.resolve(root,'models',`${modelId}.json`));
  const apparatus=readJson(path.resolve(root,'apparatus',`${experiment.apparatus}.json`));
  const state=readJson(path.resolve(root,'states',`${experiment.state}.json`));
  const observation=readJson(path.resolve(root,'observations',`${experiment.observation}.json`));
  const scoring=readJson(path.resolve(root,'scoring',`${experiment.scoring}.json`));
  return{experiment,model,apparatus,state,observation,scoring};
}
module.exports={loadBundle,readJson};
