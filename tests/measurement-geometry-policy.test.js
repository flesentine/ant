'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const core = require('../src/sim-core.js');
const { Simulation, streamSeed, FIXED_DT } = require('../src/integrity.js');
const { loadBundle } = require('../tools/load-bundle.js');
const geom = require('../tools/poissonnier2026-measurement-geometry.js');

const root = path.resolve(__dirname, '..');
const loaded = geom.loadFrozenMeasurementGeometry(root);
const geometry = loaded.geometry;
const policy = loaded.policy;
const target = JSON.parse(fs.readFileSync(path.join(root, 'reference/poissonnier2026_h2_estimation_targets.json'), 'utf8'));

assert.strictEqual(policy.firewall.H5_mechanism_still_unfrozen, true);
assert.strictEqual(policy.firewall.H5_parameter_search_allowed, false);
assert.strictEqual(policy.firewall.ymaze_access, false);
assert.strictEqual(geometry.rows.length, 51);
assert.deepStrictEqual(geometry.summary.colonies, geom.EXPECTED_COLONIES);
assert.strictEqual(geometry.summary.max_abs_Y_Line_minus_vertical_midpoint_mm, 0);
assert(geom.assertTargetAlignment(geometry, target));

const expectedFields = [...geom.ALLOWED_ROW_FIELDS].sort();
for (const row of geometry.rows) {
  assert.deepStrictEqual(Object.keys(row).sort(), expectedFields);
}

for (const heldout of geom.EXPECTED_COLONIES) {
  const heldoutN = geometry.rows.filter(r => r.colony === heldout).length;
  const pool = geom.geometryPool(geometry.rows, heldout);
  assert.strictEqual(pool.length, 51 - heldoutN);
  assert(pool.every(r => r.colony !== heldout));
  assert.deepStrictEqual(pool.map(r => r.ant_id), [...pool].map(r => r.ant_id).sort((a, b) => a - b));

  for (const seed of [1, 42, 424242, 990000, 1490000]) {
    const a = geom.sampleGeometry(pool, seed);
    const b = geom.sampleGeometry(pool, seed);
    assert.strictEqual(a.index, b.index);
    assert.strictEqual(a.row.ant_id, b.row.ant_id);
    assert.strictEqual(a.u, b.u);

    const biologyA = new core.RNG(streamSeed(seed, 'biology:0'));
    const biologyState = biologyA.state;
    geom.sampleGeometry(pool, seed);
    const biologyB = new core.RNG(streamSeed(seed, 'biology:0'));
    assert.strictEqual(biologyState, biologyB.state);
  }
}

const pool = geom.geometryPool(geometry.rows, 0);
const sampled = geom.sampleGeometry(pool, 990000).row;
const shortBase = loadBundle('open_arena_short_control.json', { modelId: 'lasius_niger_locomotion_h3_v1' });
const longBase = loadBundle('open_arena_long_control.json', { modelId: 'lasius_niger_locomotion_h3_v1' });
const short = geom.applyGeometry(shortBase, sampled);
const long = geom.applyGeometry(longBase, sampled);

for (const b of [short, long]) {
  assert.strictEqual(b.apparatus.world.width, sampled.arena_width_mm);
  assert.strictEqual(b.apparatus.world.height, sampled.arena_height_mm);
  assert.strictEqual(b.apparatus.entry_points.center.x, sampled.first_track_x_mm);
  assert.strictEqual(b.apparatus.entry_points.center.y, sampled.first_track_y_mm);
  assert.strictEqual(b.experiment.protocol.entry_state.position_jitter_mm, 0);
  assert.strictEqual(b.observation.metric_definitions.central_zone_fraction.center_y_mm, sampled.entry_reference_y_mm);
  assert.strictEqual(b.observation.metric_definitions.central_zone_fraction.half_width_mm, 10);
}
assert.deepStrictEqual(short.apparatus.world, long.apparatus.world);
assert.deepStrictEqual(short.apparatus.entry_points.center, long.apparatus.entry_points.center);

const sim = new Simulation(short, 990000);
assert(Math.abs(sim.ants[0].x - sampled.first_track_x_mm) < 1e-12);
assert(Math.abs(sim.ants[0].y - sampled.first_track_y_mm) < 1e-12);
const sx = sim.ants[0].x;
const sy = sim.ants[0].y;
const summary = sim.runUntilComplete(0.4, FIXED_DT);
assert(summary && summary.observed_metrics);
assert.strictEqual(sim.apparatus.world.width, sampled.arena_width_mm);
assert.strictEqual(sim.apparatus.world.height, sampled.arena_height_mm);
assert.strictEqual(summary.observed_metrics.observation_id, short.observation.id);
assert(Number.isFinite(Math.hypot(sim.ants[0].x - sx, sim.ants[0].y - sy)));

const frozenHistorical = {
  'apparatus/poissonnier2026_open_arena.json': '1f6461ffa392656a7cf807413ad2120636d99ee9',
  'experiments/open_arena_short_control.json': '2a75bcff9e88dc8617911886f8381315d5c05638',
  'experiments/open_arena_long_control.json': 'f38632b4fad43f0282b85e345416a1c6f1593725',
  'observations/poissonnier2026_tracking_25fps.json': '8720b5ee34165d167a7ff7a5a363449ffabef2ad'
};
for (const [rel, expected] of Object.entries(frozenHistorical)) {
  assert.strictEqual(geom.gitBlobShaFile(path.join(root, rel)), expected, rel);
}

console.log('measurement-geometry-policy.test.js PASS');
