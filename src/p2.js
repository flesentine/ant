(function (root, factory) {
  const core = (typeof module === 'object' && module.exports) ? require('./sim-core.js') : root.AntLabCore;
  const integrity = (typeof module === 'object' && module.exports) ? require('./integrity.js') : root.AntLabIntegrity;
  const p1 = (typeof module === 'object' && module.exports) ? require('./p1.js') : root.AntLabP1;
  const api = factory(core, integrity, p1);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AntLabP2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core, integrity, p1) {
  'use strict';
  if (!core) throw new Error('ANTLAB P2 requires AntLabCore');
  if (!integrity) throw new Error('ANTLAB P2 requires AntLabIntegrity');
  if (!p1) throw new Error('ANTLAB P2 requires frozen AntLabP1 local-kernel helpers');

  const P2_FORBIDDEN_KEYS=new Set([
    'painted_trail_response','sigma_field_mm','kappa_trail_per_s','p_lapse',
    'sensor_forward_offset_mm','sensor_lateral_half_separation_mm',
    'trail_bearing','trail_distance','trail_centerline','trail_target',
    'trail_heading','trail_direction','response_engaged','pheromone_ignorer'
  ]);

  function assertNoP2Overrides(value,path='experiment'){
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach((v,i)=>assertNoP2Overrides(v,`${path}[${i}]`));return;}
    for(const[key,child]of Object.entries(value)){
      if(P2_FORBIDDEN_KEYS.has(key))throw new Error(`P2 biology/navigation override forbidden at ${path}.${key}; P2 response parameters belong in the model and trail geometry/dose belong in apparatus/protocol`);
      assertNoP2Overrides(child,`${path}.${key}`);
    }
  }

  function paintedTrailResponseConfig(model){
    const c=model&&model.painted_trail_response;
    if(!c||c.enabled!==true)return null;
    if(c.mechanism_id!=='P2_trial_level_transient_trail_engagement_v1')throw new Error('Unexpected P2 mechanism id.');
    if(c.field?.type!=='gaussian_distance_to_segment')throw new Error('P2 requires gaussian_distance_to_segment field response.');
    if(c.sensors?.type!=='bilateral_body_frame_points')throw new Error('P2 requires bilateral_body_frame_points sensors.');
    if(c.transduction?.type!=='c_over_one_plus_c')throw new Error('P2 requires c_over_one_plus_c transduction.');
    if(c.steering?.type!=='engagement_gated_right_minus_left_heading_drift')throw new Error('P2 requires engagement_gated_right_minus_left_heading_drift steering.');
    if(c.engagement?.type!=='trial_level_bernoulli_lapse')throw new Error('P2 requires trial_level_bernoulli_lapse engagement.');
    const sigma=Number(c.field.sigma_field_mm),kappa=Number(c.steering.kappa_trail_per_s),
      forward=Number(c.sensors.forward_offset_mm),half=Number(c.sensors.lateral_half_separation_mm),
      pLapse=Number(c.engagement.p_lapse);
    if(!(sigma>0))throw new Error('P2 sigma_field_mm must be > 0.');
    if(!(kappa>=0))throw new Error('P2 kappa_trail_per_s must be >= 0.');
    if(!(forward>=0))throw new Error('P2 sensor forward_offset_mm must be >= 0.');
    if(!(half>0))throw new Error('P2 sensor lateral_half_separation_mm must be > 0.');
    if(!(pLapse>=0&&pLapse<=1))throw new Error('P2 p_lapse must be in [0,1].');
    return{sigma,kappa,forward,half,pLapse,mechanismId:c.mechanism_id};
  }

  function hash32(x){
    x|=0;
    x=(x+0x9e3779b9)|0;
    x=Math.imul(x^(x>>>16),0x21f0aaad);
    x=Math.imul(x^(x>>>15),0x735a2d97);
    return(x^(x>>>15))>>>0;
  }

  function responseSeed(worldSeed,antId){
    return hash32((worldSeed>>>0)^Math.imul(antId+1,0x27d4eb2d)^0x6c8e9cf5)>>>0||1;
  }

  function engagementState(worldSeed,antId,cfg,doseRatio){
    if(doseRatio===0||cfg.kappa===0)return{engaged:false,draws:0,responseSeed:null,u:null,bypass:'null_signal'};
    if(cfg.pLapse===1)return{engaged:false,draws:0,responseSeed:null,u:null,bypass:'all_lapse'};
    if(cfg.pLapse===0)return{engaged:true,draws:0,responseSeed:null,u:null,bypass:'always_engaged'};
    const seed=responseSeed(worldSeed,antId),rng=new core.RNG(seed),u=rng.next();
    return{engaged:u>=cfg.pLapse,draws:1,responseSeed:seed,u,bypass:null};
  }

  function wrapAnt(ant,sim){
    const baseUpdate=ant.update.bind(ant),gate=engagementState(sim.seed,ant.id,sim.p2Config,sim.p2DoseRatio);
    ant.p2Engaged=gate.engaged;
    ant.p2ResponseSeed=gate.responseSeed;
    ant.p2ResponseU=gate.u;
    ant.p2ResponseDraws=gate.draws;
    ant.p2EngagementBypass=gate.bypass;
    ant.p2SteeringSamples=0;
    ant.p2LastOmega=0;
    ant.p2LastLeftResponse=null;
    ant.p2LastRightResponse=null;
    ant.update=function(dt,coreSim){
      if(this.p2Engaged&&!this.finished&&sim.p2DoseRatio!==0&&sim.p2Config.kappa!==0&&p1.movingThisStepWithoutMutation(this,sim.model.movement,dt)){
        const s=p1.trailSteeringRate(this.x,this.y,this.heading,sim.p2Config,sim.p2Field,sim.p2DoseRatio);
        this.p2LastOmega=s.omega;
        this.p2LastLeftResponse=s.left;
        this.p2LastRightResponse=s.right;
        this.p2SteeringSamples++;
        this.heading=core.normalizeAngle(this.heading+s.omega*dt);
      }
      return baseUpdate(dt,coreSim);
    };
  }

  class Simulation extends integrity.Simulation{
    constructor(bundle,seed=1,workerOverride=null){
      assertNoP2Overrides(bundle&&bundle.experiment,'experiment');
      assertNoP2Overrides(bundle&&bundle.state,'state');
      super(bundle,seed,workerOverride);
      this.p2Config=paintedTrailResponseConfig(this.model);
      if(!this.p2Config)throw new Error('ANTLAB P2 Simulation requires an enabled painted_trail_response model.');
      if(this.model.directional_persistence?.enabled||this.model.reorientation_gate?.enabled||this.model.locomotor_activation?.enabled||this.model.heading_restoration?.enabled)throw new Error('P2-v1 cannot be combined with H2, H3, H4, or H5 mechanisms.');
      this.p2Field=p1.paintedTrailApparatusConfig(this.apparatus);
      this.p2DoseRatio=p1.appliedDoseRatio(this.experiment,this.p2Field);
      for(const ant of this.ants)wrapAnt(ant,this);
    }

    summary(){
      const base=super.summary();
      base.provenance=Object.assign({},base.provenance,{
        p2_mechanism:this.p2Config.mechanismId,
        p2_runtime_layer:'src/p2.js extension over frozen canonical integrity runtime using frozen P1 local-kernel helpers',
        p2_engagement_rule:'one transient per-ant per-trial Bernoulli lapse state; no persistent identity',
        p2_response_rng:'dedicated namespaced core.RNG; zero canonical biology RNG draws added',
        p2_applied_dose_ratio:this.p2DoseRatio,
        p2_null_bypass:'dose A=0, kappa=0, or p_lapse=1 skips trail steering; p_lapse endpoints use zero response RNG draws'
      });
      base.p2_diagnostics=this.ants.map(a=>({
        ant_id:a.id,
        engaged:a.p2Engaged,
        response_seed:a.p2ResponseSeed,
        response_u:a.p2ResponseU,
        response_draws:a.p2ResponseDraws,
        engagement_bypass:a.p2EngagementBypass,
        steering_samples:a.p2SteeringSamples,
        last_omega_trail_per_s:a.p2LastOmega,
        last_left_response:a.p2LastLeftResponse,
        last_right_response:a.p2LastRightResponse
      }));
      return base;
    }

    fingerprint(){
      return JSON.stringify({base:super.fingerprint(),p2:{doseRatio:this.p2DoseRatio,ants:this.ants.map(a=>[a.id,a.p2Engaged,a.p2ResponseSeed,a.p2ResponseU,a.p2ResponseDraws,a.p2SteeringSamples,a.p2LastOmega])}});
    }
  }

  return{
    assertNoP2Overrides,paintedTrailResponseConfig,hash32,responseSeed,engagementState,Simulation,
    FIXED_DT:core.FIXED_DT
  };
});
