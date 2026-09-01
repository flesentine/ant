(function (root, factory) {
  const core = (typeof module === 'object' && module.exports) ? require('./sim-core.js') : root.AntLabCore;
  const api = factory(core);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AntLabIntegrity = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (core) {
  'use strict';

  if (!core) throw new Error('ANTLAB integrity layer requires AntLabCore');

  const STATE_FORBIDDEN_KEYS = new Set([
    'movement', 'contacts', 'chemical_sensing', 'memory_rules', 'physiology_rules',
    'base_speed_mm_s', 'speed_sd_mm_s', 'angular_sigma_rad_sqrt_s',
    'speed_reversion_rate_s', 'speed_noise_sigma_sqrt_s', 'pause_rate_s',
    'pause_min_s', 'pause_max_s', 'avoidance_turn_rad'
  ]);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function assertNoModelParameters(value, path = 'state') {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => assertNoModelParameters(v, `${path}[${i}]`));
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (STATE_FORBIDDEN_KEYS.has(key)) {
        throw new Error(`Model parameter forbidden at ${path}.${key}; state may record facts but may not redefine biology`);
      }
      assertNoModelParameters(child, `${path}.${key}`);
    }
  }

  function normalizeState(raw) {
    const s = clone(raw || {});
    s.schema_version = s.schema_version || 1;
    s.id = s.id || 'default_agent_state';
    s.species = s.species || 'unknown';
    s.initial = Object.assign({
      experience: 'naive',
      travel_direction: 'outbound',
      feeding_state: 'unfed',
      crop_fraction: 0,
      food_memory: false,
      recent_travel_mm: 0
    }, s.initial || {});
    assertNoModelParameters(s.initial, 'state.initial');
    s.provenance = s.provenance || {};
    return s;
  }

  function normalizeObservation(raw) {
    const o = clone(raw || {});
    o.schema_version = o.schema_version || 1;
    o.id = o.id || 'default_observation';
    o.fps = Math.max(0.1, Number(o.fps) || 25);
    o.record_trajectories = o.record_trajectories !== false;
    o.tracking = Object.assign({
      position_noise_mm_sd: 0,
      movement_classifier: 'simulation_truth',
      status: 'engineering_default'
    }, o.tracking || {});
    o.metric_definitions = o.metric_definitions || {};
    return o;
  }

  function normalizeScoring(raw) {
    const s = clone(raw || {});
    s.schema_version = s.schema_version || 1;
    s.id = s.id || 'default_scoring';
    s.type = s.type || 'none';
    s.irreversible = s.irreversible !== false;
    s.regions = Array.isArray(s.regions) ? s.regions : [];
    return s;
  }

  function refId(value) {
    return typeof value === 'string' ? value.replace(/^.*\//, '').replace(/\.json$/, '') : null;
  }

  function assertRef(experiment, key, loaded) {
    const expected = refId(experiment[key]);
    if (expected && expected !== loaded.id) {
      throw new Error(`Experiment ${key} reference ${expected} does not match loaded ${key} ${loaded.id}`);
    }
  }

  function streamSeed(seed, name) {
    const text = `${seed >>> 0}:${name}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0 || 1;
  }

  function applyScoring(apparatus, scoring) {
    const a = clone(apparatus);
    a.terminal_regions = [];
    if (scoring.type === 'first_region_entry') {
      a.terminal_regions = clone(scoring.regions);
    } else if (scoring.type === 'apparatus_boundary') {
      a.boundary = Object.assign({}, a.boundary || {}, {
        mode: 'terminate',
        outcome: scoring.outcome || 'boundary_exit'
      });
    } else if (scoring.type !== 'none') {
      throw new Error(`Unsupported scoring type '${scoring.type}'`);
    }
    return a;
  }

  function compileIntegrityBundle(bundle) {
    if (!bundle || !bundle.experiment || !bundle.model || !bundle.apparatus || !bundle.state || !bundle.observation || !bundle.scoring) {
      throw new Error('Integrity simulation requires { experiment, model, apparatus, state, observation, scoring }');
    }

    const experiment = core.normalizeExperiment(bundle.experiment);
    const model = core.normalizeModel(bundle.model);
    const apparatus = core.normalizeApparatus(bundle.apparatus);
    const state = normalizeState(bundle.state);
    const observation = normalizeObservation(bundle.observation);
    const scoring = normalizeScoring(bundle.scoring);

    assertRef(experiment, 'model', model);
    assertRef(experiment, 'apparatus', apparatus);
    assertRef(experiment, 'state', state);
    assertRef(experiment, 'observation', observation);
    assertRef(experiment, 'scoring', scoring);

    if (state.species !== 'unknown' && model.species !== 'unknown' && state.species !== model.species) {
      throw new Error(`State species ${state.species} does not match model species ${model.species}`);
    }

    const stateFacts = clone((experiment.protocol && experiment.protocol.state_facts) || {});
    assertNoModelParameters(stateFacts, 'experiment.protocol.state_facts');
    const resolvedState = Object.assign({}, clone(state.initial), stateFacts);

    const protocolEntry = clone((experiment.protocol && experiment.protocol.entry_state) || {});
    const coreExperiment = clone(experiment);
    coreExperiment.observation = {
      fps: observation.fps,
      record_trajectories: observation.record_trajectories,
      metrics: clone(experiment.requested_metrics || observation.default_metrics || [])
    };
    coreExperiment.protocol = Object.assign({}, coreExperiment.protocol, {
      entry_state: Object.assign({}, protocolEntry, {
        position_jitter_mm: 0,
        heading_jitter_rad: 0
      })
    });

    const scoredApparatus = applyScoring(apparatus, scoring);
    const coreBundle = { experiment: coreExperiment, model, apparatus: scoredApparatus };

    const layerHashes = {
      model_hash: core.contentHash(model),
      state_hash: core.contentHash(state),
      apparatus_hash: core.contentHash(apparatus),
      protocol_hash: core.contentHash(experiment.protocol || {}),
      observation_hash: core.contentHash(observation),
      scoring_hash: core.contentHash(scoring),
      experiment_hash: core.contentHash(experiment)
    };
    layerHashes.integrity_bundle_hash = core.contentHash({ model, state, apparatus, protocol: experiment.protocol || {}, observation, scoring, experiment });

    return { experiment, model, apparatus, state, observation, scoring, resolvedState, coreBundle, layerHashes, entryState: protocolEntry };
  }

  function sampleProtocolEntry(sim, ant, protocolRng, entryState) {
    const entry = sim.compiled.entry;
    const jitter = Number(entryState.position_jitter_mm) || 0;
    let x = Number(entry.x), y = Number(entry.y);
    if (jitter > 0) {
      for (let tries = 0; tries < 30; tries++) {
        const a = protocolRng.next() * Math.PI * 2;
        const r = Math.sqrt(protocolRng.next()) * jitter;
        const tx = Number(entry.x) + Math.cos(a) * r;
        const ty = Number(entry.y) + Math.sin(a) * r;
        if (core.pointInGeometry(tx, ty, sim.apparatus.geometry)) { x = tx; y = ty; break; }
      }
    }
    ant.x = x; ant.y = y; ant.startX = x; ant.startY = y;
    const baseHeading = Number(entry.heading_rad == null ? entryState.heading_rad : entry.heading_rad) || 0;
    const headingJitter = Number(entryState.heading_jitter_rad) || 0;
    ant.heading = core.normalizeAngle(baseHeading + (headingJitter ? protocolRng.normal() * headingJitter : 0));
  }

  function reinitializeBiology(sim, ant, seed) {
    ant.rng = new core.RNG(streamSeed(seed, `biology:${ant.id}`));
    const m = sim.model.movement;
    ant.baseSpeed = Math.max(0.5, Number(m.base_speed_mm_s) + ant.rng.normal() * Number(m.speed_sd_mm_s));
    ant.speedFactor = Math.max(0.75, Math.min(1.25, 1 + ant.rng.normal() * 0.03));
    ant.turnScale = Math.max(0.7, Math.min(1.3, 1 + ant.rng.normal() * 0.08));
    ant.pauseScale = Math.max(0.65, Math.min(1.5, 1 + ant.rng.normal() * 0.12));
  }

  class Simulation extends core.Simulation {
    constructor(bundle, seed = 1, workerOverride = null) {
      const integrity = compileIntegrityBundle(bundle);
      super(integrity.coreBundle, seed, workerOverride);
      this.integrity = integrity;
      this.stateProfile = integrity.state;
      this.observationProfile = integrity.observation;
      this.scoringProfile = integrity.scoring;
      this.layerHashes = integrity.layerHashes;
      this.rngStreamSeeds = {
        protocol: streamSeed(seed, 'protocol'),
        treatment: streamSeed(seed, 'treatment'),
        observation: streamSeed(seed, 'observation')
      };
      this.protocolRng = new core.RNG(this.rngStreamSeeds.protocol);
      this.treatmentRng = new core.RNG(this.rngStreamSeeds.treatment);
      this.observationRng = new core.RNG(this.rngStreamSeeds.observation);

      for (const ant of this.ants) {
        reinitializeBiology(this, ant, seed);
        sampleProtocolEntry(this, ant, this.protocolRng, integrity.entryState);
        ant.agentState = clone(integrity.resolvedState);
      }

      // Re-record t=0 after protocol-owned entry randomization. Observation RNG is
      // intentionally independent and currently unused until measurement noise is enabled.
      this.observations = [];
      this.nextObservationTime = 0;
      if (this.experiment.observation.record_trajectories) this.recordObservation(0);
    }

    summary() {
      const base = super.summary();
      base.state_id = this.stateProfile.id;
      base.observation_id = this.observationProfile.id;
      base.scoring_id = this.scoringProfile.id;
      base.provenance = Object.assign({}, base.provenance, this.layerHashes, {
        rng_stream_seeds: Object.assign({}, this.rngStreamSeeds),
        biology_stream_scheme: 'seed + named biology:<ant_id> stream'
      });
      return base;
    }

    fingerprint() {
      return JSON.stringify({
        core: super.fingerprint(),
        integrity_bundle_hash: this.layerHashes.integrity_bundle_hash,
        state: this.stateProfile.id,
        observation: this.observationProfile.id,
        scoring: this.scoringProfile.id,
        agent_states: this.ants.map(a => [a.id, a.agentState])
      });
    }
  }

  return {
    streamSeed,
    assertNoModelParameters,
    normalizeState,
    normalizeObservation,
    normalizeScoring,
    compileIntegrityBundle,
    Simulation,
    FIXED_DT: core.FIXED_DT
  };
});
