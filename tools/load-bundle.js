'use strict';
const fs=require('fs'),path=require('path');
function readJson(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function loadBundle(experimentPath){
  const root=path.resolve(__dirname,'..');
  const full=path.isAbsolute(experimentPath)?experimentPath:path.resolve(root,'experiments',experimentPath);
  const experiment=readJson(full);
  const model=readJson(path.resolve(root,'models',`${experiment.model}.json`));
  const apparatus=readJson(path.resolve(root,'apparatus',`${experiment.apparatus}.json`));
  const state=readJson(path.resolve(root,'states',`${experiment.state}.json`));
  const observation=readJson(path.resolve(root,'observations',`${experiment.observation}.json`));
  const scoring=readJson(path.resolve(root,'scoring',`${experiment.scoring}.json`));
  return{experiment,model,apparatus,state,observation,scoring};
}
module.exports={loadBundle,readJson};
