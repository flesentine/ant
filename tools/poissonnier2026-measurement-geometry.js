#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const core = require('../src/sim-core.js');
const { streamSeed } = require('../src/integrity.js');

const POLICY_FILE = 'reference/poissonnier2026_open_arena_measurement_policy_v1.json';
const POLICY_GIT_BLOB_SHA = 'fd2718cf9351b655340eacd868adc536301a83a4';
const GEOMETRY_FILE = 'reference/poissonnier2026_open_arena_measurement_geometry_v1.json';
const GEOMETRY_GIT_BLOB_SHA = 'af0ec6fbacf83b915dd78cb3a822609c126dc1e7';
const DERIVATION_FILE = 'tools/derive-poissonnier2026-measurement-geometry.py';
const DERIVATION_GIT_BLOB_SHA = 'f9c1a9433158ca77e78ad350437fd6b21ed6a483';
const SOURCE_XLSX_SHA256 = 'b311d5fdc89eac56724bb5195743cf4bb52a6cff4040b18704353091e1fe6318';
const RNG_STREAM = 'poissonnier2026_measurement_geometry_v1';
const EXPECTED_COLONIES = Object.freeze([0, 7, 16, 20, 21, 27]);
const ALLOWED_ROW_FIELDS = Object.freeze([
  'ant_id', 'colony', 'arena_width_mm', 'arena_height_mm',
  'entry_reference_x_mm', 'entry_reference_y_mm',
  'first_track_x_mm', 'first_track_y_mm'
]);

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function gitBlobShaBuffer(buf) {
  return crypto
    .createHash('sha1')
    .update(Buffer.from(`blob ${buf.length}\0`))
    .update(buf)
    .digest('hex');
}

function gitBlobShaFile(file) {
  return gitBlobShaBuffer(fs.readFileSync(file));
}

function assertBlob(root, rel, expected) {
  const file = path.resolve(root, rel);
  const actual = gitBlobShaFile(file);
  if (actual !== expected) {
    throw new Error(`Frozen measurement input blob mismatch for ${rel}: expected ${expected}, got ${actual}.`);
  }
  return actual;
}

function validateGeometryReference(geometry) {
  if (!geometry || geometry.id !== 'poissonnier2026_open_arena_measurement_geometry_v1') {
    throw new Error('Unexpected open-arena measurement geometry reference.');
  }
  if (geometry.source_xlsx_sha256 !== SOURCE_XLSX_SHA256) {
    throw new Error('Measurement geometry source XLSX does not match frozen SHA256.');
  }
  if (!Array.isArray(geometry.rows) || geometry.rows.length !== 51) {
    throw new Error('Frozen measurement geometry must contain exactly 51 rows.');
  }
  const allowed = [...ALLOWED_ROW_FIELDS].sort();
  const ids = new Set();
  const colonies = new Set();
  for (const row of geometry.rows) {
    const keys = Object.keys(row).sort();
    if (JSON.stringify(keys) !== JSON.stringify(allowed)) {
      throw new Error(`Unexpected measurement geometry row fields for ant ${row.ant_id}.`);
    }
    if (!Number.isInteger(row.ant_id) || ids.has(row.ant_id)) {
      throw new Error(`Invalid or duplicate measurement geometry ant_id ${row.ant_id}.`);
    }
    ids.add(row.ant_id);
    colonies.add(row.colony);
    if (!(row.arena_width_mm > 0 && row.arena_height_mm > 0)) {
      throw new Error(`Non-positive measurement arena dimensions for ant ${row.ant_id}.`);
    }
    if (!(row.first_track_x_mm >= 0 && row.first_track_x_mm <= row.arena_width_mm &&
          row.first_track_y_mm >= 0 && row.first_track_y_mm <= row.arena_height_mm)) {
      throw new Error(`First-track position outside measurement arena for ant ${row.ant_id}.`);
    }
    if (!(row.entry_reference_x_mm >= 0 && row.entry_reference_x_mm <= row.arena_width_mm &&
          row.entry_reference_y_mm >= 0 && row.entry_reference_y_mm <= row.arena_height_mm)) {
      throw new Error(`Entry reference outside measurement arena for ant ${row.ant_id}.`);
    }
    if (Math.abs(row.entry_reference_x_mm - row.arena_width_mm / 2) > 1e-9 ||
        Math.abs(row.entry_reference_y_mm - row.arena_height_mm / 2) > 1e-9) {
      throw new Error(`Entry reference is not the reconstructed central trail/hole reference for ant ${row.ant_id}.`);
    }
  }
  const gotColonies = [...colonies].sort((a, b) => a - b);
  if (JSON.stringify(gotColonies) !== JSON.stringify(EXPECTED_COLONIES)) {
    throw new Error(`Unexpected measurement geometry colonies: ${gotColonies.join(',')}.`);
  }
  return true;
}

