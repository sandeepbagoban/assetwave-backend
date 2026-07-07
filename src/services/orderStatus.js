const AppError = require('../utils/AppError');
const { OrderStatusHistory } = require('../models');

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
  if (toStatus === 'released') order.escrowReleasedAt = new Date();
  if (toStatus === 'refunded') order.escrowRefundedAt = new Date();

  await order.save();
  await OrderStatusHistory.create({ orderId: order.id, fromStatus: from, toStatus, changedBy: changedBy || null, note });
  return order;
}

module.exports = { ALLOWED_TRANSITIONS, transition };
