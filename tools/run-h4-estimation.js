#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const { Simulation, streamSeed, FIXED_DT } = require('../src/integrity.js');
const core = require('../src/sim-core.js');
const h2est = require('./run-h2-estimation.js');
const h3est = require('./run-h3-estimation.js');
const { loadBundle, readJson } = require('./load-bundle.js');

const POLICY_FILE = 'hypotheses/h4_parameter_estimation_v1.json';
const POLICY_GIT_BLOB_SHA = 'a889007f988628a8e61139f4349c23714cc1dd68';
const ENTRY_STREAM = 'h2_estimation_entry_transition_v1';
const ASSAYS = Object.freeze([
  ['s', 'open_arena_short_control.json'],
  ['l', 'open_arena_long_control.json']
]);
const HALTON = Object.freeze([
  [2, 'base_speed_mm_s'],
  [3, 'angular_sigma_rad_sqrt_s'],
  [5, 'entry_orientation_retention_q'],
  [7, 'lambda_activation_mm'],
  [11, 'tau_activation_s'],
  [13, 'rho_speed']
]);

const FROZEN_RUNTIME_BLOBS = Object.freeze({
  'src/integrity.js': 'f23c68a6955832b70eeb3bd3e6893d71a3759018',
  'src/sim-core.js': '24777aac3577d442893e4779d70aee4e27761fe8',
  'src/measurement.js': '8845726e02360655c605851662256bc729277b21',
  'src/h3.js': '9bb8fc966a5aa4d4173f9bda2020c6d9cd9368f1',
  'tools/load-bundle.js': '235067f10ed85eeeaebcfe6fef0963940d516b6b',
  'tools/run-h2-estimation.js': '0fb069b3772c30f5769b4d1be285be7f67f3efe3',
  'tools/run-h3-estimation.js': '9b27812fcb869489d4979e26e8085cb8d2bf6fc1',
  'models/lasius_niger_locomotion_h4_v1.json': '4f14e9f9b5eaab4cc89f28cbd033a8fd26a8f944',
  'experiments/open_arena_short_control.json': '2a75bcff9e88dc8617911886f8381315d5c05638',
  'experiments/open_arena_long_control.json': 'f38632b4fad43f0282b85e345416a1c6f1593725',
  'states/naive_outbound_v1.json': 'd3db29a83eed68bc28f771c147dd33966764d535',
  'apparatus/poissonnier2026_open_arena.json': '1f6461ffa392656a7cf807413ad2120636d99ee9',
  'observations/poissonnier2026_tracking_25fps.json': '8720b5ee34165d167a7ff7a5a363449ffabef2ad',
  'scoring/open_arena_first_border_v1.json': '7e6ee59c223a9da1763d6b54ef3a2e3938c8bee0'
});
const FROZEN_REFERENCE_COMPARATOR_BLOBS = Object.freeze({
  'reference/calibration_manifest.json': '29044577af38dced5cccb83c687117ee878fd66c',
  'reference/poissonnier2026_source_manifest.json': '545c108f0da20cbebbe8e95c62e43fc5443d9f18',
  'models/lasius_niger_locomotion_h2_v1.json': '3d12970e782b5fd1dc54727f4d8df044c11801db',
  'models/lasius_niger_locomotion_h3_v1.json': 'fe33c31facfcabb7ddeb9a7bedf71ac248ad8e84',
  'reports/h2_parameter_estimation_500x60_v1.json': '342f7a5af7c1ed71a8bdb7ff14becf38d24daa88',
  'reports/h3_parameter_estimation_500x60_v1.json': '1d5c1b88ca9b425e927d761bc3ff1e5bad5bd5f3'
});

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : def;
}

function hasArg(name) {
  return process.argv.includes(`--${name}`);
}

function narg(name, def) {
  return Number(arg(name, def));
}

function near(a, b, tol = 1e-12) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
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

function assertExactPolicyBlob(root) {
  const file = path.resolve(root, POLICY_FILE);
  const sha = gitBlobShaFile(file);
  if (sha !== POLICY_GIT_BLOB_SHA) {
    throw new Error(
      `H4 estimation policy blob mismatch: expected ${POLICY_GIT_BLOB_SHA}, got ${sha}. ` +
      'Refusing to estimate against a changed policy.'
    );
  }
  return { file, sha, policy: readJson(file) };
}

function assertBlobSet(root, blobs, label) {
  const verified = {};
  for (const [rel, expected] of Object.entries(blobs)) {
    const file = path.resolve(root, rel);
    const actual = gitBlobShaFile(file);
    if (actual !== expected) {
      throw new Error(`${label} blob mismatch for ${rel}: expected ${expected}, got ${actual}.`);
    }
    verified[rel] = actual;
  }
  return verified;
}

function assertFrozenRuntimeBlobs(root) {
  return assertBlobSet(root, FROZEN_RUNTIME_BLOBS, 'Frozen H4 runtime input');
}

function assertFrozenReferenceComparatorBlobs(root) {
  return assertBlobSet(root, FROZEN_REFERENCE_COMPARATOR_BLOBS, 'Frozen H4 reference/comparator input');
}

