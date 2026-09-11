'use strict';

const p4 = require('../src/p4.js');
const p3 = require('../src/p3.js');
const integrity = require('../src/integrity.js');
const { loadBundle } = require('./load-bundle.js');

const PRIMARY_METRICS = Object.freeze(['middle_zone_fraction', 'trail_axis_exit']);
const SECONDARY_METRICS = Object.freeze(['time_to_exit_s', 'beeline_mm']);
const PATHS = Object.freeze(['s', 'l']);
const TREATMENTS = Object.freeze(['dcm_control', 'pheromone']);
const HALTON = Object.freeze([[2, 'sigma_field_mm'], [3, 'kappa_trail_per_s'], [5, 'theta_detect']]);

const clone = value => JSON.parse(JSON.stringify(value));
const near = (a, b, tolerance = 1e-12) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
function mean(values) {
  if (!values.length) throw new Error('Cannot take mean of empty values.');
  return values.reduce((a, b) => a + b, 0) / values.length;
}
function sampleSd(values) {
  if (values.length < 2) return 1;
  const m = mean(values);
  const variance = values.reduce((sum, x) => sum + (x - m) * (x - m), 0) / (values.length - 1);
  return Math.sqrt(variance) || 1;
}
function median(values) {
  const a = [...values].sort((x, y) => x - y);
  if (!a.length) return NaN;
  const middle = Math.floor(a.length / 2);
  return a.length % 2 ? a[middle] : (a[middle - 1] + a[middle]) / 2;
}
function halton(index, base) {
  let factor = 1, result = 0, i = index;
  while (i > 0) {
    factor /= base;
    result += factor * (i % base);
    i = Math.floor(i / base);
  }
  return result;
}
function mapVal(u, spec) {
  const [a, b] = spec.bounds;
  return spec.scale === 'log' ? Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * u) : a + (b - a) * u;
}

