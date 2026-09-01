# ANTLAB design principles

1. **An ant only gets biologically available information.**
2. **Global colony state must never be read directly by an ant.** It must arrive through local physical or social mechanisms.
3. **Colony-level organization should emerge whenever lower-level interactions can plausibly produce it.**
4. **Observations and proposed mechanisms are separate.** Competing mechanisms should remain swappable when the biology is unresolved.
5. **Every biological mechanism is labeled by evidence status:** measured, literature-supported, inferred, fitted, or invented.
6. **Matter does not teleport.** Food, brood, bodies, dirt, and later pheromone all move through explicit processes.
7. **Probabilities are defined in real time, not per update tick.**
8. **Simulation results should converge across reasonable timestep and spatial-resolution changes.**
9. **Calibration experiments are not validation.** Hold out experiments the model was not tuned against.
10. **Use the minimum sufficient internal complexity.** Do not add an ant-brain mechanism when physics, space, or interactions already explain an observation.
11. **Reference mode and fast mode must represent the same biology.**
12. **Every important result should be reproducible from a seed.**
