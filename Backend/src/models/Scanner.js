/**
 * A registered scanner installation.
 *
 * The desktop app registers once (`POST /api/scanner/register`) and then sends
 * its `scanner_id` on every session and observation. That id is the join key
 * between a downloaded .exe on someone's laptop and the rows in the dashboard.
 *
 * `capabilities` and `adapter` are stored as-is: they describe the machine, not
 * the detection methodology, and the contract for them is owned by the desktop
 * client (`scanner/capabilities.py`, `scanner/adapter.py`). Storing them
 * verbatim means the website can report a degraded adapter honestly instead of
 * inventing a shape of its own.
 */

const mongoose = require('mongoose');

const scannerSchema = new mongoose.Schema(
  {
    scannerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, default: 'SentinelAP Scanner', trim: true },
    engineVersion: { type: String, default: '', trim: true },
    hostname: { type: String, default: '', trim: true },
    platform: { type: String, default: '', trim: true },

    // Raw capability/adapter reports from the client.
    capabilities: { type: mongoose.Schema.Types.Mixed, default: {} },
    adapter: { type: mongoose.Schema.Types.Mixed, default: {} },

    lastSeenAt: { type: Date, default: Date.now, index: true },
    lastSessionId: { type: String, default: '', trim: true },
    sessionCount: { type: Number, default: 0, min: 0 },
    observationCount: { type: Number, default: 0, min: 0 },

    // A scanner can be retired without deleting its history.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

scannerSchema.index({ owner: 1, lastSeenAt: -1 });

scannerSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    scannerId: this.scannerId,
    name: this.name,
    engineVersion: this.engineVersion,
    hostname: this.hostname,
    platform: this.platform,
    capabilities: this.capabilities || {},
    adapter: this.adapter || {},
    lastSeenAt: this.lastSeenAt,
    lastSessionId: this.lastSessionId,
    sessionCount: this.sessionCount,
    observationCount: this.observationCount,
    isActive: this.isActive,
    createdAt: this.createdAt,
  };
};

/** Human label for the UI when the operator never named the device. */
scannerSchema.methods.displayName = function displayName() {
  return this.name || this.hostname || `Scanner ${this.scannerId.slice(0, 8)}`;
};

module.exports = mongoose.model('Scanner', scannerSchema);