function p4Candidate(index, policy) {
  if (index < 0 || index >= policy.search_protocol.positive_P4_candidates) throw new Error('P4 Halton candidate index out of range.');
  const n = index + 1;
  const p = policy.response_parameter_surface.estimated_parameters;
  return {
    sigma_field_mm: mapVal(halton(n, 2), p.sigma_field_mm),
    kappa_trail_per_s: mapVal(halton(n, 3), p.kappa_trail_per_s),
    theta_detect: mapVal(halton(n, 5), p.theta_detect),
    candidate_index: n,
    source: 'halton_P4'
  };
}
function ungatedCandidate(index, policy) {
  const c = p4Candidate(index, policy);
  return {
    sigma_field_mm: c.sigma_field_mm,
    kappa_trail_per_s: c.kappa_trail_per_s,
    theta_detect: 0,
    candidate_index: c.candidate_index,
    source: 'ungated_P3_structural_benchmark'
  };
}
function nullAnchor(policy) {
  const a = policy.nested_models_and_comparators.exact_canonical_null.anchor;
  return {
    sigma_field_mm: a.sigma_field_mm,
    kappa_trail_per_s: a.kappa_trail_per_s,
    theta_detect: a.theta_detect,
    candidate_index: policy.search_protocol.candidate_budget_per_fold_total,
    source: 'exact_canonical_null'
  };
}
function configuredP4Model(base, candidate) {
  const model = clone(base);
  const response = model.painted_trail_response;
  if (!response || response.enabled !== true || response.mechanism_id !== 'P4_local_sector_hard_detection_weber_steering_v1') {
    throw new Error('P4 estimator requires frozen P4 painted_trail_response.');
  }
  response.field.sigma_field_mm = candidate.sigma_field_mm;
  response.steering.kappa_trail_per_s = candidate.kappa_trail_per_s;
  response.absolute_detection.theta_detect = candidate.theta_detect;
  return model;
}
function configuredUngatedModel(base, candidate) {
  const model = clone(base);
  const response = model.painted_trail_response;
  if (!response || response.enabled !== true || response.mechanism_id !== 'P3_local_sector_weber_steering_v1') {
    throw new Error('P4 benchmark requires frozen P3 painted_trail_response.');
  }
  response.field.sigma_field_mm = candidate.sigma_field_mm;
  response.steering.kappa_trail_per_s = candidate.kappa_trail_per_s;
  return model;
}
function conditionExperiment(treatment) {
  if (treatment === 'dcm_control') return 'open_arena_p4_zero_dose_reachability.json';
  if (treatment === 'pheromone') return 'open_arena_p4_nominal_dose_reachability.json';
  throw new Error('Unknown P4 treatment ' + treatment + '.');
}
function trialSeed(seed0, pathLength, index, policy) {
  if (!PATHS.includes(pathLength)) throw new Error('Unknown P4 path stratum ' + pathLength + '.');
  return seed0 + (pathLength === 's' ? policy.search_protocol.trial_seed_pairing.short_path_offset : policy.search_protocol.trial_seed_pairing.long_path_offset) + index;
}
function exitEdge(exitCoordinate, width, height) {
  if (!exitCoordinate) return 'timeout';
  const distances = {
    left: Math.abs(exitCoordinate.x),
    right: Math.abs(exitCoordinate.x - width),
    top: Math.abs(exitCoordinate.y),
    bottom: Math.abs(exitCoordinate.y - height)
  };
  return Object.keys(distances).sort((a, b) => distances[a] - distances[b])[0];
}
function simulateTreatment(candidate, treatment, trials, seed0, bases, policy, mechanism = 'P4') {
  if (mechanism !== 'P4' && mechanism !== 'ungated') throw new Error('Unknown P4 estimator mechanism ' + mechanism + '.');
  const base = mechanism === 'P4' ? bases.p4 : bases.p3;
  const model = mechanism === 'P4' ? configuredP4Model(base, candidate) : configuredUngatedModel(base, candidate);
  const Simulation = mechanism === 'P4' ? p4.Simulation : p3.Simulation;
  const rows = [];
  const experiment = conditionExperiment(treatment);
  for (const pathLength of PATHS) {
    for (let i = 0; i < trials; i++) {
      const seed = trialSeed(seed0, pathLength, i, policy);
      const bundle = loadBundle(experiment, { modelId: base.id });
      bundle.model = clone(model);
      bundle.observation.record_trajectories = false;
      const sim = new Simulation(bundle, seed);
      const startX = sim.ants[0].x, startY = sim.ants[0].y;
      const summary = sim.runUntilComplete(bundle.experiment.duration_s, p4.FIXED_DT);
      const observed = summary.observed_metrics.ants[0];
      const exit = observed.exit_coordinate_mm;
      const edge = exitEdge(exit, sim.apparatus.world.width, sim.apparatus.world.height);
      rows.push({
        path_length: pathLength,
        treatment,
        time_to_exit_s: observed.time_to_arena_edge_s == null ? bundle.experiment.duration_s : observed.time_to_arena_edge_s,
        middle_zone_fraction: observed.central_zone_fraction == null ? 0 : observed.central_zone_fraction,
        beeline_mm: exit ? Math.hypot(exit.x - startX, exit.y - startY) : 0,
        trail_axis_exit: edge === 'left' || edge === 'right',
        seed,
        mechanism
      });
    }
  }
  return rows;
}
function simulateCandidate(candidate, trials, seed0, bases, policy, mechanism = 'P4', dcmRows = null) {
  const dcm = dcmRows ? clone(dcmRows) : simulateTreatment(candidate, 'dcm_control', trials, seed0, bases, policy, mechanism);
  return dcm.concat(simulateTreatment(candidate, 'pheromone', trials, seed0, bases, policy, mechanism));
}
function metricValue(row, metric) {
  if (metric === 'trail_axis_exit') return row[metric] === true ? 1 : row[metric] === false ? 0 : Number(row[metric]);
  const value = Number(row[metric]);
  if (!Number.isFinite(value)) throw new Error('Non-finite ' + metric + ' value.');
  return value;
}
function cellMean(rows, colony, pathLength, treatment, metric) {
  const values = rows
    .filter(r => (colony == null || r.colony === colony) && r.path_length === pathLength && r.treatment === treatment)
    .map(r => metricValue(r, metric));
  if (!values.length) throw new Error('Missing P4 cell.');
  return mean(values);
}
function colonyContrast(rows, colony, pathLength, metric) {
  return cellMean(rows, colony, pathLength, 'pheromone', metric) - cellMean(rows, colony, pathLength, 'dcm_control', metric);
}
function referenceContrastTarget(rows, colonies, metrics) {
  const target = {};
  for (const pathLength of PATHS) for (const metric of metrics) {
    target[pathLength + '|' + metric] = mean(colonies.map(colony => colonyContrast(rows, colony, pathLength, metric)));
  }
  return target;
}
function simulationContrastTarget(rows, metrics) {
  const target = {};
  for (const pathLength of PATHS) for (const metric of metrics) {
    target[pathLength + '|' + metric] = cellMean(rows, null, pathLength, 'pheromone', metric) - cellMean(rows, null, pathLength, 'dcm_control', metric);
  }
  return target;
}
function contrastScore(simRows, referenceRows, colonies, metrics = PRIMARY_METRICS) {
  const reference = referenceContrastTarget(referenceRows, colonies, metrics);
  const simulation = simulationContrastTarget(simRows, metrics);
  const components = [];
  for (const pathLength of PATHS) for (const metric of metrics) {
    const key = pathLength + '|' + metric;
    const error = simulation[key] - reference[key];
    components.push({ path_length: pathLength, metric, reference_contrast: reference[key], simulation_contrast: simulation[key], error, squared_error: error * error });
  }
  return { loss: mean(components.map(x => x.squared_error)), components };
}
function secondaryScales(rows) {
  const scales = {};
  for (const pathLength of PATHS) for (const metric of SECONDARY_METRICS) {
    scales[pathLength + '|' + metric] = sampleSd(rows.filter(r => r.path_length === pathLength && TREATMENTS.includes(r.treatment)).map(r => metricValue(r, metric)));
  }
  return scales;
}
function secondaryGuard(simRows, referenceRows, colonies, scales) {
  const reference = referenceContrastTarget(referenceRows, colonies, SECONDARY_METRICS);
  const simulation = simulationContrastTarget(simRows, SECONDARY_METRICS);
  const components = [];
  for (const pathLength of PATHS) for (const metric of SECONDARY_METRICS) {
    const key = pathLength + '|' + metric;
    const error = simulation[key] - reference[key];
    const standardized = error / scales[key];
    components.push({ path_length: pathLength, metric, standardized_error: standardized, absolute_standardized_error: Math.abs(standardized), passed: Math.abs(standardized) <= 1 });
  }
  return { passed: components.every(x => x.passed), components };
}
function normalizedCoordinate(candidate, policy, key) {
  const spec = policy.response_parameter_surface.estimated_parameters[key];
  const [a, b] = spec.bounds;
  const value = candidate[key];
  return spec.scale === 'log' ? (Math.log(value) - Math.log(a)) / (Math.log(b) - Math.log(a)) : (value - a) / (b - a);
}
function publicCandidate(candidate) {
  return { sigma_field_mm: candidate.sigma_field_mm, kappa_trail_per_s: candidate.kappa_trail_per_s, theta_detect: candidate.theta_detect };
}
function scoreRow(candidate, simRows, referenceRows, colonies) {
  const score = contrastScore(simRows, referenceRows, colonies);
  return { candidate: publicCandidate(candidate), candidate_index: candidate.candidate_index, source: candidate.source, loss: score.loss, components: score.components };
}
function searchPanel(referenceRows, colonies, policy, bases, { trials, seed0, panel = 'P4', retainAll = false }) {
  if (panel !== 'P4' && panel !== 'ungated') throw new Error('Unknown P4 estimator panel ' + panel + '.');
  const nullCandidate = nullAnchor(policy);
  const mechanism = panel === 'P4' ? 'P4' : 'ungated';
  const dcmCandidate = panel === 'P4' ? nullCandidate : { ...nullCandidate, theta_detect: 0 };
  const dcm = simulateTreatment(dcmCandidate, 'dcm_control', trials, seed0, bases, policy, mechanism);
  const rows = [];
  for (let i = 0; i < policy.search_protocol.positive_P4_candidates; i++) {
    const candidate = panel === 'P4' ? p4Candidate(i, policy) : ungatedCandidate(i, policy);
    rows.push(scoreRow(candidate, dcm.concat(simulateTreatment(candidate, 'pheromone', trials, seed0, bases, policy, mechanism)), referenceRows, colonies));
  }
  rows.push(scoreRow(dcmCandidate, dcm.concat(simulateTreatment(dcmCandidate, 'pheromone', trials, seed0, bases, policy, mechanism)), referenceRows, colonies));
  rows.sort((a, b) => a.loss - b.loss || a.candidate_index - b.candidate_index);
  return { panel, best: rows[0], top: rows.slice(0, 12), all: retainAll ? rows : undefined };
}
function evaluateCandidate(row, referenceRows, colonies, policy, bases, trials, seed0, scaleRows = null, mechanism = 'P4') {
  const candidate = { ...row.candidate, candidate_index: row.candidate_index, source: row.source };
  const simulated = simulateCandidate(candidate, trials, seed0, bases, policy, mechanism);
  const primary = contrastScore(simulated, referenceRows, colonies);
  const out = { candidate: row.candidate, candidate_index: row.candidate_index, source: row.source, primary_loss: primary.loss, primary_components: primary.components };
  if (scaleRows) out.secondary_guard = secondaryGuard(simulated, referenceRows, colonies, secondaryScales(scaleRows));
  return out;
}
function identifiability(rows, bestUngatedLoss, policy) {
  const best = rows[0];
  const limit = best.loss + Math.max(.0004, .05 * best.loss);
  const nearBest = rows.filter(r => r.loss <= limit);
  const keys = ['sigma_field_mm', 'kappa_trail_per_s', 'theta_detect'];
  const spans = {}, coordinates = {}, distances = {};
  for (const key of keys) {
    const values = nearBest.filter(r => r.source !== 'exact_canonical_null').map(r => normalizedCoordinate(r.candidate, policy, key));
    const selected = normalizedCoordinate(best.candidate, policy, key);
    spans[key] = values.length ? Math.max(...values) - Math.min(...values) : 0;
    coordinates[key] = selected;
    distances[key] = Math.min(selected, 1 - selected);
  }
  const nullInNearBest = nearBest.some(r => r.source === 'exact_canonical_null');
  const ungatedOutside = bestUngatedLoss > limit;
  return {
    passed: !nullInNearBest && ungatedOutside && keys.every(key => distances[key] >= .02 && spans[key] <= .60),
    near_best_loss_limit: limit,
    exact_canonical_null_in_near_best_set: nullInNearBest,
    best_ungated_benchmark_outside_P4_near_best_tolerance: ungatedOutside,
    selected_normalized_coordinates: coordinates,
    selected_distance_to_nearest_bound: distances,
    near_best_normalized_spans: spans
  };
}
function survivalSummary(folds) {
  const nullImprovements = folds.map(f => f.heldout_relative_improvement_vs_exact_null);
  const ungatedImprovements = folds.map(f => f.heldout_relative_improvement_vs_ungated_benchmark);
  const nullWins = nullImprovements.filter(x => x > 0).length;
  const ungatedWins = ungatedImprovements.filter(x => x > 0).length;
  const nullMedian = median(nullImprovements), ungatedMedian = median(ungatedImprovements);
  const nullPass = nullWins >= 5 && nullMedian > 0;
  const ungatedPass = ungatedWins >= 5 && ungatedMedian > 0;
  return {
    P4_wins_vs_exact_null: nullWins,
    P4_wins_vs_selected_ungated_benchmark: ungatedWins,
    total_folds: folds.length,
    median_relative_improvement_vs_exact_null: nullMedian,
    median_relative_improvement_vs_ungated_benchmark: ungatedMedian,
    canonical_null_survival_guard_passed: nullPass,
    structural_increment_survival_guard_passed: ungatedPass,
    P4_dual_survival_guard_passed: nullPass && ungatedPass
  };
}
function finalIncrementGuard(p4Result, ungatedResult, nullResult) {
  return {
    passed: p4Result.primary_loss < ungatedResult.primary_loss && p4Result.primary_loss < nullResult.primary_loss,
    P4_primary_loss: p4Result.primary_loss,
    ungated_benchmark_primary_loss: ungatedResult.primary_loss,
    exact_null_primary_loss: nullResult.primary_loss
  };
}

