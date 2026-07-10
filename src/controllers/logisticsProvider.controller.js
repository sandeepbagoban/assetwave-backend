const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logisticsProviderService = require('../services/logisticsProvider.service');

const list = asyncHandler(async (req, res) => {
  const activeOnly = req.query.active_only === 'true';
  const data = await logisticsProviderService.list({ activeOnly });
  res.json({ data, meta: { total: data.length } });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await logisticsProviderService.getById(req.params.id);
  res.json({ data });
});

const create = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.name.trim()) throw new AppError(400, 'validation_error', 'name is required.');
  const data = await logisticsProviderService.create(req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await logisticsProviderService.update(req.params.id, req.body);
  res.json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await logisticsProviderService.remove(req.params.id);
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
