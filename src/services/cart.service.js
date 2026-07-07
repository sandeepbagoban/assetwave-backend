const { Cart, CartItem, Listing, Seller, Category, ListingImage } = require('../models');
const AppError = require('../utils/AppError');
const listingService = require('./listing.service');

const ITEM_INCLUDE = [{
  model: CartItem, as: 'items',
  include: [{
    model: Listing, as: 'listing',
    include: [{ model: Seller, as: 'seller' }, { model: Category, as: 'category' }, { model: ListingImage, as: 'images' }],
  }],
}];

async function getOrCreateCart(buyerId) {
  const [cart] = await Cart.findOrCreate({ where: { buyerId } });
  return cart;
}

function toPublic(cart) {
  const items = (cart.items || []).map(item => ({
    id: item.id,
    quantity: item.quantity,
    listing: listingService.toPublic(item.listing),
  }));
  const subtotal = items.reduce((sum, i) => sum + i.listing.price_amount * i.quantity, 0);
  return { id: cart.id, items, subtotal };
}

async function getCart(user) {
  await getOrCreateCart(user.id);
  const cart = await Cart.findOne({ where: { buyerId: user.id }, include: ITEM_INCLUDE });
  return toPublic(cart);
}

async function addItem(user, { listing_id, quantity }) {
  const listing = await Listing.findByPk(listing_id);
  if (!listing || listing.status !== 'active') throw new AppError(404, 'not_found', 'Listing not available.');

  const qty = Math.max(1, Number(quantity) || 1);
  if (qty > listing.quantity) throw new AppError(409, 'insufficient_quantity', 'Not enough stock available.');

  const cart = await getOrCreateCart(user.id);
  const [item, created] = await CartItem.findOrCreate({
    where: { cartId: cart.id, listingId: listing_id },
    defaults: { quantity: qty },
  });
  if (!created) {
    item.quantity = Math.min(listing.quantity, item.quantity + qty);
    await item.save();
  }

  return getCart(user);
}

async function updateItem(user, itemId, quantity) {
  const cart = await getOrCreateCart(user.id);
  const item = await CartItem.findOne({ where: { id: itemId, cartId: cart.id }, include: [{ model: Listing, as: 'listing' }] });
  if (!item) throw new AppError(404, 'not_found', 'Cart item not found.');

  const qty = Number(quantity);
  if (!qty || qty < 1) throw new AppError(400, 'validation_error', 'quantity must be at least 1.');
  if (qty > item.listing.quantity) throw new AppError(409, 'insufficient_quantity', 'Not enough stock available.');

  item.quantity = qty;
  await item.save();
  return getCart(user);
}

async function removeItem(user, itemId) {
  const cart = await getOrCreateCart(user.id);
  await CartItem.destroy({ where: { id: itemId, cartId: cart.id } });
  return getCart(user);
}

module.exports = { getCart, addItem, updateItem, removeItem, getOrCreateCart, ITEM_INCLUDE, toPublic };
