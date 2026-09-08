# Roadmap

## v0.1 — substrate
- deterministic clock
- per-agent RNG
- continuous locomotion
- spatial contacts

## v0.2 — honest experiment engine
- experiment JSON drives simulation
- no hidden navigation cheats
- reusable geometry
- timestep and neutral-maze guardrails

## v0.3 — scientific integrity
- model/state/apparatus/protocol/observation/scoring separation
- parameter firewall
- independent RNG streams
- calibration/holdout manifests

## v0.3.1 — measurement reconstruction
- exact-time camera sampling independent of physics timestep
- sub-step apparatus-boundary truth timing
- streaming observation-derived metrics
- truth vs observed metrics kept separate
- final-version supplement inventory/reconstruction
- biological fitting remains locked because raw AnimalTA trajectories/threshold are unavailable

## v0.3.2 — locomotion model competition (in progress)
### v0.3.2a — H0 null screen — complete
- derive DCM-control short-vs-long effect reference from checksummed XLSX
- deterministic descriptive bootstrap intervals
- leave-one-colony-out sign-robustness check
- common-random-number short/long simulation comparison
- H0 context-invariant model screened out by distance, exit-time and straightness contrasts
- no fitting and no Y-maze access

### v0.3.2b — H1 entry-condition explanation
- blocked pending measured initial heading/speed distributions or raw entry frames
- entry conditions must be measured inputs, not fitted downstream knobs

### v0.3.2c — H2 persistent directional state — complete / not promoted
- pre-registered decaying continuous angular-diffusion reduction
- frozen 500-candidate × 60-trial × 6-fold LOCO development search completed
- 4/6 held-out wins with positive median improvement, but failed the frozen >=5/6 promotion guard
- canonical locomotion unchanged

### v0.3.2d — H3 transient reorientation gate — complete / not promoted
- changed discrete reorientation-event timing rather than continuous angular diffusion
- corrected frozen high-resolution LOCO search completed
- 1/6 held-out wins versus its own null; failed promotion and H2 comparison guards

### v0.3.2e — H4 transient locomotor activation — complete / not promoted
- changed moving speed only through a decaying activation state
- frozen 500-candidate × 60-trial × 6-fold LOCO search completed
- 2/6 held-out wins versus its own null; failed promotion and H2/H3 comparison guards
- moving speed remained diagnostic-only; Y-maze remained locked

### v0.3.2f — H5 transient entry-heading restoration — complete / not promoted / closed
- frozen mechanism implemented in isolated `src/h5.js` extension; pinned H0–H4 runtime blobs remain unchanged
- deterministic restoring drift targets each ant's own lazily captured post-transition entry heading
- angular-noise amplitude, speed, pauses, and shared entry-state distribution remain unchanged
- 400-trial-per-condition reference-free mechanism reachability passed all intended structural checks
- long-history engineering runs were slightly earlier, shorter, and straighter while moving speed remained essentially unchanged
- no parameter sweep or fitting during reachability; Y-maze remained locked
- H5 parameter-estimation policy v1 frozen before estimator implementation/search
- estimator implementation + reference-free synthetic qualification + code/Chromium audit complete
- qualified estimator and authorization chain completed
- one official frozen 500×60×6 H5 LOCO search completed
- 3/6 held-out wins vs H5-null; failed the required 5/6 own-null guard
- 2/6 held-out wins vs per-fold best H2/H3/H4 prior; median −7.12%; failed best-prior guard
- exact result frozen and independently reproduced; 48/48 Chromium parity cases
- H5-v1 not promoted and permanently closed; no rerun or retuning authorized
- canonical locomotion remains unchanged; Y-maze remains locked

## v0.3.3 — externally painted trail response
### v0.3.3a — evidence/protocol freeze — complete
- final Poissonnier open-arena pheromone target surface frozen from all 102 Experiment 1 rows
- published trail recipe/geometry frozen as protocol/apparatus facts
- primary response observables limited to middle-zone occupancy and trail-axis exits
- secondary guards: exit time and beeline
- response estimation must use pheromone-vs-DCM contrasts within each path-length stratum
- baseline locomotion and H2–H5 remain fixed; short/long-specific response parameters forbidden
- Y-maze remains locked
- no chemical-sensor implementation or response-parameter search authorized by this gate

