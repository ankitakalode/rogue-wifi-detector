/**
 * Environment configuration and validation.
 *
 * Every value the server needs is read exactly once, here, and validated on
 * startup. Modules import this object instead of touching `process.env`, so a
 * missing secret fails loudly at boot rather than silently at request time.
 */

const path = require('path');
const dotenv = require('dotenv');

// The .env lives at the Backend/ root, one level above src/.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_TEST = NODE_ENV === 'test';

/** Parse a positive integer, falling back when absent or unusable. */
function intFrom(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Parse a boolean flag. Accepts 1/true/yes/on in any case. */
function boolFrom(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

/** Split a comma-separated list into trimmed, non-empty entries. */
function listFrom(value) {
  return String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * A development-only secret. It is deliberately obvious in logs so a real
 * deployment that forgot to set JWT_SECRET cannot be mistaken for a secure one.
 */
const DEV_JWT_SECRET = 'sentinelap-dev-only-insecure-secret-change-me';

const jwtSecret = process.env.JWT_SECRET || (IS_PRODUCTION ? '' : DEV_JWT_SECRET);

const config = {
  env: NODE_ENV,
  isProduction: IS_PRODUCTION,
  isTest: IS_TEST,

  port: intFrom(process.env.PORT, 5000),

  mongo: {
    uri: process.env.MONGO_URI || '',
    // How long mongoose waits for a server before giving up on the first attempt.
    serverSelectionTimeoutMs: intFrom(process.env.MONGO_TIMEOUT_MS, 10000),
  },

  jwt: {
    secret: jwtSecret,
    accessTtl: process.env.JWT_ACCESS_TTL || '12h',
    refreshTtl: process.env.JWT_REFRESH_TTL || '30d',
    issuer: 'sentinelap',
  },

  /**
   * Guest/demo access. Read-only sessions issued to anonymous visitors so the
   * dashboard can be shown without an account. Never grants write access.
   */
  guest: {
    enabled: boolFrom(process.env.GUEST_MODE_ENABLED, true),
    token: process.env.GUEST_TOKEN || 'sentinelap-guest',
    label: process.env.GUEST_LABEL || 'Guest (read-only)',
  },

  cors: {
    // Empty means "reflect any origin" — convenient locally, unsafe in production.
    origins: listFrom(process.env.CORS_ORIGIN),
  },

  uploads: {
    // Observations accepted in a single scanner batch.
    maxBatchSize: intFrom(process.env.MAX_BATCH_SIZE, 100),
  },

  rateLimit: {
    windowMs: intFrom(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: intFrom(process.env.RATE_LIMIT_MAX, 600),
    authMax: intFrom(process.env.RATE_LIMIT_AUTH_MAX, 40),
  },

  staticDir: process.env.STATIC_DIR || '',
};

/**
 * Verify the configuration can run. Returns the problems found rather than
 * throwing, so the caller decides whether they are fatal for this environment.
 */
function findProblems(cfg) {
  const problems = [];

  if (!cfg.jwt.secret) {
    problems.push('JWT_SECRET is required when NODE_ENV=production.');
  }
  if (cfg.jwt.secret === DEV_JWT_SECRET && cfg.isProduction) {
    problems.push('JWT_SECRET is still the development default.');
  }
  if (cfg.isProduction && cfg.cors.origins.length === 0) {
    problems.push('CORS_ORIGIN must list the allowed web origin(s) in production.');
  }
  if (cfg.isProduction && cfg.guest.enabled && cfg.guest.token === 'sentinelap-guest') {
    problems.push('GUEST_TOKEN is still the development default while guest mode is on.');
  }

  return problems;
}

const problems = findProblems(config);

// MongoDB is treated as a warning, not a fatal error: the scanner API should
// still answer /api/scanner/status so a misconfigured deployment can be
// diagnosed from the client instead of returning a bare connection refusal.
const warnings = [];
if (!config.mongo.uri) {
  warnings.push(
    'MONGO_URI is not set — data endpoints will fail until it is configured.'
  );
}

if (config.isProduction && problems.length > 0) {
  // Refuse to start a production server with an insecure configuration.
  const message = `Invalid production configuration:\n  - ${problems.join('\n  - ')}`;
  throw new Error(message);
}

module.exports = {
  config,
  problems,
  warnings,
  DEV_JWT_SECRET,
};
