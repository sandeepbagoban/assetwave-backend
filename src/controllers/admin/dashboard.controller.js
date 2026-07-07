const asyncHandler = require('../../utils/asyncHandler');
const dashboardService = require('../../services/admin/dashboard.service');

const stats = asyncHandler(async (req, res) => res.json({ data: await dashboardService.stats() }));

module.exports = { stats };