function currentRepoCommit(root) {
  try {
    return childProcess.execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch (_) {
    return process.env.GITHUB_SHA || null;
  }
}

function assertSafeReportOutput(root, out) {
  const resolved = path.resolve(out);
  if (path.extname(resolved).toLowerCase() !== '.json') {
    throw new Error('H4 estimation output must be a JSON report.');
  }
  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) {
    throw new Error('H4 estimation refuses to write through a symbolic-link output path.');
  }
  const rel = path.relative(root, resolved);
  const insideRepo = rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
  if (insideRepo) {
    const reportsRoot = path.resolve(root, 'reports');
    const reportRel = path.relative(reportsRoot, resolved);
    const insideReports = reportRel !== '' && !reportRel.startsWith('..' + path.sep) && reportRel !== '..' && !path.isAbsolute(reportRel);
    if (!insideReports) {
      throw new Error('H4 estimation may write inside the repository only under reports/.');
    }
  }
  return resolved;
}

function halton(index, base) {
  let f = 1;
  let r = 0;
  let i = index;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
}

function mapVal(u, spec) {
  const [a, b] = spec.bounds;
  if (spec.scale === 'log') {
    return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u);
  }
  return a + (b - a) * u;
}

function nullCandidate(i, policy) {
  const p = policy.estimated_parameters;
  const index = i + 1;
  return {
    base_speed_mm_s: mapVal(halton(index, 2), p.base_speed_mm_s),
    angular_sigma_rad_sqrt_s: mapVal(halton(index, 3), p.angular_sigma_rad_sqrt_s),
    q: mapVal(halton(index, 5), p.entry_orientation_retention_q),
    // Inert bookkeeping only under rho=0. Never report these as null estimates.
    lambda_activation_mm: 500,
    tau_activation_s: 5,
    rho_speed: 0
  };
}

function contextCandidate(i, policy) {
  const p = policy.estimated_parameters;
  const index = i + 1;
  return {
    base_speed_mm_s: mapVal(halton(index, 2), p.base_speed_mm_s),
    angular_sigma_rad_sqrt_s: mapVal(halton(index, 3), p.angular_sigma_rad_sqrt_s),
    q: mapVal(halton(index, 5), p.entry_orientation_retention_q),
    lambda_activation_mm: mapVal(halton(index, 7), p.lambda_activation_mm),
    tau_activation_s: mapVal(halton(index, 11), p.tau_activation_s),
    rho_speed: mapVal(halton(index, 13), p.rho_speed)
  };
}

function nullAnchor(nullSelected) {
  return {
    base_speed_mm_s: nullSelected.base_speed_mm_s,
    angular_sigma_rad_sqrt_s: nullSelected.angular_sigma_rad_sqrt_s,
    q: nullSelected.q,
    // Inert because rho=0.
    lambda_activation_mm: 500,
    tau_activation_s: 5,
    rho_speed: 0,
    _source: 'null_anchor'
  };
}

function reportCandidate(c, kind, source = 'halton') {
  const out = {
    base_speed_mm_s: c.base_speed_mm_s,
    angular_sigma_rad_sqrt_s: c.angular_sigma_rad_sqrt_s,
    q: c.q
  };

  if (kind === 'context') {
    if (source === 'exact_null_anchor') {
      out.lambda_activation_mm = null;
      out.tau_activation_s = null;
      out.rho_speed = 0;
      out.null_equivalent_anchor = true;
    } else {
      out.lambda_activation_mm = c.lambda_activation_mm;
      out.tau_activation_s = c.tau_activation_s;
      out.rho_speed = c.rho_speed;
    }
  }
  return out;
}

function configuredModel(base, c) {
  const m = clone(base);
  m.movement.base_speed_mm_s = c.base_speed_mm_s;
  m.movement.angular_sigma_rad_sqrt_s = c.angular_sigma_rad_sqrt_s;

  const a = m.locomotor_activation;
  if (!a || a.enabled !== true) {
    throw new Error('H4 estimator requires enabled locomotor_activation in the H4 model.');
  }
  a.initialization.history_distance_scale_mm = c.lambda_activation_mm;
  a.decay.activation_tau_s = c.tau_activation_s;
  a.effect.max_speed_gain_fraction = c.rho_speed;
  return m;
}

function exitEdge(ex, w, h) {
  if (!ex) return 'timeout';
  const d = {
    left: Math.abs(ex.x),
    right: Math.abs(ex.x - w),
    top: Math.abs(ex.y),
    bottom: Math.abs(ex.y - h)
  };
  return Object.keys(d).sort((a, b) => d[a] - d[b])[0];
}

function simulateCandidate(c, trials, seed0, base) {
  const model = configuredModel(base, c);
  const out = [];

  for (const [pl, exp] of ASSAYS) {
    for (let i = 0; i < trials; i++) {
      const seed = seed0 + i;
      const b = loadBundle(exp, { modelId: model.id });
      b.model = clone(model);
      b.observation.record_trajectories = false;

      const sim = new Simulation(b, seed);
      const rr = new core.RNG(streamSeed(seed, ENTRY_STREAM));
      if (rr.next() > c.q) {
        sim.ants[0].heading = rr.next() * 2 * Math.PI - Math.PI;
      }

      const sx = sim.ants[0].x;
      const sy = sim.ants[0].y;
      const summary = sim.runUntilComplete(b.experiment.duration_s, FIXED_DT);
      const r = summary.observed_metrics.ants[0];
      const ex = r.exit_coordinate_mm;

      out.push({
        path_length: pl,
        time_to_exit_s: r.time_to_arena_edge_s ?? b.experiment.duration_s,
        middle_zone_fraction: r.central_zone_fraction ?? 0,
        beeline_mm: ex ? Math.hypot(ex.x - sx, ex.y - sy) : 0,
        exit_edge: exitEdge(ex, sim.apparatus.world.width, sim.apparatus.world.height)
      });
    }
  }
  return out;
}

