# Architecture v0.1

## Coordinate and time system

- world distance: millimetres
- time: seconds
- arena: 300 mm × 80 mm
- fixed simulation step: 0.02 s
- renderer: browser animation frames, independent of the biological step

## Agent state

Each worker currently stores:

- identity
- x/y position
- heading
- base locomotion speed
- activity bias
- directional persistence
- current behavioral bout
- carrying state
- recent contact state
- personal RNG stream
- short trajectory history for visualization

No worker stores a global map, global food reserve, global worker list, path-to-goal, or colony plan.

## Spatial indexing

A uniform 4 mm spatial hash limits contact checks to nearby buckets. This keeps contact discovery local rather than O(N²).

## Stochastic transitions

For a process with hazard rate λ events/second and timestep dt:

`P(event in dt) = 1 - exp(-λ dt)`

This avoids biology changing when the simulation update rate changes.

## Current food loop

The food system is intentionally crude. Crossing into the rightmost 30 mm triggers a short loading bout; a loaded worker receives only a weak leftward homing bias and must physically return to the nest zone to unload.

This is a temporary substrate test, not a claim about Lasius navigation.
