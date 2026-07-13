const asyncHandler = require('../utils/asyncHandler');
const rateService = require('../services/logisticsProviderRate.service');

const create = asyncHandler(async (req, res) => {
  const data = await rateService.create(req.params.providerId, req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await rateService.update(req.params.providerId, req.params.rateId, req.body);
  res.json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await rateService.remove(req.params.providerId, req.params.rateId);
  res.status(204).send();
});

module.exports = { create, update, remove };