// Deliberately alias the corrected audited H3 scorer rather than reimplementing it.
const score = h3est.score;
const scoreScales = h3est.scoreScales;
const edgeProbs = h3est.edgeProbs;

function effective(c, L) {
  const A = 1 - Math.exp(-L / c.lambda_activation_mm);
  return {
    activation: A,
    speed_multiplier: 1 + c.rho_speed * A,
    speed_gain_fraction: c.rho_speed * A
  };
}

function parameterSpec(policy, key) {
  return policy.estimated_parameters[key];
}

function nearBound(value, spec) {
  if (!spec || !Number.isFinite(value)) return false;
  const [a, b] = spec.bounds;
  const u = spec.scale === 'log'
    ? (Math.log(value) - Math.log(a)) / (Math.log(b) - Math.log(a))
    : (value - a) / (b - a);
  return u <= 0.01 || u >= 0.99;
}

function boundaryFlags(c, policy, kind) {
  const pairs = [
    ['base_speed_mm_s', 'base_speed_mm_s'],
    ['angular_sigma_rad_sqrt_s', 'angular_sigma_rad_sqrt_s'],
    ['q', 'entry_orientation_retention_q']
  ];
  if (kind === 'context') {
    pairs.push(
      ['lambda_activation_mm', 'lambda_activation_mm'],
      ['tau_activation_s', 'tau_activation_s'],
      ['rho_speed', 'rho_speed']
    );
  }
  return pairs
    .filter(([ck, pk]) => nearBound(c[ck], parameterSpec(policy, pk)))
    .map(([, pk]) => pk);
}

function scoreCandidate(c, kind, realRows, policy, base, trials, seed0, source) {
  const simRows = simulateCandidate(c, trials, seed0, base);
  const sc = score(simRows, realRows);
  // The exact null anchor does not estimate lambda/tau/rho, so only nuisance
  // coordinates are eligible for boundary-identifiability flags.
  const flagKind = source === 'exact_null_anchor' ? 'null' : kind;
  const row = {
    candidate: reportCandidate(c, kind, source),
    source,
    loss: sc.loss,
    components: sc.components,
    near_search_bounds: boundaryFlags(c, policy, flagKind)
  };

  if (kind === 'context' && source !== 'exact_null_anchor') {
    const e200 = effective(c, 200);
    const e1000 = effective(c, 1000);
    row.effective = {
      A200: e200.activation,
      A1000: e1000.activation,
      S200: e200.speed_multiplier,
      S1000: e1000.speed_multiplier,
      delta_S0: e1000.speed_gain_fraction - e200.speed_gain_fraction,
      activation_half_life_s: c.tau_activation_s * Math.log(2)
    };
  } else if (kind === 'context') {
    row.effective = {
      S200: 1,
      S1000: 1,
      delta_S0: 0,
      null_equivalent: true
    };
  }
  return row;
}

function searchNull(realRows, policy, base, { count, trials, seed0 }) {
  let best = null;
  let bestCandidate = null;
  const top = [];

  for (let i = 0; i < count; i++) {
    const c = nullCandidate(i, policy);
    const row = scoreCandidate(c, 'null', realRows, policy, base, trials, seed0, `halton_${i + 1}`);
    top.push(row);
    if (!best || row.loss < best.loss) {
      best = row;
      bestCandidate = c;
    }
  }

  top.sort((a, b) => a.loss - b.loss);
  return {
    best,
    top: top.slice(0, Math.min(12, top.length)),
    selectedCandidate: bestCandidate
  };
}

function searchContext(realRows, policy, base, { count, trials, seed0, nullSelected }) {
  if (count < 2) {
    throw new Error(
      'H4-context search requires at least two total candidates so one slot can remain the exact null anchor.'
    );
  }

  let best = null;
  let bestCandidate = null;
  const top = [];

  // Frozen high-resolution policy: count-1 context Halton points + one exact null anchor.
  for (let i = 0; i < count - 1; i++) {
    const c = contextCandidate(i, policy);
    const row = scoreCandidate(c, 'context', realRows, policy, base, trials, seed0, `halton_${i + 1}`);
    top.push(row);
    if (!best || row.loss < best.loss) {
      best = row;
      bestCandidate = c;
    }
  }

  const anchor = nullAnchor(nullSelected);
  const anchorRow = scoreCandidate(
    anchor,
    'context',
    realRows,
    policy,
    base,
    trials,
    seed0,
    'exact_null_anchor'
  );
  top.push(anchorRow);

  if (!best || anchorRow.loss < best.loss) {
    best = anchorRow;
    bestCandidate = anchor;
  }

  top.sort((a, b) => a.loss - b.loss);
  return {
    best,
    top: top.slice(0, Math.min(12, top.length)),
    selectedCandidate: bestCandidate,
    anchor: anchorRow
  };
}

function h2CandidateFromReportFold(fold) {
  const c = fold && fold.H2;
  if (!c) throw new Error('Recorded H2 report is missing fold H2 candidate.');
  return {
    sigma0: c.sigma0,
    q: c.q,
    lambda_mm: c.lambda_mm,
    tau_s: c.tau_s,
    rho: c.rho
  };
}

function h3CandidateFromReportFold(fold) {
  const c = fold && fold.H3_context;
  if (!c) throw new Error('Recorded H3 report is missing fold H3_context candidate.');
  return {
    ell0: c.ell0,
    kappa: c.kappa,
    q: c.q,
    lambda_mm: c.lambda_history_mm,
    tau_s: c.tau_gate_s,
    rho: c.rho_gate
  };
}