### v0.3.3b — egocentric painted-trail mechanism freeze — complete
- frozen undirected Gaussian external line field
- frozen two-point egocentric bilateral sensor geometry
- frozen deterministic saturating transduction and left/right steering law
- exact DCM zero-signal and kappa=0 canonical null identities required
- baseline speed, pauses, angular-noise amplitude, RNG streams, and locomotion-history state unchanged
- future P1 response parameters limited to shared sigma_field_mm and kappa_trail_per_s
- frozen engineering-only reachability values before implementation
- no trail bearing, line distance, arena target, treatment label, path-history label, or Y-maze input allowed

### v0.3.3c — implementation + reference-free reachability — complete / PASS
- isolated `src/p1.js` runtime and engineering-only P1 model implemented without changing canonical locomotion
- exact DCM zero-dose and kappa=0 paths preserve canonical trajectory/biology RNG state
- nonzero-dose P1 leaves the canonical speed/pause/RNG process unchanged
- endpoint-reversal, translation, rotation, local steering-sign, and on-trail zero-steering checks passed
- implementation qualification passed full regression suite + real Chromium parity with zero response-target and Y-maze requests
- one frozen 400-trial-per-condition reference-free reachability execution completed on attempt 1
- nominal painted trail increased mean central-zone fraction by +0.06116 and trail-axis exit rate by +0.0625 versus zero dose
- exact result frozen at `reports/p1_reference_free_reachability_v1.json`
- no fitting, parameter search, model selection, canonical update, reference-target access, or Y-maze access occurred
- engineering values remain non-biological and may not be retuned from the reachability outcome

### v0.3.3d — response-estimation policy freeze — complete
- exactly two estimated response parameters: shared `sigma_field_mm` (2–32 mm log) and `kappa_trail_per_s` (0–16 s⁻¹ linear)
- no nuisance parameters; baseline locomotion, H2–H5, sensor geometry, transduction, apparatus and observation model remain fixed
- primary objective is equal-weight error in pheromone-minus-DCM contrasts for middle-zone occupancy and trail-axis exits, separately for short and long path strata
- colony-level contrasts are equal-weighted within LOCO training and the final all-data target; ant-row counts cannot reweight colonies
- six leave-one-colony-out folds; 499 fixed Halton context candidates + one exact kappa=0 null anchor
- 60 training trials and 120 held-out trials per treatment × path with matched pheromone/DCM common random numbers
- survival requires >=5/6 held-out wins vs exact null plus positive median relative improvement
- final all-data fit, identifiability checks and secondary exit-time/beeline guards are frozen in advance
- canonical locomotion unchanged; Y-maze remains locked

### v0.3.3e — estimator implementation + qualification — complete
- frozen estimator implemented in `tools/run-p1-estimation.js`
- qualification hash-verifies the response target but does not parse response outcomes
- synthetic fixtures verify equal-weight colony contrasts, fold isolation, Halton mapping, exact null and CRN seed pairing
- low-volume reference-free simulation verifies candidate wiring and exact DCM/kappa=0 canonical identity
- semantic target loader is itself blocked without a matching active high-resolution authorization
- exact-head full regression + standalone qualification + 8/8 real Chromium parity passed
- qualified estimator merged to main; canonical locomotion unchanged; Y-maze remained locked

### v0.3.3f — high-resolution authorization freeze — complete
- permanent estimator qualification report frozen from the successful v0.3.3e audit
- authorization pins exact policy, estimator, qualification report, audit run/job/artifact and one-shot frozen execution contract
- authorization merged to main at `a9b57636db9b12cfd88feb2c8560f9eafa84787b`
- permanent main Test and deploy ANTLAB run 34081603983 passed, including test and deploy jobs
- canonical promotion remains unauthorized; Y-maze remains locked

