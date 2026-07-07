const asyncHandler = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const ordersService = require('../../services/admin/orders.service');

const list = asyncHandler(async (req, res) => res.json(await ordersService.list(req.query)));
const getOne = asyncHandler(async (req, res) => res.json({ data: await ordersService.getById(req.params.id) }));

const setStatus = asyncHandler(async (req, res) => {
  if (!req.body.to_status) throw new AppError(400, 'validation_error', 'to_status is required.');
  res.json({ data: await ordersService.setStatus(req.user, req.params.id, req.body.to_status, req.body.note) });
});

const release = asyncHandler(async (req, res) => res.json({ data: await ordersService.releaseEscrow(req.user, req.params.id) }));
const refund = asyncHandler(async (req, res) => res.json({ data: await ordersService.refundEscrow(req.user, req.params.id, req.body.reason) }));

const resolveDispute = asyncHandler(async (req, res) => {
  res.json({ data: await ordersService.resolveDispute(req.user, req.params.id, req.body.resolution, req.body.note) });
});

module.exports = { list, getOne, setStatus, release, refund, resolveDispute };
