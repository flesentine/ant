(() => {
  'use strict';
  const { Simulation, MM_W, MM_H, NEST_X, FOOD_X, FIXED_DT } = window.AntLabCore;

  const canvas = document.getElementById('labCanvas');
  const ctx = canvas.getContext('2d');
  const ui = {
    seed: document.getElementById('seedInput'), ants: document.getElementById('antCountInput'), speed: document.getElementById('speedSelect'),
    play: document.getElementById('playBtn'), step: document.getElementById('stepBtn'), reset: document.getElementById('resetBtn'), status: document.getElementById('runStatus'),
    trails: document.getElementById('showTrails'), ids: document.getElementById('showIds'), contacts: document.getElementById('showContacts'),
    simTime: document.getElementById('simTime'), meanSpeed: document.getElementById('meanSpeed'), moving: document.getElementById('movingCount'),
    contactCount: document.getElementById('contactCount'), foodVisits: document.getElementById('foodVisits'), nestReturns: document.getElementById('nestReturns'),
    inspectorEmpty: document.getElementById('inspectorEmpty'), inspectorData: document.getElementById('inspectorData'),
    workerId: document.getElementById('workerId'), workerX: document.getElementById('workerX'), workerY: document.getElementById('workerY'), workerHeading: document.getElementById('workerHeading'), workerSpeed: document.getElementById('workerSpeed'), workerState: document.getElementById('workerState'), workerContacts: document.getElementById('workerContacts'), workerTrips: document.getElementById('workerTrips'), accessibleInfo: document.getElementById('accessibleInfo')
  };

  let sim, running = false, selectedId = null, lastWallTime = performance.now(), simBudget = 0;

  function reset() {
    sim = new Simulation(Number(ui.seed.value) || 1, Math.min(2000, Math.max(1, Number(ui.ants.value) || 120)));
    running = false; selectedId = null; simBudget = 0;
    ui.play.textContent = 'Run'; ui.status.textContent = 'PAUSED';
    ui.inspectorData.hidden = true; ui.inspectorEmpty.hidden = false;
    updateMetrics(); draw();
  }

  function frame(now) {
    const wallDt = Math.min(0.05, (now - lastWallTime) / 1000); lastWallTime = now;
    if (running) {
      simBudget += wallDt * Number(ui.speed.value);
      let safety = 0;
      while (simBudget >= FIXED_DT && safety < 5000) { sim.step(FIXED_DT); simBudget -= FIXED_DT; safety++; }
    }
    draw(); updateMetrics(); updateInspector(); requestAnimationFrame(frame);
  }

  const scaleX = x => x / MM_W * canvas.width;
  const scaleY = y => y / MM_H * canvas.height;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#090b0d'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(132,204,22,.08)'; ctx.fillRect(0, 0, scaleX(NEST_X), canvas.height);
    ctx.fillStyle = 'rgba(251,191,36,.08)'; ctx.fillRect(scaleX(FOOD_X), 0, canvas.width - scaleX(FOOD_X), canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.strokeRect(.5, .5, canvas.width - 1, canvas.height - 1);
    ctx.setLineDash([6, 8]);
    ctx.strokeStyle = 'rgba(132,204,22,.35)'; ctx.beginPath(); ctx.moveTo(scaleX(NEST_X), 0); ctx.lineTo(scaleX(NEST_X), canvas.height); ctx.stroke();
    ctx.strokeStyle = 'rgba(251,191,36,.35)'; ctx.beginPath(); ctx.moveTo(scaleX(FOOD_X), 0); ctx.lineTo(scaleX(FOOD_X), canvas.height); ctx.stroke();
    ctx.setLineDash([]);

    if (ui.trails.checked) {
      ctx.lineWidth = 1;
      for (const ant of sim.ants) {
        if (ant.tail.length < 2) continue;
        ctx.strokeStyle = ant.carryingFood ? 'rgba(251,191,36,.10)' : 'rgba(255,255,255,.055)';
        ctx.beginPath();
        ant.tail.forEach((p, i) => { const x = scaleX(p.x), y = scaleY(p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      }
    }
    for (const ant of sim.ants) drawAnt(ant);
  }

  function drawAnt(ant) {
    const x = scaleX(ant.x), y = scaleY(ant.y), size = 3.2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ant.heading);
    ctx.fillStyle = ant.id === selectedId ? '#d9f99d' : (ant.carryingFood ? '#fbbf24' : '#f5f5f4');
    ctx.beginPath(); ctx.ellipse(0, 0, size * 1.55, size, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(size * 1.7, 0, size * .62, 0, Math.PI * 2); ctx.fill();
    if (ui.contacts.checked && ant.contactFlash > 0) {
      ctx.strokeStyle = 'rgba(251,113,133,.9)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    if (ui.ids.checked) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '10px ui-monospace'; ctx.fillText(String(ant.id), x + 5, y - 5); }
  }

  function updateMetrics() {
    if (!sim) return;
    const moving = sim.ants.filter(a => a.pauseRemaining <= 0).length;
    const summary = sim.summary();
    ui.simTime.textContent = `${sim.time.toFixed(1)} s`;
    ui.meanSpeed.textContent = `${summary.mean_speed_while_moving_mm_s.toFixed(1)} mm/s`;
    ui.moving.textContent = `${moving}/${sim.ants.length}`;
    ui.contactCount.textContent = sim.metrics.contacts.toLocaleString();
    ui.foodVisits.textContent = sim.metrics.foodVisits.toLocaleString();
    ui.nestReturns.textContent = sim.metrics.nestReturns.toLocaleString();
  }

  function updateInspector() {
    if (selectedId == null || !sim) return;
    const a = sim.ants[selectedId]; if (!a) return;
    ui.workerId.textContent = `#${a.id}`;
    ui.workerX.textContent = `${a.x.toFixed(2)} mm`;
    ui.workerY.textContent = `${a.y.toFixed(2)} mm`;
    ui.workerHeading.textContent = `${((((a.heading * 180 / Math.PI) % 360) + 360) % 360).toFixed(1)}°`;
    ui.workerSpeed.textContent = `${(a.pauseRemaining > 0 ? 0 : a.speed).toFixed(2)} mm/s`;
    ui.workerState.textContent = a.state;
    ui.workerContacts.textContent = a.contacts;
    ui.workerTrips.textContent = a.foodTrips;
    ui.accessibleInfo.innerHTML = '';
    const facts = [
      'own current movement state',
      `own carrying state: ${a.carryingFood ? 'food loaded' : 'empty'}`,
      'local wall/contact events',
      `recent contact count: ${a.contacts}`,
      'individual activity/persistence parameters'
    ];
    for (const f of facts) { const li = document.createElement('li'); li.textContent = f; ui.accessibleInfo.appendChild(li); }
  }

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * canvas.width;
    const my = (e.clientY - r.top) / r.height * canvas.height;
    let best = null, bestD = Infinity;
    for (const a of sim.ants) {
      const dx = scaleX(a.x) - mx, dy = scaleY(a.y) - my, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = a; }
    }
    if (best && bestD < 16 * 16) { selectedId = best.id; ui.inspectorEmpty.hidden = true; ui.inspectorData.hidden = false; updateInspector(); }
  });

  ui.play.addEventListener('click', () => { running = !running; ui.play.textContent = running ? 'Pause' : 'Run'; ui.status.textContent = running ? 'RUNNING' : 'PAUSED'; });
  ui.reset.addEventListener('click', reset);
  ui.step.addEventListener('click', () => { running = false; ui.play.textContent = 'Run'; ui.status.textContent = 'PAUSED'; sim.runFor(1, FIXED_DT); updateMetrics(); draw(); });
  ui.seed.addEventListener('change', reset); ui.ants.addEventListener('change', reset);

  reset(); requestAnimationFrame(frame);
})();
