(() => {
  'use strict';
  const { Simulation, FIXED_DT } = window.AntLabCore;

  const canvas = document.getElementById('labCanvas');
  const ctx = canvas.getContext('2d');
  const ui = {
    experiment: document.getElementById('experimentSelect'), seed: document.getElementById('seedInput'), speed: document.getElementById('speedSelect'),
    play: document.getElementById('playBtn'), step: document.getElementById('stepBtn'), reset: document.getElementById('resetBtn'), status: document.getElementById('runStatus'),
    trails: document.getElementById('showTrails'), ids: document.getElementById('showIds'), contacts: document.getElementById('showContacts'),
    simTime: document.getElementById('simTime'), meanSpeed: document.getElementById('meanSpeed'), moving: document.getElementById('movingCount'),
    contactCount: document.getElementById('contactCount'), completed: document.getElementById('completedCount'), outcome: document.getElementById('outcomeValue'),
    defWorkers: document.getElementById('defWorkers'), defWorld: document.getElementById('defWorld'), defDuration: document.getElementById('defDuration'), defObservation: document.getElementById('defObservation'), note: document.getElementById('experimentNote'),
    inspectorEmpty: document.getElementById('inspectorEmpty'), inspectorData: document.getElementById('inspectorData'),
    workerId: document.getElementById('workerId'), workerX: document.getElementById('workerX'), workerY: document.getElementById('workerY'), workerHeading: document.getElementById('workerHeading'), workerSpeed: document.getElementById('workerSpeed'), workerState: document.getElementById('workerState'), workerContacts: document.getElementById('workerContacts'), workerWalls: document.getElementById('workerWalls'), workerOutcome: document.getElementById('workerOutcome'), accessibleInfo: document.getElementById('accessibleInfo')
  };

  const experimentCache = new Map();
  let sim = null, experiment = null, running = false, selectedId = null, lastWallTime = performance.now(), simBudget = 0;

  async function loadExperiment(filename) {
    if (experimentCache.has(filename)) return experimentCache.get(filename);
    const response = await fetch(`./experiments/${filename}`);
    if (!response.ok) throw new Error(`Could not load ${filename}: HTTP ${response.status}`);
    const value = await response.json();
    experimentCache.set(filename, value);
    return value;
  }

  async function reset() {
    running = false; selectedId = null; simBudget = 0;
    ui.play.textContent = 'Run'; ui.status.textContent = 'LOADING';
    try {
      experiment = await loadExperiment(ui.experiment.value);
      sim = new Simulation(experiment, Number(ui.seed.value) || 1);
      ui.status.textContent = 'PAUSED';
      ui.inspectorData.hidden = true; ui.inspectorEmpty.hidden = false;
      updateDefinition(); updateMetrics(); draw();
    } catch (err) {
      console.error(err);
      ui.status.textContent = 'LOAD ERROR';
      ui.note.textContent = err.message;
    }
  }

  function frame(now) {
    const wallDt = Math.min(0.05, (now - lastWallTime) / 1000); lastWallTime = now;
    if (running && sim) {
      simBudget += wallDt * Number(ui.speed.value);
      let safety = 0;
      while (simBudget >= FIXED_DT && safety < 5000) {
        sim.step(FIXED_DT); simBudget -= FIXED_DT; safety++;
        if (sim.allFinished() || sim.time >= sim.experiment.duration_s) {
          running = false; ui.play.textContent = 'Run'; ui.status.textContent = sim.allFinished() ? 'COMPLETE' : 'DURATION';
          break;
        }
      }
    }
    if (sim) { draw(); updateMetrics(); updateInspector(); }
    requestAnimationFrame(frame);
  }

  function transform() {
    const margin = 28;
    const w = sim.experiment.world.width, h = sim.experiment.world.height;
    const s = Math.min((canvas.width - margin * 2) / w, (canvas.height - margin * 2) / h);
    return { s, ox: (canvas.width - w * s) / 2, oy: (canvas.height - h * s) / 2 };
  }
  function toCanvas(x, y) { const t = transform(); return { x: t.ox + x * t.s, y: t.oy + y * t.s }; }

  function drawPrimitive(p, fill, stroke) {
    const t = transform();
    ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 1.2;
    if (p.type === 'rect') {
      ctx.beginPath(); ctx.rect(t.ox + p.x * t.s, t.oy + p.y * t.s, p.width * t.s, p.height * t.s); ctx.fill(); ctx.stroke();
    } else if (p.type === 'circle') {
      const c = toCanvas(p.x, p.y); ctx.beginPath(); ctx.arc(c.x, c.y, p.radius * t.s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (p.type === 'corridor') {
      const a = toCanvas(p.x1, p.y1), b = toCanvas(p.x2, p.y2);
      ctx.lineCap = 'round'; ctx.lineWidth = p.width * t.s; ctx.strokeStyle = fill; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.strokeStyle = stroke; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    } else if (p.type === 'polygon') {
      const pts = p.points || []; if (!pts.length) { ctx.restore(); return; }
      ctx.beginPath(); pts.forEach((q, i) => { const c = toCanvas(q[0], q[1]); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#090b0d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const p of sim.experiment.geometry.primitives) drawPrimitive(p, 'rgba(148,163,184,.10)', 'rgba(255,255,255,.18)');
    for (const r of sim.experiment.terminal_regions) drawPrimitive(r.shape || r, 'rgba(96,165,250,.15)', 'rgba(96,165,250,.60)');

    const spawn = toCanvas(sim.experiment.spawn.x, sim.experiment.spawn.y);
    ctx.strokeStyle = 'rgba(217,249,157,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(spawn.x, spawn.y, 7, 0, Math.PI * 2); ctx.stroke();

    if (ui.trails.checked) {
      ctx.lineWidth = 1;
      for (const ant of sim.ants) {
        if (ant.tail.length < 2) continue;
        ctx.strokeStyle = 'rgba(217,249,157,.10)'; ctx.beginPath();
        ant.tail.forEach((p, i) => { const c = toCanvas(p.x, p.y); i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y); }); ctx.stroke();
      }
    }
    for (const ant of sim.ants) drawAnt(ant);
  }

  function drawAnt(ant) {
    const c = toCanvas(ant.x, ant.y), size = 3.2;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(ant.heading);
    ctx.fillStyle = ant.id === selectedId ? '#d9f99d' : (ant.finished ? '#60a5fa' : '#f5f5f4');
    ctx.beginPath(); ctx.ellipse(0, 0, size * 1.55, size, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(size * 1.7, 0, size * .62, 0, Math.PI * 2); ctx.fill();
    if (ui.contacts.checked && ant.contactFlash > 0) { ctx.strokeStyle = 'rgba(251,113,133,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    if (ui.ids.checked) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '10px ui-monospace'; ctx.fillText(String(ant.id), c.x + 5, c.y - 5); }
  }

  function updateDefinition() {
    const e = sim.experiment;
    ui.defWorkers.textContent = e.workers;
    ui.defWorld.textContent = `${e.world.width} × ${e.world.height} mm`;
    ui.defDuration.textContent = `${e.duration_s} s`;
    ui.defObservation.textContent = `${e.observation.fps} fps`;
    ui.note.textContent = e.metadata.purpose || '';
  }

  function updateMetrics() {
    if (!sim) return;
    const moving = sim.ants.filter(a => !a.finished && a.pauseRemaining <= 0).length;
    const summary = sim.summary();
    ui.simTime.textContent = `${sim.time.toFixed(1)} s`;
    ui.meanSpeed.textContent = `${summary.mean_speed_while_moving_mm_s.toFixed(1)} mm/s`;
    ui.moving.textContent = `${moving}/${sim.ants.length}`;
    ui.contactCount.textContent = sim.metrics.contacts.toLocaleString();
    ui.completed.textContent = `${sim.metrics.completed}/${sim.ants.length}`;
    ui.outcome.textContent = sim.ants.length === 1 && sim.ants[0].outcome ? sim.ants[0].outcome.toUpperCase() : '—';
  }

  function updateInspector() {
    if (selectedId == null || !sim) return;
    const a = sim.ants.find(x => x.id === selectedId); if (!a) return;
    ui.workerId.textContent = `#${a.id}`;
    ui.workerX.textContent = `${a.x.toFixed(2)} mm`; ui.workerY.textContent = `${a.y.toFixed(2)} mm`;
    ui.workerHeading.textContent = `${((((a.heading * 180 / Math.PI) % 360) + 360) % 360).toFixed(1)}°`;
    ui.workerSpeed.textContent = `${(a.pauseRemaining > 0 || a.finished ? 0 : a.baseSpeed * a.speedFactor).toFixed(2)} mm/s`;
    ui.workerState.textContent = a.state; ui.workerContacts.textContent = a.contacts; ui.workerWalls.textContent = a.wallContacts; ui.workerOutcome.textContent = a.outcome || '—';
    ui.accessibleInfo.innerHTML = '';
    const facts = ['own movement/pause state', 'own local wall-contact events', `recent nestmate contacts: ${a.contacts}`, 'individual locomotion parameters'];
    for (const f of facts) { const li = document.createElement('li'); li.textContent = f; ui.accessibleInfo.appendChild(li); }
  }

  canvas.addEventListener('click', e => {
    if (!sim) return;
    const r = canvas.getBoundingClientRect(); const mx = (e.clientX - r.left) / r.width * canvas.width; const my = (e.clientY - r.top) / r.height * canvas.height;
    let best = null, bestD = Infinity;
    for (const a of sim.ants) { const c = toCanvas(a.x, a.y), dx = c.x - mx, dy = c.y - my, d = dx * dx + dy * dy; if (d < bestD) { bestD = d; best = a; } }
    if (best && bestD < 18 * 18) { selectedId = best.id; ui.inspectorEmpty.hidden = true; ui.inspectorData.hidden = false; updateInspector(); }
  });

  ui.play.addEventListener('click', () => { if (!sim) return; running = !running; ui.play.textContent = running ? 'Pause' : 'Run'; ui.status.textContent = running ? 'RUNNING' : 'PAUSED'; });
  ui.reset.addEventListener('click', reset);
  ui.step.addEventListener('click', () => { if (!sim) return; running = false; ui.play.textContent = 'Run'; ui.status.textContent = 'PAUSED'; sim.runFor(1, FIXED_DT); updateMetrics(); draw(); });
  ui.seed.addEventListener('change', reset); ui.experiment.addEventListener('change', reset);

  reset(); requestAnimationFrame(frame);
})();
