(function(root,factory){
  const core=(typeof module==='object'&&module.exports)?require('./sim-core.js'):root.AntLabCore;
  const integrity=(typeof module==='object'&&module.exports)?require('./integrity.js'):root.AntLabIntegrity;
  const p1=(typeof module==='object'&&module.exports)?require('./p1.js'):root.AntLabP1;
  const api=factory(core,integrity,p1);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.AntLabP4=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(core,integrity,p1){
  'use strict';
  if(!core)throw new Error('ANTLAB P4 requires AntLabCore');
  if(!integrity)throw new Error('ANTLAB P4 requires AntLabIntegrity');
  if(!p1)throw new Error('ANTLAB P4 requires frozen AntLabP1 helpers');

  const P4_FORBIDDEN_KEYS=new Set([
    'painted_trail_response','sigma_field_mm','kappa_trail_per_s','theta_detect','p_lapse',
    'sector_radius_mm','radial_bins','angular_bins_per_sector','epsilon','threshold',
    'sigmoid_slope','hill_exponent','response_rng','stochastic_detection',
    'trail_bearing','trail_distance','trail_centerline','trail_target','trail_heading','trail_direction',
    'response_engaged','pheromone_ignorer'
  ]);

  function assertNoP4Overrides(value,path='experiment'){
    if(!value||typeof value!=='object')return;
    if(Array.isArray(value)){value.forEach(function(v,i){assertNoP4Overrides(v,path+'['+i+']');});return;}
    for(const entry of Object.entries(value)){
      const key=entry[0],child=entry[1];
      if(P4_FORBIDDEN_KEYS.has(key))throw new Error('P4 biology/navigation override forbidden at '+path+'.'+key);
      assertNoP4Overrides(child,path+'.'+key);
    }
  }

  function paintedTrailResponseConfig(model){
    const c=model&&model.painted_trail_response;
    if(!c||c.enabled!==true)return null;
    if(c.mechanism_id!=='P4_local_sector_hard_detection_weber_steering_v1')throw new Error('Unexpected P4 mechanism id.');
    if(c.field?.type!=='gaussian_distance_to_segment')throw new Error('P4 requires gaussian_distance_to_segment field.');
    if(c.sensors?.type!=='deterministic_equal_area_front_quadrant_sector_means')throw new Error('P4 requires deterministic sector sensors.');
    if(c.absolute_detection?.type!=='hard_bilateral_sum_threshold')throw new Error('P4 requires hard bilateral-sum detection.');
    if(c.transduction?.type!=='hard_detection_gated_weber_michelson_right_minus_left')throw new Error('P4 requires detection-gated Weber/Michelson transduction.');
    if(c.steering?.type!=='detection_gated_relative_right_minus_left_heading_drift')throw new Error('P4 requires detection-gated relative steering.');
    const sigma=Number(c.field.sigma_field_mm),kappa=Number(c.steering.kappa_trail_per_s),theta=Number(c.absolute_detection.theta_detect);
    const radius=Number(c.sensors.radius_mm),radialBins=Number(c.sensors.radial_bins),angularBins=Number(c.sensors.angular_bins_per_sector);
    const epsilon=Number(c.transduction.epsilon_or_regularization);
    if(!(sigma>0))throw new Error('P4 sigma_field_mm must be > 0.');
    if(!(kappa>=0))throw new Error('P4 kappa_trail_per_s must be >= 0.');
    if(!(theta>=0))throw new Error('P4 theta_detect must be >= 0.');
    if(!(radius>0))throw new Error('P4 sector radius_mm must be > 0.');
    if(radialBins!==4||angularBins!==8)throw new Error('P4 sector quadrature must be frozen 4x8.');
    if(epsilon!==0)throw new Error('P4 epsilon_or_regularization must be exactly 0.');
    return{sigma,kappa,theta,radius,radialBins,angularBins,samplesPerSector:radialBins*angularBins,mechanismId:c.mechanism_id};
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

  function gatedRelativeSignal(left,right,thetaDetect){
    const L=Math.max(0,Number(left)||0),R=Math.max(0,Number(right)||0),theta=Number(thetaDetect),sum=L+R;
    if(!(theta>=0))throw new Error('P4 theta_detect must be >= 0.');
    if(sum<=theta)return{signal:0,detected:false,sum};
    return{signal:(R-L)/sum,detected:true,sum};
  }

  function trailSteeringRate(x,y,heading,cfg,fieldCfg,doseRatio){
    if(doseRatio===0||cfg.kappa===0)return{omega:0,left:null,right:null,sum:null,signal:null,detected:false,bypass:true};
    const s=sectorSummaries(x,y,heading,cfg,fieldCfg,doseRatio),g=gatedRelativeSignal(s.left,s.right,cfg.theta);
    return{omega:cfg.kappa*g.signal,left:s.left,right:s.right,sum:g.sum,signal:g.signal,detected:g.detected,bypass:false};
  }

  function wrapAnt(ant,sim){
    const baseUpdate=ant.update.bind(ant);
    ant.p4EvaluationSamples=0;
    ant.p4DetectedSamples=0;
    ant.p4SubthresholdSamples=0;
    ant.p4NonzeroSteeringSamples=0;
    ant.p4LastOmega=0;
    ant.p4LastLeftSummary=null;
    ant.p4LastRightSummary=null;
    ant.p4LastSignalSum=null;
    ant.p4LastRelativeSignal=null;
    ant.p4LastDetected=false;
    ant.update=function(dt,coreSim){
      if(!this.finished&&sim.p4DoseRatio!==0&&sim.p4Config.kappa!==0&&p1.movingThisStepWithoutMutation(this,sim.model.movement,dt)){
        const s=trailSteeringRate(this.x,this.y,this.heading,sim.p4Config,sim.p4Field,sim.p4DoseRatio);
        this.p4EvaluationSamples++;
        this.p4LastOmega=s.omega;
        this.p4LastLeftSummary=s.left;
        this.p4LastRightSummary=s.right;
        this.p4LastSignalSum=s.sum;
        this.p4LastRelativeSignal=s.signal;
        this.p4LastDetected=s.detected;
        if(s.detected){
          this.p4DetectedSamples++;
          if(s.omega!==0){
            this.p4NonzeroSteeringSamples++;
            this.heading=core.normalizeAngle(this.heading+s.omega*dt);
          }
        }else{
          this.p4SubthresholdSamples++;
        }
      }
      return baseUpdate(dt,coreSim);
    };
  }

  class Simulation extends integrity.Simulation{
    constructor(bundle,seed=1,workerOverride=null){
      assertNoP4Overrides(bundle&&bundle.experiment,'experiment');
      assertNoP4Overrides(bundle&&bundle.state,'state');
      super(bundle,seed,workerOverride);
      this.p4Config=paintedTrailResponseConfig(this.model);
      if(!this.p4Config)throw new Error('ANTLAB P4 Simulation requires enabled painted_trail_response.');
      if(this.model.directional_persistence?.enabled||this.model.reorientation_gate?.enabled||this.model.locomotor_activation?.enabled||this.model.heading_restoration?.enabled)throw new Error('P4-v1 cannot combine with H2-H5.');
      this.p4Field=p1.paintedTrailApparatusConfig(this.apparatus);
      this.p4DoseRatio=p1.appliedDoseRatio(this.experiment,this.p4Field);
      for(const ant of this.ants)wrapAnt(ant,this);
    }
    summary(){
      const base=super.summary();
      base.provenance=Object.assign({},base.provenance,{
        p4_mechanism:this.p4Config.mechanismId,
        p4_runtime_layer:'src/p4.js extension over frozen canonical integrity runtime using frozen P1 field/apparatus helpers',
        p4_sensor_rule:'deterministic front-left/front-right 90deg sector means; 4x8 equal-area midpoint samples',
        p4_detection_rule:'S=L+R; OFF when S<=theta_detect; ON only when S>theta_detect',
        p4_transduction:'W=0 if L+R<=theta_detect else (R-L)/(R+L); epsilon=0',
        p4_theta_detect:this.p4Config.theta,
        p4_response_rng:'none; zero canonical biology RNG draws added',
        p4_applied_dose_ratio:this.p4DoseRatio
      });
      base.p4_diagnostics=this.ants.map(function(a){return{
        ant_id:a.id,evaluation_samples:a.p4EvaluationSamples,detected_samples:a.p4DetectedSamples,
        subthreshold_samples:a.p4SubthresholdSamples,nonzero_steering_samples:a.p4NonzeroSteeringSamples,
        last_omega_trail_per_s:a.p4LastOmega,last_left_sector_summary:a.p4LastLeftSummary,
        last_right_sector_summary:a.p4LastRightSummary,last_signal_sum:a.p4LastSignalSum,
        last_relative_signal:a.p4LastRelativeSignal,last_detected:a.p4LastDetected
      };});
      return base;
    }
    fingerprint(){
      return JSON.stringify({base:super.fingerprint(),p4:{doseRatio:this.p4DoseRatio,theta:this.p4Config.theta,ants:this.ants.map(function(a){return[a.id,a.p4EvaluationSamples,a.p4DetectedSamples,a.p4SubthresholdSamples,a.p4NonzeroSteeringSamples,a.p4LastOmega,a.p4LastSignalSum,a.p4LastRelativeSignal,a.p4LastDetected];})}});
    }
  }

  return{assertNoP4Overrides,paintedTrailResponseConfig,sectorSamplePoints,sectorSummaries,gatedRelativeSignal,trailSteeringRate,Simulation,FIXED_DT:core.FIXED_DT};
});