function assertPolicySemantics(policy) {
  if (
    policy.id !== 'H4_parameter_estimation_v1' ||
    policy.status !== 'development_estimation_policy_frozen_before_estimator_implementation_or_parameter_search'
  ) {
    throw new Error('Unexpected H4 frozen policy identity/status.');
  }
  if (policy.model_candidate !== 'lasius_niger_locomotion_h4_v1') {
    throw new Error('Unexpected H4 model candidate.');
  }

  const p = policy.estimated_parameters;
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  if (!eq(p.base_speed_mm_s.bounds, [12, 36]) || p.base_speed_mm_s.scale !== 'linear') {
    throw new Error('Frozen H4 base-speed bounds/scale changed.');
  }
  if (
    !eq(p.angular_sigma_rad_sqrt_s.bounds, [0.35, 2.4]) ||
    p.angular_sigma_rad_sqrt_s.scale !== 'log'
  ) {
    throw new Error('Frozen H4 angular-sigma bounds/scale changed.');
  }
  if (
    !eq(p.entry_orientation_retention_q.bounds, [0, 1]) ||
    !eq(p.lambda_activation_mm.bounds, [100, 3000]) ||
    !eq(p.tau_activation_s.bounds, [0.5, 40]) ||
    !eq(p.rho_speed.bounds, [0, 0.95])
  ) {
    throw new Error('Frozen H4 parameter bounds changed.');
  }

  const s = policy.search_protocol;
  const b = s.high_resolution_budget;
  if (
    b.H4_null_candidates_per_fold !== 500 ||
    b.H4_context_candidates_per_fold_total !== 500 ||
    b.training_trials_per_condition_per_candidate !== 60 ||
    b.heldout_evaluation_trials_per_condition !== 120 ||
    b.folds !== 6 ||
    s.root_seed !== 990000
  ) {
    throw new Error('Frozen H4 high-resolution search budget/seed changed.');
  }

  if (!near(policy.numerical_invariants.physics_dt_s, FIXED_DT, 1e-15)) {
    throw new Error('Frozen H4 physics dt does not match simulator FIXED_DT.');
  }

  const expectedMapping = HALTON.map(([prime, parameter]) => ({ prime, parameter }));
  if (JSON.stringify(s.halton_mapping) !== JSON.stringify(expectedMapping)) {
    throw new Error('Frozen H4 Halton mapping changed.');
  }

  if (policy.entry_transition_model?.rng_stream !== ENTRY_STREAM) {
    throw new Error('Frozen H4 entry-transition RNG stream changed.');
  }
  if (!String(policy.holdout_rule || '').includes('Y-maze')) {
    throw new Error('Frozen H4 policy must protect the Y-maze.');
  }
}

function validateReferenceInputs({
  policy,
  target,
  cal,
  sourceManifest,
  h2Report,
  h3Report,
  targetPath
}) {
  assertPolicySemantics(policy);

  if (gitBlobShaFile(targetPath) !== policy.reference_target_git_blob_sha) {
    throw new Error('H4 reference target Git blob does not match the frozen policy pin.');
  }
  if (target.source_xlsx_sha256 !== policy.reference_source_xlsx_sha256) {
    throw new Error('H4 reference target source XLSX hash does not match the frozen policy pin.');
  }

  const d = cal.datasets?.poissonnier2026_open_arena;
  if (d?.allowed_for_development_parameter_estimation !== true || d?.allowed_for_fitting !== false) {
    throw new Error(
      'Open-arena calibration manifest does not permit development estimation while canonical fitting remains locked.'
    );
  }
  if (cal.datasets?.poissonnier2026_ymaze?.allowed_for_development_parameter_estimation !== false) {
    throw new Error('Y-maze must remain forbidden for development parameter estimation.');
  }
  if (
    target.status !== 'development_estimation_only_not_external_validation' ||
    target.rows.some(r => !['s', 'l'].includes(r.path_length))
  ) {
    throw new Error('Unexpected H4 threshold-independent estimation target scope/status.');
  }

  const published = sourceManifest.supplements?.find(s => s.role === 'published_dataset');
  if (!published?.sha256 || published.sha256 !== target.source_xlsx_sha256) {
    throw new Error('H4 target does not match canonical published XLSX hash.');
  }

  for (const [r, name] of [[h2Report, 'H2'], [h3Report, 'H3']]) {
    if (r?.status !== 'development_estimation_failed_promotion_guard') {
      throw new Error(`Expected frozen failed-promotion ${name} high-resolution report.`);
    }
    if (r.execution?.source_xlsx_sha256 !== target.source_xlsx_sha256) {
      throw new Error(`${name} comparison report uses a different source XLSX.`);
    }
    if (r.fit_policy?.ymaze_accessed !== false) {
      throw new Error(`${name} comparison report must not have accessed the Y-maze.`);
    }
  }

  const colonies = [...new Set(target.rows.map(r => r.colony))].sort((a, b) => a - b);
  for (const [r, name] of [[h2Report, 'H2'], [h3Report, 'H3']]) {
    const rc = (r.folds || []).map(f => f.held_out_colony).sort((a, b) => a - b);
    if (JSON.stringify(colonies) !== JSON.stringify(rc)) {
      throw new Error(`${name} comparison folds do not match H4 colony folds.`);
    }
  }

  return { colonies };
}

