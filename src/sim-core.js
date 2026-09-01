(function (root, factory) {
  const core = factory();
  if (typeof module === 'object' && module.exports) module.exports = core;
  root.AntLabCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MM_W = 300;
  const MM_H = 80;
  const NEST_X = 30;
  const FOOD_X = 270;
  const FIXED_DT = 0.02;

  function hash32(x) {
    x |= 0;
    x = (x + 0x9e3779b9) | 0;
    x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
    x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
    return (x ^ (x >>> 15)) >>> 0;
  }

  class RNG {
    constructor(seed) { this.state = seed >>> 0 || 1; }
    next() {
      let t = this.state += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    normal() {
      const u = Math.max(this.next(), 1e-12);
      const v = this.next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
  }

  function hazard(ratePerSecond, dt, rng) {
    return rng.next() < 1 - Math.exp(-ratePerSecond * dt);
  }

  function blendAngles(a, b, weight) {
    const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
    return a + d * weight;
  }

  class Ant {
    constructor(id, worldSeed) {
      this.id = id;
      this.rng = new RNG(hash32(worldSeed ^ Math.imul(id + 1, 0x45d9f3b)));
      this.x = 8 + this.rng.next() * 18;
      this.y = 7 + this.rng.next() * (MM_H - 14);
      this.heading = (this.rng.next() - 0.5) * 0.5;
      this.baseSpeed = Math.max(4.5, 8.5 + this.rng.normal() * 1.2);
      this.speed = this.baseSpeed;
      this.activityBias = clamp01(0.55 + this.rng.normal() * 0.13);
      this.persistence = clamp01(0.55 + this.rng.normal() * 0.16);
      this.state = 'exploring';
      this.pauseRemaining = 0;
      this.contacts = 0;
      this.foodTrips = 0;
      this.carryingFood = false;
      this.wasInFood = false;
      this.wasInNest = true;
      this.contactFlash = 0;
      this.tail = [];
      this.tailClock = 0;
      this.distanceTravelled = 0;
      this.movingTime = 0;
    }

    update(dt, sim) {
      this.contactFlash = Math.max(0, this.contactFlash - dt);

      if (this.pauseRemaining <= 0) {
        const pauseRate = 0.035 * (1.15 - this.activityBias);
        if (hazard(pauseRate, dt, this.rng)) {
          this.pauseRemaining = 0.15 + this.rng.next() * 1.2;
          this.state = 'paused';
        }
      }

      if (this.pauseRemaining > 0) {
        this.pauseRemaining -= dt;
        if (this.pauseRemaining <= 0) this.state = this.carryingFood ? 'returning' : 'exploring';
        this.recordTail(dt);
        return;
      }

      const angularSigma = 1.05 * (1.18 - 0.55 * this.persistence);
      this.heading += this.rng.normal() * angularSigma * Math.sqrt(dt);

      // Provisional weak directional tendencies. These are explicitly NOT yet a validated
      // Lasius navigation model; they only allow the Build-0 food-loop smoke test to complete.
      if (this.carryingFood) {
        this.heading = blendAngles(this.heading, Math.PI, 0.035);
        this.state = 'returning';
      } else if (this.x < NEST_X + 25) {
        this.heading = blendAngles(this.heading, 0, 0.009);
        this.state = 'exploring';
      }

      const actualSpeed = this.speed * (0.9 + 0.2 * this.rng.next());
      const dx = Math.cos(this.heading) * actualSpeed * dt;
      const dy = Math.sin(this.heading) * actualSpeed * dt;
      this.x += dx;
      this.y += dy;
      this.distanceTravelled += Math.hypot(dx, dy);
      this.movingTime += dt;

      if (this.x < 0) { this.x = -this.x; this.heading = Math.PI - this.heading; }
      if (this.x > MM_W) { this.x = 2 * MM_W - this.x; this.heading = Math.PI - this.heading; }
      if (this.y < 0) { this.y = -this.y; this.heading = -this.heading; }
      if (this.y > MM_H) { this.y = 2 * MM_H - this.y; this.heading = -this.heading; }

      const inFood = this.x >= FOOD_X;
      const inNest = this.x <= NEST_X;

      if (inFood && !this.wasInFood && !this.carryingFood) {
        this.carryingFood = true;
        this.foodTrips += 1;
        sim.metrics.foodVisits += 1;
        this.state = 'feeding';
        this.pauseRemaining = 0.25 + this.rng.next() * 0.55;
      }

      if (inNest && !this.wasInNest && this.carryingFood) {
        this.carryingFood = false;
        sim.metrics.nestReturns += 1;
        this.state = 'unloading';
        this.pauseRemaining = 0.35 + this.rng.next() * 0.8;
      }

      this.wasInFood = inFood;
      this.wasInNest = inNest;
      this.recordTail(dt);
    }

    recordTail(dt) {
      this.tailClock += dt;
      if (this.tailClock >= 0.25) {
        this.tailClock = 0;
        this.tail.push({ x: this.x, y: this.y });
        if (this.tail.length > 28) this.tail.shift();
      }
    }
  }

  class Simulation {
    constructor(seed, antCount) {
      this.seed = seed >>> 0;
      this.time = 0;
      this.ants = [];
      this.metrics = { contacts: 0, foodVisits: 0, nestReturns: 0 };
      for (let i = 0; i < antCount; i++) this.ants.push(new Ant(i, this.seed));
      this.cellSize = 4;
      this.grid = new Map();
    }

    step(dt = FIXED_DT) {
      for (const ant of this.ants) ant.update(dt, this);
      this.resolveContacts();
      this.time += dt;
    }

    runFor(seconds, dt = FIXED_DT) {
      const steps = Math.round(seconds / dt);
      for (let i = 0; i < steps; i++) this.step(dt);
      return this.summary();
    }

    resolveContacts() {
      this.grid.clear();
      for (const ant of this.ants) {
        const k = this.key(ant.x, ant.y);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(ant);
      }

      for (const ant of this.ants) {
        const cx = Math.floor(ant.x / this.cellSize);
        const cy = Math.floor(ant.y / this.cellSize);
        for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          const bucket = this.grid.get(`${cx + ox},${cy + oy}`);
          if (!bucket) continue;
          for (const other of bucket) {
            if (other.id <= ant.id) continue;
            const dx = other.x - ant.x;
            const dy = other.y - ant.y;
            if (dx * dx + dy * dy >= 1.6 * 1.6) continue;

            const contactAngle = Math.atan2(dy, dx);
            ant.heading = blendAngles(ant.heading, contactAngle + Math.PI / 2, 0.12);
            other.heading = blendAngles(other.heading, contactAngle - Math.PI / 2, 0.12);

            if (ant.contactFlash <= 0 && other.contactFlash <= 0) {
              ant.contacts++;
              other.contacts++;
              this.metrics.contacts++;
            }
            ant.contactFlash = 0.12;
            other.contactFlash = 0.12;
          }
        }
      }
    }

    key(x, y) {
      return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }

    summary() {
      const totalDistance = this.ants.reduce((s, a) => s + a.distanceTravelled, 0);
      const totalMovingTime = this.ants.reduce((s, a) => s + a.movingTime, 0);
      return {
        seed: this.seed,
        workers: this.ants.length,
        time_s: Number(this.time.toFixed(6)),
        food_visits: this.metrics.foodVisits,
        nest_returns: this.metrics.nestReturns,
        contacts: this.metrics.contacts,
        mean_speed_while_moving_mm_s: totalMovingTime > 0 ? totalDistance / totalMovingTime : 0,
        mean_distance_mm: this.ants.length ? totalDistance / this.ants.length : 0
      };
    }

    fingerprint() {
      // Rounded state fingerprint for deterministic reference testing.
      return JSON.stringify({
        time: Number(this.time.toFixed(6)),
        metrics: this.metrics,
        ants: this.ants.map(a => [
          a.id,
          Number(a.x.toFixed(6)),
          Number(a.y.toFixed(6)),
          Number(a.heading.toFixed(6)),
          a.carryingFood ? 1 : 0,
          a.foodTrips,
          a.contacts
        ])
      });
    }
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  return { MM_W, MM_H, NEST_X, FOOD_X, FIXED_DT, RNG, hazard, blendAngles, Ant, Simulation };
});
