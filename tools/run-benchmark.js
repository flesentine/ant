#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { Simulation, FIXED_DT } = require('../src/sim-core.js');

function value(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : fallback;
}
const experimentName = value('experiment', 'neutral_y_maze.json');
const trials = Math.max(1, Number(value('trials', 400)) || 400);
const firstSeed = Math.max(1, Number(value('seed', 928491)) || 928491);
const dt = Math.max(0.001, Number(value('dt', FIXED_DT)) || FIXED_DT);
const experimentPath = path.resolve(__dirname, '../experiments', experimentName);
const experiment = JSON.parse(fs.readFileSync(experimentPath, 'utf8'));
experiment.observation = Object.assign({}, experiment.observation, { record_trajectories: false });

const rows = [];
const outcomes = {};
for (let i = 0; i < trials; i++) {
  const sim = new Simulation(experiment, firstSeed + i);
  const row = experiment.terminal_regions && experiment.terminal_regions.length
    ? sim.runUntilComplete(experiment.duration_s, dt)
    : sim.runFor(experiment.duration_s, dt);
  rows.push(row);
  for (const [k, v] of Object.entries(row.outcomes)) outcomes[k] = (outcomes[k] || 0) + v;
}
function mean(k) { return rows.reduce((s,r)=>s+r[k],0)/rows.length; }
const scored = Object.entries(outcomes).filter(([k]) => k !== 'timeout').reduce((s,[,v])=>s+v,0);
const report = {
  model: 'antlab-v0.2-experiment-engine',
  experiment_id: experiment.id,
  experiment_file: experimentName,
  trials,
  dt_s: dt,
  seed_range: [firstSeed, firstSeed + trials - 1],
  aggregate: {
    outcomes,
    scored_trials: scored,
    outcome_rates_among_scored: Object.fromEntries(Object.entries(outcomes).filter(([k]) => k !== 'timeout').map(([k,v]) => [k, scored ? v / scored : 0])),
    timeout_rate: (outcomes.timeout || 0) / trials,
    mean_speed_while_moving_mm_s: mean('mean_speed_while_moving_mm_s'),
    mean_distance_mm: mean('mean_distance_mm')
  },
  trials_data: rows
};
const out = path.resolve(process.cwd(), 'benchmark-results.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.aggregate, null, 2));
console.log(`\nSaved ${out}`);
