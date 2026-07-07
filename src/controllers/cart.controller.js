const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const cartService = require('../services/cart.service');

const getCart = asyncHandler(async (req, res) => {
  const data = await cartService.getCart(req.user);
  res.json({ data });
});

const addItem = asyncHandler(async (req, res) => {
  if (!req.body.listing_id) throw new AppError(400, 'validation_error', 'listing_id is required.');
  const data = await cartService.addItem(req.user, req.body);
  res.status(201).json({ data });
});

const updateItem = asyncHandler(async (req, res) => {
  const data = await cartService.updateItem(req.user, req.params.id, req.body.quantity);
  res.json({ data });
});

const removeItem = asyncHandler(async (req, res) => {
  const data = await cartService.removeItem(req.user, req.params.id);
  res.json({ data });
});

module.exports = { getCart, addItem, updateItem, removeItem };