### v0.3.3g — official high-resolution response execution — complete / FAIL
- one official frozen response-estimation execution completed successfully on attempt 1 at main commit `4da2101267093ead0e3f2569b28940f49f89a552`
- run 34081980126 / job 101618864436 / artifact 10004082907
- exact report SHA-256 `4e3de4c1fb35465a877fbc78b8ce178763b5bcb968af05d66085186a93a3facf`
- P1 beat its exact null in 4/6 held-out colonies; frozen survival requirement was >=5/6
- median relative held-out improvement was positive (+26.13%), but the 4/6 win count failed the conjunctive primary survival guard
- losses occurred for held-out colonies 0 (−17.10%) and 27 (−153.94%)
- final all-data fit was not executed because the primary survival guard failed
- no identifiability or final secondary promotion guard was evaluated
- canonical locomotion unchanged; Y-maze untouched

### v0.3.3h — response-estimation result freeze / P1-v1 closure — complete
- exact 174770-byte official report materialized without reserialization
- exact execution provenance frozen from the official Actions artifact
- active high-resolution authorization retired to archive
- official execution workflow and one-time result materializer retired
- result-freeze record closes P1-v1 with rerun/retuning explicitly unauthorized
- permanent regression pins 4/6 failure, positive median, absent final fit, no fixed pair, no canonical update, and no Y-maze unlock
- final full-suite + real Chromium result-freeze audit passed with 4/4 parity and zero response-target/Y-maze requests
- P1-v1 permanently closed; canonical locomotion unchanged; Y-maze remains locked

### v0.3.3i — post-P1 failure characterization + P2 evidence gate — complete
- post-hoc characterization uses only the immutable official P1 report; no raw target re-read, new simulation, reranking, refit, or inferential testing
- fold summaries are frozen descriptively and explicitly forbid treating colony 27 or any other colony as an outlier to remove/downweight
- independent Lasius niger evidence supports transient non-repeatable pheromone lapses as a plausible future mechanism class, but not a stable specialist-ignorer caste
- cross-species Linepithema humile evidence supports relative/Weber-like bilateral pheromone sensing as a plausible mechanism class, but cannot set Lasius niger parameters
- 2026 Lasius niger evidence does not support adding path-history, travel-direction, or recent-food-experience response modifiers
- no P2 mechanism selected; no P2 runtime/model/policy/authorization exists; no new simulation authorized
- final audit run 34084252932 passed full H0-H5 + P1 suite plus real Chromium with zero response-target, Y-maze, or P2 executable-surface requests
- canonical locomotion unchanged; P1-v1 remains closed; Y-maze remains locked

### v0.3.3j — P2 transient-engagement mechanism selection freeze — complete
- Candidate A transient response engagement/lapse selected prospectively for P2-v1 because it has direct Lasius niger support
- Candidate B relative/Weber bilateral transduction remains unselected because current support is cross-species; no A+B combination is authorized
- P2 adds one per-ant, per-trial engagement state that is redrawn each simulation trial and is never a persistent specialist identity
- when engaged, P2 reuses the already-frozen P1 egocentric local steering kernel unchanged as a component; P1-v1 itself remains closed
- dedicated response-only RNG is namespaced from simulation seed + ant id and adds zero canonical biology RNG draws
- exact identities frozen for zero dose, kappa=0, p_lapse=1 canonical bypass, and p_lapse=0 nested P1-kernel identity
- reference-free engineering panel freezes sigma=8 mm, kappa=4 s^-1, and literature-motivated p_lapse=0.20 only for reachability
- no P2 runtime/model exists; no new simulation, response-target search, estimation policy, canonical update, or Y-maze access authorized
- final audit run 34085033098 passed full suite + pure specification checks + real Chromium with zero response-target, Y-maze, or P2 executable-surface requests

