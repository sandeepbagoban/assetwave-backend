const { sequelize, Order, OrderItem, Listing, Seller, User, Cart, CartItem, OrderStatusHistory } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');
const { transition } = require('./orderStatus');

const DETAIL_INCLUDE = [
  { model: OrderItem, as: 'items' },
  { model: OrderStatusHistory, as: 'statusHistory', order: [['createdAt', 'ASC']] },
];

function toPublic(order) {
  return {
    id: order.id,
    status: order.status,
    subtotal_amount: Number(order.subtotalAmount),
    total_amount: Number(order.totalAmount),
    currency: order.currency,
    shipping_address: order.shippingAddress,
    payment_method: order.paymentMethod,
    escrow_held_at: order.escrowHeldAt,
    escrow_released_at: order.escrowReleasedAt,
    escrow_refunded_at: order.escrowRefundedAt,
    dispute_reason: order.disputeReason,
    placed_at: order.placedAt,
    items: (order.items || []).map(item => ({
      id: item.id,
      listing_id: item.listingId,
      seller_id: item.sellerId,
      title: item.titleSnapshot,
      price_amount: Number(item.priceAmount),
      quantity: item.quantity,
    })),
    status_history: (order.statusHistory || []).map(h => ({
      from: h.fromStatus, to: h.toStatus, note: h.note, at: h.createdAt,
    })),
  };
}

function requiredShippingFields(addr) {
  const required = ['name', 'line1', 'city', 'country', 'postal_code'];
  for (const field of required) {
    if (!addr || !addr[field]) throw new AppError(400, 'validation_error', `shipping_address.${field} is required.`);
  }
}

async function checkout(user, { shipping_address }) {
  requiredShippingFields(shipping_address);

  const cart = await Cart.findOne({ where: { buyerId: user.id }, include: [{ model: CartItem, as: 'items', include: [{ model: Listing, as: 'listing' }] }] });
  if (!cart || !cart.items.length) throw new AppError(400, 'empty_cart', 'Your cart is empty.');

  return sequelize.transaction(async (t) => {
    let subtotal = 0;
    const itemRows = [];

    for (const cartItem of cart.items) {
      const listing = await Listing.findByPk(cartItem.listingId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!listing || listing.status !== 'active') {
        throw new AppError(409, 'listing_unavailable', `"${cartItem.listing.title}" is no longer available.`);
      }
      if (listing.quantity < cartItem.quantity) {
        throw new AppError(409, 'insufficient_quantity', `Not enough stock for "${listing.title}".`);
      }

      subtotal += Number(listing.priceAmount) * cartItem.quantity;
      itemRows.push({
        listingId: listing.id,
        sellerId: listing.sellerId,
        titleSnapshot: listing.title,
        priceAmount: listing.priceAmount,
        quantity: cartItem.quantity,
      });

      listing.quantity -= cartItem.quantity;
      if (listing.quantity === 0) listing.status = 'sold';
      await listing.save({ transaction: t });
    }

    const order = await Order.create({
      buyerId: user.id,
      status: 'pending_payment',
      subtotalAmount: subtotal,
      totalAmount: subtotal,
      shippingAddress: shipping_address,
      paymentMethod: 'simulated',
    }, { transaction: t });

    await OrderItem.bulkCreate(itemRows.map(row => ({ ...row, orderId: order.id })), { transaction: t });
    await OrderStatusHistory.create({ orderId: order.id, fromStatus: null, toStatus: 'pending_payment', note: 'Order placed.' }, { transaction: t });

    // Simulated payment gateway: capture succeeds immediately and funds move
    // into escrow. A real gateway integration would instead webhook this
    // transition in after an async charge confirmation.
    order.status = 'paid';
    order.escrowHeldAt = new Date();
    await order.save({ transaction: t });
    await OrderStatusHistory.create({ orderId: order.id, fromStatus: 'pending_payment', toStatus: 'paid', note: 'Payment captured (simulated); funds held in escrow.' }, { transaction: t });

    await CartItem.destroy({ where: { cartId: cart.id }, transaction: t });

    const fresh = await Order.findByPk(order.id, { include: DETAIL_INCLUDE, transaction: t });
    return toPublic(fresh);
  });
}

async function listMine(user, query) {
  const { page, limit, offset } = parsePagination(query);
  const { rows, count } = await Order.findAndCountAll({
    where: { buyerId: user.id }, include: DETAIL_INCLUDE, limit, offset, order: [['placedAt', 'DESC']], distinct: true,
  });
  return paginatedResponse(rows.map(toPublic), count, { page, limit });
}

async function findAuthorized(user, id) {
  const order = await Order.findByPk(id, { include: DETAIL_INCLUDE });
  if (!order) throw new AppError(404, 'not_found', 'Order not found.');

  if (user.role === 'admin' || order.buyerId === user.id) return order;

  const seller = await Seller.findOne({ where: { userId: user.id } });
  const ownsItem = seller && order.items.some(i => i.sellerId === seller.id);
  if (!ownsItem) throw new AppError(403, 'forbidden', 'You do not have access to this order.');
  return order;
}

async function getById(user, id) {
  return toPublic(await findAuthorized(user, id));
}

async function confirmDelivery(user, id) {
  const order = await Order.findByPk(id);
  if (!order) throw new AppError(404, 'not_found', 'Order not found.');
  if (order.buyerId !== user.id) throw new AppError(403, 'forbidden', 'Only the buyer can confirm delivery.');

  await transition(order, 'delivered', { changedBy: user.id, note: 'Buyer confirmed delivery.' });
  return getById(user, id);
}

async function markShipped(user, id) {
  const seller = await Seller.findOne({ where: { userId: user.id } });
  if (!seller) throw new AppError(403, 'forbidden', 'You do not have a seller profile.');

  const order = await Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] });
  if (!order) throw new AppError(404, 'not_found', 'Order not found.');
  if (!order.items.some(i => i.sellerId === seller.id)) {
    throw new AppError(403, 'forbidden', 'You do not have items in this order.');
  }

  await transition(order, 'shipped', { changedBy: user.id, note: 'Seller marked order as shipped.' });
  return getById(user, id);
}

async function raiseDispute(user, id, reason) {
  const order = await findAuthorized(user, id);
  if (!reason || !reason.trim()) throw new AppError(400, 'validation_error', 'A dispute reason is required.');

  order.disputeReason = reason;
  await transition(order, 'disputed', { changedBy: user.id, note: reason });
  return getById(user, id);
}

module.exports = { checkout, listMine, getById, findAuthorized, confirmDelivery, markShipped, raiseDispute, toPublic };
