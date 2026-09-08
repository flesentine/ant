(function(root,factory){
  const core=(typeof module==='object'&&module.exports)?require('./sim-core.js'):root.AntLabCore;
  const integrity=(typeof module==='object'&&module.exports)?require('./integrity.js'):root.AntLabIntegrity;
  const p1=(typeof module==='object'&&module.exports)?require('./p1.js'):root.AntLabP1;
  const api=factory(core,integrity,p1);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.AntLabP3=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(core,integrity,p1){
  'use strict';
  if(!core)throw new Error('ANTLAB P3 requires AntLabCore');
  if(!integrity)throw new Error('ANTLAB P3 requires AntLabIntegrity');
  if(!p1)throw new Error('ANTLAB P3 requires frozen AntLabP1 helpers');

  const P3_FORBIDDEN_KEYS=new Set([
    'painted_trail_response','sigma_field_mm','kappa_trail_per_s','p_lapse',
    'sector_radius_mm','radial_bins','angular_bins_per_sector','epsilon','threshold',
    'trail_bearing','trail_distance','trail_centerline','trail_target',
    'trail_heading','trail_direction','response_engaged','pheromone_ignorer'
  ]);

  function assertNoP3Overrides(value,path='experiment'){
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(function(v,i){assertNoP3Overrides(v,path+'['+i+']');});return;}
    for(const entry of Object.entries(value)){
      const key=entry[0],child=entry[1];
      if(P3_FORBIDDEN_KEYS.has(key))throw new Error('P3 biology/navigation override forbidden at '+path+'.'+key);
      assertNoP3Overrides(child,path+'.'+key);
    }
  }

  function paintedTrailResponseConfig(model){
    const c=model&&model.painted_trail_response;
    if(!c||c.enabled!==true)return null;
    if(c.mechanism_id!=='P3_local_sector_weber_steering_v1')throw new Error('Unexpected P3 mechanism id.');
    if(c.field?.type!=='gaussian_distance_to_segment')throw new Error('P3 requires gaussian_distance_to_segment field.');
    if(c.sensors?.type!=='deterministic_equal_area_front_quadrant_sector_means')throw new Error('P3 requires deterministic sector sensors.');
    if(c.transduction?.type!=='piecewise_weber_michelson_right_minus_left')throw new Error('P3 requires Weber/Michelson transduction.');
    if(c.steering?.type!=='relative_right_minus_left_heading_drift')throw new Error('P3 requires relative right-minus-left steering.');
    const sigma=Number(c.field.sigma_field_mm),kappa=Number(c.steering.kappa_trail_per_s);
    const radius=Number(c.sensors.radius_mm),radialBins=Number(c.sensors.radial_bins),angularBins=Number(c.sensors.angular_bins_per_sector);
    const epsilon=Number(c.transduction.epsilon_or_regularization);
    if(!(sigma>0))throw new Error('P3 sigma_field_mm must be > 0.');
    if(!(kappa>=0))throw new Error('P3 kappa_trail_per_s must be >= 0.');
    if(!(radius>0))throw new Error('P3 sector radius_mm must be > 0.');
    if(radialBins!==4||angularBins!==8)throw new Error('P3 sector quadrature must be frozen 4x8.');
    if(epsilon!==0)throw new Error('P3 epsilon_or_regularization must be exactly 0.');
    return{sigma,kappa,radius,radialBins,angularBins,samplesPerSector:radialBins*angularBins,mechanismId:c.mechanism_id};
  }

  function sectorSamplePoints(x,y,heading,cfg){
    const ch=Math.cos(heading),sh=Math.sin(heading);
    const u={x:ch,y:sh},right={x:-sh,y:ch},left={x:sh,y:-ch};
    const l=[],r=[];
    for(let i=0;i<cfg.radialBins;i++)for(let j=0;j<cfg.angularBins;j++){
      const rho=cfg.radius*Math.sqrt((i+.5)/cfg.radialBins);
      const alpha=(j+.5)*(Math.PI/2)/cfg.angularBins,ca=Math.cos(alpha),sa=Math.sin(alpha);
      r.push({x:x+rho*(ca*u.x+sa*right.x),y:y+rho*(ca*u.y+sa*right.y)});
      l.push({x:x+rho*(ca*u.x+sa*left.x),y:y+rho*(ca*u.y+sa*left.y)});
    }
    return{left:l,right:r};
  }

  function sectorSummaries(x,y,heading,cfg,fieldCfg,doseRatio){
    const pts=sectorSamplePoints(x,y,heading,cfg);
    let L=0,R=0;
    for(const pt of pts.left)L+=p1.fieldConcentration(pt,fieldCfg,cfg.sigma,doseRatio);
    for(const pt of pts.right)R+=p1.fieldConcentration(pt,fieldCfg,cfg.sigma,doseRatio);
    return{left:L/pts.left.length,right:R/pts.right.length,leftSamples:pts.left,rightSamples:pts.right};
  }

  function relativeSignal(left,right){
    const L=Math.max(0,Number(left)||0),R=Math.max(0,Number(right)||0),sum=L+R;
    return sum<=0?0:(R-L)/sum;
  }

  function trailSteeringRate(x,y,heading,cfg,fieldCfg,doseRatio){
    if(doseRatio===0||cfg.kappa===0)return{omega:0,left:null,right:null,signal:null,bypass:true};
    const s=sectorSummaries(x,y,heading,cfg,fieldCfg,doseRatio),w=relativeSignal(s.left,s.right);
    return{omega:cfg.kappa*w,left:s.left,right:s.right,signal:w,bypass:false};
  }

  function wrapAnt(ant,sim){
    const baseUpdate=ant.update.bind(ant);
    ant.p3SteeringSamples=0;
    ant.p3LastOmega=0;
    ant.p3LastLeftSummary=null;
    ant.p3LastRightSummary=null;
    ant.p3LastRelativeSignal=null;
    ant.update=function(dt,coreSim){
      if(!this.finished&&sim.p3DoseRatio!==0&&sim.p3Config.kappa!==0&&p1.movingThisStepWithoutMutation(this,sim.model.movement,dt)){
        const s=trailSteeringRate(this.x,this.y,this.heading,sim.p3Config,sim.p3Field,sim.p3DoseRatio);
        this.p3LastOmega=s.omega;
        this.p3LastLeftSummary=s.left;
        this.p3LastRightSummary=s.right;
        this.p3LastRelativeSignal=s.signal;
        this.p3SteeringSamples++;
        this.heading=core.normalizeAngle(this.heading+s.omega*dt);
      }
      return baseUpdate(dt,coreSim);
    };
  }

  class Simulation extends integrity.Simulation{
    constructor(bundle,seed=1,workerOverride=null){
      assertNoP3Overrides(bundle&&bundle.experiment,'experiment');
      assertNoP3Overrides(bundle&&bundle.state,'state');
      super(bundle,seed,workerOverride);
      this.p3Config=paintedTrailResponseConfig(this.model);
      if(!this.p3Config)throw new Error('ANTLAB P3 Simulation requires enabled painted_trail_response.');
      if(this.model.directional_persistence?.enabled||this.model.reorientation_gate?.enabled||this.model.locomotor_activation?.enabled||this.model.heading_restoration?.enabled)throw new Error('P3-v1 cannot combine with H2-H5.');
      this.p3Field=p1.paintedTrailApparatusConfig(this.apparatus);
      this.p3DoseRatio=p1.appliedDoseRatio(this.experiment,this.p3Field);
      for(const ant of this.ants)wrapAnt(ant,this);
    }
    summary(){
      const base=super.summary();
      base.provenance=Object.assign({},base.provenance,{
        p3_mechanism:this.p3Config.mechanismId,
        p3_runtime_layer:'src/p3.js extension over frozen canonical integrity runtime using frozen P1 field/apparatus helpers',
        p3_sensor_rule:'deterministic front-left/front-right 90deg sector means; 4x8 equal-area midpoint samples',
        p3_transduction:'W=0 if L+R<=0 else (R-L)/(R+L); epsilon=0',
        p3_response_rng:'none; zero canonical biology RNG draws added',
        p3_applied_dose_ratio:this.p3DoseRatio
      });
      base.p3_diagnostics=this.ants.map(function(a){return{
        ant_id:a.id,steering_samples:a.p3SteeringSamples,last_omega_trail_per_s:a.p3LastOmega,
        last_left_sector_summary:a.p3LastLeftSummary,last_right_sector_summary:a.p3LastRightSummary,
        last_relative_signal:a.p3LastRelativeSignal
      };});
      return base;
    }
    fingerprint(){
      return JSON.stringify({base:super.fingerprint(),p3:{doseRatio:this.p3DoseRatio,ants:this.ants.map(function(a){return[a.id,a.p3SteeringSamples,a.p3LastOmega,a.p3LastRelativeSignal];})}});
    }
  }

  return{assertNoP3Overrides,paintedTrailResponseConfig,sectorSamplePoints,sectorSummaries,relativeSignal,trailSteeringRate,Simulation,FIXED_DT:core.FIXED_DT};
});
