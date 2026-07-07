// Wraps async route/controller functions so rejected promises reach errorHandler
// instead of crashing the request with an unhandled rejection.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
