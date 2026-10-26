const MAX_ATTEMPTS = 3;
const WINDOW_MS = 5 * 60 * 1000;
const BLOCK_MS = 30 * 60 * 1000;

const buckets = new Map();

const normalizeId = (value) => String(value || '').trim().toLowerCase();

export const attemptIds = (...values) => {
  const ids = [];
  for (const value of values.flat()) {
    const id = normalizeId(value);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids;
};

const storageKey = (scope, id) => `${scope}:${id}`;

const getBucket = (scope, id) => {
  const key = storageKey(scope, id);
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { attempts: [], blockedUntil: 0 };
    buckets.set(key, bucket);
  }
  return bucket;
};

const dropBucketIfIdle = (scope, id, bucket, now) => {
  if (bucket.blockedUntil <= now && bucket.attempts.length === 0) {
    buckets.delete(storageKey(scope, id));
  }
};

export const checkAttemptLimit = (scope, identifiers, now = Date.now()) => {
  let retryAfterMs = 0;

  for (const id of attemptIds(identifiers)) {
    const bucket = buckets.get(storageKey(scope, id));
    if (!bucket) continue;

    if (bucket.blockedUntil > now) {
      retryAfterMs = Math.max(retryAfterMs, bucket.blockedUntil - now);
      continue;
    }

    if (bucket.blockedUntil) {
      bucket.blockedUntil = 0;
      bucket.attempts = [];
    }

    bucket.attempts = bucket.attempts.filter((ts) => now - ts < WINDOW_MS);
    dropBucketIfIdle(scope, id, bucket, now);
  }

  if (retryAfterMs > 0) {
    return { blocked: true, retryAfterMs };
  }

  return { blocked: false, retryAfterMs: 0 };
};

export const recordAttempt = (scope, identifiers, now = Date.now()) => {
  for (const id of attemptIds(identifiers)) {
    const bucket = getBucket(scope, id);
    if (bucket.blockedUntil > now) continue;

    if (bucket.blockedUntil) {
      bucket.blockedUntil = 0;
      bucket.attempts = [];
    }

    bucket.attempts = bucket.attempts.filter((ts) => now - ts < WINDOW_MS);
    bucket.attempts.push(now);

    if (bucket.attempts.length >= MAX_ATTEMPTS) {
      bucket.blockedUntil = now + BLOCK_MS;
      bucket.attempts = [];
    }
  }
};

export const clearAttempts = (scope, identifiers) => {
  for (const id of attemptIds(identifiers)) {
    buckets.delete(storageKey(scope, id));
  }
};

export const attemptLimitMessage = (retryAfterMs) => {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60000));
  const unit = minutes === 1 ? 'minute' : 'minutes';
  return `Too many attempts. Please try again after ${minutes} ${unit}.`;
};

export const sendAttemptLimited = (res, retryAfterMs) => {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.set('Retry-After', String(seconds));
  return res.status(429).json({ message: attemptLimitMessage(retryAfterMs) });
};
