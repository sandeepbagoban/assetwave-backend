const AppError = require('../utils/AppError');
module.exports = function requirePilotBuyer(req, res, next) {
  if (!req.user || (!req.user.pilotBuyer && req.user.role !== 'admin')) return next(new AppError(403, 'pilot_access_required', 'Online purchasing is available to approved pilot buyers. Please enquire with the AWXchange team.'));
  next();
};
