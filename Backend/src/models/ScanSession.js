/**
 * One cloud scan session.
 *
 * The desktop controller opens a session (`/api/scanner/session/start`) and
 * closes it (`/session/stop`). Sessions are what make the dashboard readable:
 * without them, observations from three laptops at three different times would
 * be one undifferentiated pile.
 *
 * Counters here are denormalised on purpose. The session list is the most
 * frequently read page, and recomputing "how many rogues in session X" from the
 * observations collection on every page load would be a full scan of the
 * largest collection for a number we already receive from the client.
 */

const mongoose = require('mongoose');

const SESSION_RUNNING = 'running';
const SESSION_STOPPED = 'stopped';

const scanSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true, trim: true },
    scannerId: { type: String, required: true, index: true, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    engineVersion: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: [SESSION_RUNNING, SESSION_STOPPED],
      default: SESSION_RUNNING,
      index: true,
    },

    startedAt: { type: Date, default: Date.now, index: true },
    endedAt: { type: Date, default: null },
    lastObservationAt: { type: Date, default: null },

    // Rollups updated as observations arrive.
    batchCount: { type: Number, default: 0, min: 0 },
    networkCount: { type: Number, default: 0, min: 0 },
    rogueCount: { type: Number, default: 0, min: 0 },
    highestScore: { type: Number, default: 0, min: 0, max: 100 },
    dnsHijacked: { type: Boolean, default: false },

    // The free-form summary the client sends on /session/stop.
    summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// The dashboard lists one owner's sessions, newest first.
scanSessionSchema.index({ owner: 1, startedAt: -1 });
scanSessionSchema.index({ scannerId: 1, startedAt: -1 });

/** Duration in seconds, or null while the session is still open. */
scanSessionSchema.methods.durationSeconds = function durationSeconds() {
  if (!this.startedAt) return null;
  const end = this.endedAt || new Date();
  return Math.max(0, Math.round((end.getTime() - this.startedAt.getTime()) / 1000));
};

scanSessionSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    sessionId: this.sessionId,
    scannerId: this.scannerId,
    engineVersion: this.engineVersion,
    status: this.status,
    startedAt: this.startedAt,
    endedAt: this.endedAt,
    lastObservationAt: this.lastObservationAt,
    durationSeconds: this.durationSeconds(),
    batchCount: this.batchCount,
    networkCount: this.networkCount,
    rogueCount: this.rogueCount,
    highestScore: this.highestScore,
    dnsHijacked: this.dnsHijacked,
    summary: this.summary || {},
  };
};

module.exports = mongoose.model('ScanSession', scanSessionSchema);
module.exports.SESSION_RUNNING = SESSION_RUNNING;
module.exports.SESSION_STOPPED = SESSION_STOPPED;