function loadReferenceInputs(root, policy) {
  const frozenRuntimeBlobs = assertFrozenRuntimeBlobs(root);
  const frozenReferenceComparatorBlobs = assertFrozenReferenceComparatorBlobs(root);
  const targetPath = path.resolve(root, policy.reference_target_file);
  const target = readJson(targetPath);
  const cal = readJson(path.resolve(root, 'reference', 'calibration_manifest.json'));
  const sourceManifest = readJson(path.resolve(root, 'reference', 'poissonnier2026_source_manifest.json'));
  const base = readJson(path.resolve(root, 'models', 'lasius_niger_locomotion_h4_v1.json'));
  const h2Base = readJson(path.resolve(root, 'models', 'lasius_niger_locomotion_h2_v1.json'));
  const h3Base = readJson(path.resolve(root, 'models', 'lasius_niger_locomotion_h3_v1.json'));
  const h2Report = readJson(path.resolve(root, 'reports', 'h2_parameter_estimation_500x60_v1.json'));
  const h3Report = readJson(path.resolve(root, 'reports', 'h3_parameter_estimation_500x60_v1.json'));

  const v = validateReferenceInputs({
    policy,
    target,
    cal,
    sourceManifest,
    h2Report,
    h3Report,
    targetPath
  });

  return {
    target,
    cal,
    sourceManifest,
    base,
    h2Base,
    h3Base,
    h2Report,
    h3Report,
    targetPath,
    frozenRuntimeBlobs,
    frozenReferenceComparatorBlobs,
    colonies: v.colonies
  };
}

