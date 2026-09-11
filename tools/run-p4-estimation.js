#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const est = require('./p4-estimation-core.js');
const { readJson } = require('./load-bundle.js');

const POLICY_FILE = 'hypotheses/p4_response_estimation_v1.json';
const POLICY_GIT_BLOB_SHA = '2d0bdfaba74ad08f8424870f37a48399428ae8b7';
const CORE_GIT_BLOB_SHA = '4d985cd7258fc26eb06be75f09bdac4b92325ff0';
const IMPLEMENTATION_AUTH_FILE = 'hypotheses/p4_estimator_implementation_authorization_v1.json';
const IMPLEMENTATION_AUTH_GIT_BLOB_SHA = 'e8f26731412d8693a5596da4374de932745b9392';
const HIGHRES_AUTHORIZATION_FILE = 'hypotheses/p4_highres_authorization_v1.json';
const RESPONSE_TARGET_FILE = 'reference/poissonnier2026_pheromone_response_targets.json';

const FROZEN_RUNTIME_BLOBS = Object.freeze({
  'tools/p4-estimation-core.js': CORE_GIT_BLOB_SHA,
  'hypotheses/p4_estimator_implementation_authorization_v1.json': IMPLEMENTATION_AUTH_GIT_BLOB_SHA,
  'hypotheses/p4_painted_trail_candidate_class_evidence_v1.json': '262f332062f271bbf111d0572f83b2faaf2cfd74',
  'hypotheses/p4_painted_trail_candidate_class_decision_v1.json': 'ad7295ba6d466549c60c8ecac37e39d30006ec1c',
  'hypotheses/p4_painted_trail_mechanism_v1.json': '609551836e540c341365db9cc987d2ca340cc053',
  'hypotheses/p4_reachability_execution_v1.json': '0d452f9c0d548ec962e0a6d9826648bf5e14a4ef',
  'hypotheses/p4_implementation_authorization_v1.json': '42f8d51b06a20c0c6001a42b6021a134f2694e0d',
  'hypotheses/p4_reachability_result_freeze_v1.json': 'f2074ae3157f22208ff98ebc620c00006549cab6',
  'reports/p4_reference_free_reachability_v1.json': 'f6e77596eb25cc7bca3bf0dde1da712511a1d0d0',
  'src/p4.js': 'bf7d5781bd69ec4568450ebbd3bdc284897b6f61',
  'models/lasius_niger_painted_trail_p4_v1.json': '3d8460b6916a90d06e70768f696ee3f0d48fccf4',
  'experiments/open_arena_p4_zero_dose_reachability.json': 'a0ce8285448adacd18feebb3e82e76092e102eec',
  'experiments/open_arena_p4_nominal_dose_reachability.json': 'd7605792f6f0eb871d7b3999940e08f750784b64',
  'tools/run-p4-reachability.js': 'ba4e067a7f686933ed3271a64da2f79f0a558ab0',
  'src/p3.js': '4010b19fd7a1b713a4b8d25b6a693d3ee0a581b8',
  'models/lasius_niger_painted_trail_p3_v1.json': '9107de0c71641c4037bbedbb498b9fa868c1ef00',
  'apparatus/poissonnier2026_open_arena_p1_v1.json': 'df589d6b39c1617a7dedc3bfa9d34a408c51b2f4',
  'models/lasius_niger_locomotion_v1.json': '2fde196d6c8a9353c1c8c206d4fcef223e92ad1d',
  'src/sim-core.js': '24777aac3577d442893e4779d70aee4e27761fe8',
  'src/integrity.js': 'f23c68a6955832b70eeb3bd3e6893d71a3759018',
  'tools/load-bundle.js': '235067f10ed85eeeaebcfe6fef0963940d516b6b'
});

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] != null ? process.argv[i + 1] : def;
}
function hasArg(name) { return process.argv.includes('--' + name); }
function narg(name, def) { return Number(arg(name, def)); }
function gitBlobShaBuffer(buf) {
  return crypto.createHash('sha1').update(Buffer.from('blob ' + buf.length + '\0')).update(buf).digest('hex');
}
function gitBlobShaFile(file) { return gitBlobShaBuffer(fs.readFileSync(file)); }
function sha256File(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function currentRepoCommit(root) {
  try { return childProcess.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch (_) { return process.env.GITHUB_SHA || null; }
}
function currentBranchName(root) {
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try { return childProcess.execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null; }
  catch (_) { return null; }
}
function assertSafeReportOutput(root, out) {
  const resolved = path.resolve(out);
  if (path.extname(resolved).toLowerCase() !== '.json') throw new Error('P4 estimation output must be a JSON report.');
  if (fs.existsSync(resolved) && fs.lstatSync(resolved).isSymbolicLink()) throw new Error('P4 estimation refuses to write through a symbolic-link output path.');
  const rel = path.relative(root, resolved);
  const inside = rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
  if (inside) {
    const reportsRoot = path.resolve(root, 'reports');
    const reportRel = path.relative(reportsRoot, resolved);
    if (reportRel === '' || reportRel.startsWith('..' + path.sep) || reportRel === '..' || path.isAbsolute(reportRel)) {
      throw new Error('P4 estimation may write inside the repository only under reports/.');
    }
  }
  return resolved;
}
function assertBlobSet(root, blobs, label) {
  const verified = {};
  for (const [rel, expected] of Object.entries(blobs)) {
    const actual = gitBlobShaFile(path.resolve(root, rel));
    if (actual !== expected) throw new Error(label + ' blob mismatch for ' + rel + ': expected ' + expected + ', got ' + actual + '.');
    verified[rel] = actual;
  }
  return verified;
}
function assertExactPolicyBlob(root) {
  const file = path.resolve(root, POLICY_FILE);
  const sha = gitBlobShaFile(file);
  if (sha !== POLICY_GIT_BLOB_SHA) throw new Error('P4 response-estimation policy blob mismatch: expected ' + POLICY_GIT_BLOB_SHA + ', got ' + sha + '.');
  const policy = readJson(file);
  est.assertPolicySemantics(policy);
  return { file, sha, policy };
}
function assertImplementationAuthorization(root) {
  const file = path.resolve(root, IMPLEMENTATION_AUTH_FILE);
  const sha = gitBlobShaFile(file);
  if (sha !== IMPLEMENTATION_AUTH_GIT_BLOB_SHA) throw new Error('P4 estimator implementation authorization blob mismatch.');
  const a = readJson(file);
  if (a.id !== 'P4_estimator_implementation_authorization_v1' ||
      a.authorization.create_tools_p4_estimation_core_js !== true ||
      a.authorization.create_tools_run_p4_estimation_js !== true ||
      a.still_forbidden.response_target_semantic_access !== true ||
      a.still_forbidden.official_high_resolution_search !== true) {
    throw new Error('P4 estimator implementation authorization semantics changed.');
  }
  return a;
}
function assertResponseTargetHashOnly(root, policy) {
  const file = path.resolve(root, RESPONSE_TARGET_FILE);
  const actual = gitBlobShaFile(file);
  const expected = policy.frozen_inputs.response_target.git_blob_sha;
  if (actual !== expected) throw new Error('P4 response target blob mismatch: expected ' + expected + ', got ' + actual + '.');
  return actual;
}
function validateReferenceTarget(target, policy) {
  if (target.status !== 'development_response_estimation_only_not_external_validation') throw new Error('Unexpected P4 response target status.');
  if (target.scope !== 'open_arena_painted_trail_response_threshold_independent_observables') throw new Error('Unexpected P4 response target scope.');
  if (!Array.isArray(target.rows) || target.rows.length !== policy.frozen_inputs.response_target.rows) throw new Error('Unexpected P4 response target row count.');
  if (JSON.stringify(target.primary_response_observables) !== JSON.stringify(est.PRIMARY_METRICS) ||
      JSON.stringify(target.secondary_guard_observables) !== JSON.stringify(est.SECONDARY_METRICS)) throw new Error('P4 target observable surface changed.');
  const counts = { dcm_control_short: 0, dcm_control_long: 0, pheromone_short: 0, pheromone_long: 0 };
  for (const r of target.rows) {
    if (!policy.reference_partition.colonies.includes(r.colony) || !est.PATHS.includes(r.path_length) || !est.TREATMENTS.includes(r.treatment)) throw new Error('Unexpected P4 response row stratum.');
    counts[r.treatment + '_' + (r.path_length === 's' ? 'short' : 'long')]++;
    for (const metric of est.PRIMARY_METRICS.concat(est.SECONDARY_METRICS)) est.metricValue(r, metric);
  }
  if (JSON.stringify(counts) !== JSON.stringify({ dcm_control_short: 25, dcm_control_long: 26, pheromone_short: 26, pheromone_long: 25 })) throw new Error('P4 response group counts changed.');
  for (const c of policy.reference_partition.colonies) for (const pl of est.PATHS) for (const t of est.TREATMENTS) {
    if (!target.rows.some(r => r.colony === c && r.path_length === pl && r.treatment === t)) throw new Error('P4 response target missing colony x path x treatment cell.');
  }
  return target;
}
function assertAuthorizationEffective(a, root, options = {}) {
  const branch = options.branchName || currentBranchName(root);
  if (a.effective_when_merged_to_main !== true) throw new Error('P4 high-resolution authorization must declare effective_when_merged_to_main.');
  if (branch !== 'main') throw new Error('P4 high-resolution authorization is not effective until merged to main.');
  return branch;
}
function assertHighResolutionAuthorized(root, policy = null, options = {}) {
  const file = path.resolve(root, HIGHRES_AUTHORIZATION_FILE);
  if (!fs.existsSync(file)) throw new Error('P4 high-resolution search is missing post-qualification authorization artifact.');
  const a = readJson(file);
  if (a.id !== 'P4_high_resolution_authorization_v1' || a.high_resolution_response_search_authorized !== true) throw new Error('Invalid P4 high-resolution authorization.');
  assertAuthorizationEffective(a, root, options);
  const pol = policy || assertExactPolicyBlob(root).policy;
  if (a.policy_git_blob_sha !== POLICY_GIT_BLOB_SHA || a.estimator_core_git_blob_sha !== CORE_GIT_BLOB_SHA) throw new Error('P4 high-resolution authorization does not match frozen policy/core.');
  const runnerSha = gitBlobShaFile(__filename);
  if (a.estimator_git_blob_sha !== runnerSha) throw new Error('P4 high-resolution authorization does not match estimator runner.');
  if (a.response_target_semantic_access_authorized !== true ||
      a.P1_official_result_semantic_access_authorized !== false ||
      a.P2_official_result_semantic_access_authorized !== false ||
      a.P3_official_result_semantic_access_authorized !== false ||
      a.ymaze_access_authorized !== false ||
      a.canonical_promotion_authorized !== false) throw new Error('P4 high-resolution authorization firewall changed.');
  if (!a.qualification_result_freeze || !a.qualification_result_freeze.file || !a.qualification_result_freeze.git_blob_sha) throw new Error('P4 high-resolution authorization missing qualification result freeze pin.');
  const qf = path.resolve(root, a.qualification_result_freeze.file);
  if (gitBlobShaFile(qf) !== a.qualification_result_freeze.git_blob_sha) throw new Error('P4 estimator qualification result freeze mismatch.');
  est.assertPolicySemantics(pol);
  return a;
}
function highResolutionPreflight({ root, policy, options = {} }) {
  assertBlobSet(root, FROZEN_RUNTIME_BLOBS, 'Frozen P4 estimator input');
  assertImplementationAuthorization(root);
  assertResponseTargetHashOnly(root, policy);
  const authorization = assertHighResolutionAuthorized(root, policy, options);
  return { authorization };
}
function loadReferenceTarget(root, policy, options = {}) {
  highResolutionPreflight({ root, policy, options });
  return validateReferenceTarget(readJson(path.resolve(root, RESPONSE_TARGET_FILE)), policy);
}
function comparatorMathQualification() {
  const folds = [[.1,.05],[.2,.02],[.3,.03],[.4,.04],[.5,.01],[-.1,-.01]]
    .map(x => ({ heldout_relative_improvement_vs_exact_null: x[0], heldout_relative_improvement_vs_ungated_benchmark: x[1] }));
  const pass = est.survivalSummary(folds);
  const fail = est.survivalSummary(folds.map((f, i) => i === 4 ? { ...f, heldout_relative_improvement_vs_ungated_benchmark: -.02 } : f));
  return pass.P4_wins_vs_exact_null === 5 && pass.P4_wins_vs_selected_ungated_benchmark === 5 && pass.P4_dual_survival_guard_passed === true && fail.P4_dual_survival_guard_passed === false;
}
function identifiabilityQualification(policy) {
  const n = est.nullAnchor(policy);
  const rows = [
    { candidate: { sigma_field_mm: 8, kappa_trail_per_s: 8, theta_detect: 1 }, candidate_index: 1, source: 'halton_P4', loss: .01 },
    { candidate: { sigma_field_mm: 8.2, kappa_trail_per_s: 8.2, theta_detect: 1.02 }, candidate_index: 2, source: 'halton_P4', loss: .0101 },
    { candidate: n, candidate_index: 2000, source: 'exact_canonical_null', loss: .2 }
  ];
  const id = est.identifiability(rows, .05, policy);
  return id.passed === true && id.best_ungated_benchmark_outside_P4_near_best_tolerance === true && est.finalIncrementGuard({ primary_loss: .01 }, { primary_loss: .02 }, { primary_loss: .03 }).passed === true;
}
function qualify({ root, policy, trials = 1 }) {
  est.assertPolicySemantics(policy);
  const runtimeBlobs = assertBlobSet(root, FROZEN_RUNTIME_BLOBS, 'Frozen P4 estimator input');
  assertImplementationAuthorization(root);
  const targetHash = assertResponseTargetHashOnly(root, policy);
  const bases = {
    p4: readJson(path.resolve(root, 'models/lasius_niger_painted_trail_p4_v1.json')),
    p3: readJson(path.resolve(root, 'models/lasius_niger_painted_trail_p3_v1.json'))
  };
  const checks = {};
  checks.no_nuisance_parameters = policy.response_parameter_surface.nuisance_parameters.length === 0;
  const c0 = est.p4Candidate(0, policy), c1 = est.p4Candidate(1, policy), u0 = est.ungatedCandidate(0, policy), n = est.nullAnchor(policy);
  checks.halton_3d_mapping = est.near(c0.sigma_field_mm, 8, 1e-14) && est.near(c0.kappa_trail_per_s, 16/3, 1e-14) && est.near(c0.theta_detect, .4, 1e-14) && est.near(c1.sigma_field_mm, 4, 1e-14) && est.near(c1.kappa_trail_per_s, 32/3, 1e-14) && est.near(c1.theta_detect, .8, 1e-14);
  checks.ungated_projection_same_coordinates = est.near(u0.sigma_field_mm, c0.sigma_field_mm, 1e-15) && est.near(u0.kappa_trail_per_s, c0.kappa_trail_per_s, 1e-15) && u0.theta_detect === 0 && u0.candidate_index === c0.candidate_index;
  checks.exact_null_anchor = n.sigma_field_mm === 8 && n.kappa_trail_per_s === 0 && n.theta_detect === .25 && n.candidate_index === 2000;
  const pm = est.configuredP4Model(bases.p4, { sigma_field_mm: 13, kappa_trail_per_s: 2.5, theta_detect: .7 });
  const um = est.configuredUngatedModel(bases.p3, { sigma_field_mm: 13, kappa_trail_per_s: 2.5, theta_detect: 0 });
  checks.P4_candidate_parameter_wiring = JSON.stringify(pm.movement) === JSON.stringify(bases.p4.movement) && pm.painted_trail_response.field.sigma_field_mm === 13 && pm.painted_trail_response.steering.kappa_trail_per_s === 2.5 && pm.painted_trail_response.absolute_detection.theta_detect === .7;
  checks.ungated_benchmark_wiring = JSON.stringify(um.movement) === JSON.stringify(bases.p3.movement) && um.painted_trail_response.field.sigma_field_mm === 13 && um.painted_trail_response.steering.kappa_trail_per_s === 2.5 && um.painted_trail_response.transduction.epsilon_or_regularization === 0;
  checks.exact_P4_and_ungated_canonical_identities = est.identityQualification(bases);
  checks.no_response_rng = est.noResponseRngQualification(bases);
  checks.crn_pairing = est.trialSeed(8210000, 's', 4, policy) === 8210004 && est.trialSeed(8210000, 'l', 4, policy) === 8211004;
  checks.path_not_runtime_input = est.conditionExperiment('dcm_control') === 'open_arena_p4_zero_dose_reachability.json' && est.conditionExperiment('pheromone') === 'open_arena_p4_nominal_dose_reachability.json';
  const syn = est.syntheticRows(), cols = policy.reference_partition.colonies;
  const ref = est.referenceContrastTarget(syn, cols, est.PRIMARY_METRICS), manual = {};
  for (const pl of est.PATHS) for (const metric of est.PRIMARY_METRICS) manual[pl + '|' + metric] = est.mean(cols.map(col => est.colonyContrast(syn, col, pl, metric)));
  checks.equal_weight_colony_contrasts = JSON.stringify(ref) === JSON.stringify(manual);
  const trainCols = cols.filter(x => x !== 27), train = syn.filter(r => r.colony !== 27);
  checks.fold_isolation = !train.some(r => r.colony === 27) && Object.keys(est.referenceContrastTarget(train, trainCols, est.PRIMARY_METRICS)).length === 4;
  const simPrimaryOnly = [];
  for (const pl of est.PATHS) for (const t of est.TREATMENTS) simPrimaryOnly.push({ path_length: pl, treatment: t, middle_zone_fraction: est.cellMean(syn, null, pl, t, 'middle_zone_fraction'), trail_axis_exit: est.cellMean(syn, null, pl, t, 'trail_axis_exit'), time_to_exit_s: 9999, beeline_mm: 9999 });
  checks.primary_objective_ignores_secondary = Number.isFinite(est.contrastScore(simPrimaryOnly, syn, cols, est.PRIMARY_METRICS).loss);
  checks.sample_sd_semantics = est.near(est.sampleSd([1,2,3]), 1, 1e-15);
  checks.dual_survival_comparator_math = comparatorMathQualification();
  checks.three_parameter_identifiability_and_final_increment = identifiabilityQualification(policy);
  const d = est.simulateTreatment(c0, 'dcm_control', trials, 1084700, bases, policy, 'P4');
  const ph = est.simulateTreatment(c0, 'pheromone', trials, 1084700, bases, policy, 'P4');
  const uh = est.simulateTreatment(u0, 'pheromone', trials, 1084700, bases, policy, 'ungated');
  checks.P4_simulation_smoke = d.length === trials * 2 && ph.length === trials * 2;
  checks.ungated_simulation_smoke = uh.length === trials * 2 && uh.every(r => r.mechanism === 'ungated');
  checks.response_target_semantics_not_loaded = true;
  checks.response_target_hash_verified_only = targetHash === policy.frozen_inputs.response_target.git_blob_sha;
  checks.P1_official_result_semantics_not_loaded = true;
  checks.P2_official_result_semantics_not_loaded = true;
  checks.P3_official_result_semantics_not_loaded = true;
  checks.ymaze_not_loaded = true;
  checks.high_resolution_search_not_authorized = true;
  const passed = Object.values(checks).every(Boolean);
  return {
    schema_version: 1,
    qualification_id: 'P4_estimator_synthetic_qualification_v1',
    status: passed ? 'passed' : 'failed',
    scientific_evidence: false,
    reference_outcomes_accessed: false,
    response_target_semantics_loaded: false,
    response_target_hash_verified_only: true,
    P1_official_result_semantics_loaded: false,
    P2_official_result_semantics_loaded: false,
    P3_official_result_semantics_loaded: false,
    ymaze_accessed: false,
    high_resolution_search_executed: false,
    policy_git_blob_sha: POLICY_GIT_BLOB_SHA,
    estimator_core_git_blob_sha: CORE_GIT_BLOB_SHA,
    estimator_git_blob_sha: gitBlobShaFile(__filename),
    implementation_authorization_git_blob_sha: IMPLEMENTATION_AUTH_GIT_BLOB_SHA,
    response_target_git_blob_sha_verified: targetHash,
    runtime_blobs_verified: runtimeBlobs,
    checks
  };
}
function runHighres({ root, policy, target }) {
  const bases = {
    p4: readJson(path.resolve(root, 'models/lasius_niger_painted_trail_p4_v1.json')),
    p3: readJson(path.resolve(root, 'models/lasius_niger_painted_trail_p3_v1.json'))
  };
  const cols = policy.reference_partition.colonies, folds = [];
  for (let fi = 0; fi < cols.length; fi++) {
    const held = cols[fi], trainCols = cols.filter(c => c !== held);
    const trainRows = target.rows.filter(r => r.colony !== held), heldRows = target.rows.filter(r => r.colony === held);
    const fitSeed = policy.search_protocol.root_fit_seed + fi * 10000, evalSeed = policy.search_protocol.root_evaluation_seed + fi * 10000;
    const pp = est.searchPanel(trainRows, trainCols, policy, bases, { trials: policy.search_protocol.training_trials_per_treatment_path_per_candidate, seed0: fitSeed, panel: 'P4' });
    const up = est.searchPanel(trainRows, trainCols, policy, bases, { trials: policy.search_protocol.training_trials_per_treatment_path_per_candidate, seed0: fitSeed, panel: 'ungated' });
    const n = { candidate: est.nullAnchor(policy), candidate_index: 2000, source: 'exact_canonical_null' };
    const hp = est.evaluateCandidate(pp.best, heldRows, [held], policy, bases, policy.search_protocol.heldout_evaluation_trials_per_treatment_path, evalSeed, trainRows, 'P4');
    const hu = est.evaluateCandidate(up.best, heldRows, [held], policy, bases, policy.search_protocol.heldout_evaluation_trials_per_treatment_path, evalSeed, trainRows, 'ungated');
    const hn = est.evaluateCandidate(n, heldRows, [held], policy, bases, policy.search_protocol.heldout_evaluation_trials_per_treatment_path, evalSeed, trainRows, 'P4');
    folds.push({ fold_index: fi, held_out_colony: held, P4_training_top_candidates: pp.top, ungated_training_top_candidates: up.top, selected_P4_training_fit: pp.best, selected_ungated_training_fit: up.best, heldout_selected_P4: hp, heldout_selected_ungated_benchmark: hu, heldout_exact_null: hn, heldout_relative_improvement_vs_exact_null: (hn.primary_loss - hp.primary_loss) / Math.max(1e-12, hn.primary_loss), heldout_relative_improvement_vs_ungated_benchmark: (hu.primary_loss - hp.primary_loss) / Math.max(1e-12, hu.primary_loss) });
  }
  const internal_cv = est.survivalSummary(folds);
  const report = {
    schema_version: 1,
    status: null,
    execution_class: 'frozen_high_resolution_response_search',
    scientific_evidence: true,
    reference_outcomes_accessed: true,
    response_target_git_blob_sha: policy.frozen_inputs.response_target.git_blob_sha,
    P1_official_result_semantics_loaded: false,
    P2_official_result_semantics_loaded: false,
    P3_official_result_semantics_loaded: false,
    ymaze_accessed: false,
    canonical_locomotion_updated: false,
    H2_H3_H4_H5_refit: false,
    nuisance_parameters_estimated: false,
    policy_git_blob_sha: POLICY_GIT_BLOB_SHA,
    estimator_core_git_blob_sha: CORE_GIT_BLOB_SHA,
    search: { P4_candidates_per_fold_total: 2000, positive_P4_halton_candidates: 1999, ungated_benchmark_candidates_per_fold_total: 2000, training_trials_per_treatment_path_per_candidate: 60, heldout_evaluation_trials_per_treatment_path: 120, folds: 6, root_fit_seed: 8210000, root_evaluation_seed: 8810000, common_random_numbers: true, response_rng: 'none' },
    folds,
    internal_cv,
    final_all_data_fit: null,
    promotion: null
  };
  if (!internal_cv.P4_dual_survival_guard_passed) {
    report.status = 'development_response_estimation_failed_dual_primary_survival_guard';
    report.promotion = { mechanism_survives_internal_development: false, fixed_parameter_triplet_eligible_for_future_freeze: false, reason: 'failed_dual_primary_survival_guard', canonical_promotion: false, ymaze_unlock: false };
    return report;
  }
  const pp = est.searchPanel(target.rows, cols, policy, bases, { trials: policy.final_all_data_fit.training_trials_per_treatment_path_per_candidate, seed0: policy.final_all_data_fit.fit_seed, panel: 'P4', retainAll: true });
  const up = est.searchPanel(target.rows, cols, policy, bases, { trials: policy.final_all_data_fit.training_trials_per_treatment_path_per_candidate, seed0: policy.final_all_data_fit.fit_seed, panel: 'ungated', retainAll: true });
  const id = est.identifiability(pp.all, up.best.loss, policy);
  const n = { candidate: est.nullAnchor(policy), candidate_index: 2000, source: 'exact_canonical_null' };
  const checkSeed = policy.final_all_data_fit.final_check_seed, trials = policy.final_all_data_fit.final_check_trials_per_treatment_path;
  const fp = est.evaluateCandidate(pp.best, target.rows, cols, policy, bases, trials, checkSeed, target.rows, 'P4');
  const fu = est.evaluateCandidate(up.best, target.rows, cols, policy, bases, trials, checkSeed, target.rows, 'ungated');
  const fn = est.evaluateCandidate(n, target.rows, cols, policy, bases, trials, checkSeed, target.rows, 'P4');
  const increment = est.finalIncrementGuard(fp, fu, fn), secondary = fp.secondary_guard;
  const eligible = id.passed && increment.passed && secondary.passed;
  report.final_all_data_fit = { selected_P4_training_fit: pp.best, selected_ungated_training_fit: up.best, identifiability: id, independent_final_check: { selected_P4: fp, selected_ungated_benchmark: fu, exact_null: fn, primary_increment_guard: increment, secondary_guard: secondary } };
  report.status = eligible ? 'development_response_estimation_passed_and_parameter_triplet_eligible_for_future_freeze' : 'development_response_estimation_survived_but_parameter_triplet_not_eligible';
  report.promotion = { mechanism_survives_internal_development: true, fixed_parameter_triplet_eligible_for_future_freeze: eligible, reason: eligible ? 'all_frozen_internal_guards_passed' : 'one_or_more_post_survival_guards_failed', canonical_promotion: false, ymaze_unlock: false };
  return report;
}
function writeReport(file, report) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
}
function main() {
  const root = path.resolve(__dirname, '..');
  const mode = arg('mode', 'qualify');
  const out = assertSafeReportOutput(root, arg('out', mode === 'qualify' ? 'reports/p4_estimator_qualification_v1.json' : 'reports/p4_response_estimation_2000x60_v1.json'));
  const { policy } = assertExactPolicyBlob(root);
  assertImplementationAuthorization(root);
  if (mode === 'qualify') {
    if (hasArg('candidates') || hasArg('seed') || hasArg('dt')) throw new Error('P4 qualification does not accept scientific search overrides.');
    const report = qualify({ root, policy, trials: narg('trials', 1) });
    writeReport(out, report);
    if (report.status !== 'passed') process.exitCode = 1;
    return;
  }
  if (mode !== 'highres') throw new Error('Unknown P4 estimation mode ' + mode + '.');
  for (const k of ['candidates','trials','eval-trials','seed','final-trials','final-seed','dt']) if (hasArg(k)) throw new Error('Frozen P4 high-resolution search forbids CLI override --' + k + '.');
  const options = { branchName: currentBranchName(root) };
  const preflight = highResolutionPreflight({ root, policy, options });
  const target = validateReferenceTarget(readJson(path.resolve(root, RESPONSE_TARGET_FILE)), policy);
  const report = runHighres({ root, policy, target });
  report.authorization_id = preflight.authorization.id;
  report.generated_from_git_head = currentRepoCommit(root);
  report.estimator_git_blob_sha = gitBlobShaFile(__filename);
  writeReport(out, report);
}

if (require.main === module) main();
module.exports = { POLICY_FILE, POLICY_GIT_BLOB_SHA, CORE_GIT_BLOB_SHA, IMPLEMENTATION_AUTH_FILE, IMPLEMENTATION_AUTH_GIT_BLOB_SHA, HIGHRES_AUTHORIZATION_FILE, RESPONSE_TARGET_FILE, FROZEN_RUNTIME_BLOBS, arg, hasArg, narg, gitBlobShaBuffer, gitBlobShaFile, sha256File, currentRepoCommit, currentBranchName, assertSafeReportOutput, assertBlobSet, assertExactPolicyBlob, assertImplementationAuthorization, assertResponseTargetHashOnly, validateReferenceTarget, assertAuthorizationEffective, assertHighResolutionAuthorized, highResolutionPreflight, loadReferenceTarget, comparatorMathQualification, identifiabilityQualification, qualify, runHighres, writeReport, main };