function loadFrozenMeasurementGeometry(root = path.resolve(__dirname, '..')) {
  const verified = {
    policy: assertBlob(root, POLICY_FILE, POLICY_GIT_BLOB_SHA),
    geometry: assertBlob(root, GEOMETRY_FILE, GEOMETRY_GIT_BLOB_SHA),
    derivation: assertBlob(root, DERIVATION_FILE, DERIVATION_GIT_BLOB_SHA)
  };
  const policy = JSON.parse(fs.readFileSync(path.resolve(root, POLICY_FILE), 'utf8'));
  const geometry = JSON.parse(fs.readFileSync(path.resolve(root, GEOMETRY_FILE), 'utf8'));
  if (policy.id !== 'poissonnier2026_open_arena_measurement_policy_v1' ||
      policy.status !== 'frozen_measurement_input_policy_before_H5_mechanism_freeze_or_estimator_implementation') {
    throw new Error('Unexpected frozen measurement policy identity or status.');
  }
  if (policy.source.geometry_reference_git_blob_sha !== GEOMETRY_GIT_BLOB_SHA ||
      policy.source.derivation_script_git_blob_sha !== DERIVATION_GIT_BLOB_SHA ||
      policy.source.published_dataset_sha256 !== SOURCE_XLSX_SHA256) {
    throw new Error('Frozen measurement policy provenance does not match adapter constants.');
  }
  if (policy.geometry_sampler.rng_stream_name !== RNG_STREAM ||
      policy.geometry_sampler.type !== 'uniform_empirical_discrete') {
    throw new Error('Unexpected frozen measurement geometry sampler.');
  }
  validateGeometryReference(geometry);
  return { policy, geometry, verified };
}

function geometryPool(rows, heldoutColony) {
  if (!Array.isArray(rows)) throw new Error('Measurement geometry rows are required.');
  let pool;
  if (heldoutColony == null) {
    pool = rows.slice();
  } else {
    if (!EXPECTED_COLONIES.includes(Number(heldoutColony))) {
      throw new Error(`Unknown held-out colony ${heldoutColony}.`);
    }
    pool = rows.filter(r => Number(r.colony) !== Number(heldoutColony));
    if (pool.some(r => Number(r.colony) === Number(heldoutColony))) {
      throw new Error('Held-out measurement geometry leaked into the training pool.');
    }
  }
  pool.sort((a, b) => a.ant_id - b.ant_id);
  if (!pool.length) throw new Error('Measurement geometry pool is empty.');
  return pool;
}

function sampleGeometry(pool, trialSeed) {
  if (!Array.isArray(pool) || pool.length === 0) throw new Error('Non-empty measurement geometry pool required.');
  const rng = new core.RNG(streamSeed(trialSeed, RNG_STREAM));
  const u = rng.next();
  const index = Math.min(pool.length - 1, Math.floor(u * pool.length));
  return { row: pool[index], index, u };
}

function applyGeometry(bundle, row) {
  if (!bundle || !bundle.experiment || !bundle.apparatus || !bundle.observation) {
    throw new Error('Measurement geometry adapter requires experiment, apparatus, and observation bundle layers.');
  }
  const b = clone(bundle);
  const w = Number(row.arena_width_mm);
  const h = Number(row.arena_height_mm);
  const sx = Number(row.first_track_x_mm);
  const sy = Number(row.first_track_y_mm);
  const cy = Number(row.entry_reference_y_mm);
  if (!(w > 0 && h > 0 && sx >= 0 && sx <= w && sy >= 0 && sy <= h && cy >= 0 && cy <= h)) {
    throw new Error('Invalid sampled measurement geometry row.');
  }

  b.apparatus.world.width = w;
  b.apparatus.world.height = h;
  const arenaRect = (b.apparatus.geometry?.primitives || []).find(p => p.type === 'rect' && p.name === 'a4_arena') ||
                    (b.apparatus.geometry?.primitives || []).find(p => p.type === 'rect');
  if (!arenaRect) throw new Error('Open-arena rectangle not found in apparatus geometry.');
  arenaRect.x = 0;
  arenaRect.y = 0;
  arenaRect.width = w;
  arenaRect.height = h;

  const existingDefaultHeading = Number(b.apparatus.entry_points?.default?.heading_rad) || 0;
  const existingCenterHeading = Number(b.apparatus.entry_points?.center?.heading_rad) || existingDefaultHeading;
  b.apparatus.entry_points = b.apparatus.entry_points || {};
  b.apparatus.entry_points.default = { x: sx, y: sy, heading_rad: existingDefaultHeading };
  b.apparatus.entry_points.center = { x: sx, y: sy, heading_rad: existingCenterHeading };

  b.experiment.protocol = b.experiment.protocol || {};
  b.experiment.protocol.entry_state = Object.assign({}, b.experiment.protocol.entry_state || {}, {
    position_jitter_mm: 0
  });

  b.observation.metric_definitions = b.observation.metric_definitions || {};
  const zone = b.observation.metric_definitions.central_zone_fraction;
  if (!zone || zone.type !== 'horizontal_band') {
    throw new Error('Expected article-defined horizontal central zone.');
  }
  zone.center_y_mm = cy;
  zone.half_width_mm = 10;

  return b;
}

function assertTargetAlignment(geometry, target) {
  if (!target || !Array.isArray(target.rows)) throw new Error('Estimation target rows are required for alignment check.');
  const geoIds = geometry.rows.map(r => r.ant_id).sort((a, b) => a - b);
  const targetIds = target.rows.map(r => Number(r.ant_id)).sort((a, b) => a - b);
  if (JSON.stringify(geoIds) !== JSON.stringify(targetIds)) {
    throw new Error('Measurement geometry ant IDs do not exactly match the development target ant IDs.');
  }
  return true;
}

module.exports = {
  POLICY_FILE,
  POLICY_GIT_BLOB_SHA,
  GEOMETRY_FILE,
  GEOMETRY_GIT_BLOB_SHA,
  DERIVATION_FILE,
  DERIVATION_GIT_BLOB_SHA,
  SOURCE_XLSX_SHA256,
  RNG_STREAM,
  EXPECTED_COLONIES,
  ALLOWED_ROW_FIELDS,
  gitBlobShaBuffer,
  gitBlobShaFile,
  validateGeometryReference,
  loadFrozenMeasurementGeometry,
  geometryPool,
  sampleGeometry,
  applyGeometry,
  assertTargetAlignment
};