function median(xs) {
  const a = [...xs].sort((x, y) => x - y);
  const n = a.length;
  if (!n) return NaN;
  const m = Math.floor(n / 2);
  return n % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function runLoco({ policy, inputs, count, trials, evalTrials, seed0, evidence }) {
  const {
    target,
    base,
    h2Base,
    h3Base,
    h2Report,
    h3Report,
    colonies
  } = inputs;
  const folds = [];

  for (let fi = 0; fi < colonies.length; fi++) {
    const held = colonies[fi];
    const train = target.rows.filter(r => r.colony !== held);
    const test = target.rows.filter(r => r.colony === held);
    const fitSeed = seed0 + fi * 10000;
    const evalSeed = seed0 + 500000 + fi * 10000;
    const scales = scoreScales(train);

    const ns = searchNull(train, policy, base, { count, trials, seed0: fitSeed });
    const cs = searchContext(train, policy, base, {
      count,
      trials,
      seed0: fitSeed,
      nullSelected: ns.selectedCandidate
    });

    const nEval = score(
      simulateCandidate(ns.selectedCandidate, evalTrials, evalSeed, base),
      test,
      scales
    );
    const cEval = score(
      simulateCandidate(cs.selectedCandidate, evalTrials, evalSeed, base),
      test,
      scales
    );

    const h2Fold = h2Report.folds.find(f => f.held_out_colony === held);
    const h3Fold = h3Report.folds.find(f => f.held_out_colony === held);
    const h2c = h2CandidateFromReportFold(h2Fold);
    const h3c = h3CandidateFromReportFold(h3Fold);

    const h2Eval = score(
      h2est.simulateCandidate(h2c, evalTrials, evalSeed, h2Base),
      test,
      scales
    );
    const h3Eval = score(
      h3est.simulateCandidate(h3c, evalTrials, evalSeed, h3Base),
      test,
      scales
    );

    const vsNull = (nEval.loss - cEval.loss) / Math.max(1e-12, nEval.loss);
    const vsH2 = (h2Eval.loss - cEval.loss) / Math.max(1e-12, h2Eval.loss);
    const vsH3 = (h3Eval.loss - cEval.loss) / Math.max(1e-12, h3Eval.loss);

    folds.push({
      held_out_colony: held,
      train_n: train.length,
      test_n: test.length,
      fit_seed: fitSeed,
      evaluation_seed: evalSeed,
      evaluation_trials_per_condition: evalTrials,
      heldout_metric_scales_from_training: scales,
      H4_null: {
        fit: ns.best,
        training_top_candidates: ns.top,
        heldout_loss: nEval.loss,
        heldout_components: nEval.components
      },
      H4_context: {
        fit: cs.best,
        training_top_candidates: cs.top,
        heldout_loss: cEval.loss,
        heldout_components: cEval.components,
        null_anchor_train_loss: cs.anchor.loss
      },
      H2_v1_frozen_candidate: {
        candidate: h2c,
        reevaluated_heldout_loss_matched_crn: h2Eval.loss,
        heldout_components: h2Eval.components
      },
      H3_v1_frozen_candidate: {
        candidate: h3c,
        reevaluated_heldout_loss_matched_crn: h3Eval.loss,
        heldout_components: h3Eval.components
      },
      heldout_relative_improvement_vs_H4_null: vsNull,
      heldout_relative_improvement_vs_H2_v1: vsH2,
      heldout_relative_improvement_vs_H3_v1: vsH3
    });
  }

  const imN = folds.map(f => f.heldout_relative_improvement_vs_H4_null);
  const im2 = folds.map(f => f.heldout_relative_improvement_vs_H2_v1);
  const im3 = folds.map(f => f.heldout_relative_improvement_vs_H3_v1);
  const winsN = imN.filter(x => x > 0).length;
  const wins2 = im2.filter(x => x > 0).length;
  const wins3 = im3.filter(x => x > 0).length;
  const medN = median(imN);
  const med2 = median(im2);
  const med3 = median(im3);

  if (!evidence) {
    return {
      folds,
      execution_path_smoke_summary: {
        H4_wins_vs_H4_null: winsN,
        median_relative_improvement_vs_H4_null: medN,
        H4_wins_vs_H2_v1: wins2,
        median_relative_improvement_vs_H2_v1: med2,
        H4_wins_vs_H3_v1: wins3,
        median_relative_improvement_vs_H3_v1: med3,
        promotion_evaluated: false,
        scientific_evidence: false
      }
    };
  }

  const nullPass = winsN >= 5 && medN > 0;
  const h2Pass = wins2 >= 4 && med2 > 0;
  const h3Pass = wins3 >= 4 && med3 > 0;

  const boundaryHitCounts = {};
  const nullAnchorSelectedFolds = [];
  for (const f of folds) {
    const fit = f.H4_context.fit;
    if (fit.source === 'exact_null_anchor') nullAnchorSelectedFolds.push(f.held_out_colony);
    for (const key of fit.near_search_bounds || []) {
      boundaryHitCounts[key] = (boundaryHitCounts[key] || 0) + 1;
    }
  }

    return {
    folds,
    identifiability: {
      boundary_hit_counts_across_selected_H4_context_folds: boundaryHitCounts,
      null_anchor_selected_folds: nullAnchorSelectedFolds,
      top_training_candidates_retained_per_model_per_fold: 12,
      ridge_assessment: 'Not automated because the frozen policy defines no numeric ridge tolerance; top training candidates and effective quantities are retained for post-selection identifiability review.'
    },
    internal_cv: {
      H4_wins_vs_H4_null: winsN,
      total_folds: folds.length,
      median_relative_improvement_vs_H4_null: medN,
      H4_promotion_guard_passed: nullPass,
      H4_wins_vs_H2_v1: wins2,
      median_relative_improvement_vs_H2_v1: med2,
      H2_comparison_guard_passed: h2Pass,
      H4_wins_vs_H3_v1: wins3,
      median_relative_improvement_vs_H3_v1: med3,
      H3_comparison_guard_passed: h3Pass,
      development_preferred_over_H2_v1: nullPass && h2Pass,
      development_preferred_over_H3_v1: nullPass && h3Pass,
      canonical_promotion: false
    }
  };
}

function assertHighResolutionArgs(policy) {
  const b = policy.search_protocol.high_resolution_budget;
  const checks = [
    ['candidates', b.H4_null_candidates_per_fold],
    ['trials', b.training_trials_per_condition_per_candidate],
    ['eval-trials', b.heldout_evaluation_trials_per_condition],
    ['seed', policy.search_protocol.root_seed],
    ['dt', policy.numerical_invariants.physics_dt_s]
  ];
  for (const [name, expected] of checks) {
    if (hasArg(name) && Number(arg(name, expected)) !== expected) {
      throw new Error(
        `Frozen high-resolution mode forbids --${name} override; expected ${expected}.`
      );
    }
  }
}

function deterministicBoundaryQualification() {
  const b = loadBundle('open_arena_short_control.json', {
    modelId: 'lasius_niger_locomotion_h4_v1'
  });
  b.experiment.protocol.entry_state.position_jitter_mm = 0;
  b.experiment.protocol.entry_state.heading_jitter_rad = 0;
  Object.assign(b.model.movement, {
    speed_sd_mm_s: 0,
    speed_reversion_rate_s: 0,
    speed_noise_sigma_sqrt_s: 0,
    angular_sigma_rad_sqrt_s: 0,
    pause_rate_s: 0
  });

  const sim = new Simulation(b, 445577);
  const ant = sim.ants[0];
  const a0 = ant.locomotorActivationInitial;
  const v0 = ant.baseSpeed * ant.speedFactor;
  const tau = sim.h4Config.tau;
  const rho = sim.h4Config.rho;
  const target = sim.apparatus.world.width - ant.x;
  const travel = t => v0 * (t + rho * a0 * tau * (1 - Math.exp(-t / tau)));

  let lo = 0;
  let hi = 20;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if (travel(mid) < target) lo = mid;
    else hi = mid;
  }
  const expected = (lo + hi) / 2;

  sim.runUntilComplete(30, 0.5);

  return {
    passed:
      sim.ants[0].finished &&
      near(sim.ants[0].completedAt, expected, 2e-9) &&
      near(
        sim.ants[0].locomotorActivation,
        a0 * Math.exp(-expected / tau),
        2e-10
      ),
    expected_s: expected,
    observed_s: sim.ants[0].completedAt
  };
}

