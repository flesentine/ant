'use strict';
const assert=require('assert'),path=require('path');
const{runCompetition,validateScreeningInputs,PRIMARY}=require('../tools/run-model-competition.js');
const{readJson}=require('../tools/load-bundle.js');
const root=path.resolve(__dirname,'..'),hypothesis=readJson(path.join(root,'hypotheses/open_arena_locomotion_context_v1.json')),reference=readJson(path.join(root,'reference/poissonnier2026_control_effects.json')),policy=readJson(path.join(root,'reference/calibration_manifest.json')),sourceManifest=readJson(path.join(root,'reference/poissonnier2026_source_manifest.json'));
const clone=v=>JSON.parse(JSON.stringify(v));
validateScreeningInputs({hypothesis,reference,policy,sourceManifest});
{const p=clone(policy);p.datasets.poissonnier2026_open_arena.allowed_for_descriptive_model_screening=false;assert.throws(()=>validateScreeningInputs({hypothesis,reference,policy:p,sourceManifest}),/not allowed/);}
{const r=clone(reference);r.source_xlsx_sha256='wrong';assert.throws(()=>validateScreeningInputs({hypothesis,reference:r,policy,sourceManifest}),/does not match/);}
{const p=clone(policy);p.datasets.poissonnier2026_ymaze.allowed_for_descriptive_model_screening=true;assert.throws(()=>validateScreeningInputs({hypothesis,reference,policy:p,sourceManifest}),/Y-maze holdout/);}
const r=runCompetition({trials:24,firstSeed:640000,dt:.02});assert.strictEqual(r.hypothesis_id,'H0_context_invariant');assert.strictEqual(r.fit_performed,false);assert.strictEqual(r.ymaze_accessed,false);assert.strictEqual(r.conclusion,'H0_screening_incompatible');assert.deepStrictEqual(r.primary_outside,PRIMARY);for(const[name,m]of Object.entries(r.metrics))assert(Math.abs(m.max_abs_paired_seed_difference)<1e-12,`${name} leaked context into H0`);assert.strictEqual(r.metrics.mean_moving_speed_mm_s.classification,'compatible_with_summary_contrast');assert.strictEqual(r.metrics.central_zone_fraction.classification,'compatible_with_summary_contrast');for(const k of PRIMARY)assert.strictEqual(r.metrics[k].classification,'outside_summary_contrast_interval');console.log('model-competition.test.js PASS '+JSON.stringify({conclusion:r.conclusion,primary_outside:r.primary_outside}));
