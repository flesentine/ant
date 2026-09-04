(function (root, factory) {
  const core = (typeof module === 'object' && module.exports) ? require('./sim-core.js') : root.AntLabCore;
  const h3 = (typeof module === 'object' && module.exports) ? require('./h3.js') : root.AntLabH3;
  const api = factory(core, h3);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AntLabH5 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core, h3) {
  'use strict';
  if (!core) throw new Error('ANTLAB H5 requires AntLabCore');
  if (!h3) throw new Error('ANTLAB H5 requires AntLabH3');

  const EPS = 1e-12;
  const SUPPORTED_HISTORY_MM = Object.freeze([200, 1000]);
  const CHOICE_STREAM_PREFIX = 'biology_h5_search_choice:';
  const ANGLE_STREAM_PREFIX = 'biology_h5_search_angle:';

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function originSearchConfig(model) {
    const c = model && model.origin_search;
    if (!c || c.enabled !== true) return null;
    if (c.origin?.type !== 'arena_center_physical_entry_reference') {
      throw new Error('H5 requires arena_center_physical_entry_reference origin.');
    }
    if (c.temporal_profile?.type !== 'constant_over_observed_arena_traversal') {
      throw new Error('H5 requires constant_over_observed_arena_traversal temporal profile.');
    }
    if (c.radial_gate?.type !== 'boundary_normalized_linear') {
      throw new Error('H5 requires boundary_normalized_linear radial gate.');
    }
    if (c.direction?.type !== 'origin_bearing_von_mises_shared_kappa') {
      throw new Error('H5 requires origin_bearing_von_mises_shared_kappa direction law.');
    }
    if (c.history_response?.type !== 'observed_level_effective_amplitudes') {
      throw new Error('H5 requires observed_level_effective_amplitudes history response.');
    }
    const inputFact = String(c.input_fact || '');
    const alpha200 = Number(c.history_response.alpha_search_200);
    const alpha1000 = Number(c.history_response.alpha_search_1000);
    const supported = c.history_response.supported_history_mm;
    if (!inputFact) throw new Error('H5 requires observable input_fact.');
    if (JSON.stringify(supported) !== JSON.stringify(SUPPORTED_HISTORY_MM)) {
      throw new Error('H5-v1 supports history distances exactly 200 and 1000 mm only.');
    }
    if (!(alpha1000 >= 0 && alpha1000 <= alpha200 && alpha200 <= 1)) {
      throw new Error('H5 requires 0 <= alpha_search_1000 <= alpha_search_200 <= 1.');
    }
    return {
      inputFact,
      alpha200,
      alpha1000,
      mechanismId: c.mechanism_id || 'H5_origin_referenced_search_v1'
    };
  }

  function historyAmplitude(historyMm, cfg) {
    const L = Number(historyMm);
    if (L === 200) return cfg.alpha200;
    if (L === 1000) return cfg.alpha1000;
    throw new Error(`H5-v1 unsupported recent_constrained_travel_mm ${historyMm}; only 200 and 1000 are defined.`);
  }

  function originCoordinates(apparatus) {
    const w = Number(apparatus?.world?.width);
    const h = Number(apparatus?.world?.height);
    if (!(w > 0 && h > 0)) throw new Error('H5 requires positive rectangular arena dimensions.');
    return { x: w / 2, y: h / 2, width: w, height: h };
  }

  function boundaryNormalizedRadius(x, y, originX, originY, width, height) {
    x = Number(x); y = Number(y); originX = Number(originX); originY = Number(originY);
    width = Number(width); height = Number(height);
    if (![x, y, originX, originY, width, height].every(Number.isFinite) || !(width > 0 && height > 0)) {
      throw new Error('H5 boundary-normalized radius received invalid geometry.');
    }
    const dx = x - originX;
    const dy = y - originY;
    const r = Math.hypot(dx, dy);
    if (!(r > EPS)) return 0;
    const ux = dx / r;
    const uy = dy / r;
    const candidates = [];
    if (ux > EPS) candidates.push((width - originX) / ux);
    else if (ux < -EPS) candidates.push((0 - originX) / ux);
    if (uy > EPS) candidates.push((height - originY) / uy);
    else if (uy < -EPS) candidates.push((0 - originY) / uy);
    const positive = candidates.filter(t => Number.isFinite(t) && t > EPS);
    if (!positive.length) throw new Error('H5 could not resolve arena boundary along origin ray.');
    const dEdge = Math.min(...positive);
    return clamp(r / dEdge, 0, 1);
  }

  function initializeAnt(ant, model, resolvedState, seed, streamSeed, apparatus) {
    const cfg = originSearchConfig(model);
    ant.h5ChoiceRng = null;
    ant.h5AngleRng = null;
    ant.h5StreamSeeds = null;
    ant.h5HistoryMm = null;
    ant.h5SearchAmplitude = 0;
    ant.h5OriginX = null;
    ant.h5OriginY = null;
    ant.h5SearchSelections = 0;
    ant.h5ChoiceDrawCount = 0;
    ant.h5AngleDrawCount = 0;
    ant.h5LastWeight = 0;
    ant.h5LastRadialGate = 0;
    ant.h5LastSearchAngle = null;
    if (!cfg) return null;

    const L = Number(resolvedState[cfg.inputFact]);
    const alpha = historyAmplitude(L, cfg);
    const origin = originCoordinates(apparatus);
    const choiceSeed = streamSeed(seed, `${CHOICE_STREAM_PREFIX}${ant.id}`);
    const angleSeed = streamSeed(seed, `${ANGLE_STREAM_PREFIX}${ant.id}`);
    ant.h5ChoiceRng = new core.RNG(choiceSeed);
    ant.h5AngleRng = new core.RNG(angleSeed);
    ant.h5StreamSeeds = { choice: choiceSeed, angle: angleSeed };
    ant.h5HistoryMm = L;
    ant.h5SearchAmplitude = alpha;
    ant.h5OriginX = origin.x;
    ant.h5OriginY = origin.y;
    ant.latentState = ant.latentState || {};
    ant.latentState.h5_origin_x_mm = origin.x;
    ant.latentState.h5_origin_y_mm = origin.y;
    ant.latentState.h5_history_mm = L;
    ant.latentState.h5_search_amplitude = alpha;
    ant.latentState.h5_mechanism = cfg.mechanismId;
    return cfg;
  }

  function resolveReorientation(ant, sim, baselineHeading) {
    const cfg = sim.h5Config || originSearchConfig(sim.model);
    if (!cfg) {
      return {
        heading: baselineHeading,
        selected: false,
        choice: null,
        searchAngle: null,
        radialGate: 0,
        weight: 0,
        bearingToOrigin: null
      };
    }
    if (!ant.h5ChoiceRng || !ant.h5AngleRng) throw new Error('H5 RNG streams were not initialized.');
    if (!sim.h3Config) throw new Error('H5 requires the H3 run-and-reorientation substrate.');
    if (Math.abs(Number(sim.h3Config.rho)) > EPS) {
      throw new Error('H5 requires the H3 history-dependent hazard effect to be disabled (rho=0).');
    }

    const choice = ant.h5ChoiceRng.next();
    ant.h5ChoiceDrawCount++;
    const searchAngle = h3.sampleVonMises(ant.h5AngleRng, sim.h3Config.kappa);
    ant.h5AngleDrawCount++;

    const width = Number(sim.apparatus.world.width);
    const height = Number(sim.apparatus.world.height);
    const radialGate = boundaryNormalizedRadius(
      ant.x, ant.y, ant.h5OriginX, ant.h5OriginY, width, height
    );
    const weight = clamp(ant.h5SearchAmplitude * radialGate, 0, 1);
    const dx = ant.h5OriginX - ant.x;
    const dy = ant.h5OriginY - ant.y;
    const atOrigin = Math.hypot(dx, dy) <= EPS;
    const bearingToOrigin = atOrigin ? null : Math.atan2(dy, dx);
    const selected = !atOrigin && choice < weight;
    const heading = selected
      ? core.normalizeAngle(bearingToOrigin + searchAngle)
      : baselineHeading;

    if (selected) ant.h5SearchSelections++;
    ant.h5LastWeight = weight;
    ant.h5LastRadialGate = radialGate;
    ant.h5LastSearchAngle = searchAngle;
    if (ant.latentState) {
      ant.latentState.h5_last_weight = weight;
      ant.latentState.h5_last_radial_gate = radialGate;
      ant.latentState.h5_search_selections = ant.h5SearchSelections;
    }
    return { heading, selected, choice, searchAngle, radialGate, weight, bearingToOrigin };
  }

  return {
    EPS,
    SUPPORTED_HISTORY_MM,
    CHOICE_STREAM_PREFIX,
    ANGLE_STREAM_PREFIX,
    originSearchConfig,
    historyAmplitude,
    originCoordinates,
    boundaryNormalizedRadius,
    initializeAnt,
    resolveReorientation
  };
});
