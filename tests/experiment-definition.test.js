'use strict';
const assert = require('assert');
const { Simulation, normalizeExperiment } = require('../src/sim-core.js');
const raw = {
  id: 'definition_test',
  world: { width: 42, height: 17 },
  workers: 1,
  duration_s: 5,
  observation: { fps: 10, record_trajectories: true },
  geometry: { primitives: [{ type: 'rect', x: 0, y: 0, width: 42, height: 17 }] },
  spawn: { x: 7, y: 8, heading_rad: 0, position_jitter_mm: 0, heading_jitter_rad: 0 },
  movement: { base_speed_mm_s: 5, speed_sd_mm_s: 0, angular_sigma_rad_sqrt_s: 0, speed_reversion_rate_s: 2, speed_noise_sigma_sqrt_s: 0, pause_rate_s: 0, pause_min_s: 0.1, pause_max_s: 0.2 },
  terminal_regions: [{ label: 'finish', shape: { type: 'circle', x: 12, y: 8, radius: 0.5 } }]
};
const normalized = normalizeExperiment(raw);
assert.strictEqual(normalized.world.width, 42);
const sim = new Simulation(raw, 1);
assert.strictEqual(sim.ants[0].x, 7);
assert.strictEqual(sim.ants[0].y, 8);
sim.runUntilComplete(3, 0.02);
assert.strictEqual(sim.ants[0].outcome, 'finish', 'terminal scoring must come from experiment definition');
assert(sim.observations.length > 1, 'observation cadence must be driven by experiment definition');
assert(!('carryingFood' in sim.ants[0]), 'v0.2 ant should not contain provisional food/navigation state');
console.log('experiment-definition.test.js PASS');
