const AppError = require('../utils/AppError');

function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'not_found', message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors?.map(e => e.message).join('; ') || err.message;
    return res.status(409).json({ error: { code: 'validation_error', message } });
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: { code: 'upload_error', message: err.message } });
  }

  console.error(err);
  return res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong.' } });
}

module.exports = { errorHandler, notFoundHandler };
