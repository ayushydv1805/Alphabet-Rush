function createRateLimiter({ windowMs = 1000, max = 5 } = {}) {
  const buckets = new Map();

  function isAllowed(key) {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      return true;
    }

    if (bucket.count >= max) return false;
    bucket.count += 1;
    return true;
  }

  function clear(key) {
    buckets.delete(key);
  }

  function reset() {
    buckets.clear();
  }

  return { isAllowed, clear, reset };
}

module.exports = { createRateLimiter };
