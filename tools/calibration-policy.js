'use strict';
function assertDatasetAllowed(manifest,datasetId){const d=manifest.datasets&&manifest.datasets[datasetId];if(!d)throw new Error(`Unknown calibration dataset: ${datasetId}`);if(!d.allowed_for_fitting)throw new Error(`Dataset '${datasetId}' is locked for ${d.role}; it cannot be used for fitting or model selection`);return d;}module.exports={assertDatasetAllowed};