### v0.3.3k — P2 implementation + reference-free reachability — complete / PASS
- P2 reachability execution policy frozen before runtime implementation at blob `8431ada87724953128104077f4ce1c11b569b1cf`
- implementation authorization frozen before runtime implementation at blob `462997ea7399d98efca5a6b19a0e38160fbddbaf`
- isolated `src/p2.js` implements only the frozen transient per-trial engagement gate over canonical integrity runtime
- P2 uses a dedicated namespaced response RNG and adds zero canonical biology RNG draws
- engineering P2 model freezes sigma=8 mm, kappa=4 s^-1, p_lapse=0.20, and unchanged bilateral sensor geometry
- all eight exact-identity seeds passed: zero dose -> canonical, kappa=0 -> canonical, p_lapse=1 -> canonical, p_lapse=0 -> frozen P1-kernel identity
- first frozen 400-trial reference-free execution passed on run 34089553046: 75 lapses / 325 engaged (18.75% realized lapse fraction)
- every stochastic P2 trial was exactly the same-seed P1 trajectory if engaged or exactly canonical if lapsed; exactly one response draw per intermediate-p_lapse trial
- descriptive engineering summaries: central-zone fraction 0.31054, trail-axis exit rate 0.4825, mean moving speed 23.6285 mm/s, mean exit time 9.3533 s
- exact 5765-byte report frozen at `reports/p2_reference_free_reachability_v1.json`, blob `78a5e0ac4a3dd536a0e2d06ece2e9e37cdb2aefa`, SHA-256 `de481a25ad36d6124bb51cb644bb55199fa655471fbadc082f7d3f04cb2ac37b`
- Chromium parity 6/6 with zero exceptions, console errors, response-target requests, Y-maze requests, or P2 estimation-surface requests
- Candidate B Weber transduction remains absent; no estimation policy/search, biological fit claim, canonical update, or Y-maze access authorized

### v0.3.3l — P2 response-estimation policy freeze — complete
- P2 estimation policy frozen before estimator implementation or semantic response-target access at blob `eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce`
- active parameters: sigma_field_mm [2,32] log, kappa_trail_per_s [0,16] linear, p_lapse [0,1] linear; no nuisance parameters
- 3D deterministic Halton panel: 999 P2 candidates + exact canonical null; p_lapse uses prime 5 and its full mathematical domain to avoid target-informed narrowing
- separate 999-candidate projected p_lapse=0 benchmark + exact null is ranked independently on the same objective
- six-colony LOCO partition, equal colony weighting, primary metrics/objective, 5/6 robustness threshold, secondary guards, and trial budgets retain the previously frozen meanings rather than being softened after P1 failure
- P2 must pass both 5/6 heldout guards: versus exact canonical null and versus the separately selected no-lapse nested benchmark; both median relative improvements must be strictly positive
- fresh P2-only seed streams: fit 4210000, heldout 4810000, final fit 5210000, independent final check 5610000
- final promotion additionally requires 3-parameter identifiability, no-lapse submodel outside the near-best tolerance, final primary improvement over both comparators, and all four secondary standardized errors <=1
- final audit run 34090954537 passed full suite + policy-math checks + real Chromium with zero response-target, Y-maze, or P2-estimator-surface requests
- no estimator exists; no high-resolution search, target semantic access, P1-result semantic access, Candidate B transduction, canonical update, H2-H5 combination, or Y-maze access authorized

### v0.3.3m — P2 estimator implementation + reference-free qualification — complete
- `tools/run-p2-estimation.js` frozen at blob `38d66d28e94d2f532e9c8a20bd6553d6d11be8a6` against exact policy blob `eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce`
- estimator implements 999-candidate 3D P2 Halton panel + exact canonical null and separately ranked 999-candidate projected p_lapse=0 benchmark + same null
- reference-free qualification passed all 20 frozen checks, including null/endpoints, nested P1 identity, response-RNG common random numbers, equal-colony contrasts, fold isolation, primary-only ranking, sample-SD guards, dual 5/6 survival math, 3-parameter identifiability, and final primary increment logic
- exact 2902-byte qualification report frozen at `reports/p2_estimator_qualification_v1.json`, blob `9f4d15875b35773b41696987abd1cc4721435bc2`, SHA-256 `22cd65ffbf3adbfd88fb3998ba4ab41e142b52b2b19d8aa2460ab2d9c42596a2`
- first successful qualification audit run 34091953598 / job 101647130672 / artifact 10007145009; freeze-aware audit run 34092138649 also passed
- Chromium estimator-wiring parity 10/10 with zero exceptions, console errors, response-target requests, Y-maze requests, or P2 authorization requests
- response-target file was hash-verified only; semantic loading remains blocked behind absent post-qualification high-res authorization
- P1 official response-result semantics were not loaded by the P2 estimator
- no high-resolution search, canonical update, Candidate B implementation, or Y-maze access authorized in this phase

