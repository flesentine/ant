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

## v0.4 — locked cross-apparatus validation
- frozen species model
- four Y-maze protocol conditions
- stratified + pooled trail-following results
- no Y-maze fitting/model selection

## v0.5 — trail deposition
## v0.6 — self recruitment
## v0.7 — resource physics
## v0.8 — social traffic
