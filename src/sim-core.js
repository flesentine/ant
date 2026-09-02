(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  root.AntLabCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FIXED_DT = 0.02;
  const EPS = 1e-9;
  const BIOLOGY_KEYS = new Set([
    'movement', 'contacts', 'chemical_sensing', 'memory', 'physiology',
    'directional_persistence', 'distance_scale_mm', 'tau_s', 'max_reduction_fraction',
    'base_speed_mm_s', 'speed_sd_mm_s', 'angular_sigma_rad_sqrt_s',
    'speed_reversion_rate_s', 'speed_noise_sigma_sqrt_s', 'pause_rate_s',
    'pause_min_s', 'pause_max_s', 'radius_mm', 'avoidance_turn_rad'
  ]);

  function hash32(x) {
    x |= 0;
    x = (x + 0x9e3779b9) | 0;
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
    x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
    return (x ^ (x >>> 15)) >>> 0;
  }

  class RNG {
    constructor(seed) { this.state = seed >>> 0 || 1; }
    next() {
      let t = this.state += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    normal() {
      const u = Math.max(this.next(), 1e-12);
      const v = this.next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
  }

  function hazard(ratePerSecond, dt, rng) {
    return rng.next() < 1 - Math.exp(-Math.max(0, ratePerSecond) * dt);
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function normalizeAngle(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  function cloneJson(value) { return JSON.parse(JSON.stringify(value)); }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
  }

  function contentHash(value) {
    const s = stableStringify(value);
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function assertNoBiologyOverrides(value, path = 'experiment') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => assertNoBiologyOverrides(v, `${path}[${i}]`));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (BIOLOGY_KEYS.has(key)) {
        throw new Error(`Biology override forbidden at ${path}.${key}; biological parameters belong in the model profile`);
      }
      assertNoBiologyOverrides(child, `${path}.${key}`);
    }
  }

  function normalizeModel(raw) {
    const m = cloneJson(raw || {});
    m.schema_version = m.schema_version || 1;
    m.id = m.id || 'untitled_model';
    m.species = m.species || 'unknown';
    m.status = m.status || 'provisional';
    m.movement = Object.assign({
      base_speed_mm_s: 14,
      speed_sd_mm_s: 1.4,
      angular_sigma_rad_sqrt_s: 0.8,
      speed_reversion_rate_s: 2.0,
      speed_noise_sigma_sqrt_s: 0.08,
      pause_rate_s: 0.015,
      pause_min_s: 0.12,
      pause_max_s: 0.8
    }, m.movement || {});
    m.contacts = Object.assign({
      enabled: false,
      radius_mm: 1.6,
      avoidance_turn_rad: 0.18
    }, m.contacts || {});
    return m;
  }

  function normalizeApparatus(raw) {
    const a = cloneJson(raw || {});
    a.schema_version = a.schema_version || 1;
    a.id = a.id || 'untitled_apparatus';
    a.world = Object.assign({ width: 300, height: 80 }, a.world || {});
    a.world.width = Number(a.world.width) || 300;
    a.world.height = Number(a.world.height) || 80;
    a.geometry = a.geometry || {};
    if (!Array.isArray(a.geometry.primitives) || a.geometry.primitives.length === 0) {
      a.geometry.primitives = [{ type: 'rect', x: 0, y: 0, width: a.world.width, height: a.world.height }];
    }
    a.boundary = Object.assign({ mode: 'reflect', outcome: 'boundary' }, a.boundary || {});
    a.entry_points = a.entry_points || {};
    a.terminal_regions = Array.isArray(a.terminal_regions) ? a.terminal_regions : [];
    return a;
  }

  function normalizeExperiment(raw) {
    const e = cloneJson(raw || {});
    assertNoBiologyOverrides(e, 'experiment');
    e.schema_version = e.schema_version || 2;
    e.id = e.id || 'untitled_experiment';
    e.title = e.title || e.id;
    e.model = e.model || null;
    e.apparatus = e.apparatus || null;
    e.workers = Math.max(1, Math.floor(Number(e.workers) || 1));
    e.duration_s = Math.max(0.1, Number(e.duration_s) || 60);
    e.protocol = e.protocol || {};
    e.protocol.entry_point = e.protocol.entry_point || 'default';
    e.protocol.entry_state = Object.assign({ heading_rad: 0, position_jitter_mm: 0, heading_jitter_rad: 0 }, e.protocol.entry_state || {});
    e.observation = Object.assign({ fps: 25, record_trajectories: true, metrics: [] }, e.observation || {});
    e.observation.fps = Math.max(0.1, Number(e.observation.fps) || 25);
    e.calibration_role = e.calibration_role || 'development';
    e.metadata = e.metadata || {};
    return e;
  }

  function compileBundle(bundle) {
    if (!bundle || !bundle.experiment || !bundle.model || !bundle.apparatus) throw new Error('Simulation requires { experiment, model, apparatus }');
    const experiment = normalizeExperiment(bundle.experiment);
    const model = normalizeModel(bundle.model);
    const apparatus = normalizeApparatus(bundle.apparatus);
    const modelRef = typeof experiment.model === 'string' ? experiment.model.replace(/^.*\//, '').replace(/\.json$/, '') : null;
    const apparatusRef = typeof experiment.apparatus === 'string' ? experiment.apparatus.replace(/^.*\//, '').replace(/\.json$/, '') : null;
    if (modelRef && modelRef !== model.id) throw new Error(`Experiment model reference ${modelRef} does not match loaded model ${model.id}`);
    if (apparatusRef && apparatusRef !== apparatus.id) throw new Error(`Experiment apparatus reference ${apparatusRef} does not match loaded apparatus ${apparatus.id}`);
    const entry = apparatus.entry_points[experiment.protocol.entry_point] || apparatus.entry_points.default;
    if (!entry) throw new Error(`Apparatus ${apparatus.id} has no entry point '${experiment.protocol.entry_point}'`);
    return { experiment, model, apparatus, entry: cloneJson(entry), provenance: { model_hash: contentHash(model), apparatus_hash: contentHash(apparatus), experiment_hash: contentHash(experiment), bundle_hash: contentHash({ model, apparatus, experiment }) } };
  }

  function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], yi = points[i][1], xj = points[j][0], yj = points[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || EPS) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function closestPointOnSegment(px, py, ax, ay, bx, by) { const abx=bx-ax,aby=by-ay,denom=abx*abx+aby*aby,t=denom<=EPS?0:clamp(((px-ax)*abx+(py-ay)*aby)/denom,0,1); return {x:ax+t*abx,y:ay+t*aby}; }
  function distanceToSegment(px, py, ax, ay, bx, by) { const q=closestPointOnSegment(px,py,ax,ay,bx,by); return Math.hypot(px-q.x,py-q.y); }
  function pointInPrimitive(x, y, p) { switch(p.type){case'rect':return x>=p.x-EPS&&x<=p.x+p.width+EPS&&y>=p.y-EPS&&y<=p.y+p.height+EPS;case'circle':return(x-p.x)**2+(y-p.y)**2<=(p.radius+EPS)**2;case'corridor':return distanceToSegment(x,y,p.x1,p.y1,p.x2,p.y2)<=p.width/2+EPS;case'polygon':return pointInPolygon(x,y,p.points||[]);default:return false;} }
  function pointInGeometry(x,y,geometry){return geometry.primitives.some(p=>pointInPrimitive(x,y,p));}
  function primitiveBoundaryCandidates(px,py,p){const out=[];function addSegment(ax,ay,bx,by){const q=closestPointOnSegment(px,py,ax,ay,bx,by),dx=px-q.x,dy=py-q.y,d=Math.hypot(dx,dy);out.push({distance:d,nx:d>EPS?dx/d:1,ny:d>EPS?dy/d:0});}if(p.type==='rect'){const x0=p.x,y0=p.y,x1=p.x+p.width,y1=p.y+p.height;addSegment(x0,y0,x1,y0);addSegment(x1,y0,x1,y1);addSegment(x1,y1,x0,y1);addSegment(x0,y1,x0,y0);}else if(p.type==='polygon'){const pts=p.points||[];for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];addSegment(a[0],a[1],b[0],b[1]);}}else if(p.type==='circle'){const dx=px-p.x,dy=py-p.y,r=Math.hypot(dx,dy)||1;out.push({distance:Math.abs(r-p.radius),nx:dx/r,ny:dy/r});}else if(p.type==='corridor'){const q=closestPointOnSegment(px,py,p.x1,p.y1,p.x2,p.y2),dx=px-q.x,dy=py-q.y,r=Math.hypot(dx,dy)||1;out.push({distance:Math.abs(r-p.width/2),nx:dx/r,ny:dy/r});}return out;}
  function closestBoundaryNormal(x,y,geometry){let best={distance:Infinity,nx:1,ny:0};for(const p of geometry.primitives)for(const c of primitiveBoundaryCandidates(x,y,p))if(c.distance<best.distance)best=c;return best;}
  function reflectHeading(heading,nx,ny){const vx=Math.cos(heading),vy=Math.sin(heading),dot=vx*nx+vy*ny;return Math.atan2(vy-2*dot*ny,vx-2*dot*nx);}
  function terminalAt(x,y,regions){for(const region of regions||[]){const shape=region.shape||region;if(pointInPrimitive(x,y,shape))return region;}return null;}
  function lastInsidePoint(x0,y0,x1,y1,geometry){let lo=0,hi=1;for(let i=0;i<28;i++){const mid=(lo+hi)/2,x=x0+(x1-x0)*mid,y=y0+(y1-y0)*mid;if(pointInGeometry(x,y,geometry))lo=mid;else hi=mid;}return{x:x0+(x1-x0)*lo,y:y0+(y1-y0)*lo};}

  class Ant {
    constructor(id,worldSeed,compiled){this.id=id;this.rng=new RNG(hash32(worldSeed^Math.imul(id+1,0x45d9f3b)));const entry=compiled.entry,entryState=compiled.experiment.protocol.entry_state;this.x=Number(entry.x);this.y=Number(entry.y);this.startX=this.x;this.startY=this.y;this.heading=Number(entry.heading_rad==null?entryState.heading_rad:entry.heading_rad)||0;const jitter=Number(entryState.position_jitter_mm)||0;if(jitter>0){for(let tries=0;tries<20;tries++){const a=this.rng.next()*Math.PI*2,r=Math.sqrt(this.rng.next())*jitter,tx=this.x+Math.cos(a)*r,ty=this.y+Math.sin(a)*r;if(pointInGeometry(tx,ty,compiled.apparatus.geometry)){this.x=tx;this.y=ty;this.startX=tx;this.startY=ty;break;}}}this.heading=normalizeAngle(this.heading+this.rng.normal()*(Number(entryState.heading_jitter_rad)||0));const m=compiled.model.movement;this.baseSpeed=Math.max(.5,Number(m.base_speed_mm_s)+this.rng.normal()*Number(m.speed_sd_mm_s));this.speedFactor=clamp(1+this.rng.normal()*.03,.75,1.25);this.turnScale=clamp(1+this.rng.normal()*.08,.7,1.3);this.pauseScale=clamp(1+this.rng.normal()*.12,.65,1.5);this.state='moving';this.pauseRemaining=0;this.contacts=0;this.wallContacts=0;this.contactFlash=0;this.tail=[];this.tailClock=0;this.distanceTravelled=0;this.movingTime=0;this.finished=false;this.outcome=null;this.completedAt=null;this.exitX=null;this.exitY=null;}
    finish(outcome,time,sim,exitPoint=null){if(this.finished)return;this.finished=true;this.outcome=outcome;this.completedAt=time;this.state='finished';if(exitPoint){this.exitX=exitPoint.x;this.exitY=exitPoint.y;}sim.metrics.completed++;sim.metrics.outcomes[outcome]=(sim.metrics.outcomes[outcome]||0)+1;sim.events.push({time,type:'terminal',ant:this.id,outcome,x:this.x,y:this.y});}
    update(dt,sim){if(this.finished)return;this.contactFlash=Math.max(0,this.contactFlash-dt);const m=sim.model.movement;if(this.pauseRemaining<=0&&hazard(Number(m.pause_rate_s)*this.pauseScale,dt,this.rng)){this.pauseRemaining=Number(m.pause_min_s)+this.rng.next()*(Number(m.pause_max_s)-Number(m.pause_min_s));this.state='paused';}if(this.pauseRemaining>0){this.pauseRemaining-=dt;if(this.pauseRemaining<=0)this.state='moving';this.recordTail(dt);return;}const theta=Number(m.speed_reversion_rate_s),sigmaSpeed=Number(m.speed_noise_sigma_sqrt_s);this.speedFactor+=theta*(1-this.speedFactor)*dt+sigmaSpeed*Math.sqrt(dt)*this.rng.normal();this.speedFactor=clamp(this.speedFactor,.6,1.4);this.heading=normalizeAngle(this.heading+this.rng.normal()*Number(m.angular_sigma_rad_sqrt_s)*this.turnScale*Math.sqrt(dt));const actualSpeed=this.baseSpeed*this.speedFactor,ox=this.x,oy=this.y;let nx=ox+Math.cos(this.heading)*actualSpeed*dt,ny=oy+Math.sin(this.heading)*actualSpeed*dt;if(!pointInGeometry(nx,ny,sim.apparatus.geometry)){const mode=sim.apparatus.boundary.mode;if(mode==='terminate'){const exit=lastInsidePoint(ox,oy,nx,ny,sim.apparatus.geometry),moved=Math.hypot(exit.x-ox,exit.y-oy);this.x=exit.x;this.y=exit.y;this.distanceTravelled+=moved;if(moved>0)this.movingTime+=dt;this.finish(sim.apparatus.boundary.outcome||'boundary_exit',sim.time+dt,sim,exit);this.recordTail(dt);return;}const normal=closestBoundaryNormal(nx,ny,sim.apparatus.geometry);this.heading=normalizeAngle(reflectHeading(this.heading,normal.nx,normal.ny));this.wallContacts++;sim.metrics.wallContacts++;sim.events.push({time:sim.time,type:'wall_contact',ant:this.id});nx=ox+Math.cos(this.heading)*actualSpeed*dt;ny=oy+Math.sin(this.heading)*actualSpeed*dt;if(!pointInGeometry(nx,ny,sim.apparatus.geometry)){nx=ox;ny=oy;}}const moved=Math.hypot(nx-ox,ny-oy);this.x=nx;this.y=ny;this.distanceTravelled+=moved;if(moved>0)this.movingTime+=dt;this.state='moving';const terminal=terminalAt(this.x,this.y,sim.apparatus.terminal_regions);if(terminal)this.finish(terminal.label||'terminal',sim.time+dt,sim,{x:this.x,y:this.y});this.recordTail(dt);}
    recordTail(dt){this.tailClock+=dt;if(this.tailClock>=.25){this.tailClock-=.25;this.tail.push({x:this.x,y:this.y});if(this.tail.length>40)this.tail.shift();}}
  }

  class Simulation {
    constructor(bundle,seed=1,workerOverride=null){this.compiled=compileBundle(bundle);this.experiment=this.compiled.experiment;this.model=this.compiled.model;this.apparatus=this.compiled.apparatus;this.provenance=this.compiled.provenance;this.seed=seed>>>0||1;this.time=0;this.events=[];this.metrics={contacts:0,wallContacts:0,completed:0,outcomes:{}};const n=workerOverride==null?this.experiment.workers:Math.max(1,Math.floor(workerOverride));this.ants=Array.from({length:n},(_,i)=>new Ant(i,this.seed,this.compiled));this.cellSize=Math.max(2,Number(this.model.contacts.radius_mm)*2.5);this.grid=new Map();this.activeContacts=new Set();this.observations=[];this.nextObservationTime=0;if(this.experiment.observation.record_trajectories)this.recordObservation(0);}
    step(dt=FIXED_DT){for(const ant of this.ants)ant.update(dt,this);this.resolveContacts();this.time+=dt;if(this.experiment.observation.record_trajectories){const interval=1/this.experiment.observation.fps;while(this.nextObservationTime<=this.time+EPS){this.recordObservation(this.nextObservationTime);this.nextObservationTime+=interval;}}}
    recordObservation(sampleTime=0){this.observations.push({time_s:Number(sampleTime.toFixed(6)),ants:this.ants.map(a=>({id:a.id,x:a.x,y:a.y,heading:a.heading,state:a.state,outcome:a.outcome}))});if(this.nextObservationTime===0)this.nextObservationTime=1/this.experiment.observation.fps;}
    runFor(seconds,dt=FIXED_DT){const end=this.time+Math.max(0,seconds);while(this.time+EPS<end&&!this.allFinished())this.step(Math.min(dt,end-this.time));return this.summary();}
    runUntilComplete(maxSeconds=this.experiment.duration_s,dt=FIXED_DT){const end=this.time+maxSeconds;while(this.time+EPS<end&&!this.allFinished())this.step(Math.min(dt,end-this.time));if(!this.allFinished())for(const ant of this.ants)if(!ant.finished)ant.finish('timeout',this.time,this);return this.summary();}
    allFinished(){return this.ants.length>0&&this.ants.every(a=>a.finished);}
    resolveContacts(){if(!this.model.contacts.enabled||this.ants.length<2){this.activeContacts.clear();return;}this.grid.clear();for(const ant of this.ants){if(ant.finished)continue;const k=this.key(ant.x,ant.y);if(!this.grid.has(k))this.grid.set(k,[]);this.grid.get(k).push(ant);}const radius=Number(this.model.contacts.radius_mm),radius2=radius*radius,current=new Set();for(const ant of this.ants){if(ant.finished)continue;const cx=Math.floor(ant.x/this.cellSize),cy=Math.floor(ant.y/this.cellSize);for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){const bucket=this.grid.get(`${cx+ox},${cy+oy}`);if(!bucket)continue;for(const other of bucket){if(other.id<=ant.id||other.finished)continue;const dx=other.x-ant.x,dy=other.y-ant.y;if(dx*dx+dy*dy>=radius2)continue;const pair=`${ant.id}:${other.id}`;current.add(pair);if(!this.activeContacts.has(pair))this.beginContact(ant,other,dx,dy);}}}for(const pair of this.activeContacts)if(!current.has(pair))this.events.push({time:this.time,type:'contact_end',pair});this.activeContacts=current;if(this.events.length>5000)this.events.splice(0,this.events.length-5000);}
    beginContact(ant,other,dx,dy){const angle=Math.atan2(dy,dx),turn=Number(this.model.contacts.avoidance_turn_rad);ant.heading=normalizeAngle(ant.heading+(normalizeAngle(angle-ant.heading)>=0?-turn:turn));other.heading=normalizeAngle(other.heading+(normalizeAngle(angle+Math.PI-other.heading)>=0?-turn:turn));ant.contacts++;other.contacts++;this.metrics.contacts++;ant.contactFlash=.12;other.contactFlash=.12;this.events.push({time:this.time,type:'contact_begin',antA:ant.id,antB:other.id,relative_heading_rad:normalizeAngle(other.heading-ant.heading)});}
    key(x,y){return`${Math.floor(x/this.cellSize)},${Math.floor(y/this.cellSize)}`;}
    trajectoryMetrics(ant){const beeline=Math.hypot(ant.x-ant.startX,ant.y-ant.startY);return{total_distance_mm:ant.distanceTravelled,time_to_outcome_s:ant.completedAt,straightness:ant.distanceTravelled>0?beeline/ant.distanceTravelled:0,exit_x_mm:ant.exitX,exit_y_mm:ant.exitY};}
    summary(){const totalDistance=this.ants.reduce((s,a)=>s+a.distanceTravelled,0),totalMovingTime=this.ants.reduce((s,a)=>s+a.movingTime,0);return{experiment_id:this.experiment.id,model_id:this.model.id,apparatus_id:this.apparatus.id,calibration_role:this.experiment.calibration_role,provenance:Object.assign({},this.provenance),seed:this.seed,workers:this.ants.length,time_s:Number(this.time.toFixed(6)),completed:this.metrics.completed,outcomes:Object.assign({},this.metrics.outcomes),contacts:this.metrics.contacts,wall_contacts:this.metrics.wallContacts,mean_speed_while_moving_mm_s:totalMovingTime>0?totalDistance/totalMovingTime:0,mean_distance_mm:this.ants.length?totalDistance/this.ants.length:0,trajectories:this.ants.map(a=>this.trajectoryMetrics(a))};}
    fingerprint(){return JSON.stringify({experiment:this.experiment.id,model_hash:this.provenance.model_hash,apparatus_hash:this.provenance.apparatus_hash,time:Number(this.time.toFixed(6)),metrics:this.metrics,ants:this.ants.map(a=>[a.id,Number(a.x.toFixed(6)),Number(a.y.toFixed(6)),Number(a.heading.toFixed(6)),Number(a.speedFactor.toFixed(6)),a.state,a.outcome,a.contacts,a.wallContacts])});}
  }

  return {FIXED_DT,RNG,hazard,normalizeAngle,stableStringify,contentHash,assertNoBiologyOverrides,normalizeModel,normalizeApparatus,normalizeExperiment,compileBundle,pointInPrimitive,pointInGeometry,terminalAt,Ant,Simulation};
});
