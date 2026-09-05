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

### v0.3.2f — H5 transient entry-heading restoration — implemented / reachability verified
- frozen mechanism implemented in isolated `src/h5.js` extension; pinned H0–H4 runtime blobs remain unchanged
- deterministic restoring drift targets each ant's own lazily captured post-transition entry heading
- angular-noise amplitude, speed, pauses, and shared entry-state distribution remain unchanged
- 400-trial-per-condition reference-free mechanism reachability passed all intended structural checks
- long-history engineering runs were slightly earlier, shorter, and straighter while moving speed remained essentially unchanged
- no parameter sweep or fitting during reachability; Y-maze remained locked
- H5 parameter-estimation policy v1 frozen before estimator implementation/search
- estimator implementation + reference-free synthetic qualification + code/Chromium audit complete
- qualified estimator blob recorded; high-resolution mode remains hard-locked
- next gate is separate post-qualification authorization, then the unchanged frozen 500×60×6 H5 LOCO search
- canonical locomotion remains unchanged

## v0.3.3 — externally painted trail response
- local egocentric chemical sensors
- dose-aware trail stimulus
- fit only pheromone-response parameters against open-arena pheromone data

## v0.4 — locked cross-apparatus validation
- frozen species model
- four Y-maze protocol conditions
- stratified + pooled trail-following results
- no Y-maze fitting/model selection

## v0.5 — trail deposition
## v0.6 — self recruitment
## v0.7 — resource physics
## v0.8 — social traffic
