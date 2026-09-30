/**
 * JWT issuing and verification.
 *
 * The scanner's `authentication.py` accepts several spellings for the same
 * fact (`access_token`/`accessToken`/`token`, `expires_in`/`expiresIn`). We
 * emit the snake_case spellings the client prefers and always include
 * `expires_in`, because that is what lets the desktop app refresh *before* the
 * token dies instead of after a 401.
 */

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const ApiError = require('./ApiError');

// Role values carried in the token.
const ROLE_USER = 'user';
const ROLE_SCANNER = 'scanner';
const ROLE_GUEST = 'guest';

const TOKEN_TYPE = 'Bearer';

/** Sign a token and report when it expires. */
function sign(payload, ttl) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: ttl,
    issuer: config.jwt.issuer,
  });
}

/**
 * Issue an access/refresh pair.
 *
 * @param {object} claims  { sub, email, role, scannerId? }
 * @returns {{accessToken: string, refreshToken: string, expiresIn: number, expiresAt: string}}
 */
function issuePair(claims) {
  const accessToken = sign(
    { ...claims, typ: 'access' },
    config.jwt.accessTtl
  );
  const refreshToken = sign(
    { sub: claims.sub, typ: 'refresh' },
    config.jwt.refreshTtl
  );

  const decoded = jwt.decode(accessToken) || {};
  const expiresIn = Math.max(0, (decoded.exp || 0) - Math.floor(Date.now() / 1000));

  return {
    accessToken,
    refreshToken,
    expiresIn,
    expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : '',
  };
}

/**
 * Issue a read-only guest session.
 *
 * Guests are signed with the same secret so the auth middleware needs no
 * special case, but the `role` claim is checked by `requireWrite` — a guest
 * token therefore cannot create, upload or modify anything.
 */
function issueGuest() {
  const claims = { sub: 'guest', email: '', role: ROLE_GUEST };
  const pair = issuePair(claims);
  return { ...pair, role: ROLE_GUEST };
}

/** Verify a token. Throws ApiError(401) for anything untrustworthy. */
function verify(token, expectedType) {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    });
    if (expectedType && decoded.typ !== expectedType) {
      throw ApiError.unauthorized('This token cannot be used for that request.');
    }
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('The session has expired.', {
        code: 'TOKEN_EXPIRED',
      });
    }
    throw ApiError.unauthorized('The session token is not valid.', {
      code: 'TOKEN_INVALID',
    });
  }
}

/** Normalise the `Authorization: Bearer <token>` header into a bare token. */
function fromAuthHeader(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') return '';
  const [scheme, ...rest] = headerValue.trim().split(/\s+/);
  if (!/^Bearer$/i.test(scheme)) return '';
  return rest.join('');
}

/**
 * The response body the scanner's `Authenticator` parses.
 *
 * The extra aliases cost nothing and make the endpoint tolerant of an older
 * desktop build, which is the whole point of accepting several key spellings
 * on the client side in the first place.
 */
function toAuthResponse({ user, pair, scannerId = '', sessionId = '' }) {
  return {
    access_token: pair.accessToken,
    refresh_token: pair.refreshToken,
    token_type: TOKEN_TYPE,
    expires_in: pair.expiresIn,
    expires_at: pair.expiresAt,
    email: user?.email || '',
    role: user?.role || ROLE_USER,
    scanner_id: scannerId,
    session_id: sessionId,
  };
}

module.exports = {
  ROLE_USER,
  ROLE_SCANNER,
  ROLE_GUEST,
  issuePair,
  issueGuest,
  verify,
  fromAuthHeader,
  toAuthResponse,
};
