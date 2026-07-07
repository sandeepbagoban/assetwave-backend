const AppError = require('../utils/AppError');

// requireRole('admin') or requireRole('seller', 'admin')
module.exports = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'unauthorized', 'Authentication required.'));
  if (!roles.includes(req.user.role)) {
    return next(new AppError(403, 'forbidden', 'You do not have permission to perform this action.'));
  }
  next();
};
