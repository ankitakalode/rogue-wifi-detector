/**
 * MongoDB connection lifecycle.
 *
 * Replaces the old top-level `mongoose.connect(...).then().catch()` call, which
 * had three problems: it set global DNS servers as a workaround, it never
 * retried, and it reported failure only to the console, so `/api/alerts`
 * simply hung when the cluster was unreachable.
 *
 * Here the connection is: retried with backoff, observable through
 * `getStatus()`, and closable so tests and shutdown do not leave handles open.
 */

const mongoose = require('mongoose');
const { config } = require('../config/env');
const logger = require('../utils/logger');

// Connection states mongoose reports, mapped to words an operator can act on.
const STATE_NAMES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let lastError = '';
let lastConnectedAt = null;

// mongoose logs deprecation chatter at startup; keep the console clean.
mongoose.set('strictQuery', true);

/**
 * Connect, retrying transient failures.
 *
 * Mongo Atlas occasionally refuses the first few attempts on a cold network.
 * Retrying here means the process does not need a supervisor to come back up.
 *
 * @param {object} [options]
 * @param {number} [options.attempts] Total attempts. Default 5.
 * @param {number} [options.baseDelayMs] First backoff step. Default 1000.
 * @returns {Promise<boolean>} true when connected.
 */
async function connect({ attempts = 5, baseDelayMs = 1000 } = {}) {
  if (!config.mongo.uri) {
    lastError = 'MONGO_URI is not configured.';
    logger.warn(lastError);
    return false;
  }

  if (mongoose.connection.readyState === 1) return true;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await mongoose.connect(config.mongo.uri, {
        serverSelectionTimeoutMS: config.mongo.serverSelectionTimeoutMs,
        // Keep the pool small: the API is I/O bound, not CPU bound.
        maxPoolSize: 10,
        minPoolSize: 0,
      });
      lastError = '';
      lastConnectedAt = new Date().toISOString();
      logger.info('MongoDB connected', {
        database: mongoose.connection.name,
        attempt,
      });
      return true;
    } catch (error) {
      lastError = error.message;
      const isLast = attempt === attempts;
      logger.warn('MongoDB connection attempt failed', {
        attempt,
        of: attempts,
        error: error.message,
      });
      if (isLast) break;

      // 1s, 2s, 4s, 8s ... capped so a long outage does not stall boot forever.
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 15000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  logger.error('MongoDB could not be reached; data endpoints will return 503.', {
    error: lastError,
  });
  return false;
}

/** A machine-readable snapshot for the health endpoint. */
function getStatus() {
  const state = mongoose.connection.readyState;
  return {
    state: STATE_NAMES[state] || 'unknown',
    connected: state === 1,
    database: mongoose.connection.name || '',
    host: mongoose.connection.host || '',
    lastConnectedAt,
    lastError,
  };
}

/** True when queries can be served. */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

/** Close the connection. Used by shutdown and by tests. */
async function disconnect() {
  if (mongoose.connection.readyState === 0) return;
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.warn('Error while closing MongoDB', { error: error.message });
  }
}

module.exports = { connect, disconnect, getStatus, isConnected };
