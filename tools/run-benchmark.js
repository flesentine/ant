#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { Simulation, FIXED_DT } = require('../src/sim-core.js');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] != null ? Number(process.argv[i + 1]) : fallback;
}
const trials = Math.max(1, arg('trials', 20));
const workers = Math.max(1, arg('workers', 120));
const duration = Math.max(1, arg('seconds', 300));
const firstSeed = Math.max(1, arg('seed', 928491));
const rows = [];
for (let i = 0; i < trials; i++) {
  const sim = new Simulation(firstSeed + i, workers);
  rows.push(sim.runFor(duration, FIXED_DT));
}
function mean(k) { return rows.reduce((s,r)=>s+r[k],0)/rows.length; }
const report = {
  model: 'antlab-v0.1-provisional-locomotion',
  trials, workers, duration_s: duration, fixed_dt_s: FIXED_DT,
  seed_range: [firstSeed, firstSeed + trials - 1],
  aggregate: {
    mean_food_visits: mean('food_visits'),
    mean_nest_returns: mean('nest_returns'),
    mean_contacts: mean('contacts'),
    mean_speed_while_moving_mm_s: mean('mean_speed_while_moving_mm_s'),
    mean_distance_per_worker_mm: mean('mean_distance_mm')
  },
  trials_data: rows
};
const out = path.resolve(process.cwd(), 'benchmark-results.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.aggregate, null, 2));
console.log(`\nSaved ${out}`);
