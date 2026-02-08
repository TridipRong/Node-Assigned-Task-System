/**
 * Central error handler: uses statusCode from service/DTO errors, defaults to 500.
 * For 400 validation errors, optionally includes details (e.g. Joi).
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  console.error('[Server] error', { statusCode, message, path: req.path });
  const payload = { error: message };
  if (statusCode === 400 && err.details) {
    payload.details = err.details;
  }
  res.status(statusCode).json(payload);
}

module.exports = errorHandler;
