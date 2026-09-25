(() => {
  'use strict';
  const { FIXED_DT } = window.AntLabIntegrity;
  function simulationClassFor(bundle){
    const p4=bundle?.model?.painted_trail_response;
    if(p4?.enabled===true&&p4.mechanism_id==='P4_local_sector_hard_detection_weber_steering_v1'){
      if(!window.AntLabP4?.Simulation)throw new Error('ANTLAB P4 runtime unavailable');
      return window.AntLabP4.Simulation;
    }
    return window.AntLabIntegrity.Simulation;
  }
  const canvas=document.getElementById('labCanvas'),ctx=canvas.getContext('2d');
  const ui={singleModeBtn:document.getElementById('singleModeBtn'),compareModeBtn:document.getElementById('compareModeBtn'),singleModeView:document.getElementById('singleModeView'),compareModeView:document.getElementById('compareModeView'),experiment:document.getElementById('experimentSelect'),seed:document.getElementById('seedInput'),speed:document.getElementById('speedSelect'),play:document.getElementById('playBtn'),step:document.getElementById('stepBtn'),reset:document.getElementById('resetBtn'),status:document.getElementById('runStatus'),trails:document.getElementById('showTrails'),ids:document.getElementById('showIds'),contacts:document.getElementById('showContacts'),simTime:document.getElementById('simTime'),meanSpeed:document.getElementById('meanSpeed'),completed:document.getElementById('completedCount'),outcome:document.getElementById('outcomeValue'),straightness:document.getElementById('straightnessValue'),distance:document.getElementById('distanceValue'),truthDistance:document.getElementById('truthDistanceValue'),modelId:document.getElementById('modelId'),modelHash:document.getElementById('modelHash'),stateId:document.getElementById('stateId'),stateHash:document.getElementById('stateHash'),resolvedStateHash:document.getElementById('resolvedStateHash'),apparatusId:document.getElementById('apparatusId'),observationId:document.getElementById('observationId'),scoringId:document.getElementById('scoringId'),experimentHash:document.getElementById('experimentHash'),calibrationRole:document.getElementById('calibrationRole'),protocolNote:document.getElementById('protocolNote'),explainSummary:document.getElementById('explainSummary'),explainGoal:document.getElementById('explainGoal'),explainWorkers:document.getElementById('explainWorkers'),explainDuration:document.getElementById('explainDuration'),explainLegend:document.getElementById('explainLegend'),explainMetrics:document.getElementById('explainMetrics'),explainNow:document.getElementById('explainNow'),measurementNote:document.getElementById('measurementNote'),inspectorEmpty:document.getElementById('inspectorEmpty'),inspectorData:document.getElementById('inspectorData'),workerId:document.getElementById('workerId'),workerX:document.getElementById('workerX'),workerY:document.getElementById('workerY'),workerHeading:document.getElementById('workerHeading'),workerState:document.getElementById('workerState'),workerBioState:document.getElementById('workerBioState'),workerOutcome:document.getElementById('workerOutcome')};
  const EXPERIMENT_EXPLANATIONS={
    'open_arena_short_control.json':{
      summary:'One simulated ant enters the center of the open arena after a 20 cm constrained approach under a DCM solvent-control condition.',
      goal:'Watch how the baseline locomotion model leaves the center and reaches the arena border after the shorter approach.',
      legend:'White = active ant · green trail = recent path · green ring = entry · blue region = scoring boundary'
    },
    'open_arena_long_control.json':{
      summary:'One simulated ant enters the center of the open arena after a 100 cm constrained approach under the same DCM solvent-control condition.',
      goal:'Compare the baseline locomotion response after the longer approach while keeping the arena and control treatment matched.',
      legend:'White = active ant · green trail = recent path · green ring = entry · blue region = scoring boundary'
    },
    'neutral_y_maze.json':{
      summary:'One simulated ant enters the stem of a symmetric Y-maze with DCM on both arms and no pheromone-marked side.',
      goal:'Watch a neutral branch choice. Across many seeds this engineering control should not systematically prefer left or right.',
      legend:'White = active ant · green trail = recent path · green ring = entry · blue = branch scoring regions'
    },
    'y_maze_p4_left_consistency_v1.json':{
      summary:'One simulated ant enters a Y-maze where the left arm carries the frozen P4 Candidate 307 painted-trail stimulus.',
      goal:'Visualize how the already-frozen P4 mechanism responds when the left arm is marked. This view is descriptive only, not a new biological result.',
      legend:'White = active ant · green trail = recent path · yellow dashed line = painted trail · blue = branch scoring regions'
    },
    'y_maze_p4_right_consistency_v1.json':{
      summary:'One simulated ant enters a Y-maze where the right arm carries the frozen P4 Candidate 307 painted-trail stimulus.',
      goal:'Visualize the same frozen P4 mechanism with the marked side reversed. This view is descriptive only, not a new biological result.',
      legend:'White = active ant · green trail = recent path · yellow dashed line = painted trail · blue = branch scoring regions'
    },
    'y_maze_p4_neutral_consistency_v1.json':{
      summary:'One simulated ant runs through the P4 Y-maze geometry at exact zero dose, so the painted-trail mechanism is present but chemically inactive.',
      goal:'Show the zero-dose identity control for Candidate 307 without introducing an active marked-side signal.',
      legend:'White = active ant · green trail = recent path · green ring = entry · blue = branch scoring regions'
    },
    'straight_bridge.json':{
      summary:'120 simulated ants start near the left end of a 30 cm × 8 cm rectangular bridge and move for 60 simulated seconds.',
      goal:'Watch the basic locomotion model by itself: speed, random turning, brief pauses, and wall reflections, without a maze decision or pheromone treatment.',
      legend:'White = moving worker · blue = finished worker · green lines = recent trajectory tails · green ring = shared entry'
    }
  };
  const METRIC_LABELS={
    central_zone_fraction:'time in center',
    mean_moving_speed:'moving speed',
    total_distance:'distance travelled',
    time_to_arena_edge:'time to arena edge',
    path_straightness:'path straightness',
    exit_coordinate:'exit location',
    branch_choice:'left/right branch choice'
  };
  const cache=new Map();let sim=null,running=false,selectedId=null,lastWallTime=performance.now(),simBudget=0,resetGeneration=0,viewMode='single';
  function setSingleControlsDisabled(disabled){
    [ui.experiment,ui.seed,ui.speed,ui.play,ui.step,ui.reset,ui.trails,ui.ids,ui.contacts].forEach(control=>{
      if(control)control.disabled=disabled;
    });
  }
  function setViewMode(mode){
    const next=mode==='compare'?'compare':'single';
    viewMode=next;
    const compare=next==='compare';
    if(compare){
      running=false;
      simBudget=0;
      ui.play.textContent='Run';
      ui.status.textContent='COMPARE SETUP';
    }else{
      ui.status.textContent=sim?(sim.allFinished()?'COMPLETE':'PAUSED'):'LOADING';
    }
    ui.singleModeView.hidden=compare;
    ui.compareModeView.hidden=!compare;
    ui.singleModeBtn.classList.toggle('active',!compare);
    ui.compareModeBtn.classList.toggle('active',compare);
    ui.singleModeBtn.setAttribute('aria-pressed',String(!compare));
    ui.compareModeBtn.setAttribute('aria-pressed',String(compare));
    setSingleControlsDisabled(compare);
  }
  async function json(path){if(cache.has(path))return cache.get(path);const r=await fetch(path);if(!r.ok)throw new Error(`Could not load ${path}: HTTP ${r.status}`);const v=await r.json();cache.set(path,v);return v;}
  async function loadBundle(filename){const experiment=await json(`./experiments/${filename}`);const [model,apparatus,state,observation,scoring]=await Promise.all([json(`./models/${experiment.model}.json`),json(`./apparatus/${experiment.apparatus}.json`),json(`./states/${experiment.state}.json`),json(`./observations/${experiment.observation}.json`),json(`./scoring/${experiment.scoring}.json`)]);return{experiment,model,apparatus,state,observation,scoring};}
  async function reset(){const generation=++resetGeneration,filename=ui.experiment.value,seed=Number(ui.seed.value)||1;running=false;selectedId=null;simBudget=0;sim=null;ui.play.textContent='Run';ui.status.textContent='LOADING';try{const bundle=await loadBundle(filename);if(generation!==resetGeneration)return;const Simulation=simulationClassFor(bundle);sim=new Simulation(bundle,seed);ui.status.textContent='PAUSED';ui.inspectorData.hidden=true;ui.inspectorEmpty.hidden=false;updateDefinition();updateExplainer();updateMetrics();draw();}catch(err){if(generation!==resetGeneration)return;console.error(err);ui.status.textContent='LOAD ERROR';ui.protocolNote.textContent=err.message;}}
  function frame(now){const wallDt=Math.min(.05,(now-lastWallTime)/1000);lastWallTime=now;if(running&&sim){simBudget+=wallDt*Number(ui.speed.value);let safety=0;while(simBudget>=FIXED_DT&&safety++<5000){sim.step(FIXED_DT);simBudget-=FIXED_DT;const durationReached=sim.time>=sim.experiment.duration_s&&!sim.allFinished();if(sim.allFinished()||durationReached){if(durationReached)sim.runUntilComplete(0);running=false;ui.play.textContent='Run';ui.status.textContent=durationReached?'DURATION':'COMPLETE';break;}}}if(sim){draw();updateMetrics();updateInspector();}requestAnimationFrame(frame);}
  function transform(){const margin=28,w=sim.apparatus.world.width,h=sim.apparatus.world.height,s=Math.min((canvas.width-margin*2)/w,(canvas.height-margin*2)/h);return{s,ox:(canvas.width-w*s)/2,oy:(canvas.height-h*s)/2};}function toCanvas(x,y){const t=transform();return{x:t.ox+x*t.s,y:t.oy+y*t.s};}
  function drawPrimitive(p,fill,stroke){const t=transform();ctx.save();ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=1.2;if(p.type==='rect'){ctx.beginPath();ctx.rect(t.ox+p.x*t.s,t.oy+p.y*t.s,p.width*t.s,p.height*t.s);ctx.fill();ctx.stroke();}else if(p.type==='circle'){const c=toCanvas(p.x,p.y);ctx.beginPath();ctx.arc(c.x,c.y,p.radius*t.s,0,Math.PI*2);ctx.fill();ctx.stroke();}else if(p.type==='corridor'){const a=toCanvas(p.x1,p.y1),b=toCanvas(p.x2,p.y2);ctx.lineCap='round';ctx.lineWidth=p.width*t.s;ctx.strokeStyle=fill;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.lineWidth=1.2;ctx.strokeStyle=stroke;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();}
  function drawExternalFields(){const trail=sim?.apparatus?.external_fields?.painted_trail;if(!trail?.line_segment_mm||!(Number(sim?.p4DoseRatio)>0))return;const s=trail.line_segment_mm,a=toCanvas(s.x1,s.y1),b=toCanvas(s.x2,s.y2);ctx.save();ctx.lineCap='round';ctx.strokeStyle='rgba(250,204,21,.22)';ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.strokeStyle='rgba(250,204,21,.9)';ctx.lineWidth=2;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='rgba(250,204,21,.88)';ctx.font='11px ui-monospace';ctx.fillText('PHEROMONE TRAIL',b.x+8,b.y);ctx.restore();}
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#090b0d';ctx.fillRect(0,0,canvas.width,canvas.height);for(const p of sim.apparatus.geometry.primitives)drawPrimitive(p,'rgba(148,163,184,.10)','rgba(255,255,255,.18)');for(const r of sim.scoringProfile.regions||[])drawPrimitive(r.shape||r,'rgba(96,165,250,.15)','rgba(96,165,250,.60)');drawExternalFields();const e=sim.compiled.entry,c=toCanvas(e.x,e.y);ctx.strokeStyle='rgba(217,249,157,.5)';ctx.beginPath();ctx.arc(c.x,c.y,7,0,Math.PI*2);ctx.stroke();if(ui.trails.checked)for(const ant of sim.ants){if(ant.tail.length<2)continue;ctx.strokeStyle='rgba(217,249,157,.12)';ctx.lineWidth=1;ctx.beginPath();ant.tail.forEach((p,i)=>{const q=toCanvas(p.x,p.y);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)});ctx.stroke();}for(const ant of sim.ants)drawAnt(ant);}
  function drawAnt(ant){const c=toCanvas(ant.x,ant.y),size=3.2;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(ant.heading);ctx.fillStyle=ant.id===selectedId?'#d9f99d':ant.finished?'#60a5fa':'#f5f5f4';ctx.beginPath();ctx.ellipse(0,0,size*1.55,size,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(size*1.7,0,size*.62,0,Math.PI*2);ctx.fill();if(ui.contacts.checked&&ant.contactFlash>0){ctx.strokeStyle='rgba(251,113,133,.9)';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.stroke();}ctx.restore();if(ui.ids.checked){ctx.fillStyle='rgba(255,255,255,.55)';ctx.font='10px ui-monospace';ctx.fillText(String(ant.id),c.x+5,c.y-5);}}
  function updateDefinition(){ui.modelId.textContent=sim.model.id;ui.modelHash.textContent=sim.layerHashes.model_hash;ui.stateId.textContent=sim.stateProfile.id;ui.stateHash.textContent=sim.layerHashes.state_profile_hash;ui.resolvedStateHash.textContent=sim.layerHashes.resolved_state_hash;ui.apparatusId.textContent=sim.integrity.apparatus.id;ui.observationId.textContent=sim.observationProfile.id;ui.scoringId.textContent=sim.scoringProfile.id;ui.experimentHash.textContent=sim.layerHashes.experiment_hash;ui.calibrationRole.textContent=sim.experiment.calibration_role;const p=sim.experiment.protocol,p4=sim.model.painted_trail_response;const p4Note=p4?.enabled===true?` Frozen P4 Candidate 307 visual runtime; marked side: ${p.treatment?.marked_side||'none'}; noncanonical descriptive visualization only.`:'';ui.protocolNote.textContent=`${sim.experiment.title}. Approach: ${p.approach_distance_mm??'n/a'} mm. Treatment: ${p.treatment?.type||'none'}. Observation: ${sim.observationProfile.fps} fps. Scoring: ${sim.scoringProfile.type}.${p4Note}`;}
  function prettyMetricName(name){return METRIC_LABELS[name]||String(name).replace(/_/g,' ');}
  function updateExplainer(){
    if(!sim)return;
    const config=EXPERIMENT_EXPLANATIONS[ui.experiment.value]||{
      summary:`${sim.experiment.title} is running with the currently loaded model and apparatus.`,
      goal:'Watch the assay unfold and inspect the measurements generated by the simulation.',
      legend:'White = active worker · green lines = recent trajectory tails · green ring = entry point'
    };
    const metrics=Array.isArray(sim.experiment.requested_metrics)?sim.experiment.requested_metrics:[];
    ui.explainSummary.textContent=config.summary;
    ui.explainGoal.textContent=config.goal;
    ui.explainWorkers.textContent=`${sim.experiment.workers} worker${sim.experiment.workers===1?'':'s'}`;
    ui.explainDuration.textContent=`${sim.experiment.duration_s} simulated seconds`;
    ui.explainLegend.textContent=config.legend;
    ui.explainMetrics.textContent=metrics.length?metrics.map(prettyMetricName).join(' · '):'No scored output; visual engineering control';
  }
  function updateExplainerNow(summary,observedMeans){
    if(!sim)return;
    const t=`${sim.time.toFixed(1)} s`;
    const outcomes=Object.entries(summary.outcomes||{}).filter(([,n])=>n>0);
    if(outcomes.length){
      ui.explainNow.textContent=`Now • ${t} • ${outcomes.map(([name,n])=>`${name.toUpperCase()}${n>1?` ×${n}`:''}`).join(' · ')}`;
      return;
    }
    const speed=observedMeans&&Number.isFinite(observedMeans.mean_moving_speed_mm_s)?` • mean observed speed ${observedMeans.mean_moving_speed_mm_s.toFixed(1)} mm/s`:'';
    const progress=summary.workers>1?` • ${summary.completed}/${summary.workers} completed`:' • awaiting outcome';
    ui.explainNow.textContent=`Now • ${t}${progress}${speed}`;
  }
  function updateMetrics(){const s=sim.summary(),om=s.observed_metrics?.means||{},truth=s.truth_metrics||{};ui.simTime.textContent=`${sim.time.toFixed(1)} s`;ui.meanSpeed.textContent=Number.isFinite(om.mean_moving_speed_mm_s)?`${om.mean_moving_speed_mm_s.toFixed(1)} mm/s`:'—';ui.completed.textContent=`${s.completed}/${s.workers}`;const outcomes=Object.entries(s.outcomes||{}).filter(([,n])=>n>0);ui.outcome.textContent=outcomes.length?outcomes.map(([name,n])=>`${name.toUpperCase()}${n>1?` ×${n}`:''}`).join(', '):'—';ui.straightness.textContent=Number.isFinite(om.path_straightness)?om.path_straightness.toFixed(3):'—';ui.distance.textContent=Number.isFinite(om.total_distance_mm)?`${om.total_distance_mm.toFixed(1)} mm`:'—';ui.truthDistance.textContent=Number.isFinite(truth.mean_distance_mm)?`${truth.mean_distance_mm.toFixed(1)} mm`:'—';const observed=s.observed_metrics,status=observed?.measurement_status;ui.measurementNote.textContent=status?`Measured from ${observed.fps} fps observations. Movement classifier: ${status.movement_classifier?.status||'unspecified'}. Truth metrics are kept separate.`:'';updateExplainerNow(s,om);}
  function updateInspector(){if(selectedId==null||!sim)return;const a=sim.ants.find(x=>x.id===selectedId);if(!a)return;ui.workerId.textContent=`#${a.id}`;ui.workerX.textContent=`${a.x.toFixed(2)} mm`;ui.workerY.textContent=`${a.y.toFixed(2)} mm`;ui.workerHeading.textContent=`${((((a.heading*180/Math.PI)%360)+360)%360).toFixed(1)}°`;ui.workerState.textContent=a.state;ui.workerBioState.textContent=a.agentState?`${a.agentState.experience}; ${a.agentState.travel_direction}; ${a.agentState.feeding_state}; recent travel ${a.agentState.recent_travel_mm} mm`:'—';ui.workerOutcome.textContent=a.outcome||'—';}
  canvas.addEventListener('click',e=>{if(!sim)return;const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*canvas.width,my=(e.clientY-r.top)/r.height*canvas.height;let best=null,bestD=Infinity;for(const a of sim.ants){const c=toCanvas(a.x,a.y),d=(c.x-mx)**2+(c.y-my)**2;if(d<bestD){bestD=d;best=a;}}if(best&&bestD<18**2){selectedId=best.id;ui.inspectorEmpty.hidden=true;ui.inspectorData.hidden=false;updateInspector();}});
  ui.singleModeBtn.addEventListener('click',()=>setViewMode('single'));ui.compareModeBtn.addEventListener('click',()=>setViewMode('compare'));
  ui.play.addEventListener('click',()=>{if(!sim)return;running=!running;ui.play.textContent=running?'Pause':'Run';ui.status.textContent=running?'RUNNING':'PAUSED';});ui.reset.addEventListener('click',reset);ui.step.addEventListener('click',()=>{if(!sim)return;running=false;ui.play.textContent='Run';const remaining=Math.max(0,sim.experiment.duration_s-sim.time);if(remaining<=1e-9){const alreadyFinished=sim.allFinished();if(!alreadyFinished)sim.runUntilComplete(0);const outcomes=sim.summary().outcomes||{};ui.status.textContent=outcomes.timeout>0?'DURATION':'COMPLETE';updateMetrics();draw();return;}sim.runFor(Math.min(1,remaining),FIXED_DT);const durationReached=sim.time>=sim.experiment.duration_s-1e-9&&!sim.allFinished();if(durationReached)sim.runUntilComplete(0);ui.status.textContent=durationReached?'DURATION':(sim.allFinished()?'COMPLETE':'PAUSED');updateMetrics();draw();});ui.seed.addEventListener('change',reset);ui.experiment.addEventListener('change',reset);setViewMode('single');reset();requestAnimationFrame(frame);
})();
