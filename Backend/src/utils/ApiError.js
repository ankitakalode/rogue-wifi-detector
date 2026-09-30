/**
 * A single error type the whole API throws.
 *
 * Route handlers raise `ApiError.badRequest(...)` and the error middleware
 * renders it. Without this, every handler would invent its own response shape
 * and the client could not tell a validation failure from a crash.
 */

class ApiError extends Error {
  /**
   * @param {number} statusCode HTTP status to send.
   * @param {string} message    Human-readable, safe to show a client.
   * @param {object} [options]
   * @param {string} [options.code]   Stable machine code (e.g. 'INVALID_CREDENTIALS').
   * @param {Array}  [options.details] Field-level problems, one per entry.
   * @param {boolean}[options.expose] Send `message` to the client. Defaults to true
   *                                  for 4xx and false for 5xx.
   */
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code || 'ERROR';
    this.details = Array.isArray(options.details) ? options.details : [];
    this.expose = options.expose ?? statusCode < 500;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, options) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', ...options });
  }

  static unauthorized(message = 'Authentication is required.', options) {
    return new ApiError(401, message, { code: 'UNAUTHORIZED', ...options });
  }

  static forbidden(message = 'This action is not allowed.', options) {
    return new ApiError(403, message, { code: 'FORBIDDEN', ...options });
  }

  static notFound(message = 'Resource not found.', options) {
    return new ApiError(404, message, { code: 'NOT_FOUND', ...options });
  }

  static conflict(message, options) {
    return new ApiError(409, message, { code: 'CONFLICT', ...options });
  }

  static tooManyRequests(message = 'Too many requests.', options) {
    return new ApiError(429, message, { code: 'RATE_LIMITED', ...options });
  }

  /** A failure the client cannot fix — logged in full, reported vaguely. */
  static internal(message = 'Something went wrong on the server.', options) {
    return new ApiError(500, message, {
      code: 'INTERNAL_ERROR',
      expose: false,
      ...options,
    });
  }

  static serviceUnavailable(message = 'The service is temporarily unavailable.', options) {
    return new ApiError(503, message, { code: 'UNAVAILABLE', ...options });
  }

  /** RFC 7807-ish body. Internal errors never leak their real message. */
  toBody() {
    const body = { error: { code: this.code, message: this.message } };
    if (this.details.length > 0) body.error.details = this.details;
    return body;
  }
}

module.exports = ApiError;
