(function (root, factory) {
  const core = (typeof module === 'object' && module.exports) ? require('./sim-core.js') : root.AntLabCore;
  const integrity = (typeof module === 'object' && module.exports) ? require('./integrity.js') : root.AntLabIntegrity;
  const api = factory(core, integrity);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AntLabP1 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core, integrity) {
  'use strict';
  if (!core) throw new Error('ANTLAB P1 requires AntLabCore');
  if (!integrity) throw new Error('ANTLAB P1 requires AntLabIntegrity');

  const P1_FORBIDDEN_KEYS=new Set([
    'painted_trail_response','sigma_field_mm','kappa_trail_per_s',
    'sensor_forward_offset_mm','sensor_lateral_half_separation_mm',
    'trail_bearing','trail_distance','trail_centerline','trail_target',
    'trail_heading','trail_direction'
  ]);

  function assertNoP1Overrides(value,path='experiment'){
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach((v,i)=>assertNoP1Overrides(v,`${path}[${i}]`));return;}
    for(const[key,child]of Object.entries(value)){
      if(P1_FORBIDDEN_KEYS.has(key))throw new Error(`P1 biology/navigation override forbidden at ${path}.${key}; P1 response parameters belong in the model and trail geometry/dose belong in apparatus/protocol`);
      assertNoP1Overrides(child,`${path}.${key}`);
    }
  }

  function paintedTrailResponseConfig(model){
    const c=model&&model.painted_trail_response;
    if(!c||c.enabled!==true)return null;
    if(c.mechanism_id!=='P1_egocentric_painted_trail_gradient_steering_v1')throw new Error('Unexpected P1 mechanism id.');
    if(c.field?.type!=='gaussian_distance_to_segment')throw new Error('P1 requires gaussian_distance_to_segment field response.');
    if(c.sensors?.type!=='bilateral_body_frame_points')throw new Error('P1 requires bilateral_body_frame_points sensors.');
    if(c.transduction?.type!=='c_over_one_plus_c')throw new Error('P1 requires c_over_one_plus_c transduction.');
    if(c.steering?.type!=='right_minus_left_heading_drift')throw new Error('P1 requires right_minus_left_heading_drift steering.');
    const sigma=Number(c.field.sigma_field_mm),kappa=Number(c.steering.kappa_trail_per_s),
      forward=Number(c.sensors.forward_offset_mm),half=Number(c.sensors.lateral_half_separation_mm);
    if(!(sigma>0))throw new Error('P1 sigma_field_mm must be > 0.');
    if(!(kappa>=0))throw new Error('P1 kappa_trail_per_s must be >= 0.');
    if(!(forward>=0))throw new Error('P1 sensor forward_offset_mm must be >= 0.');
    if(!(half>0))throw new Error('P1 sensor lateral_half_separation_mm must be > 0.');
    return{sigma,kappa,forward,half,mechanismId:c.mechanism_id};
  }

  function paintedTrailApparatusConfig(apparatus){
    const f=apparatus&&apparatus.external_fields&&apparatus.external_fields.painted_trail;
    if(!f)throw new Error('P1 requires apparatus.external_fields.painted_trail.');
    if(f.type!=='line_segment_scalar_field')throw new Error('P1 painted trail must be a line_segment_scalar_field.');
    const l=f.line_segment_mm||{},x1=Number(l.x1),y1=Number(l.y1),x2=Number(l.x2),y2=Number(l.y2),
      nominal=Number(f.nominal_dose_hindgut_equivalents_per_cm);
    if(![x1,y1,x2,y2].every(Number.isFinite))throw new Error('P1 trail line segment must have finite coordinates.');
    if(x1===x2&&y1===y2)throw new Error('P1 trail line segment must have nonzero length.');
    if(!(nominal>0))throw new Error('P1 nominal trail dose must be > 0.');
    return{a:{x:x1,y:y1},b:{x:x2,y:y2},nominalDose:nominal};
  }

  function appliedDoseRatio(experiment,fieldCfg){
    const raw=experiment&&experiment.protocol&&experiment.protocol.painted_trail&&experiment.protocol.painted_trail.applied_hindgut_equivalents_per_cm;
    const dose=Number(raw);
    if(!Number.isFinite(dose)||dose<0)throw new Error('P1 protocol requires nonnegative painted_trail.applied_hindgut_equivalents_per_cm.');
    return dose/fieldCfg.nominalDose;
  }

  function distanceToSegment(p,a,b){
    const vx=b.x-a.x,vy=b.y-a.y,wx=p.x-a.x,wy=p.y-a.y,vv=vx*vx+vy*vy;
    const t=vv===0?0:Math.max(0,Math.min(1,(wx*vx+wy*vy)/vv));
    return Math.hypot(p.x-(a.x+t*vx),p.y-(a.y+t*vy));
  }

  function fieldConcentration(p,fieldCfg,sigma,doseRatio){
    const d=distanceToSegment(p,fieldCfg.a,fieldCfg.b);
    return doseRatio*Math.exp(-(d*d)/(2*sigma*sigma));
  }

  function sensorPoints(x,y,heading,cfg){
    const ch=Math.cos(heading),sh=Math.sin(heading);
    const ux=ch,uy=sh,rx=-sh,ry=ch,lx=sh,ly=-ch;
    return{
      left:{x:x+cfg.forward*ux+cfg.half*lx,y:y+cfg.forward*uy+cfg.half*ly},
      right:{x:x+cfg.forward*ux+cfg.half*rx,y:y+cfg.forward*uy+cfg.half*ry}
    };
  }

  function transduce(c){
    const x=Math.max(0,Number(c)||0);
    return x/(1+x);
  }

  function trailSteeringRate(x,y,heading,responseCfg,fieldCfg,doseRatio){
    if(doseRatio===0||responseCfg.kappa===0)return{omega:0,left:null,right:null,leftConcentration:null,rightConcentration:null,bypass:true};
    const pts=sensorPoints(x,y,heading,responseCfg);
    const lc=fieldConcentration(pts.left,fieldCfg,responseCfg.sigma,doseRatio);
    const rc=fieldConcentration(pts.right,fieldCfg,responseCfg.sigma,doseRatio);
    const left=transduce(lc),right=transduce(rc);
    return{omega:responseCfg.kappa*(right-left),left,right,leftConcentration:lc,rightConcentration:rc,bypass:false};
  }

  function movingThisStepWithoutMutation(ant,movement,dt){
    if(ant.finished||ant.pauseRemaining>0)return false;
    const preview=new core.RNG(1);
    preview.state=ant.rng.state;
    return !core.hazard(Number(movement.pause_rate_s)*ant.pauseScale,dt,preview);
  }

  function wrapAnt(ant,sim){
    const baseUpdate=ant.update.bind(ant);
    ant.p1SteeringSamples=0;
    ant.p1LastOmega=0;
    ant.p1LastLeftResponse=null;
    ant.p1LastRightResponse=null;
    ant.update=function(dt,coreSim){
      if(!this.finished&&sim.p1DoseRatio!==0&&sim.p1Config.kappa!==0&&movingThisStepWithoutMutation(this,sim.model.movement,dt)){
        const s=trailSteeringRate(this.x,this.y,this.heading,sim.p1Config,sim.p1Field,sim.p1DoseRatio);
        this.p1LastOmega=s.omega;
        this.p1LastLeftResponse=s.left;
        this.p1LastRightResponse=s.right;
        this.p1SteeringSamples++;
        this.heading=core.normalizeAngle(this.heading+s.omega*dt);
      }
      return baseUpdate(dt,coreSim);
    };
  }

  class Simulation extends integrity.Simulation{
    constructor(bundle,seed=1,workerOverride=null){
      assertNoP1Overrides(bundle&&bundle.experiment,'experiment');
      assertNoP1Overrides(bundle&&bundle.state,'state');
      super(bundle,seed,workerOverride);
      this.p1Config=paintedTrailResponseConfig(this.model);
      if(!this.p1Config)throw new Error('ANTLAB P1 Simulation requires an enabled painted_trail_response model.');
      if(this.model.directional_persistence?.enabled||this.model.reorientation_gate?.enabled||this.model.locomotor_activation?.enabled||this.model.heading_restoration?.enabled)throw new Error('P1-v1 cannot be combined with H2, H3, H4, or H5 mechanisms.');
      this.p1Field=paintedTrailApparatusConfig(this.apparatus);
      this.p1DoseRatio=appliedDoseRatio(this.experiment,this.p1Field);
      for(const ant of this.ants)wrapAnt(ant,this);
    }

    summary(){
      const base=super.summary();
      base.provenance=Object.assign({},base.provenance,{
        p1_mechanism:this.p1Config.mechanismId,
        p1_runtime_layer:'src/p1.js extension over frozen canonical integrity runtime',
        p1_rng_scheme:'no new RNG stream or draw; moving-step preview clones biology RNG state without mutation',
        p1_applied_dose_ratio:this.p1DoseRatio,
        p1_field_source:'apparatus external_fields.painted_trail + protocol applied dose',
        p1_null_bypass:'dose A=0 or kappa=0 skips field/sensor evaluation and adds positive numeric +0 exactly'
      });
      base.p1_diagnostics=this.ants.map(a=>({
        ant_id:a.id,
        steering_samples:a.p1SteeringSamples,
        last_omega_trail_per_s:a.p1LastOmega,
        last_left_response:a.p1LastLeftResponse,
        last_right_response:a.p1LastRightResponse
      }));
      return base;
    }

    fingerprint(){
      return JSON.stringify({base:super.fingerprint(),p1:{doseRatio:this.p1DoseRatio,ants:this.ants.map(a=>[a.id,a.p1SteeringSamples,a.p1LastOmega])}});
    }
  }

  return{
    assertNoP1Overrides,paintedTrailResponseConfig,paintedTrailApparatusConfig,appliedDoseRatio,
    distanceToSegment,fieldConcentration,sensorPoints,transduce,trailSteeringRate,movingThisStepWithoutMutation,
    Simulation,FIXED_DT:core.FIXED_DT
  };
});
