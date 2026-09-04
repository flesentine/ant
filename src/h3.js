(function (root, factory) {
  const core = (typeof module === 'object' && module.exports) ? require('./sim-core.js') : root.AntLabCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AntLabH3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';
  if (!core) throw new Error('ANTLAB H3 requires AntLabCore');
  const EPS = 1e-12;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function reorientationGateConfig(model) {
    const c = model && model.reorientation_gate;
    if (!c || c.enabled !== true) return null;
    if (c.baseline?.type !== 'run_and_reorientation') throw new Error('H3 requires run_and_reorientation baseline.');
    if (c.initialization?.type !== 'saturating_distance') throw new Error('H3 requires saturating_distance initialization.');
    if (c.decay?.type !== 'exponential') throw new Error('H3 requires exponential gate decay.');
    if (c.effect?.type !== 'turn_hazard_reduction') throw new Error('H3 requires turn_hazard_reduction effect.');
    const inputFact = String(c.input_fact || '');
    const ell0 = Number(c.baseline.mean_free_path_mm);
    const kappa = Number(c.baseline.turn_concentration);
    const lambda = Number(c.initialization.history_distance_scale_mm);
    const tau = Number(c.decay.gate_tau_s);
    const rho = Number(c.effect.max_hazard_reduction_fraction);
    if (!inputFact) throw new Error('H3 requires an observable input_fact.');
    if (!(ell0 > 0)) throw new Error('H3 mean_free_path_mm must be > 0.');
    if (!(kappa >= 0)) throw new Error('H3 turn_concentration must be >= 0.');
    if (!(lambda > 0)) throw new Error('H3 history_distance_scale_mm must be > 0.');
    if (!(tau > 0)) throw new Error('H3 gate_tau_s must be > 0.');
    if (!(rho >= 0 && rho < 1)) throw new Error('H3 max_hazard_reduction_fraction must be in [0,1).');
    return { inputFact, ell0, kappa, lambda, tau, rho, mechanismId: c.mechanism_id || 'H3_transient_reorientation_gate' };
  }

  function drawUnitHazard(rng) {
    return -Math.log(Math.max(rng.next(), 1e-12));
  }

  function sampleVonMises(rng, kappa) {
    kappa = Math.max(0, Number(kappa) || 0);
    if (kappa < 1e-8) return (rng.next() * 2 - 1) * Math.PI;
    const a = 1 + Math.sqrt(1 + 4 * kappa * kappa);
    const b = (a - Math.sqrt(2 * a)) / (2 * kappa);
    const r = (1 + b * b) / (2 * b);
    for (let tries = 0; tries < 10000; tries++) {
      const u1 = rng.next();
      const z = Math.cos(Math.PI * u1);
      const f = (1 + r * z) / (r + z);
      const c = kappa * (r - f);
      const u2 = Math.max(rng.next(), 1e-12);
      if (c * (2 - c) - u2 > 0 || Math.log(c / u2) + 1 - c >= 0) {
        const sign = rng.next() > 0.5 ? 1 : -1;
        return sign * Math.acos(clamp(f, -1, 1));
      }
    }
    throw new Error('H3 von Mises sampler failed to converge.');
  }

  function initializeAnt(ant, model, resolvedState, seed, streamSeed) {
    const cfg = reorientationGateConfig(model);
    ant.reorientationGate = 0;
    ant.reorientationGateInitial = 0;
    ant.h3TurnCount = 0;
    ant.h3FirstTurnTime = null;
    ant.h3FirstTurnDistance = null;
    ant.h3LastTurnAngle = null;
    ant.h3EventRng = null;
    ant.h3AngleRng = null;
    ant.h3HazardRemaining = null;
    ant.h3StreamSeeds = null;
    ant.substepTrace = [];
    if (!cfg) return null;
    const L = Math.max(0, Number(resolvedState[cfg.inputFact]) || 0);
    const g0 = clamp(1 - Math.exp(-L / cfg.lambda), 0, 1);
    const eventSeed = streamSeed(seed, `biology_h3_turn_event:${ant.id}`);
    const angleSeed = streamSeed(seed, `biology_h3_turn_angle:${ant.id}`);
    ant.h3EventRng = new core.RNG(eventSeed);
    ant.h3AngleRng = new core.RNG(angleSeed);
    ant.h3HazardRemaining = drawUnitHazard(ant.h3EventRng);
    ant.h3StreamSeeds = { event: eventSeed, angle: angleSeed };
    ant.reorientationGate = g0;
    ant.reorientationGateInitial = g0;
    ant.latentState = ant.latentState || {};
    ant.latentState.reorientation_gate = g0;
    ant.latentState.reorientation_gate_input_mm = L;
    ant.latentState.reorientation_gate_mechanism = cfg.mechanismId;
    return cfg;
  }

  function setGate(ant, cfg, gateAtStepStart, elapsed) {
    const g = clamp(gateAtStepStart * Math.exp(-Math.max(0, elapsed) / cfg.tau), 0, 1);
    ant.reorientationGate = g;
    if (ant.latentState) ant.latentState.reorientation_gate = g;
  }

  function integratedHazard(speed, cfg, gateAtStepStart, elapsed, duration) {
    if (!(duration > 0) || !(speed > 0)) return 0;
    const a = Math.exp(-Math.max(0, elapsed) / cfg.tau);
    const b = Math.exp(-Math.max(0, elapsed + duration) / cfg.tau);
    const effectiveTime = duration - cfg.rho * gateAtStepStart * cfg.tau * (a - b);
    return Math.max(0, speed / cfg.ell0 * effectiveTime);
  }

  function solveEventOffset(speed, cfg, gateAtStepStart, elapsed, duration, targetHazard) {
    let lo = 0, hi = duration;
    for (let i = 0; i < 52; i++) {
      const mid = (lo + hi) / 2;
      if (integratedHazard(speed, cfg, gateAtStepStart, elapsed, mid) >= targetHazard) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  }

  function lastInsideFraction(x0, y0, x1, y1, geometry) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const x = x0 + (x1 - x0) * mid;
      const y = y0 + (y1 - y0) * mid;
      if (core.pointInGeometry(x, y, geometry)) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  function traceSegment(ant, start_s, end_s, x0, y0, x1, y1, heading, state, outcome) {
    if (!(end_s > start_s + EPS)) return;
    ant.substepTrace = ant.substepTrace || [];
    ant.substepTrace.push({ start_s, end_s, x0, y0, x1, y1, heading, state, outcome: outcome || null });
  }

  function moveSegment(ant, segmentDt, sim, elapsedBefore, speed) {
    if (!(segmentDt > EPS) || ant.finished) return { activeDt: 0, finished: ant.finished };
    const ox = ant.x, oy = ant.y, segmentHeading = ant.heading;
    const nx = ox + Math.cos(segmentHeading) * speed * segmentDt;
    const ny = oy + Math.sin(segmentHeading) * speed * segmentDt;
    if (!core.pointInGeometry(nx, ny, sim.apparatus.geometry)) {
      if (sim.apparatus.boundary.mode !== 'terminate') {
        throw new Error('H3 v1 currently requires a terminating apparatus boundary; reflective H3 geometry is not implemented.');
      }
      const alpha = lastInsideFraction(ox, oy, nx, ny, sim.apparatus.geometry);
      const activeDt = segmentDt * alpha;
      ant.x = ox + (nx - ox) * alpha;
      ant.y = oy + (ny - oy) * alpha;
      const moved = Math.hypot(ant.x - ox, ant.y - oy);
      ant.distanceTravelled += moved;
      if (moved > 0) ant.movingTime += activeDt;
      const outcome = sim.apparatus.boundary.outcome || 'boundary_exit';
      ant.finish(outcome, sim.time + elapsedBefore + activeDt, sim, { x: ant.x, y: ant.y });
      traceSegment(ant, elapsedBefore, elapsedBefore + activeDt, ox, oy, ant.x, ant.y, segmentHeading, 'moving', outcome);
      return { activeDt, finished: true };
    }
    ant.x = nx;
    ant.y = ny;
    const moved = speed * segmentDt;
    ant.distanceTravelled += moved;
    if (moved > 0) ant.movingTime += segmentDt;
    const terminal = core.terminalAt(ant.x, ant.y, sim.apparatus.terminal_regions);
    let outcome = null;
    if (terminal) {
      outcome = terminal.label || 'terminal';
      ant.finish(outcome, sim.time + elapsedBefore + segmentDt, sim, { x: ant.x, y: ant.y });
    }
    traceSegment(ant, elapsedBefore, elapsedBefore + segmentDt, ox, oy, ant.x, ant.y, segmentHeading, 'moving', outcome);
    return { activeDt: segmentDt, finished: ant.finished };
  }

  function updateAnt(ant, dt, sim) {
    ant.substepTrace = [];
    if (ant.finished) return;
    const cfg = sim.h3Config || reorientationGateConfig(sim.model);
    if (!cfg) throw new Error('H3 update called without an enabled reorientation_gate model.');
    ant.contactFlash = Math.max(0, ant.contactFlash - dt);
    const m = sim.model.movement;
    const gate0 = clamp(Number(ant.reorientationGate) || 0, 0, 1);

    if (ant.pauseRemaining <= 0 && core.hazard(Number(m.pause_rate_s) * ant.pauseScale, dt, ant.rng)) {
      ant.pauseRemaining = Number(m.pause_min_s) + ant.rng.next() * (Number(m.pause_max_s) - Number(m.pause_min_s));
      ant.state = 'paused';
    }
    if (ant.pauseRemaining > 0) {
      const px = ant.x, py = ant.y, ph = ant.heading;
      ant.pauseRemaining -= dt;
      traceSegment(ant, 0, dt, px, py, px, py, ph, 'paused', null);
      if (ant.pauseRemaining <= 0) ant.state = 'moving';
      setGate(ant, cfg, gate0, dt);
      ant.recordTail(dt);
      return;
    }

    const theta = Number(m.speed_reversion_rate_s);
    const sigmaSpeed = Number(m.speed_noise_sigma_sqrt_s);
    ant.speedFactor += theta * (1 - ant.speedFactor) * dt + sigmaSpeed * Math.sqrt(dt) * ant.rng.normal();
    ant.speedFactor = clamp(ant.speedFactor, .6, 1.4);
    ant.rng.normal(); // preserve the pre-H3 biology RNG cadence while suppressing continuous angular diffusion.
    const speed = ant.baseSpeed * ant.speedFactor;
    let elapsed = 0;
    let remaining = dt;
    let eventGuard = 0;

    while (remaining > EPS && !ant.finished) {
      if (++eventGuard > 1000) throw new Error('H3 generated too many reorientation events inside one physics step.');
      const availableHazard = integratedHazard(speed, cfg, gate0, elapsed, remaining);
      if (availableHazard + 1e-14 < ant.h3HazardRemaining) {
        const moved = moveSegment(ant, remaining, sim, elapsed, speed);
        ant.h3HazardRemaining = Math.max(0, ant.h3HazardRemaining - integratedHazard(speed, cfg, gate0, elapsed, moved.activeDt));
        elapsed += moved.activeDt;
        remaining = Math.max(0, dt - elapsed);
        break;
      }

      const eventDt = solveEventOffset(speed, cfg, gate0, elapsed, remaining, ant.h3HazardRemaining);
      const moved = moveSegment(ant, eventDt, sim, elapsed, speed);
      elapsed += moved.activeDt;
      remaining = Math.max(0, dt - elapsed);
      if (moved.finished) break;
      ant.h3HazardRemaining = drawUnitHazard(ant.h3EventRng);
      const angle = sampleVonMises(ant.h3AngleRng, cfg.kappa);
      const baselineHeading = core.normalizeAngle(ant.heading + angle);
      let h5Decision = null;
      if (sim.h5Config) {
        if (!sim.h5Runtime || typeof sim.h5Runtime.resolveReorientation !== 'function') {
          throw new Error('H5 runtime is unavailable at an H3 reorientation event.');
        }
        h5Decision = sim.h5Runtime.resolveReorientation(ant, sim, baselineHeading);
        ant.heading = h5Decision.heading;
      } else {
        ant.heading = baselineHeading;
      }
      ant.h3TurnCount++;
      ant.h3LastTurnAngle = angle;
      if (ant.h3FirstTurnTime == null) {
        ant.h3FirstTurnTime = sim.time + elapsed;
        ant.h3FirstTurnDistance = ant.distanceTravelled;
      }
      const event = { time: sim.time + elapsed, type: 'h3_reorientation', ant: ant.id, sequence: ant.h3TurnCount, angle_rad: angle, x: ant.x, y: ant.y };
      if (h5Decision) {
        event.h5_search_selected = h5Decision.selected;
        event.h5_choice = h5Decision.choice;
        event.h5_search_angle_rad = h5Decision.searchAngle;
        event.h5_radial_gate = h5Decision.radialGate;
        event.h5_weight = h5Decision.weight;
        event.h5_bearing_to_origin_rad = h5Decision.bearingToOrigin;
      }
      sim.events.push(event);
    }

    setGate(ant, cfg, gate0, elapsed);
    if (!ant.finished) ant.state = 'moving';
    ant.recordTail(dt);
  }

  return {
    reorientationGateConfig,
    drawUnitHazard,
    sampleVonMises,
    initializeAnt,
    integratedHazard,
    solveEventOffset,
    updateAnt,
    traceSegment
  };
});
