/**
 * One scored network observation — the unit the whole product is about.
 *
 * The field set is not invented here. It is the exact dictionary
 * `scanner_controller.fuse_scores()` builds on the desktop:
 *
 *   timestamp, ssid, bssid, channel, signal_dbm, encryption, authentication,
 *   signal_approximate, final_score, threat_level, is_rogue, flags,
 *   recommendation, component_scores, dns_hijacked, dns_tier, dns_fake_ip,
 *   has_portal, portal_url, accepts_any_creds, creds_over_http,
 *   tls_self_signed, ml_label, ml_probability, ml_risk_level,
 *   rule_score, rule_level, label, scan_cycle
 *   + the 10 SentinelAP features.
 *
 * Two deliberate choices:
 *
 * 1. The 10 features are stored **nested** rather than flattened. On the wire
 *    they arrive flat alongside the metadata; nesting them means a query can
 *    ask for `features.beacon_variance` without every other feature being
 *    ambiguous with a metadata key of the same name.
 *
 * 2. `raw` keeps the original object exactly as received. If the desktop adds a
 *    field before this schema knows about it, nothing is lost and the detail
 *    page can still show it.
 */

const mongoose = require('mongoose');

// The four levels the score engine's SCORE_LEVELS map produces.
const THREAT_LEVELS = ['SAFE', 'MEDIUM', 'HIGH', 'CRITICAL'];

// The frozen Random Forest input contract (features/existing_features.py).
const FEATURE_COLS = [
  'bssid_mismatch',
  'signal_strength',
  'signal_anomaly',
  'open_network',
  'beacon_count',
  'beacon_variance',
  'channel_conflict',
  'ssid_similarity',
  'vendor_suspicious',
  'first_seen_hours',
];

const featureSchema = new mongoose.Schema(
  {
    bssid_mismatch: { type: Number, default: 0 },
    signal_strength: { type: Number, default: 0 },
    signal_anomaly: { type: Number, default: 0 },
    open_network: { type: Number, default: 0 },
    beacon_count: { type: Number, default: 0 },
    beacon_variance: { type: Number, default: 0 },
    channel_conflict: { type: Number, default: 0 },
    ssid_similarity: { type: Number, default: 0 },
    vendor_suspicious: { type: Number, default: 0 },
    first_seen_hours: { type: Number, default: 0 },
  },
  { _id: false }
);

// The weighted components behind final_score (scoring/score_engine.py WEIGHTS).
const componentSchema = new mongoose.Schema(
  {
    ml_model: { type: Number, default: 0 },
    dns_hijack: { type: Number, default: 0 },
    portal_fake: { type: Number, default: 0 },
    tls_invalid: { type: Number, default: 0 },
    wifi_features: { type: Number, default: 0 },
  },
  { _id: false }
);

const observationSchema = new mongoose.Schema(
  {
    // ── ownership / provenance ──────────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scannerId: { type: String, required: true, index: true, trim: true },
    sessionId: { type: String, default: '', index: true, trim: true },
    batchId: { type: String, default: '', trim: true },

    // ── the access point ────────────────────────────────────────────
    ssid: { type: String, default: '', trim: true },
    bssid: { type: String, default: '', lowercase: true, trim: true, index: true },
    channel: { type: Number, default: 0 },
    signalDbm: { type: Number, default: -100 },
    signalApproximate: { type: Boolean, default: false },
    encryption: { type: String, default: '', lowercase: true, trim: true, index: true },
    authentication: { type: String, default: '', trim: true },

    // ── the verdict ─────────────────────────────────────────────────
    finalScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    threatLevel: {
      type: String,
      enum: THREAT_LEVELS,
      default: 'SAFE',
      index: true,
    },
    isRogue: { type: Boolean, default: false, index: true },
    flags: { type: [String], default: [] },
    recommendation: { type: String, default: '' },

    // ── the signals behind the verdict ──────────────────────────────
    components: { type: componentSchema, default: () => ({}) },
    features: { type: featureSchema, default: () => ({}) },

    // ── the local ML model's own output ─────────────────────────────
    mlLabel: { type: Number, default: 0 },
    mlProbability: { type: Number, default: 0, min: 0, max: 1, index: true },
    mlRiskLevel: { type: String, default: '', trim: true },

    // ── the rule engine's independent output ────────────────────────
    ruleScore: { type: Number, default: 0, min: 0, max: 100 },
    ruleLevel: { type: String, default: 'SAFE', trim: true },
    autoLabel: { type: Number, default: 0 },

    // ── active-analysis facts ───────────────────────────────────────
    dnsHijacked: { type: Boolean, default: false, index: true },
    dnsTier: { type: String, default: null },
    dnsFakeIp: { type: String, default: null },
    hasPortal: { type: Boolean, default: false },
    portalUrl: { type: String, default: null },
    acceptsAnyCreds: { type: Boolean, default: false },
    credsOverHttp: { type: Boolean, default: false },
    tlsSelfSigned: { type: Boolean, default: false },

    // ── timing ──────────────────────────────────────────────────────
    scanCycle: { type: Number, default: 0 },
    observedAt: { type: Date, default: Date.now, index: true },
    receivedAt: { type: Date, default: Date.now, index: true },

    // The payload exactly as the desktop sent it, minus what is already above.
    raw: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);

// Feed and table queries: one owner, newest first.
observationSchema.index({ owner: 1, receivedAt: -1 });
// "Show me the rogues" — the dashboard's default filter.
observationSchema.index({ owner: 1, isRogue: 1, receivedAt: -1 });
// Per-session drill-down.
observationSchema.index({ owner: 1, sessionId: 1, receivedAt: -1 });
// History for one access point across scans.
observationSchema.index({ owner: 1, bssid: 1, receivedAt: -1 });
// Aggregations that group by level.
observationSchema.index({ owner: 1, threatLevel: 1, receivedAt: -1 });

/** The 10 features as an ordered array — the Random Forest input order. */
observationSchema.methods.featureVector = function featureVector() {
  const source = this.features || {};
  return FEATURE_COLS.map((column) => Number(source[column]) || 0);
};

observationSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: String(this._id),
    scannerId: this.scannerId,
    sessionId: this.sessionId,
    batchId: this.batchId,

    ssid: this.ssid,
    bssid: this.bssid,
    channel: this.channel,
    signalDbm: this.signalDbm,
    signalApproximate: this.signalApproximate,
    encryption: this.encryption,
    authentication: this.authentication,

    finalScore: this.finalScore,
    threatLevel: this.threatLevel,
    isRogue: this.isRogue,
    flags: this.flags || [],
    recommendation: this.recommendation,

    components: this.components || {},
    features: this.features || {},

    mlLabel: this.mlLabel,
    mlProbability: this.mlProbability,
    mlRiskLevel: this.mlRiskLevel,

    ruleScore: this.ruleScore,
    ruleLevel: this.ruleLevel,
    autoLabel: this.autoLabel,

    dnsHijacked: this.dnsHijacked,
    dnsTier: this.dnsTier,
    dnsFakeIp: this.dnsFakeIp,
    hasPortal: this.hasPortal,
    portalUrl: this.portalUrl,
    acceptsAnyCreds: this.acceptsAnyCreds,
    credsOverHttp: this.credsOverHttp,
    tlsSelfSigned: this.tlsSelfSigned,

    scanCycle: this.scanCycle,
    observedAt: this.observedAt,
    receivedAt: this.receivedAt,
  };
};

const Observation = mongoose.model('Observation', observationSchema);

module.exports = Observation;
module.exports.THREAT_LEVELS = THREAT_LEVELS;
module.exports.FEATURE_COLS = FEATURE_COLS;
