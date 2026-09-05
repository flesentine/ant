(function (root, factory) {
  const core = (typeof module === 'object' && module.exports) ? require('./sim-core.js') : root.AntLabCore;
  const integrity = (typeof module === 'object' && module.exports) ? require('./integrity.js') : root.AntLabIntegrity;
  const api = factory(core, integrity);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AntLabH5 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core, integrity) {
  'use strict';
  if (!core) throw new Error('ANTLAB H5 requires AntLabCore');
  if (!integrity) throw new Error('ANTLAB H5 requires AntLabIntegrity');

  const H5_FORBIDDEN_KEYS=new Set([
    'heading_restoration','heading_commitment','lambda_commitment_mm','tau_commitment_s',
    'kappa_restore_per_s','theta_ref','heading_reference_rad','C'
  ]);

  function assertNoH5Overrides(value,path='experiment'){
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach((v,i)=>assertNoH5Overrides(v,`${path}[${i}]`));return;}
    for(const[key,child]of Object.entries(value)){
      if(H5_FORBIDDEN_KEYS.has(key))throw new Error(`H5 biology override forbidden at ${path}.${key}; H5 biological parameters and latent state belong in the model/runtime layer`);
      assertNoH5Overrides(child,`${path}.${key}`);
    }
  }

  function headingRestorationConfig(model){
    const c=model&&model.heading_restoration;
    if(!c||c.enabled!==true)return null;
    if(c.initialization?.type!=='saturating_distance')throw new Error('H5 heading restoration requires saturating_distance initialization.');
    if(c.decay?.type!=='exponential')throw new Error('H5 heading restoration requires exponential decay.');
    if(c.effect?.type!=='circular_entry_heading_restoration')throw new Error('H5 heading restoration requires circular_entry_heading_restoration effect.');
    const inputFact=String(c.input_fact||''),lambda=Number(c.initialization.lambda_commitment_mm),tau=Number(c.decay.tau_commitment_s),kappa=Number(c.effect.kappa_restore_per_s);
    if(!inputFact)throw new Error('H5 heading restoration requires an observable input_fact.');
    if(!(lambda>0))throw new Error('H5 lambda_commitment_mm must be > 0.');
    if(!(tau>0))throw new Error('H5 tau_commitment_s must be > 0.');
    if(!(kappa>=0))throw new Error('H5 kappa_restore_per_s must be >= 0.');
    return{inputFact,lambda,tau,kappa,mechanismId:c.mechanism_id||'H5_transient_entry_heading_restoration_v1'};
  }

  function initializeHeadingRestoration(ant,cfg){
    const L=Math.max(0,Number(ant.agentState&&ant.agentState[cfg.inputFact])||0),c0=Math.max(0,Math.min(1,1-Math.exp(-L/cfg.lambda)));
    ant.headingCommitment=c0;
    ant.headingCommitmentInitial=c0;
    ant.headingReference=null;
    ant.headingReferenceCaptured=false;
    ant.h5InputTravelMm=L;
  }

  function captureHeadingReferences(sim){
    if(!sim.h5Config)return;
    for(const ant of sim.ants){
      if(ant.finished||ant.headingReferenceCaptured)continue;
      ant.headingReference=core.normalizeAngle(ant.heading);
      ant.headingReferenceCaptured=true;
    }
  }

  function exactHeadingRestorationAngle(heading,reference,c0,cfg,dt){
    const h=core.normalizeAngle(Number(heading)||0),ref=core.normalizeAngle(Number(reference)||0),c=Math.max(0,Math.min(1,Number(c0)||0)),t=Math.max(0,Number(dt)||0);
    if(!(t>0)||!(cfg&&cfg.kappa>0)||!(c>0))return h;
    const integratedCommitment=c*cfg.tau*(1-Math.exp(-t/cfg.tau)),factor=Math.exp(-cfg.kappa*integratedCommitment),delta=core.normalizeAngle(h-ref);
    return core.normalizeAngle(ref+2*Math.atan2(factor*Math.sin(delta),1+Math.cos(delta)));
  }

  function movingThisStepWithoutMutation(ant,movement,dt){
    if(ant.finished||ant.pauseRemaining>0)return false;
    const preview=new core.RNG(1);
    preview.state=ant.rng.state;
    return !core.hazard(Number(movement.pause_rate_s)*ant.pauseScale,dt,preview);
  }

  function wrapAnt(ant,sim){
    const baseUpdate=ant.update.bind(ant);
    ant.update=function(dt,coreSim){
      if(!this.finished&&movingThisStepWithoutMutation(this,sim.model.movement,dt)&&this.headingReferenceCaptured){
        this.heading=exactHeadingRestorationAngle(this.heading,this.headingReference,this.headingCommitment,sim.h5Config,dt);
      }
      return baseUpdate(dt,coreSim);
    };
  }

  class Simulation extends integrity.Simulation{
    constructor(bundle,seed=1,workerOverride=null){
      assertNoH5Overrides(bundle&&bundle.experiment,'experiment');
      assertNoH5Overrides(bundle&&bundle.state,'state');
      super(bundle,seed,workerOverride);
      this.h5Config=headingRestorationConfig(this.model);
      if(!this.h5Config)throw new Error('ANTLAB H5 Simulation requires an enabled heading_restoration model.');
      if(this.model.directional_persistence?.enabled||this.model.reorientation_gate?.enabled||this.model.locomotor_activation?.enabled)throw new Error('H5 cannot be combined with H2, H3, or H4 mechanisms in the same v1 model.');
      for(const ant of this.ants){initializeHeadingRestoration(ant,this.h5Config);wrapAnt(ant,this);}
    }

    step(dt=core.FIXED_DT){
      captureHeadingReferences(this);
      const t0=this.time,before=new Map(this.ants.map(a=>[a.id,{finished:a.finished,c:a.headingCommitment}]));
      super.step(dt);
      for(const ant of this.ants){
        const prev=before.get(ant.id);
        if(!prev||prev.finished)continue;
        let elapsed=Math.max(0,dt);
        if(ant.finished&&ant.completedAt!=null&&ant.completedAt<t0+dt-1e-7)elapsed=Math.max(0,Math.min(dt,ant.completedAt-t0));
        ant.headingCommitment=Math.max(0,Math.min(1,prev.c*Math.exp(-elapsed/this.h5Config.tau)));
      }
    }

    summary(){
      const base=super.summary();
      base.latent_states=base.latent_states.map((l,i)=>Object.assign({},l,{
        heading_commitment_initial:this.ants[i].headingCommitmentInitial||0,
        heading_commitment_current:this.ants[i].headingCommitment||0,
        h5_heading_reference_rad:this.ants[i].headingReferenceCaptured?this.ants[i].headingReference:null,
        h5_heading_reference_captured:!!this.ants[i].headingReferenceCaptured
      }));
      base.provenance=Object.assign({},base.provenance,{
        h5_heading_restoration_mechanism:this.h5Config.mechanismId,
        h5_runtime_layer:'src/h5.js extension over frozen H0-H4 integrity runtime',
        h5_rng_scheme:'no new stochastic stream; pause/move preview clones current biology RNG state without mutating it; baseline RNG consumption is unchanged',
        h5_reference_capture:'lazy immediately before first physics step after shared entry transition',
        h5_pause_semantics:'restoring drift moving-only; commitment decays in real time during pauses',
        h5_drift_integration:'exact circular deterministic drift map for exponential commitment decay'
      });
      return base;
    }

    fingerprint(){
      return JSON.stringify({base:super.fingerprint(),h5:this.ants.map(a=>[a.id,a.headingCommitment,a.headingReferenceCaptured?a.headingReference:null])});
    }
  }

  return{assertNoH5Overrides,headingRestorationConfig,initializeHeadingRestoration,captureHeadingReferences,exactHeadingRestorationAngle,movingThisStepWithoutMutation,Simulation,FIXED_DT:core.FIXED_DT};
});