function qualify({ root, policy, trials = 3 }) {
  assertPolicySemantics(policy);
  const runtimeBlobs = assertFrozenRuntimeBlobs(root);

  const base = readJson(path.resolve(root, 'models', 'lasius_niger_locomotion_h4_v1.json'));
  const short = loadBundle('open_arena_short_control.json', { modelId: base.id });
  const long = loadBundle('open_arena_long_control.json', { modelId: base.id });
  const checks = {};

  checks.context_inputs =
    short.experiment.protocol.state_facts.recent_constrained_travel_mm === 200 &&
    long.experiment.protocol.state_facts.recent_constrained_travel_mm === 1000;

  const nc = nullCandidate(7, policy);
  const cc = contextCandidate(7, policy);
  checks.nuisance_coordinate_pairing =
    near(nc.base_speed_mm_s, cc.base_speed_mm_s) &&
    near(nc.angular_sigma_rad_sqrt_s, cc.angular_sigma_rad_sqrt_s) &&
    near(nc.q, cc.q);

  const anchor = nullAnchor(nc);
  const nr = simulateCandidate(nc, trials, 881000, base);
  const ar = simulateCandidate(anchor, trials, 881000, base);
  checks.null_anchor_equivalence = JSON.stringify(nr) === JSON.stringify(ar);

  const ep = edgeProbs([{ exit_edge: 'left' }, { exit_edge: 'timeout' }]);
  checks.five_category_exit_normalization =
    ep.length === 5 &&
    near(ep.reduce((a, b) => a + b, 0), 1, 1e-15) &&
    near(ep[4], 0.5, 1e-15);

  const boundary = deterministicBoundaryQualification();
  checks.exact_boundary_timing = boundary.passed;

  const s = new Simulation(short, 88221);
  const l = new Simulation(long, 88221);
  for (let i = 0; i < 50; i++) {
    s.step(FIXED_DT);
    l.step(FIXED_DT);
  }
  checks.no_h4_rng_stream =
    s.ants[0].rng.state === l.ants[0].rng.state &&
    near(s.ants[0].heading, l.ants[0].heading, 1e-12) &&
    near(s.ants[0].speedFactor, l.ants[0].speedFactor, 1e-12);

  checks.candidate_parameter_wiring = (() => {
    const m = configuredModel(base, cc);
    return (
      near(m.movement.base_speed_mm_s, cc.base_speed_mm_s) &&
      near(m.movement.angular_sigma_rad_sqrt_s, cc.angular_sigma_rad_sqrt_s) &&
      near(
        m.locomotor_activation.initialization.history_distance_scale_mm,
        cc.lambda_activation_mm
      ) &&
      near(m.locomotor_activation.decay.activation_tau_s, cc.tau_activation_s) &&
      near(m.locomotor_activation.effect.max_speed_gain_fraction, cc.rho_speed)
    );
  })();

  checks.scorer_identity_is_audited_h3 =
    h3est.score === score &&
    h3est.scoreScales === scoreScales &&
    h3est.edgeProbs === edgeProbs;

  const syntheticTrainForScale = [
    { time_to_exit_s: 1, middle_zone_fraction: 0.1, beeline_mm: 10 },
    { time_to_exit_s: 3, middle_zone_fraction: 0.3, beeline_mm: 30 },
    { time_to_exit_s: 5, middle_zone_fraction: 0.5, beeline_mm: 50 }
  ];
  const syntheticHeldoutForScale = [
    { time_to_exit_s: 10, middle_zone_fraction: 0.2, beeline_mm: 100 },
    { time_to_exit_s: 30, middle_zone_fraction: 0.8, beeline_mm: 300 },
    { time_to_exit_s: 50, middle_zone_fraction: 0.9, beeline_mm: 500 }
  ];
  const trainingScales = scoreScales(syntheticTrainForScale);
  const heldoutScales = scoreScales(syntheticHeldoutForScale);
  checks.training_fold_scaling_semantics =
    !near(trainingScales.time, heldoutScales.time) &&
    !near(trainingScales.beeline, heldoutScales.beeline);

  checks.colony_identity_not_model_input =
    !JSON.stringify(base).toLowerCase().includes('colony');

  checks.ymaze_inaccessible =
    ASSAYS.every(([, x]) => !x.toLowerCase().includes('ymaze'));

  const passed = Object.values(checks).every(Boolean);

  return {
    schema_version: 1,
    qualification_id: 'H4_estimator_synthetic_qualification_v1',
    policy_git_blob_sha: POLICY_GIT_BLOB_SHA,
    status: passed ? 'passed' : 'failed',
    reference_outcomes_accessed: false,
    ymaze_accessed: false,
    scientific_evidence: false,
    frozen_runtime_blobs_verified: runtimeBlobs,
    trials_per_condition: trials,
    checks,
    boundary_check: boundary
  };
}

function highResolutionPreflight({ root, policy }) {
  const q = qualify({ root, policy, trials: 3 });
  if (
    q.status !== 'passed' ||
    q.reference_outcomes_accessed !== false ||
    q.ymaze_accessed !== false
  ) {
    throw new Error(
      'Frozen H4 high-resolution search requires a passing reference-free synthetic ' +
      'estimator qualification before reference outcomes are loaded.'
    );
  }
  return q;
}

