'use strict';
const assert = require('assert');
const { RNG, hazard } = require('../src/sim-core.js');
function estimate(dt, trials=100000) {
  const rng = new RNG(1234567);
  const rate = 0.7;
  let count = 0;
  for (let i=0;i<trials;i++) if (hazard(rate, dt, rng)) count++;
  return count / trials;
}
for (const dt of [0.02,0.1,0.2]) {
  const observed = estimate(dt);
  const expected = 1 - Math.exp(-0.7 * dt);
  assert(Math.abs(observed-expected) < 0.004, `hazard mismatch dt=${dt}`);
}
console.log('hazard.test.js PASS');
