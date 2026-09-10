# P4 painted-trail response — independent candidate evidence

## Status

**Independent evidence frozen; one fresh broad candidate class is supported, but no P4 mechanism is selected or implemented.**

Evidence record:

`hypotheses/p4_painted_trail_candidate_class_evidence_v1.json`

Git blob:

`262f332062f271bbf111d0572f83b2faaf2cfd74`

This gate begins only after P1-v1, P2-v1, and P3-v1 are permanently closed. The P3 post-failure characterization may motivate the question, but it does not determine any P4 equation, threshold, sensor geometry, parameter, search surface, or promotion rule.

## Direct Lasius niger evidence that absolute pheromone level can matter

Oberhauser, Wendt & Czaczkes (2020), *Trail Pheromone Does Not Modulate Subjective Reward Evaluation in Lasius niger Ants* (Frontiers in Psychology, DOI `10.3389/fpsyg.2020.555576`) reported a separate concentration-dependent attraction assay.

Observed pheromone-arm choices were:

| Treatment | Pheromone-arm choice |
| --- | ---: |
| DCM vs DCM | 51.2% |
| 2 glands/ml | 73.4% |
| 4 glands/ml | 85.1% |
| 8 glands/ml | 94.4% |

All three pheromone concentrations were preferred over chance, the four conditions differed overall, and the strongest 8 glands/ml treatment attracted significantly more ants than the weakest 2 glands/ml treatment.

Allowed inference: **absolute pheromone level can affect attraction strength in Lasius niger under the tested assay.**

Not allowed: infer a hard threshold, sigmoid, Hill function, regularization constant, local open-arena sensor geometry, field width, steering gain, or P4 parameter value from these percentages.

Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC7540218/

## Relative directional comparison is compatible with absolute detectability

Perna et al. (2012), *Individual Rules for Trail Pattern Formation in Argentine Ants (Linepithema humile)* (PLoS Computational Biology, DOI `10.1371/journal.pcbi.1002592`), reported a local Weber-like bilateral turning response in Argentine ants.

Importantly, the authors also explicitly discussed a **minimum sensory detection threshold**: below detectable pheromone levels, the expected average response is to continue without changing direction.

This matters conceptually because it shows that a relative left-right directional comparison and an absolute detectability stage are not mutually exclusive mechanisms.

Allowed inference: a future candidate class may combine local bilateral directional information with absolute-signal-dependent response expression or detection.

Not allowed: copy the Argentine-ant threshold value, sector geometry, Weber equation, or numerical constants into Lasius niger.

Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC3400603/

## Why the evidence does not choose one smooth dose-response law

Czaczkes, Grüter, Jones & Ratnieks (2011), *Synergy between social and private information increases foraging efficiency in ants* (Biology Letters, DOI `10.1098/rsbl.2011.0067`), found that pheromone interacting with route memory altered walking speed and straightness in experienced Lasius niger foragers.

However, increasing trail strength from one ant passage to 20 ant passages did **not** significantly change pheromone deposition, U-turn rate, walking speed, or path sinuosity in that comparison. The authors described the measured response as compatible with an all-or-nothing effect in that context.

Allowed inference: absolute-signal dependence need not be assumed to be one universal smooth gain curve across every assay and endpoint.

Not allowed: infer that all Lasius niger pheromone responses are binary, or introduce a P4 speed law from this assay.

Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC3130237/

## Existing evidence that must not be recycled as a fake new mechanism

Koch & Czaczkes (2021), *No specialist pheromone-ignoring ants in Lasius niger* (Ecological Entomology, DOI `10.1111/een.12995`), supports transient non-following rather than a stable pheromone-ignoring specialist identity. That evidence already motivated the signal-independent transient-lapse class tested as P2-v1. P2-v1 is closed and may not be renamed or rerun as P4.

Poissonnier et al. (2026), *Pheromone trail following is not modulated by previous visit to food location, distance travelled, or travel direction in the ant Lasius niger* (Insectes Sociaux, DOI `10.1007/s00040-026-01106-9`), found robust trail following with no significant modulation by distance travelled, travel direction, or recent food discovery. P4 therefore must not add path-, direction-, or recent-experience-specific response parameters without separate independent evidence.

## Fresh supported candidate class

The evidence gate supports exactly one fresh broad class:

`P4_candidate_absolute_signal_dependent_bilateral_response`

Conceptually:

- directional information remains local and bilateral;
- absolute local pheromone evidence is allowed to affect **whether or how strongly** that directional information influences behavior;
- unlike P3-v1, the class is not required to be positively scale-invariant;
- unlike P2-v1, any suppression would be tied to sensory evidence rather than a signal-independent trial-level lapse;
- unlike P1-v1, the class does not prespecify the old point-sensor `C/(1+C)` kernel.

This gate does **not** choose among:

- a hard detection threshold;
- a smooth deterministic gate;
- a signal-dependent stochastic detection process;
- a regularized relative comparison that attenuates at weak signal;
- another prospectively justified absolute-evidence modulation.

## Explicit non-selections

Still not selected or authorized:

- exact absolute-evidence statistic (`L+R`, mean, maximum, etc.);
- threshold or half-response value;
- hard, smooth, or stochastic gate form;
- exact transduction equation;
- sensor geometry or quadrature;
- Gaussian-field changes;
- steering gain;
- parameter values or search bounds;
- response RNG;
- P4 simulation;
- response-target semantic access or candidate ranking;
- canonical locomotion changes;
- H2-H5 refitting;
- path/direction/recent-experience modifiers;
- stable specialist identities;
- repulsive/sign-reversing pheromone response;
- reserved project Y-maze validation access.

The published Y-maze concentration experiment is used only as external biological evidence. It does **not** expose or unlock the project's reserved Y-maze validation target.

## Candidate-class decision

Decision record:

`hypotheses/p4_painted_trail_candidate_class_decision_v1.json`

Git blob:

`ad7295ba6d466549c60c8ecac37e39d30006ec1c`

After the evidence gate merged and permanent main workflow #153 passed, ANTLAB formally selected:

`P4_candidate_absolute_signal_dependent_bilateral_response`

This is a **class selection only**. It says the next internal development hypothesis may let absolute local pheromone evidence control whether or how strongly local bilateral directional information is expressed.

It still does not choose:

- a hard threshold;
- a smooth deterministic gate;
- a stochastic detector or engagement process;
- a regularized relative formula;
- the absolute-evidence statistic;
- the directional equation;
- sensor geometry;
- field treatment;
- steering gain;
- response RNG;
- parameters or bounds;
- an estimation policy.

P1-v1, P2-v1, and P3-v1 remain permanently closed. Their scientific outcomes cannot be reused as a tuning surface for P4.

## Next gate

Create a separate **P4 mechanism-selection/freeze** record. That prospective gate must choose exactly one mathematical realization of the selected broad class and freeze its zero-signal identity, structural invariances, sensor/field treatment, engineering-only reachability values, and seed panel before any P4 implementation or simulation.

Response-target semantics and the project's reserved Y-maze validation remain locked until later explicit authorization gates.
