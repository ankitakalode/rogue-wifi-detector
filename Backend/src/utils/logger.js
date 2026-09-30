/**
 * Minimal structured logger.
 *
 * The API logs in JSON so a hosted deployment (Render, ECS, CloudWatch) can
 * index fields rather than regex a prose line. Locally it stays readable.
 * Deliberately dependency-free — logging must not be able to fail.
 */

const { config } = require('../config/env');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const LEVEL_NAMES = Object.keys(LEVELS);

// LOG_LEVEL=debug in development, info otherwise.
const threshold = (() => {
  const configured = (process.env.LOG_LEVEL || '').trim().toLowerCase();
  if (configured && configured in LEVELS) return LEVELS[configured];
  return config.isProduction ? LEVELS.info : LEVELS.info;
})();

/** Strip values that must never reach a log sink. */
function scrub(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const SENSITIVE = ['password', 'passwordHash', 'token', 'accessToken',
    'refreshToken', 'authorization', 'jwt', 'secret'];
  const clean = {};
  for (const [key, value] of Object.entries(meta)) {
    clean[key] = SENSITIVE.includes(key) ? '[redacted]' : value;
  }
  return clean;
}

function emit(level, message, meta) {
  if (LEVELS[level] > threshold) return;

  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: scrub(meta) } : {}),
  };

  const line = config.isProduction
    ? JSON.stringify(entry)
    : `${entry.time} ${level.toUpperCase().padEnd(5)} ${message}` +
      (meta ? ` ${JSON.stringify(scrub(meta))}` : '');

  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

module.exports = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta),
  LEVEL_NAMES,
};
