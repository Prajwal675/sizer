// This directory is not used by the actual deploy (netlify.toml points `functions`
// at ../../functions), but keeping a thin re-export here means it can never silently
// drift from the real implementation if anything ever does reference this path.
module.exports = require('../../functions/match-size');
