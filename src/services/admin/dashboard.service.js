const { Op } = require('sequelize');
const { Listing, Seller, Order } = require('../../models');

async function stats() {
  const [activeListings, pendingKyb, totalSellers, escrowHeld, gmvRow, ordersByStatus] = await Promise.all([
    Listing.count({ where: { status: 'active' } }),
    Seller.count({ where: { kybStatus: 'pending' } }),
    Seller.count({ where: { kybStatus: 'approved' } }),
    Order.sum('totalAmount', { where: { status: { [Op.in]: ['paid', 'shipped', 'delivered'] } } }),
    Order.sum('totalAmount', { where: { status: { [Op.notIn]: ['pending_payment', 'cancelled'] } } }),
    Order.findAll({ attributes: ['status', [Order.sequelize.fn('COUNT', '*'), 'count']], group: ['status'] }),
  ]);

  return {
    active_listings: activeListings,
    pending_seller_applications: pendingKyb,
    approved_sellers: totalSellers,
    escrow_held_usd: Number(escrowHeld || 0),
    gross_merchandise_value_usd: Number(gmvRow || 0),
    orders_by_status: Object.fromEntries(ordersByStatus.map(r => [r.status, Number(r.get('count'))])),
  };
}

module.exports = { stats };