function exactAntIdentity(a, b) {
  for (const key of ['x', 'y', 'heading', 'speedFactor', 'pauseRemaining', 'distanceTravelled', 'movingTime']) if (!Object.is(a[key], b[key])) return false;
  return a.rng.state === b.rng.state && a.finished === b.finished && a.outcome === b.outcome;
}
function identityQualification(bases) {
  const cases = [
    { treatment: 'dcm_control', kappa: 9, theta: .7, mechanism: 'P4' },
    { treatment: 'pheromone', kappa: 0, theta: .7, mechanism: 'P4' },
    { treatment: 'dcm_control', kappa: 9, theta: 0, mechanism: 'ungated' },
    { treatment: 'pheromone', kappa: 0, theta: 0, mechanism: 'ungated' }
  ];
  for (const seed of [1084501, 1084503, 1084507]) for (const testCase of cases) {
    const experiment = conditionExperiment(testCase.treatment);
    const canonicalBundle = loadBundle(experiment, { modelId: 'lasius_niger_locomotion_v1' });
    const base = testCase.mechanism === 'P4' ? bases.p4 : bases.p3;
    const candidateBundle = loadBundle(experiment, { modelId: base.id });
    const candidate = { sigma_field_mm: 12, kappa_trail_per_s: testCase.kappa, theta_detect: testCase.theta };
    const Simulation = testCase.mechanism === 'P4' ? p4.Simulation : p3.Simulation;
    candidateBundle.model = testCase.mechanism === 'P4' ? configuredP4Model(base, candidate) : configuredUngatedModel(base, candidate);
    const canonical = new integrity.Simulation(canonicalBundle, seed), candidateSim = new Simulation(candidateBundle, seed);
    for (let i = 0; i < 80; i++) { canonical.step(p4.FIXED_DT); candidateSim.step(p4.FIXED_DT); }
    if (!exactAntIdentity(canonical.ants[0], candidateSim.ants[0])) return false;
  }
  return true;
}
function noResponseRngQualification(bases) {
  for (const seed of [1085111, 1085113]) {
    const canonicalBundle = loadBundle(conditionExperiment('pheromone'), { modelId: 'lasius_niger_locomotion_v1' });
    const p4Bundle = loadBundle(conditionExperiment('pheromone'), { modelId: bases.p4.id });
    const ungatedBundle = loadBundle(conditionExperiment('pheromone'), { modelId: bases.p3.id });
    p4Bundle.model = configuredP4Model(bases.p4, { sigma_field_mm: 8, kappa_trail_per_s: 4, theta_detect: .25 });
    ungatedBundle.model = configuredUngatedModel(bases.p3, { sigma_field_mm: 8, kappa_trail_per_s: 4, theta_detect: 0 });
    const canonical = new integrity.Simulation(canonicalBundle, seed), gated = new p4.Simulation(p4Bundle, seed), ungated = new p3.Simulation(ungatedBundle, seed);
    if (canonical.ants[0].rng.state !== gated.ants[0].rng.state || canonical.ants[0].rng.state !== ungated.ants[0].rng.state) return false;
  }
  return true;
}
function syntheticRows() {
  const rows = [], colonies = [0, 7, 16, 20, 21, 27];
  for (let ci = 0; ci < colonies.length; ci++) for (const pathLength of PATHS) {
    const pathOffset = pathLength === 's' ? .02 : .05;
    const delta = .05 + ci * .02 + pathOffset;
    const copies = ci === 0 ? 3 : 1;
    for (const treatment of TREATMENTS) for (let j = 0; j < copies; j++) {
      const active = treatment === 'pheromone' ? 1 : 0;
      rows.push({ colony: colonies[ci], path_length: pathLength, treatment, middle_zone_fraction: .2 + active * delta, trail_axis_exit: !!active, time_to_exit_s: 10 + ci + active * (1 + pathOffset), beeline_mm: 100 + ci * 2 + active * (4 + pathOffset) });
    }
  }
  return rows;
}
function assertPolicySemantics(policy) {
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (policy.id !== 'P4_response_estimation_v1' || policy.status !== 'development_response_estimation_policy_frozen_before_estimator_implementation_or_response_target_semantic_access') throw new Error('Unexpected P4 policy identity/status.');
  const parameters = policy.response_parameter_surface && policy.response_parameter_surface.estimated_parameters;
  if (!equal(policy.response_parameter_surface.estimated_parameter_names_exact, ['sigma_field_mm', 'kappa_trail_per_s', 'theta_detect']) || policy.response_parameter_surface.nuisance_parameters.length !== 0) throw new Error('P4 parameter surface changed.');
  if (!equal(parameters.sigma_field_mm.bounds, [2,32]) || parameters.sigma_field_mm.scale !== 'log' || !equal(parameters.kappa_trail_per_s.bounds, [0,16]) || parameters.kappa_trail_per_s.scale !== 'linear' || !equal(parameters.theta_detect.bounds, [0,2]) || parameters.theta_detect.scale !== 'linear') throw new Error('P4 bounds/scales changed.');
  if (!equal(policy.reference_partition.colonies, [0,7,16,20,21,27]) || policy.reference_partition.folds !== 6) throw new Error('P4 LOCO partition changed.');
  if (!equal(policy.primary_fit_observables.map(x => x.name), PRIMARY_METRICS) || !equal(policy.secondary_guard_observables, SECONDARY_METRICS)) throw new Error('P4 observable surface changed.');
  if (policy.search_protocol.candidate_budget_per_fold_total !== 2000 || policy.search_protocol.positive_P4_candidates !== 1999 || !equal(policy.search_protocol.halton_mapping.map(x => [x.prime, x.parameter]), HALTON)) throw new Error('P4 panel changed.');
  if (policy.search_protocol.training_trials_per_treatment_path_per_candidate !== 60 || policy.search_protocol.heldout_evaluation_trials_per_treatment_path !== 120 || policy.search_protocol.physics_dt_s !== .02 || policy.search_protocol.root_fit_seed !== 8210000 || policy.search_protocol.root_evaluation_seed !== 8810000) throw new Error('P4 training/evaluation protocol changed.');
  if (policy.final_all_data_fit.training_trials_per_treatment_path_per_candidate !== 120 || policy.final_all_data_fit.fit_seed !== 9210000 || policy.final_all_data_fit.final_check_trials_per_treatment_path !== 240 || policy.final_all_data_fit.final_check_seed !== 9610000) throw new Error('P4 final protocol changed.');
  if (policy.cross_validation_and_survival.canonical_null_survival_guard.minimum_heldout_fold_wins !== 5 || policy.cross_validation_and_survival.structural_increment_survival_guard.minimum_heldout_fold_wins_vs_selected_ungated_benchmark !== 5) throw new Error('P4 survival threshold changed.');
  if (policy.nested_models_and_comparators.ungated_P3_structural_benchmark.P3_official_result_semantics_loaded !== false || policy.nested_models_and_comparators.excluded_posthoc_comparator.P1_absolute_transduction_benchmark_included !== false) throw new Error('P4 comparator firewall changed.');
  if (policy.estimator_implementation_gate.response_target_semantics_accessed_at_this_freeze !== false || policy.global_firewall.reserved_Y_maze_access !== false) throw new Error('P4 reference firewall changed.');
  return true;
}

module.exports = { PRIMARY_METRICS, SECONDARY_METRICS, PATHS, TREATMENTS, HALTON, clone, near, mean, sampleSd, median, halton, mapVal, p4Candidate, ungatedCandidate, nullAnchor, configuredP4Model, configuredUngatedModel, conditionExperiment, trialSeed, exitEdge, simulateTreatment, simulateCandidate, metricValue, cellMean, colonyContrast, referenceContrastTarget, simulationContrastTarget, contrastScore, secondaryScales, secondaryGuard, normalizedCoordinate, publicCandidate, scoreRow, searchPanel, evaluateCandidate, identifiability, survivalSummary, finalIncrementGuard, exactAntIdentity, identityQualification, noResponseRngQualification, syntheticRows, assertPolicySemantics };