### v0.3.3n — P2 post-qualification high-resolution authorization freeze — complete
- high-resolution authorization frozen at `hypotheses/p2_highres_authorization_v1.json`, blob `de361b15b9600bd92a35baf30fa71c2a7c61003c`
- authorization pins exact policy `eaa74df19f3fdc1a59dec5f0b3b2efefba3f89ce`, estimator `38d66d28e94d2f532e9c8a20bd6553d6d11be8a6`, qualification report `9f4d15875b35773b41696987abd1cc4721435bc2`, and qualification freeze `1d46b594cb154a93c2e321fb67d399acdd821993`
- authorization is effective only after merge to main and only after permanent main test/deploy succeeds on a commit containing the exact authorization, policy, estimator, and qualification freeze
- authorizes exactly one frozen official P2 high-resolution response search; review-branch highres must still reject before semantic target parsing
- frozen execution: 999 3D P2 Halton candidates + exact null, 999 projected no-lapse candidates + same null, 60/120 LOCO trials, fresh 4210000/4810000 seeds, 120 final-fit + 240 final-check with 5210000/5610000 seeds
- dual 5/6 survival guards remain mandatory versus exact canonical null and separately selected no-lapse benchmark
- authorization audit run `34188977874` / job `101942942275` / artifact `10041510303` passed full suite, reference-free qualification, review-branch highres rejection, and Chromium/firewall with zero target, Y-maze, P1-result, or official-P2-result requests
- no CLI search overrides, adaptive refinement, P1-result semantic access, Candidate B, canonical update, H2-H5 combination, or Y-maze access
- this authorization PR does not run the 102-row official search; a later separate one-shot main-only execution gate is required

### v0.3.3o — P2 one-shot official high-resolution execution gate — in progress
- one-shot main-only workflow frozen at `.github/workflows/p2-v033o-official-highres.yml`, blob `467aa7fc56bd7e843a68ad03e7d57c4a174efc2f`
- execution precondition frozen at `hypotheses/p2_highres_execution_precondition_v1.json`, blob `a0bf279649df4be906f74dc96b53f6c2106071bf`
- precondition pins merged authorization commit `a2f5c3dc2a10aad30e796c3f866a382b31cc6210` and green permanent main CI run `34189072667` (#140), test job `101943216663`, deploy job `101943352041`
- workflow has only a push-to-main path trigger on its own workflow file; no pull_request or workflow_dispatch trigger
- review-branch commits cannot execute the official 102-row search and unrelated later main commits cannot retrigger it
- official command frozen exactly: `node tools/run-p2-estimation.js --mode highres --out reports/p2_response_estimation_1000x60_v1.json`
- workflow reruns the permanent regression suite immediately before target-ranked execution, validates frozen authorization/policy/estimator/qualification/target/runtime blobs, then uploads exact report + execution provenance as artifact `p2-v033o-official-highres`
- no high-resolution CLI overrides, P1-result semantic access, Candidate B, canonical promotion, H2-H5 refit, or Y-maze access
- branch-only preflight audit required before merge; merging the clean workflow head to main is the one event authorized to trigger the official search

## v0.4 — locked cross-apparatus validation
- frozen species model
- four Y-maze protocol conditions
- stratified + pooled trail-following results
- no Y-maze fitting/model selection

## v0.5 — trail deposition
## v0.6 — self recruitment
## v0.7 — resource physics
## v0.8 — social traffic
