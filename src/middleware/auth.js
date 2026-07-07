const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { User } = require('../models');

function requireAuth() {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) throw new AppError(401, 'unauthorized', 'Missing or invalid Authorization header.');

      const payload = jwt.verify(token, env.jwt.accessSecret);
      const user = await User.findByPk(payload.sub);
      if (!user || user.status !== 'active') {
        throw new AppError(401, 'unauthorized', 'User no longer active.');
      }

      req.user = user;
      next();
    } catch (err) {
      if (err instanceof AppError) return next(err);
      next(new AppError(401, 'unauthorized', 'Invalid or expired token.'));
    }
  };
}

// Auth is attached if a valid token is present, but the route is still
// reachable without one (e.g. GET /listings shows different data when a
// seller/admin is browsing their own draft listings vs an anonymous buyer).
function optionalAuth() {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) return next();

      const payload = jwt.verify(token, env.jwt.accessSecret);
      const user = await User.findByPk(payload.sub);
      if (user && user.status === 'active') req.user = user;
      next();
    } catch {
      next();
    }
  };
}

module.exports = { requireAuth, optionalAuth };
