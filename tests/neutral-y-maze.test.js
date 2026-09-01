'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Simulation, FIXED_DT } = require('../src/sim-core.js');
const exp = JSON.parse(fs.readFileSync(path.join(__dirname, '../experiments/neutral_y_maze.json'), 'utf8'));
const counts = { left: 0, right: 0, timeout: 0 };
const trials = 600;
for (let i = 0; i < trials; i++) {
  const sim = new Simulation(exp, 700000 + i);
  sim.runUntilComplete(exp.duration_s, FIXED_DT);
  counts[sim.ants[0].outcome]++;
}
const choices = counts.left + counts.right;
const leftRate = choices ? counts.left / choices : 0;
const timeoutRate = counts.timeout / trials;
assert(choices > trials * 0.85, `too many neutral-maze timeouts: ${JSON.stringify(counts)}`);
assert(leftRate > 0.44 && leftRate < 0.56, `neutral maze has directional bias: ${JSON.stringify(counts)}`);
assert(timeoutRate < 0.15, `neutral maze timeout rate too high: ${timeoutRate}`);
console.log(`neutral-y-maze.test.js PASS left=${counts.left} right=${counts.right} timeout=${counts.timeout}`);
