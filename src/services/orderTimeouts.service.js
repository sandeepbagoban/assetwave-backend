// Enforces the escrow policy's 3-day windows:
//   - Seller has 3 days to confirm shipment after payment, else auto-refunded.
//   - Buyer has 3 days to report an issue after delivery, else escrow auto-releases.
// Both transitions are already legal moves in orderStatus.js's ALLOWED_TRANSITIONS
// (paid->refunded, delivered->released) — this just calls them on a timer,
// with `changedBy: null` marking the change as system-initiated.
const { Op } = require('sequelize');
const { Order } = require('../models');
const { transition } = require('./orderStatus');

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

async function runOrderTimeouts() {
  const cutoff = new Date(Date.now() - THREE_DAYS_MS);
  const results = { refunded: [], released: [], errors: [] };

  const unshipped = await Order.findAll({
    where: { status: 'paid', escrowHeldAt: { [Op.lte]: cutoff } },
  });
  for (const order of unshipped) {
    try {
      await transition(order, 'refunded', {
        changedBy: null,
        note: 'Auto-refunded: seller did not confirm shipment within 3 days.',
      });
      results.refunded.push(order.id);
    } catch (err) {
      results.errors.push({ order_id: order.id, message: err.message });
    }
  }

  const undisputed = await Order.findAll({
    where: { status: 'delivered', deliveredAt: { [Op.lte]: cutoff } },
  });
  for (const order of undisputed) {
    try {
      await transition(order, 'released', {
        changedBy: null,
        note: 'Auto-released: no dispute reported within 3 days of delivery.',
      });
      results.released.push(order.id);
    } catch (err) {
      results.errors.push({ order_id: order.id, message: err.message });
    }
  }

  return results;
}

module.exports = { runOrderTimeouts };