function writeReport(report, out) {
  const root = path.resolve(__dirname, '..');
  const safeOut = assertSafeReportOutput(root, out);
  fs.writeFileSync(safeOut, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  console.log(`Saved ${safeOut}`);
}

function h2ReportSummary(r) {
  return {
    id: r.id,
    status: r.status,
    repo_commit: r.execution?.repo_commit
  };
}

function h3ReportSummary(r) {
  return {
    id: r.id,
    status: r.status,
    repo_commit: r.execution?.repo_commit
  };
}

function main() {
  const root = path.resolve(__dirname, '..');
  const pinned = assertExactPolicyBlob(root);
  const policy = pinned.policy;
  const mode = arg('mode', 'qualification');
  assertPolicySemantics(policy);

  if (mode === 'qualification') {
    const q = qualify({
      root,
      policy,
      trials: Math.max(1, narg('trials', 3))
    });
    if (q.status !== 'passed') {
      throw new Error(`H4 estimator qualification failed: ${JSON.stringify(q.checks)}`);
    }
    return writeReport(
      q,
      path.resolve(process.cwd(), arg('out', path.join('reports', 'h4_estimator_qualification_v1.json')))
    );
  }

  if (mode !== 'smoke' && mode !== 'highres') {
    throw new Error(
      `Unknown H4 estimation mode '${mode}'. Use qualification, smoke, or highres.`
    );
  }

  const evidence = mode === 'highres';
  let preflight = null;
  let count;
  let trials;
  let evalTrials;
  let seed0;

  if (evidence) {
    // Policy requirement: qualify first, while no Poissonnier reference target
    // has yet been loaded by this process.
    preflight = highResolutionPreflight({ root, policy });
    assertHighResolutionArgs(policy);

    const b = policy.search_protocol.high_resolution_budget;
    count = b.H4_null_candidates_per_fold;
    trials = b.training_trials_per_condition_per_candidate;
    evalTrials = b.heldout_evaluation_trials_per_condition;
    seed0 = policy.search_protocol.root_seed;
  } else {
    count = Math.max(2, narg('candidates', 8));
    trials = Math.max(1, narg('trials', 4));
    evalTrials = Math.max(2, narg('eval-trials', Math.max(8, trials * 2)));
    seed0 = Math.max(1, narg('seed', policy.search_protocol.root_seed));
  }

  // This is deliberately after high-resolution preflight.
  const inputs = loadReferenceInputs(root, policy);

  const run = runLoco({
    policy,
    inputs,
    count,
    trials,
    evalTrials,
    seed0,
    evidence
  });

  const report = {
    schema_version: 1,
    estimation_id: policy.id,
    status: evidence
      ? 'development_estimation_high_resolution_complete'
      : 'execution_path_smoke_only_not_evidence',
    execution_class: evidence ? 'frozen_high_resolution' : 'low_resolution_smoke',
    scientific_evidence: evidence,
    policy_git_blob_sha: POLICY_GIT_BLOB_SHA,
    reference_outcomes_accessed: true,
    pre_reference_highres_qualification: evidence ? preflight : null,
    canonical_parameters_updated: false,
    ymaze_accessed: false,
    threshold_dependent_metrics_used: false,
    moving_speed_used_for_fit: false,
    colony_identity_used_as_biological_input: false,
    H1_treatment_specific_entry_state_used: false,
    entry_transition_rng_stream: ENTRY_STREAM,
    source_xlsx_sha256: inputs.target.source_xlsx_sha256,
    reference_target_git_blob_sha: gitBlobShaFile(inputs.targetPath),
    execution: {
      repo_commit: currentRepoCommit(root),
      node_version: process.version,
      frozen_runtime_blobs: inputs.frozenRuntimeBlobs,
      frozen_reference_comparator_blobs: inputs.frozenReferenceComparatorBlobs
    },
    search: {
      method: policy.search_protocol.method,
      H4_null_candidates_per_fold: count,
      H4_context_candidates_per_fold_total: count,
      context_halton_candidates_per_fold: count - 1,
      exact_null_anchor_per_fold: 1,
      training_trials_per_condition_per_candidate: trials,
      evaluation_trials_per_condition: evalTrials,
      folds: inputs.colonies.length,
      root_seed: seed0,
      physics_dt_s: FIXED_DT,
      common_random_numbers: true,
      heldout_continuous_scaling: 'pooled training SD frozen per LOCO fold',
      exit_categories: ['left', 'right', 'top', 'bottom', 'timeout'],
      halton_mapping: policy.search_protocol.halton_mapping
    },
    comparators: {
      H2_report: h2ReportSummary(inputs.h2Report),
      H3_report: h3ReportSummary(inputs.h3Report),
      rule:
        'Frozen fold-specific H2/H3 candidates are re-evaluated on H4 held-out rows ' +
        'with H4 training-derived scales, evaluation trial count, fold evaluation seed, ' +
        'and shared entry-transition CRN wherever architectures permit.'
    },
    ...run
  };

  if (evidence) {
    report.status = report.internal_cv.H4_promotion_guard_passed
      ? 'development_estimation_passed_promotion_guard'
      : 'development_estimation_failed_promotion_guard';
  }

  return writeReport(
    report,
    path.resolve(
      process.cwd(),
      arg('out', evidence ? path.join('reports', 'h4_parameter_estimation_500x60_v1.json') : path.join('reports', 'h4_estimation_smoke_v1.json'))
    )
  );
}

if (require.main === module) main();

module.exports = {
  POLICY_GIT_BLOB_SHA,
  ENTRY_STREAM,
  HALTON,
  FROZEN_RUNTIME_BLOBS,
  FROZEN_REFERENCE_COMPARATOR_BLOBS,
  gitBlobShaBuffer,
  gitBlobShaFile,
  assertExactPolicyBlob,
  assertFrozenRuntimeBlobs,
  assertFrozenReferenceComparatorBlobs,
  assertSafeReportOutput,
  currentRepoCommit,
  assertPolicySemantics,
  halton,
  mapVal,
  nullCandidate,
  contextCandidate,
  nullAnchor,
  reportCandidate,
  configuredModel,
  exitEdge,
  simulateCandidate,
  score,
  scoreScales,
  edgeProbs,
  effective,
  boundaryFlags,
  searchNull,
  searchContext,
  h2CandidateFromReportFold,
  h3CandidateFromReportFold,
  validateReferenceInputs,
  loadReferenceInputs,
  runLoco,
  qualify,
  highResolutionPreflight,
  deterministicBoundaryQualification
};
