const AppError = require('../utils/AppError');
const { OrderStatusHistory, OrderItem } = require('../models');
const notificationService = require('./notification.service');

// Single source of truth for the escrow lifecycle. Kept as a plain adjacency
// map so both buyer/seller actions and admin overrides go through the same
// validated, audited path (see order_status_history).
const ALLOWED_TRANSITIONS = {
  pending_payment: ['paid', 'cancelled'],
  paid: ['shipped', 'disputed', 'refunded'],
  shipped: ['delivered', 'disputed', 'refunded'],
  delivered: ['released', 'disputed', 'refunded'],
  released: [],
  refunded: [],
  disputed: ['released', 'refunded'],
  cancelled: [],
};

async function transition(order, toStatus, { changedBy, note } = {}) {
  const from = order.status;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  if (!allowed.includes(toStatus)) {
    throw new AppError(409, 'invalid_transition', `Cannot move an order from '${from}' to '${toStatus}'.`);
  }

  order.status = toStatus;
  if (toStatus === 'paid') order.escrowHeldAt = new Date();
  if (toStatus === 'shipped') order.shippedAt = new Date();
  if (toStatus === 'delivered') order.deliveredAt = new Date();
  if (toStatus === 'released') order.escrowReleasedAt = new Date();
  if (toStatus === 'refunded') order.escrowRefundedAt = new Date();

  await order.save();
  await OrderStatusHistory.create({ orderId: order.id, fromStatus: from, toStatus, changedBy: changedBy || null, note });

  // Best-effort — a notification failure should never block the actual
  // status change (same belt-and-suspenders philosophy as the timeout cron).
  try {
    await notifyForTransition(order, toStatus);
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }

  return order;
}

async function notifyForTransition(order, toStatus) {
  const link = `/orders/${order.id}`;
  const items = order.items || await OrderItem.findAll({ where: { orderId: order.id } });
  const sellerIds = items.map(i => i.sellerId);

  if (toStatus === 'shipped') {
    await notificationService.create({
      userId: order.buyerId, type: 'order_shipped', title: 'Your order has shipped',
      message: 'Your order is on its way.', link,
    });
  } else if (toStatus === 'delivered') {
    await notificationService.notifySellers(sellerIds, {
      type: 'order_delivered', title: 'Delivery confirmed', message: 'The buyer confirmed delivery of their order.', link,
    });
  } else if (toStatus === 'disputed') {
    await notificationService.notifyAdmins({
      type: 'order_disputed', title: 'Dispute raised', message: 'A dispute was raised on an order and needs review.', link,
    });
  } else if (toStatus === 'released') {
    await notificationService.create({
      userId: order.buyerId, type: 'order_released', title: 'Order completed',
      message: 'Escrow was released — this order is complete.', link,
    });
    await notificationService.notifySellers(sellerIds, {
      type: 'order_released', title: 'Payout released', message: 'Escrow was released for one of your sales.', link,
    });
  } else if (toStatus === 'refunded') {
    await notificationService.create({
      userId: order.buyerId, type: 'order_refunded', title: 'Order refunded',
      message: 'This order was refunded.', link,
    });
    await notificationService.notifySellers(sellerIds, {
      type: 'order_refunded', title: 'Order refunded', message: 'One of your sales was refunded to the buyer.', link,
    });
  }
}

module.exports = { ALLOWED_TRANSITIONS, transition };
