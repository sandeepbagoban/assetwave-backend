const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/order.service');

const checkout = asyncHandler(async (req, res) => {
  const data = await orderService.checkout(req.user, req.body);
  res.status(201).json({ data });
});

const list = asyncHandler(async (req, res) => {
  const result = await orderService.listMine(req.user, req.query);
  res.json(result);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await orderService.getById(req.user, req.params.id);
  res.json({ data });
});

const confirmDelivery = asyncHandler(async (req, res) => {
  const data = await orderService.confirmDelivery(req.user, req.params.id);
  res.json({ data });
});

const markShipped = asyncHandler(async (req, res) => {
  const data = await orderService.markShipped(req.user, req.params.id);
  res.json({ data });
});

const raiseDispute = asyncHandler(async (req, res) => {
  const data = await orderService.raiseDispute(req.user, req.params.id, req.body.reason);
  res.json({ data });
});

const recordTracking = asyncHandler(async (req, res) => {
  const data = await orderService.recordTracking(req.user, req.params.id, req.body.tracking_number);
  res.json({ data });
});

module.exports = { checkout, list, getOne, confirmDelivery, markShipped, raiseDispute, recordTracking };
