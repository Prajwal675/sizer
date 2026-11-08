const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

// Best-effort, per-warm-container limiter. Netlify Functions can run across many
// concurrent/cold containers, so this map is NOT a global guarantee across all
// traffic to the function — it only throttles a single warm instance. It's a cheap
// first line of defense; a hard platform-wide limit would need Netlify's own
// rate-limiting config (only available on the newer V2/ESM function format, which
// this project's classic `exports.handler` functions don't use yet) or an external
// store (e.g. Redis) shared across instances.
const requestLog = new Map();

function getClientIp(event) {
  const headers = event.headers || {};
  const forwardedFor = headers['x-forwarded-for'] || headers['X-Forwarded-For'];
  return (
    headers['x-nf-client-connection-ip'] ||
    headers['client-ip'] ||
    (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
    'unknown'
  );
}

/**
 * Returns true if the request's client IP has exceeded RATE_LIMIT_MAX_REQUESTS
 * within the last RATE_LIMIT_WINDOW_MS, and records this request either way.
 */
function isRateLimited(event) {
  const ip = getClientIp(event);
  const now = Date.now();
  const recent = (requestLog.get(ip) || []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

module.exports = { isRateLimited, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS };
