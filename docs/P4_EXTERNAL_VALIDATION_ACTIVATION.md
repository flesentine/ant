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
