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
  const ui={singleModeBtn:document.getElementById('singleModeBtn'),compareModeBtn:document.getElementById('compareModeBtn'),singleModeView:document.getElementById('singleModeView'),compareModeView:document.getElementById('compareModeView'),comparePresetSelect:document.getElementById('comparePresetSelect'),comparePresetHelp:document.getElementById('comparePresetHelp'),comparePresetDescription:document.getElementById('comparePresetDescription'),comparePresetBadge:document.getElementById('comparePresetBadge'),compareCanvasA:document.getElementById('compareCanvasA'),compareCanvasB:document.getElementById('compareCanvasB'),comparePlaceholderA:document.getElementById('comparePlaceholderA'),comparePlaceholderB:document.getElementById('comparePlaceholderB'),compareStatusA:document.getElementById('compareStatusA'),compareStatusB:document.getElementById('compareStatusB'),compareTitleA:document.getElementById('compareATitle'),compareTitleB:document.getElementById('compareBTitle'),replaySeedBtn:document.getElementById('replaySeedBtn'),nextSeedBtn:document.getElementById('nextSeedBtn'),compareSeedReadout:document.getElementById('compareSeedReadout'),compareMatchWorker:document.getElementById('compareMatchWorker'),compareMatchDetail:document.getElementById('compareMatchDetail'),compareSpeedA:document.getElementById('compareSpeedA'),compareSpeedB:document.getElementById('compareSpeedB'),compareSpeedDelta:document.getElementById('compareSpeedDelta'),compareDistanceA:document.getElementById('compareDistanceA'),compareDistanceB:document.getElementById('compareDistanceB'),compareDistanceDelta:document.getElementById('compareDistanceDelta'),compareStraightnessA:document.getElementById('compareStraightnessA'),compareStraightnessB:document.getElementById('compareStraightnessB'),compareStraightnessDelta:document.getElementById('compareStraightnessDelta'),compareEdgeTimeA:document.getElementById('compareEdgeTimeA'),compareEdgeTimeB:document.getElementById('compareEdgeTimeB'),compareEdgeTimeDelta:document.getElementById('compareEdgeTimeDelta'),compareCentralA:document.getElementById('compareCentralA'),compareCentralB:document.getElementById('compareCentralB'),compareCentralDelta:document.getElementById('compareCentralDelta'),compareOutcomeA:document.getElementById('compareOutcomeA'),compareOutcomeB:document.getElementById('compareOutcomeB'),compareOutcomeDelta:document.getElementById('compareOutcomeDelta'),compareMetricsNote:document.getElementById('compareMetricsNote'),compareSummaryText:document.getElementById('compareSummaryText'),compareSummaryQualifier:document.getElementById('compareSummaryQualifier'),showCompareOverlay:document.getElementById('showCompareOverlay'),compareOverlayBody:document.getElementById('compareOverlayBody'),compareOverlayCanvas:document.getElementById('compareOverlayCanvas'),compareOverlayNote:document.getElementById('compareOverlayNote'),compareOverlayLabelA:document.getElementById('compareOverlayLabelA'),compareOverlayLabelB:document.getElementById('compareOverlayLabelB'),compareMetricsLabelA:document.getElementById('compareMetricsLabelA'),compareMetricsLabelB:document.getElementById('compareMetricsLabelB'),compareMetricsTitle:document.getElementById('compareMetricsTitle'),compareMetricsModeLabel:document.getElementById('compareMetricsModeLabel'),compareMetricsDeltaLabel:document.getElementById('compareMetricsDeltaLabel'),compareMetricSpeedRow:document.getElementById('compareMetricSpeedRow'),compareMetricDistanceRow:document.getElementById('compareMetricDistanceRow'),compareMetricStraightnessRow:document.getElementById('compareMetricStraightnessRow'),compareMetricEdgeTimeRow:document.getElementById('compareMetricEdgeTimeRow'),compareMetricCentralRow:document.getElementById('compareMetricCentralRow'),compareOutcomeLabel:document.getElementById('compareOutcomeLabel'),compareLegendScoring:document.getElementById('compareLegendScoring'),compareLegendPathA:document.getElementById('compareLegendPathA'),compareLegendPathB:document.getElementById('compareLegendPathB'),compareLegendTrailA:document.getElementById('compareLegendTrailA'),compareLegendTrailB:document.getElementById('compareLegendTrailB'),compareLegendTrailALabel:document.getElementById('compareLegendTrailALabel'),compareLegendTrailBLabel:document.getElementById('compareLegendTrailBLabel'),compareTreatmentDifference:document.getElementById('compareTreatmentDifference'),compareTreatmentA:document.getElementById('compareTreatmentA'),compareTreatmentB:document.getElementById('compareTreatmentB'),comparePaneScoringA:document.getElementById('comparePaneScoringA'),comparePaneScoringB:document.getElementById('comparePaneScoringB'),comparePaneTreatmentA:document.getElementById('comparePaneTreatmentA'),comparePaneTreatmentB:document.getElementById('comparePaneTreatmentB'),compareOverlayScoringLabel:document.getElementById('compareOverlayScoringLabel'),compareOverlayTrailA:document.getElementById('compareOverlayTrailA'),compareOverlayTrailB:document.getElementById('compareOverlayTrailB'),compareOverlayTrailALabel:document.getElementById('compareOverlayTrailALabel'),compareOverlayTrailBLabel:document.getElementById('compareOverlayTrailBLabel'),experiment:document.getElementById('experimentSelect'),seed:document.getElementById('seedInput'),speed:document.getElementById('speedSelect'),play:document.getElementById('playBtn'),step:document.getElementById('stepBtn'),reset:document.getElementById('resetBtn'),status:document.getElementById('runStatus'),trails:document.getElementById('showTrails'),ids:document.getElementById('showIds'),contacts:document.getElementById('showContacts'),simTime:document.getElementById('simTime'),meanSpeed:document.getElementById('meanSpeed'),completed:document.getElementById('completedCount'),outcome:document.getElementById('outcomeValue'),straightness:document.getElementById('straightnessValue'),distance:document.getElementById('distanceValue'),truthDistance:document.getElementById('truthDistanceValue'),modelId:document.getElementById('modelId'),modelHash:document.getElementById('modelHash'),stateId:document.getElementById('stateId'),stateHash:document.getElementById('stateHash'),resolvedStateHash:document.getElementById('resolvedStateHash'),apparatusId:document.getElementById('apparatusId'),observationId:document.getElementById('observationId'),scoringId:document.getElementById('scoringId'),experimentHash:document.getElementById('experimentHash'),calibrationRole:document.getElementById('calibrationRole'),protocolNote:document.getElementById('protocolNote'),explainSummary:document.getElementById('explainSummary'),explainGoal:document.getElementById('explainGoal'),explainWorkers:document.getElementById('explainWorkers'),explainDuration:document.getElementById('explainDuration'),explainLegend:document.getElementById('explainLegend'),explainMetrics:document.getElementById('explainMetrics'),explainNow:document.getElementById('explainNow'),measurementNote:document.getElementById('measurementNote'),inspectorEmpty:document.getElementById('inspectorEmpty'),inspectorData:document.getElementById('inspectorData'),workerId:document.getElementById('workerId'),workerX:document.getElementById('workerX'),workerY:document.getElementById('workerY'),workerHeading:document.getElementById('workerHeading'),workerState:document.getElementById('workerState'),workerBioState:document.getElementById('workerBioState'),workerOutcome:document.getElementById('workerOutcome')};
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
  const COMPARE_PRESETS={
    'open-arena-20-vs-100':{
      id:'open-arena-20-vs-100',label:'Open arena · 20 cm vs 100 cm',badge:'20 CM ↔ 100 CM',
      description:'Matched-seed comparison of the 20 cm and 100 cm open-arena control approaches.',
      fileA:'open_arena_short_control.json',fileB:'open_arena_long_control.json',
      labelA:'20 cm',labelB:'100 cm',readyStatus:'20 cm VS 100 cm',metricMode:'numeric',legendScoring:'Arena-edge scoring region',difference:'Constrained approach distance before arena entry',treatmentA:'20 cm approach · DCM control',treatmentB:'100 cm approach · DCM control',enabled:true
    },
    'p4-marked-vs-zero':{
      id:'p4-marked-vs-zero',label:'P4 · marked vs zero-dose',badge:'P4 MARKED ↔ ZERO',
      description:'Frozen Candidate 307 marked-arm comparison against the exact zero-dose neutral identity control.',
      fileA:'y_maze_p4_left_consistency_v1.json',fileB:'y_maze_p4_neutral_consistency_v1.json',
      labelA:'P4 marked',labelB:'Zero-dose',readyStatus:'P4 MARKED VS ZERO-DOSE',metricMode:'branch-choice',legendScoring:'Left/right branch scoring regions',difference:'P4 painted-trail dose',treatmentA:'Left arm marked · 0.0048 hindgut eq/cm',treatmentB:'Exact zero-dose identity control',trailA:'Left-arm P4 marked trail',trailB:null,p4Diagnostic:true,enabled:true
    },
    'p4-left-vs-right':{
      id:'p4-left-vs-right',label:'P4 · left-marked vs right-marked',badge:'P4 LEFT ↔ RIGHT',
      description:'Frozen Candidate 307 comparison with the marked arm mirrored from left to right.',
      fileA:'y_maze_p4_left_consistency_v1.json',fileB:'y_maze_p4_right_consistency_v1.json',
      labelA:'P4 left-marked',labelB:'P4 right-marked',readyStatus:'P4 LEFT VS RIGHT',metricMode:'branch-choice',legendScoring:'Left/right branch scoring regions',difference:'Which Y-maze arm carries the same frozen P4 dose',treatmentA:'Left arm marked · 0.0048 hindgut eq/cm',treatmentB:'Right arm marked · 0.0048 hindgut eq/cm',trailA:'Left-arm P4 marked trail',trailB:'Right-arm P4 marked trail',p4Diagnostic:true,enabled:true
    }
  };
  const DEFAULT_COMPARE_PRESET_ID='open-arena-20-vs-100';
  const cache=new Map();let sim=null,running=false,selectedId=null,lastWallTime=performance.now(),simBudget=0,resetGeneration=0,viewMode='single';const comparePair={a:null,b:null,generation:0,clock:0,seed:null,selectedId:null,presetId:null};const comparePaths={a:new Map(),b:new Map(),nextSample:.25,loading:false};
  function selectedComparePreset(){
    const requested=COMPARE_PRESETS[ui.comparePresetSelect?.value];
    if(requested?.enabled)return requested;
    if(ui.comparePresetSelect)ui.comparePresetSelect.value=DEFAULT_COMPARE_PRESET_ID;
    return COMPARE_PRESETS[DEFAULT_COMPARE_PRESET_ID];
  }
  function currentComparePreset(){
    return COMPARE_PRESETS[comparePair.presetId]||selectedComparePreset();
  }
  function applyComparePresetUi(preset){
    const branchChoice=preset.metricMode==='branch-choice';
    ui.comparePresetDescription.textContent=preset.description;
    ui.comparePresetBadge.textContent=preset.badge;
    ui.compareMetricsLabelA.textContent=`${preset.labelA} · A`;
    ui.compareMetricsLabelB.textContent=`${preset.labelB} · B`;
    ui.compareOverlayLabelA.textContent=`${preset.labelA} · A`;
    ui.compareOverlayLabelB.textContent=`${preset.labelB} · B`;
    ui.compareLegendPathA.textContent=`A path · ${preset.labelA}`;
    ui.compareLegendPathB.textContent=`B path · ${preset.labelB}`;
    ui.compareLegendScoring.textContent=preset.legendScoring;
    ui.comparePaneScoringA.textContent=preset.legendScoring;
    ui.comparePaneScoringB.textContent=preset.legendScoring;
    ui.compareOverlayScoringLabel.textContent=preset.legendScoring;
    ui.compareTreatmentDifference.textContent=preset.difference;
    ui.compareTreatmentA.textContent=preset.treatmentA;
    ui.compareTreatmentB.textContent=preset.treatmentB;
    ui.comparePaneTreatmentA.textContent=preset.treatmentA;
    ui.comparePaneTreatmentB.textContent=preset.treatmentB;
    const trailA=Boolean(preset.trailA),trailB=Boolean(preset.trailB);
    ui.compareLegendTrailA.hidden=!trailA;ui.compareOverlayTrailA.hidden=!trailA;
    ui.compareLegendTrailB.hidden=!trailB;ui.compareOverlayTrailB.hidden=!trailB;
    if(trailA){ui.compareLegendTrailALabel.textContent=`A trail · ${preset.trailA}`;ui.compareOverlayTrailALabel.textContent=`A · ${preset.trailA}`;}
    if(trailB){ui.compareLegendTrailBLabel.textContent=`B trail · ${preset.trailB}`;ui.compareOverlayTrailBLabel.textContent=`B · ${preset.trailB}`;}
    ui.compareMetricsTitle.textContent=branchChoice?'Observed branch choice':'Observed metrics';
    ui.compareMetricsModeLabel.textContent=branchChoice?'A ↔ B':'B − A';
    ui.compareMetricsDeltaLabel.textContent=branchChoice?'Relation':'Δ';
    ui.compareOutcomeLabel.textContent=branchChoice?'Branch choice':'Outcome';
    for(const row of [ui.compareMetricSpeedRow,ui.compareMetricDistanceRow,ui.compareMetricStraightnessRow,ui.compareMetricEdgeTimeRow,ui.compareMetricCentralRow])row.hidden=branchChoice;
    ui.comparePresetHelp.textContent=!preset.enabled?`Preset unlocks in step ${preset.unlockStep}.`:preset.p4Diagnostic?'Active preset · frozen P4 diagnostic only; official biological execution remains unauthorized.':'Active preset · all Compare presets are available.';
  }
  function initializeComparePresets(){
    ui.comparePresetSelect.replaceChildren();
    for(const preset of Object.values(COMPARE_PRESETS)){
      const option=document.createElement('option');
      option.value=preset.id;
      option.textContent=preset.enabled?preset.label:`${preset.label} — step ${preset.unlockStep}`;
      option.disabled=!preset.enabled;
      ui.comparePresetSelect.appendChild(option);
    }
    ui.comparePresetSelect.value=DEFAULT_COMPARE_PRESET_ID;
    applyComparePresetUi(COMPARE_PRESETS[DEFAULT_COMPARE_PRESET_ID]);
  }
  function drawCompareCanvasPlaceholder(canvas,label){
    if(!canvas)return;
    const c=canvas.getContext('2d');
    const w=canvas.width,h=canvas.height;
    c.clearRect(0,0,w,h);
    c.fillStyle='#090b0d';
    c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(148,163,184,.08)';
    c.lineWidth=1;
    const step=48;
    for(let x=step;x<w;x+=step){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
    for(let y=step;y<h;y+=step){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
    c.strokeStyle='rgba(217,249,157,.16)';
    c.setLineDash([8,8]);
    c.strokeRect(28,28,w-56,h-56);
    c.setLineDash([]);
    c.fillStyle='rgba(217,249,157,.72)';
    c.font='700 18px ui-monospace, monospace';
    c.textAlign='center';
    c.fillText(label,w/2,h/2-8);
    c.fillStyle='rgba(142,153,164,.72)';
    c.font='13px ui-monospace, monospace';
    c.fillText('simulation hookup arrives in step 3',w/2,h/2+18);
  }
  function initializeCompareCanvases(){
    drawCompareCanvasPlaceholder(ui.compareCanvasA,'CONDITION A');
    drawCompareCanvasPlaceholder(ui.compareCanvasB,'CONDITION B');
  }
  function compareTransform(canvas,targetSim){
    const margin=20,w=targetSim.apparatus.world.width,h=targetSim.apparatus.world.height,s=Math.min((canvas.width-margin*2)/w,(canvas.height-margin*2)/h);
    return{s,ox:(canvas.width-w*s)/2,oy:(canvas.height-h*s)/2};
  }
  function comparePoint(canvas,targetSim,x,y){const t=compareTransform(canvas,targetSim);return{x:t.ox+x*t.s,y:t.oy+y*t.s};}
  function drawComparePrimitive(c,canvas,targetSim,p,fill,stroke){
    const t=compareTransform(canvas,targetSim);c.save();c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=1;
    if(p.type==='rect'){c.beginPath();c.rect(t.ox+p.x*t.s,t.oy+p.y*t.s,p.width*t.s,p.height*t.s);c.fill();c.stroke();}
    else if(p.type==='circle'){const q=comparePoint(canvas,targetSim,p.x,p.y);c.beginPath();c.arc(q.x,q.y,p.radius*t.s,0,Math.PI*2);c.fill();c.stroke();}
    else if(p.type==='corridor'){const a=comparePoint(canvas,targetSim,p.x1,p.y1),b=comparePoint(canvas,targetSim,p.x2,p.y2);c.lineCap='round';c.lineWidth=p.width*t.s;c.strokeStyle=fill;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.lineWidth=1;c.strokeStyle=stroke;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
    c.restore();
  }
  function matchedCompareWorkerIds(){
    if(!comparePair.a||!comparePair.b)return[];
    const idsB=new Set(comparePair.b.ants.map(ant=>String(ant.id)));
    return comparePair.a.ants.map(ant=>ant.id).filter(id=>idsB.has(String(id)));
  }
  function updateCompareMatchDisplay(){
    const ids=matchedCompareWorkerIds();
    if(!ids.length){
      ui.compareMatchWorker.textContent='No shared worker ID';
      ui.compareMatchDetail.textContent='The pair cannot be linked visually until both sides expose the same worker ID.';
      return;
    }
    if(comparePair.selectedId==null||!ids.some(id=>String(id)===String(comparePair.selectedId)))comparePair.selectedId=ids[0];
    const id=comparePair.selectedId;
    ui.compareMatchWorker.textContent=`Worker W${id} ↔ Worker W${id}`;
    ui.compareMatchDetail.textContent=`Seed ${comparePair.seed} · paired by seed + worker ID · A ${comparePair.a.time.toFixed(1)} s · B ${comparePair.b.time.toFixed(1)} s`;
  }
  function drawCompareExternalField(c,canvas,targetSim,{stroke='rgba(250,204,21,.92)',halo='rgba(250,204,21,.20)',label=null,dashed=true}={}){
    const trail=targetSim?.apparatus?.external_fields?.painted_trail;
    if(!trail?.line_segment_mm||!(Number(targetSim?.p4DoseRatio)>0))return false;
    const segment=trail.line_segment_mm,a=comparePoint(canvas,targetSim,segment.x1,segment.y1),b=comparePoint(canvas,targetSim,segment.x2,segment.y2);
    const side=targetSim?.experiment?.protocol?.treatment?.marked_side,trailLabel=label||(side?`P4 ${String(side).toUpperCase()} TRAIL`:'P4 MARKED TRAIL');
    c.save();c.lineCap='round';c.strokeStyle=halo;c.lineWidth=9;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
    c.strokeStyle=stroke;c.lineWidth=2;c.setLineDash(dashed?[7,5]:[]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.setLineDash([]);
    c.fillStyle=stroke;c.font='700 10px ui-monospace, monospace';c.fillText(trailLabel,b.x+7,b.y);c.restore();return true;
  }
  function compareOverlayCoordinateSystemCompatible(a,b){
    if(!a?.apparatus||!b?.apparatus)return false;
    const frame=apparatus=>({world:apparatus.world,geometry:apparatus.geometry,boundary:apparatus.boundary,entry_points:apparatus.entry_points,terminal_regions:apparatus.terminal_regions});
    return JSON.stringify(frame(a.apparatus))===JSON.stringify(frame(b.apparatus));
  }
  function drawCompareSimulation(canvas,targetSim){
    if(!canvas||!targetSim)return;
    const c=canvas.getContext('2d'),matchedIds=new Set(matchedCompareWorkerIds().map(String));c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#090b0d';c.fillRect(0,0,canvas.width,canvas.height);
    for(const p of targetSim.apparatus.geometry.primitives)drawComparePrimitive(c,canvas,targetSim,p,'rgba(148,163,184,.10)','rgba(255,255,255,.18)');
    for(const r of targetSim.scoringProfile.regions||[])drawComparePrimitive(c,canvas,targetSim,r.shape||r,'rgba(96,165,250,.15)','rgba(96,165,250,.60)');
    drawCompareExternalField(c,canvas,targetSim);
    const e=targetSim.compiled.entry,q=comparePoint(canvas,targetSim,e.x,e.y);c.strokeStyle='rgba(217,249,157,.55)';c.beginPath();c.arc(q.x,q.y,6,0,Math.PI*2);c.stroke();
    for(const ant of targetSim.ants){
      const p=comparePoint(canvas,targetSim,ant.x,ant.y),matched=matchedIds.has(String(ant.id)),selected=matched&&String(ant.id)===String(comparePair.selectedId);
      c.save();c.translate(p.x,p.y);
      if(matched){c.strokeStyle=selected?'#d9f99d':'rgba(217,249,157,.55)';c.lineWidth=selected?3:1.5;c.setLineDash(selected?[]:[3,3]);c.beginPath();c.arc(0,0,selected?10:9,0,Math.PI*2);c.stroke();c.setLineDash([]);}
      c.rotate(ant.heading);c.fillStyle=ant.finished?'#60a5fa':'#f5f5f4';c.beginPath();c.ellipse(0,0,4.5,2.8,0,0,Math.PI*2);c.fill();c.beginPath();c.arc(5,0,1.8,0,Math.PI*2);c.fill();c.restore();
      if(matched){c.save();c.fillStyle='#d9f99d';c.font=selected?'800 11px ui-monospace, monospace':'700 10px ui-monospace, monospace';c.textAlign='center';c.fillText(`${selected?'MATCH ':''}W${ant.id}`,p.x,p.y-14);c.restore();}
    }
  }
  function selectCompareWorkerFromCanvas(canvas,targetSim,event){
    if(!canvas||!targetSim)return;
    const r=canvas.getBoundingClientRect(),mx=(event.clientX-r.left)/r.width*canvas.width,my=(event.clientY-r.top)/r.height*canvas.height;
    let best=null,bestD=Infinity;
    for(const ant of targetSim.ants){const p=comparePoint(canvas,targetSim,ant.x,ant.y),d=(p.x-mx)**2+(p.y-my)**2;if(d<bestD){bestD=d;best=ant;}}
    if(best&&bestD<22**2&&matchedCompareWorkerIds().some(id=>String(id)===String(best.id))){comparePair.selectedId=best.id;renderComparePair();}
  }
  const COMPARE_PATH_SAMPLE_S=.25;
  function comparePathPush(pathMap,id,ant,time){
    if(!ant)return;
    const key=String(id),path=pathMap.get(key)||[],last=path[path.length-1];
    if(!last||Math.hypot(ant.x-last.x,ant.y-last.y)>1e-9)path.push({x:ant.x,y:ant.y,time});
    pathMap.set(key,path);
  }
  function recordCompareTrajectoryPoints(force=false){
    if(!comparePair.a||!comparePair.b)return;
    if(!force&&comparePair.clock+1e-9<comparePaths.nextSample)return;
    for(const id of matchedCompareWorkerIds()){
      const antA=comparePair.a.ants.find(ant=>String(ant.id)===String(id));
      const antB=comparePair.b.ants.find(ant=>String(ant.id)===String(id));
      comparePathPush(comparePaths.a,id,antA,comparePair.a.time);
      comparePathPush(comparePaths.b,id,antB,comparePair.b.time);
    }
    while(comparePaths.nextSample<=comparePair.clock+1e-9)comparePaths.nextSample+=COMPARE_PATH_SAMPLE_S;
  }
  function resetCompareTrajectoryHistory(){
    comparePaths.a=new Map();comparePaths.b=new Map();comparePaths.nextSample=COMPARE_PATH_SAMPLE_S;
    recordCompareTrajectoryPoints(true);
  }
  function drawCompareOverlayMessage(message){
    const canvas=ui.compareOverlayCanvas,c=canvas.getContext('2d');
    c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#090b0d';c.fillRect(0,0,canvas.width,canvas.height);
    c.fillStyle='#6f7b85';c.font='13px ui-monospace, monospace';c.textAlign='center';c.fillText(message,canvas.width/2,canvas.height/2);
  }
  function drawCompareOverlayPath(c,canvas,targetSim,path,{stroke,dashed=false,width=2.5}){
    if(!path||path.length<2)return;
    c.save();c.strokeStyle=stroke;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.setLineDash(dashed?[8,6]:[]);
    c.beginPath();
    path.forEach((point,index)=>{const p=comparePoint(canvas,targetSim,point.x,point.y);if(index===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);});
    c.stroke();c.restore();
  }
  function drawCompareTrajectoryOverlay(){
    const visible=Boolean(ui.showCompareOverlay?.checked);
    ui.compareOverlayBody.hidden=!visible;
    if(!visible)return;
    if(comparePaths.loading){drawCompareOverlayMessage('Loading matched trajectories…');return;}
    if(!comparePair.a||!comparePair.b){drawCompareOverlayMessage('Matched trajectory data will appear here.');return;}
    if(!compareOverlayCoordinateSystemCompatible(comparePair.a,comparePair.b)){
      drawCompareOverlayMessage('Overlay unavailable: the paired coordinate systems differ.');
      ui.compareOverlayNote.textContent='Display-only overlay requires matching world, geometry, boundary, entry, and terminal coordinates on both sides.';
      return;
    }
    const canvas=ui.compareOverlayCanvas,c=canvas.getContext('2d'),simA=comparePair.a;
    c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#090b0d';c.fillRect(0,0,canvas.width,canvas.height);
    for(const primitive of simA.apparatus.geometry.primitives)drawComparePrimitive(c,canvas,simA,primitive,'rgba(148,163,184,.08)','rgba(255,255,255,.15)');
    for(const region of simA.scoringProfile.regions||[])drawComparePrimitive(c,canvas,simA,region.shape||region,'rgba(96,165,250,.08)','rgba(96,165,250,.34)');
    const trailA=drawCompareExternalField(c,canvas,simA,{stroke:'rgba(250,204,21,.95)',halo:'rgba(250,204,21,.17)',label:'A · MARKED TRAIL'});
    const trailB=drawCompareExternalField(c,canvas,comparePair.b,{stroke:'rgba(251,146,60,.95)',halo:'rgba(251,146,60,.15)',label:'B · MARKED TRAIL'});
    const id=comparePair.selectedId??matchedCompareWorkerIds()[0],key=String(id),pathA=comparePaths.a.get(key)||[],pathB=comparePaths.b.get(key)||[];
    drawCompareOverlayPath(c,canvas,simA,pathA,{stroke:'#d9f99d',width:4});
    drawCompareOverlayPath(c,canvas,simA,pathB,{stroke:'#60a5fa',dashed:true,width:2.5});
    const start=pathA[0]||pathB[0];
    if(start){const p=comparePoint(canvas,simA,start.x,start.y);c.fillStyle='#090b0d';c.strokeStyle='#f5f5f4';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,5,0,Math.PI*2);c.fill();c.stroke();}
    for(const [path,color] of [[pathA,'#d9f99d'],[pathB,'#60a5fa']]){const end=path[path.length-1];if(end){const p=comparePoint(canvas,simA,end.x,end.y);c.fillStyle=color;c.beginPath();c.arc(p.x,p.y,4,0,Math.PI*2);c.fill();}}
    ui.compareOverlayNote.textContent=`Worker W${id} · seed ${comparePair.seed} · display-only path history sampled about every 0.25 s · A ${pathA.length} points · B ${pathB.length} points · active marked trails ${Number(trailA)+Number(trailB)} · not a new measurement endpoint.`;
  }
  function toggleCompareTrajectoryOverlay(){drawCompareTrajectoryOverlay();}
  function normalizeCompareSeed(value){
    const seed=Math.trunc(Number(value));
    return Number.isSafeInteger(seed)&&seed>=1?seed:1;
  }
  async function resetComparePair(){
    const preset=selectedComparePreset(),generation=++comparePair.generation,seed=normalizeCompareSeed(ui.seed.value);
    ui.seed.value=String(seed);
    running=false;simBudget=0;comparePair.clock=0;comparePair.seed=seed;comparePair.selectedId=null;comparePair.presetId=preset.id;ui.play.textContent='Run';
    applyComparePresetUi(preset);
    comparePaths.a=new Map();comparePaths.b=new Map();comparePaths.nextSample=COMPARE_PATH_SAMPLE_S;comparePaths.loading=true;
    ui.compareSeedReadout.textContent=`Seed ${seed} · matched A/B`;
    drawCompareTrajectoryOverlay();
    ui.compareStatusA.textContent='LOADING';ui.compareStatusB.textContent='LOADING';
    ui.comparePlaceholderA.hidden=false;ui.comparePlaceholderB.hidden=false;
    try{
      const [bundleA,bundleB]=await Promise.all([
        loadBundle(preset.fileA),
        loadBundle(preset.fileB)
      ]);
      if(generation!==comparePair.generation||viewMode!=='compare')return;
      const SimulationA=simulationClassFor(bundleA),SimulationB=simulationClassFor(bundleB);
      comparePair.a=new SimulationA(bundleA,seed);
      comparePair.b=new SimulationB(bundleB,seed);
      ui.compareTitleA.textContent=comparePair.a.experiment.title;
      ui.compareTitleB.textContent=comparePair.b.experiment.title;
      ui.compareStatusA.textContent=`${preset.labelA} · seed ${seed} · MATCHED`;
      ui.compareStatusB.textContent=`${preset.labelB} · seed ${seed} · MATCHED`;
      ui.comparePlaceholderA.hidden=true;ui.comparePlaceholderB.hidden=true;
      updateCompareMatchDisplay();resetCompareTrajectoryHistory();comparePaths.loading=false;
      renderComparePair();
      ui.status.textContent=`${preset.readyStatus} READY`;
    }catch(err){
      if(generation!==comparePair.generation)return;
      console.error(err);comparePaths.loading=false;ui.compareStatusA.textContent='LOAD ERROR';ui.compareStatusB.textContent='LOAD ERROR';ui.status.textContent='COMPARE ERROR';drawCompareTrajectoryOverlay();
    }
  }
  function replaySameCompareSeed(){
    if(viewMode!=='compare')return;
    const seed=normalizeCompareSeed(comparePair.seed??ui.seed.value);
    ui.seed.value=String(seed);
    resetComparePair();
  }
  function nextCompareSeed(){
    if(viewMode!=='compare')return;
    const seed=normalizeCompareSeed(comparePair.seed??ui.seed.value);
    const next=seed>=Number.MAX_SAFE_INTEGER?1:seed+1;
    ui.seed.value=String(next);
    resetComparePair();
  }
  function compareSimActive(targetSim){
    return Boolean(targetSim)&&!targetSim.allFinished()&&targetSim.time<targetSim.experiment.duration_s-1e-9;
  }
  function finalizeCompareDuration(targetSim){
    if(targetSim&&targetSim.time>=targetSim.experiment.duration_s-1e-9&&!targetSim.allFinished())targetSim.runUntilComplete(0);
  }
  function advanceCompareFixedStep(){
    const {a,b}=comparePair;
    if(!a||!b)return true;
    const activeA=compareSimActive(a),activeB=compareSimActive(b);
    if(!activeA&&!activeB)return true;
    if(activeA)a.step(FIXED_DT);
    if(activeB)b.step(FIXED_DT);
    comparePair.clock+=FIXED_DT;
    finalizeCompareDuration(a);finalizeCompareDuration(b);
    const done=!compareSimActive(a)&&!compareSimActive(b);
    recordCompareTrajectoryPoints(done);
    return done;
  }
  function updateComparePlaybackStatus(){
    if(!comparePair.a||!comparePair.b)return;
    const preset=currentComparePreset(),stateFor=s=>s.allFinished()?'COMPLETE':(s.time>=s.experiment.duration_s-1e-9?'DURATION':(running?'RUNNING':'PAUSED'));
    ui.compareStatusA.textContent=`${preset.labelA} · ${comparePair.a.time.toFixed(1)} s · ${stateFor(comparePair.a)}`;
    ui.compareStatusB.textContent=`${preset.labelB} · ${comparePair.b.time.toFixed(1)} s · ${stateFor(comparePair.b)}`;
  }
  function compareObservedSnapshot(targetSim){
    const summary=targetSim.summary(),means=summary.observed_metrics?.means||{},observedRows=summary.observed_metrics?.ants||[];
    const outcomes=Object.entries(summary.outcomes||{}).filter(([,n])=>n>0);
    const choices=observedRows.map(row=>row.branch_choice).filter(Boolean);
    return{
      summary,
      speed:means.mean_moving_speed_mm_s,
      distance:means.total_distance_mm,
      straightness:means.path_straightness,
      edgeTime:means.time_to_arena_edge_s,
      central:means.central_zone_fraction,
      branchChoice:choices.length?choices.map(choice=>String(choice).toUpperCase()).join(', '):'—',
      outcome:outcomes.length?outcomes.map(([name,n])=>`${name.toUpperCase()}${n>1?` ×${n}`:''}`).join(', '):'—'
    };
  }
  function formatCompareValue(value,{digits=1,unit=''}={}){
    return Number.isFinite(value)?`${value.toFixed(digits)}${unit}`:'—';
  }
  function formatCompareDelta(a,b,{digits=1,unit=''}={}){
    if(!Number.isFinite(a)||!Number.isFinite(b))return'—';
    const delta=b-a,epsilon=10**(-digits)/2;
    const normalized=Math.abs(delta)<epsilon?0:delta;
    return`${normalized>0?'+':''}${normalized.toFixed(digits)}${unit}`;
  }
  function compareDifferenceClause(a,b,{digits,unit,positive,negative}){
    if(!Number.isFinite(a)||!Number.isFinite(b))return null;
    const delta=b-a,threshold=10**(-digits)/2;
    if(Math.abs(delta)<threshold)return null;
    const amount=Math.abs(delta).toFixed(digits);
    return`${amount}${unit} ${delta>0?positive:negative}`;
  }
  function buildBranchChoiceSummary(a,b,preset){
    const started=Math.max(comparePair.a?.time||0,comparePair.b?.time||0)>1e-9,aChoice=a.branchChoice,bChoice=b.branchChoice;
    if(!started)return`The matched pair is ready. Start the run to compare ${preset.labelA} and ${preset.labelB} branch choices.`;
    if(aChoice==='—'&&bChoice==='—')return'Neither condition has reached an observed scored branch yet for this simulated seed.';
    if(aChoice!=='—'&&bChoice==='—')return`So far for this simulated seed, ${preset.labelA} chose ${aChoice}; ${preset.labelB} has not reached an observed scored branch yet.`;
    if(aChoice==='—'&&bChoice!=='—')return`So far for this simulated seed, ${preset.labelB} chose ${bChoice}; ${preset.labelA} has not reached an observed scored branch yet.`;
    if(aChoice===bChoice)return`For this simulated seed, both ${preset.labelA} and ${preset.labelB} chose ${aChoice}.`;
    return`For this simulated seed, ${preset.labelA} chose ${aChoice} while ${preset.labelB} chose ${bChoice}.`;
  }
  function buildCompareSummary(a,b){
    const preset=currentComparePreset();
    if(preset.metricMode==='branch-choice')return buildBranchChoiceSummary(a,b,preset);
    const started=Math.max(comparePair.a?.time||0,comparePair.b?.time||0)>1e-9;
    if(!started)return`The matched pair is ready. Start the run to compare ${preset.labelA} and ${preset.labelB}.`;
    const clauses=[];
    const edge=compareDifferenceClause(a.edgeTime,b.edgeTime,{digits:2,unit:' s',positive:'later',negative:'sooner'});
    if(edge)clauses.push(`reached the arena edge ${edge}`);
    const distance=compareDifferenceClause(a.distance,b.distance,{digits:1,unit:' mm',positive:'farther',negative:'less far'});
    if(distance)clauses.push(`traveled ${distance}`);
    const straightness=compareDifferenceClause(a.straightness,b.straightness,{digits:3,unit:'',positive:'higher in path straightness',negative:'lower in path straightness'});
    if(straightness)clauses.push(`was ${straightness}`);
    const speed=compareDifferenceClause(a.speed,b.speed,{digits:1,unit:' mm/s',positive:'higher in mean moving speed',negative:'lower in mean moving speed'});
    if(speed)clauses.push(`was ${speed}`);
    const central=compareDifferenceClause(a.central,b.central,{digits:3,unit:'',positive:'higher in central-zone fraction',negative:'lower in central-zone fraction'});
    if(central)clauses.push(`was ${central}`);
    const finished=(comparePair.a?.allFinished()||comparePair.a?.time>=comparePair.a?.experiment.duration_s-1e-9)&&(comparePair.b?.allFinished()||comparePair.b?.time>=comparePair.b?.experiment.duration_s-1e-9);
    const prefix=finished?`For this completed simulated seed, the ${preset.labelB} condition`:`So far for this simulated seed, the ${preset.labelB} condition`;
    if(!clauses.length){
      const comparable=[a.speed,a.distance,a.straightness,a.edgeTime,a.central].some(Number.isFinite);
      return comparable?`${prefix} has no displayed difference from the ${preset.labelA} condition at the current metric precision.`:'Observed differences are not available yet for this matched seed.';
    }
    const selected=clauses.slice(0,3);
    const joined=selected.length===1?selected[0]:selected.length===2?`${selected[0]} and ${selected[1]}`:`${selected[0]}, ${selected[1]}, and ${selected[2]}`;
    return`${prefix} ${joined} than the ${preset.labelA} condition.`;
  }
  function updateCompareSummary(a,b){
    ui.compareSummaryText.textContent=buildCompareSummary(a,b);
    const preset=currentComparePreset();
    ui.compareSummaryQualifier.textContent=preset.p4Diagnostic?'Frozen Candidate 307 simulated diagnostic only; official biological execution remains unauthorized. No new fit, calibration, validation, or causal claim.':'Descriptive output from the current simulation and observed measurement pipeline; not biological validation or causal evidence.';
  }
  function updateCompareMetrics(){
    if(!comparePair.a||!comparePair.b)return;
    const preset=currentComparePreset(),a=compareObservedSnapshot(comparePair.a),b=compareObservedSnapshot(comparePair.b);
    if(preset.metricMode==='branch-choice'){
      ui.compareOutcomeA.textContent=a.branchChoice;
      ui.compareOutcomeB.textContent=b.branchChoice;
      ui.compareOutcomeDelta.textContent=a.branchChoice==='—'||b.branchChoice==='—'?'—':(a.branchChoice===b.branchChoice?'same':'different');
      const fpsA=a.summary.observed_metrics?.fps,fpsB=b.summary.observed_metrics?.fps;
      ui.compareMetricsNote.textContent=`Observed branch_choice${Number.isFinite(fpsA)&&Number.isFinite(fpsB)?` · A ${fpsA} fps · B ${fpsB} fps`:''}. Relation compares the two observed categorical choices; no numeric delta or significance claim.`;
      updateCompareSummary(a,b);
      return;
    }
    const rows=[
      ['speed',ui.compareSpeedA,ui.compareSpeedB,ui.compareSpeedDelta,{digits:1,unit:' mm/s'}],
      ['distance',ui.compareDistanceA,ui.compareDistanceB,ui.compareDistanceDelta,{digits:1,unit:' mm'}],
      ['straightness',ui.compareStraightnessA,ui.compareStraightnessB,ui.compareStraightnessDelta,{digits:3}],
      ['edgeTime',ui.compareEdgeTimeA,ui.compareEdgeTimeB,ui.compareEdgeTimeDelta,{digits:2,unit:' s'}],
      ['central',ui.compareCentralA,ui.compareCentralB,ui.compareCentralDelta,{digits:3}]
    ];
    for(const [key,aNode,bNode,dNode,format] of rows){
      aNode.textContent=formatCompareValue(a[key],format);
      bNode.textContent=formatCompareValue(b[key],format);
      dNode.textContent=formatCompareDelta(a[key],b[key],format);
    }
    ui.compareOutcomeA.textContent=a.outcome;
    ui.compareOutcomeB.textContent=b.outcome;
    ui.compareOutcomeDelta.textContent=a.outcome==='—'||b.outcome==='—'?'—':(a.outcome===b.outcome?'same':'different');
    const fpsA=a.summary.observed_metrics?.fps,fpsB=b.summary.observed_metrics?.fps;
    ui.compareMetricsNote.textContent=`Observed values${Number.isFinite(fpsA)&&Number.isFinite(fpsB)?` · A ${fpsA} fps · B ${fpsB} fps`:''}. Δ = Condition B minus Condition A. Missing values stay — until the metric is observable.`;
    updateCompareSummary(a,b);
  }
  function renderComparePair(){
    if(!comparePair.a||!comparePair.b)return;
    updateCompareMatchDisplay();
    drawCompareSimulation(ui.compareCanvasA,comparePair.a);
    drawCompareSimulation(ui.compareCanvasB,comparePair.b);
    drawCompareTrajectoryOverlay();
    updateCompareMetrics();
    updateComparePlaybackStatus();
  }
  function stepCompareOneSecond(){
    if(!comparePair.a||!comparePair.b)return;
    running=false;ui.play.textContent='Run';simBudget=0;
    const steps=Math.round(1/FIXED_DT);
    let done=false;
    for(let i=0;i<steps&&!done;i++)done=advanceCompareFixedStep();
    renderComparePair();
    ui.status.textContent=done?'COMPARE COMPLETE':'COMPARE PAUSED';
  }
  function setSingleControlsDisabled(disabled){
    ui.experiment.disabled=disabled;
    [ui.trails,ui.ids,ui.contacts].forEach(control=>{if(control)control.disabled=disabled;});
    [ui.seed,ui.speed,ui.play,ui.step,ui.reset].forEach(control=>{if(control)control.disabled=false;});
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
      initializeCompareCanvases();
      resetComparePair();
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
  function frame(now){
    const wallDt=Math.min(.05,(now-lastWallTime)/1000);lastWallTime=now;
    if(running&&viewMode==='single'&&sim){
      simBudget+=wallDt*Number(ui.speed.value);let safety=0;
      while(simBudget>=FIXED_DT&&safety++<5000){sim.step(FIXED_DT);simBudget-=FIXED_DT;const durationReached=sim.time>=sim.experiment.duration_s&&!sim.allFinished();if(sim.allFinished()||durationReached){if(durationReached)sim.runUntilComplete(0);running=false;ui.play.textContent='Run';ui.status.textContent=durationReached?'DURATION':'COMPLETE';break;}}
    }else if(running&&viewMode==='compare'&&comparePair.a&&comparePair.b){
      simBudget+=wallDt*Number(ui.speed.value);let safety=0,done=false;
      while(simBudget>=FIXED_DT&&safety++<5000&&!done){done=advanceCompareFixedStep();simBudget-=FIXED_DT;}
      if(done){running=false;ui.play.textContent='Run';ui.status.textContent='COMPARE COMPLETE';}
    }
    if(viewMode==='single'&&sim){draw();updateMetrics();updateInspector();}
    else if(viewMode==='compare'&&comparePair.a&&comparePair.b)renderComparePair();
    requestAnimationFrame(frame);
  }
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
  ui.comparePresetSelect.addEventListener('change',()=>{if(viewMode==='compare')resetComparePair();});
  ui.replaySeedBtn.addEventListener('click',replaySameCompareSeed);ui.nextSeedBtn.addEventListener('click',nextCompareSeed);
  ui.showCompareOverlay.addEventListener('change',toggleCompareTrajectoryOverlay);
  ui.compareCanvasA.addEventListener('click',event=>selectCompareWorkerFromCanvas(ui.compareCanvasA,comparePair.a,event));ui.compareCanvasB.addEventListener('click',event=>selectCompareWorkerFromCanvas(ui.compareCanvasB,comparePair.b,event));
  ui.play.addEventListener('click',()=>{
    if(viewMode==='compare'){
      if(!comparePair.a||!comparePair.b)return;
      running=!running;ui.play.textContent=running?'Pause':'Run';ui.status.textContent=running?'COMPARE RUNNING':'COMPARE PAUSED';updateComparePlaybackStatus();return;
    }
    if(!sim)return;running=!running;ui.play.textContent=running?'Pause':'Run';ui.status.textContent=running?'RUNNING':'PAUSED';
  });
  ui.reset.addEventListener('click',()=>{if(viewMode==='compare')resetComparePair();else reset();});
  ui.step.addEventListener('click',()=>{
    if(viewMode==='compare'){stepCompareOneSecond();return;}
    if(!sim)return;running=false;ui.play.textContent='Run';const remaining=Math.max(0,sim.experiment.duration_s-sim.time);if(remaining<=1e-9){const alreadyFinished=sim.allFinished();if(!alreadyFinished)sim.runUntilComplete(0);const outcomes=sim.summary().outcomes||{};ui.status.textContent=outcomes.timeout>0?'DURATION':'COMPLETE';updateMetrics();draw();return;}sim.runFor(Math.min(1,remaining),FIXED_DT);const durationReached=sim.time>=sim.experiment.duration_s-1e-9&&!sim.allFinished();if(durationReached)sim.runUntilComplete(0);ui.status.textContent=durationReached?'DURATION':(sim.allFinished()?'COMPLETE':'PAUSED');updateMetrics();draw();
  });
  ui.seed.addEventListener('change',()=>{if(viewMode==='compare')resetComparePair();else reset();});
  ui.experiment.addEventListener('change',reset);initializeComparePresets();initializeCompareCanvases();setViewMode('single');reset();requestAnimationFrame(frame);
})();
