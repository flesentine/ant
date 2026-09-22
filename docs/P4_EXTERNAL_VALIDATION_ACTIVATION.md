# P4 external-validation collection activation preflight

This tool prepares the already-frozen P4 external biological replication for a future activation commit. It does **not** authorize biological collection and it does not change Candidate 307, the preregistration, schedules, apparatus, wet-lab recipe, thresholds, or statistical rules.

## Inputs

Run:

```bash
node tools/check-p4-external-validation-activation.js \
  --collector /path/to/collector.json \
  --husbandry /path/to/husbandry.json \
  --declaration /path/to/precollection-declaration.json \
  --json
```

The collector JSON must use the existing `P4_external_validation_collector_independence_record_v1` structure with a real non-placeholder identity and affiliation/team, `identity_frozen=true`, all seven frozen independence attestations exactly `true`, the frozen firewall still false, and `current_authorization_condition_satisfied=true`.

The husbandry JSON is either an array of 12 records or `{"records":[...]}`. It must contain exactly one record for each C01–C12, with distinct wild-source IDs and distinct source-nest IDs. Only the frozen activation-time prospective fields are allowed to contain observed values before trial 1. Future fields such as first-trial time, test date, lights-on compliance, derived acclimation/deprivation durations, and deviations must remain absent or null until collection actually occurs.

The precollection declaration must contain:

```json
{
  "attested_by": "real non-placeholder identity",
  "attested_at_local": "ISO-8601 timestamp with explicit offset",
  "no_biological_collection_has_started": true,
  "no_new_biological_outcome_has_been_accessed": true,
  "candidate_307_prediction_has_not_been_disclosed_to_collector": true
}
```

## Create a fail-closed activation packet scaffold

Before real collector and colony-source information is available, generate an editable packet with:

~~~bash
node tools/create-p4-external-validation-activation-packet.js \
  --out /path/to/p4-activation-packet \
  --json
~~~

The scaffolder creates `collector.json`, `husbandry.json`, `precollection-declaration.json`, and a packet README. It copies the frozen collector record unchanged, creates C01–C12 husbandry rows, and pre-populates only frozen protocol constants such as 0.5 M sucrose, three chopped-cockroach feedings per week, water ad libitum, the 12:12 light/dark cycle, and no food reward in the maze.

It deliberately leaves real collector identity/affiliation, independence attestations, source-colony/source-nest identifiers, acclimation/deprivation timestamps, and the precollection declaration unset. It also omits every field that can only be observed or derived during collection.

The generator refuses to overwrite an existing packet and runs the activation preflight immediately after generation. A newly generated scaffold must remain fail-closed:

~~~text
ready_for_activation_commit=false
collection_authorized=false
~~~

If a blank scaffold ever passes activation preflight, the generator removes the generated files and fails.

## Build or validate a prospective activation transition

Once a real packet passes the precollection checks, build a proposed authorization transition outside the repository. This first step creates a candidate **for staging**; it does not yet make the activation commit ready:

~~~bash
node tools/build-p4-external-validation-activation-transition.js \
  --collector /path/to/collector.json \
  --husbandry /path/to/husbandry.json \
  --declaration /path/to/precollection-declaration.json \
  --out /path/to/candidate-authorization.json \
  --json
~~~

The transition builder is intentionally stricter than a generic JSON patch. It embeds the trusted preactivation authorization and collector baselines, verifies every still-immutable frozen repository input, validates the real packet, and then normalizes only the explicit activation-mutable authorization surface. Any change outside that surface fails closed.

Before the builder can report `ready_for_activation_commit=true`, the exact validated collector record must also be copied to the canonical repository path `hypotheses/p4_external_validation_collector_independence_record_v1.json` and staged. An external `--collector` path may be used as the source packet, but its Git-blob SHA must exactly match the guarded canonical stage-0 collector blob that the activation commit would record. This prevents an authorization commit from claiming frozen collector identity/attestations while leaving the repository's durable collector record at the placeholder baseline.

Likewise, the exact generated/validated authorization candidate must be copied to `hypotheses/p4_external_validation_collection_authorization_v1.json` and staged. The initial `--out` build succeeds when `candidate_ready_for_staging=true` even though `ready_for_activation_commit=false`; after both canonical collector and authorization blobs are staged, rerun with `--candidate /path/to/candidate-authorization.json` (or the canonical authorization path). Only an exact blob match at both canonical stage-0 paths can produce `ready_for_activation_commit=true`.

The candidate authorization may update only operational activation state: the authorization status, the three collector/husbandry gate mirrors, `collection_authorized`, the resolved preactivation blocker, the durable next-action rule, and a fixed activation-metadata object binding the collector, husbandry, and declaration Git-blob hashes. Preregistration, Candidate 307, schedules, templates, apparatus/stimulus contracts, wet-lab recipe, sample size, thresholds, statistical rules, and semantic firewalls remain byte-for-byte semantically unchanged after normalization.

A successfully built candidate for staging deliberately has:

~~~text
candidate_ready_for_staging=true
ready_for_activation_commit=false
candidate_collection_authorized=true
biological_collection_may_begin=false
~~~

After the exact candidate blob is copied to the canonical authorization path and staged, a clean revalidation may advance `ready_for_activation_commit` to `true`. `candidate_collection_authorized=true` describes the proposed authorization content; `biological_collection_may_begin` remains false because the frozen post-commit gates still apply. Biological trial 1 remains forbidden until that exact activation commit has clean exact-head regression and Codex review, is merged, and its permanent-main test and deploy both succeed.

An already-built candidate can be revalidated with `--candidate /path/to/candidate-authorization.json` instead of `--out`. Revalidation requires that exact candidate Git-blob SHA to match the guarded canonical staged authorization blob. The builder refuses to overwrite an existing candidate file and never writes a candidate when the packet or candidate semantics are invalid.

## What the preflight verifies

The tool also verifies the frozen preregistration, marked-side schedule, release-pose manifest and all 12 release-pose slices, release initialization/RNG blobs, chemical template, husbandry template, calibration template, trial schema, and activation checklist against their pinned Git blob SHAs.

A successful result means only:

```text
ready_for_activation_commit = true
collection_authorized = false
```

Collection remains forbidden until a separate activation commit updates only fields allowed by the frozen checklist and then satisfies all three post-commit gates:

1. activation regression passes on the exact head;
2. fresh Codex review is clean on that exact head;
3. the activation commit is qualified on permanent main before biological trial 1.

The validator cannot establish that a person, affiliation, source colony, source nest, or attestation is truthful in the real world. Those facts require manual verification. The tool intentionally reports those manual checks even when all machine-verifiable fields pass.
