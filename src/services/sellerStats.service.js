// Seller-scoped analytics — aggregated in JS over one bounded query rather
// than raw-SQL date grouping, since a single seller's order-item volume is
// small. See admin/dashboard.service.js for the equivalent global aggregation.
const { Seller, Listing, OrderItem, Order } = require('../models');

const REVENUE_STATUSES = new Set(['paid', 'shipped', 'delivered', 'released']);
const PENDING_ORDER_STATUSES = ['pending_payment', 'paid', 'shipped', 'delivered'];
const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

async function getStats(user) {
  const seller = await Seller.findOne({ where: { userId: user.id } });
  if (!seller) {
    return {
      active_listings: 0, total_listings: 0, sold_listings: 0, inventory_value_usd: 0,
      pending_orders: 0, total_revenue_usd: 0,
      orders_by_status: {},
      sales_last_30_days: buildEmptyDays().map(d => ({ date: d.date, revenue_usd: 0 })),
      top_listings: [],
    };
  }

  const [activeListings, totalListings, soldListings, pendingOrders, activeListingRows, items] = await Promise.all([
    Listing.count({ where: { sellerId: seller.id, status: 'active' } }),
    Listing.count({ where: { sellerId: seller.id } }),
    Listing.count({ where: { sellerId: seller.id, status: 'sold' } }),
    Order.count({
      distinct: true,
      col: 'id',
      where: { status: PENDING_ORDER_STATUSES },
      include: [{ model: OrderItem, as: 'items', attributes: [], required: true, where: { sellerId: seller.id } }],
    }),
    Listing.findAll({ where: { sellerId: seller.id, status: 'active' }, attributes: ['priceAmount', 'quantity'] }),
    OrderItem.findAll({
      where: { sellerId: seller.id },
      include: [{ model: Order, as: 'order', attributes: ['id', 'status', 'placedAt'] }],
    }),
  ]);

  const inventoryValue = activeListingRows.reduce((sum, l) => sum + Number(l.priceAmount) * l.quantity, 0);

  let totalRevenue = 0;
  const ordersByStatus = {};
  const seenOrderIds = new Set();
  const salesByDay = new Map(buildEmptyDays().map(d => [d.date, 0]));
  const listingTotals = new Map();

  for (const item of items) {
    const order = item.order;
    if (!order) continue;

    if (!seenOrderIds.has(order.id)) {
      seenOrderIds.add(order.id);
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    }

    if (!REVENUE_STATUSES.has(order.status)) continue;

    const revenue = Number(item.priceAmount) * item.quantity;
    totalRevenue += revenue;

    const key = dateKey(order.placedAt);
    if (salesByDay.has(key)) salesByDay.set(key, salesByDay.get(key) + revenue);

    const existing = listingTotals.get(item.listingId) || { title: item.titleSnapshot, revenue: 0, units: 0 };
    existing.revenue += revenue;
    existing.units += item.quantity;
    listingTotals.set(item.listingId, existing);
  }

  const topListings = [...listingTotals.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([listingId, v]) => ({ listing_id: listingId, title: v.title, revenue_usd: Number(v.revenue.toFixed(2)), units_sold: v.units }));

  return {
    active_listings: activeListings,
    total_listings: totalListings,
    sold_listings: soldListings,
    inventory_value_usd: Number(inventoryValue.toFixed(2)),
    pending_orders: pendingOrders,
    total_revenue_usd: Number(totalRevenue.toFixed(2)),
    orders_by_status: ordersByStatus,
    sales_last_30_days: [...salesByDay.entries()].map(([date, revenue]) => ({ date, revenue_usd: Number(revenue.toFixed(2)) })),
    top_listings: topListings,
  };
}

function buildEmptyDays() {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i -= 1) {
    days.push({ date: dateKey(new Date(today.getTime() - i * DAY_MS)) });
  }
  return days;
}

module.exports = { getStats };
