const asyncHandler = require('../utils/asyncHandler');
const sellerService = require('../services/seller.service');
const sellerStatsService = require('../services/sellerStats.service');

const apply = asyncHandler(async (req, res) => {
  const data = await sellerService.apply(req.user, req.body);
  res.status(201).json({ data });
});

const me = asyncHandler(async (req, res) => {
  const data = await sellerService.getMe(req.user);
  res.json({ data });
});

const myListings = asyncHandler(async (req, res) => {
  const result = await sellerService.getMyListings(req.user, req.query);
  res.json(result);
});

const myOrders = asyncHandler(async (req, res) => {
  const result = await sellerService.getMyOrders(req.user, req.query);
  res.json(result);
});

const stats = asyncHandler(async (req, res) => {
  const data = await sellerStatsService.getStats(req.user);
  res.json({ data });
});

module.exports = { apply, me, myListings, myOrders, stats };
