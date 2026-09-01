'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Simulation } = require('../src/sim-core.js');
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '../experiments/open_arena_control.json'), 'utf8'));
base.observation.record_trajectories = false;
const dts = [0.01, 0.02, 0.05];
const trials = 240;
function run(dt) {
  let dist = 0, speed = 0;
  for (let i = 0; i < trials; i++) {
    const sim = new Simulation(base, 810000 + i);
    const s = sim.runFor(20, dt);
    dist += s.mean_distance_mm;
    speed += s.mean_speed_while_moving_mm_s;
  }
  return { dt, meanDistance: dist / trials, meanSpeed: speed / trials };
}
const rows = dts.map(run);
const ref = rows[1];
for (const r of rows) {
  const distanceDelta = Math.abs(r.meanDistance - ref.meanDistance) / ref.meanDistance;
  const speedDelta = Math.abs(r.meanSpeed - ref.meanSpeed) / ref.meanSpeed;
  assert(distanceDelta < 0.06, `distance changed too much with dt: ${JSON.stringify(rows)}`);
  assert(speedDelta < 0.04, `speed changed too much with dt: ${JSON.stringify(rows)}`);
}
console.log('timestep-convergence.test.js PASS', JSON.stringify(rows));
