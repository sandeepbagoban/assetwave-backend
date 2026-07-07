const { Order, OrderItem, OrderStatusHistory, User } = require('../../models');
const AppError = require('../../utils/AppError');
const { parsePagination, paginatedResponse } = require('../../utils/pagination');
const { transition } = require('../orderStatus');
const orderService = require('../order.service');

const INCLUDE = [
  { model: OrderItem, as: 'items' },
  { model: OrderStatusHistory, as: 'statusHistory' },
  { model: User, as: 'buyer' },
];

function toPublic(order) {
  return { ...orderService.toPublic(order), buyer_email: order.buyer?.email, buyer_name: order.buyer?.fullName };
}

async function list(query) {
  const { page, limit, offset } = parsePagination(query);
  const where = {};
  if (query.status) where.status = query.status;

  const { rows, count } = await Order.findAndCountAll({ where, include: INCLUDE, limit, offset, order: [['placedAt', 'DESC']], distinct: true });
  return paginatedResponse(rows.map(toPublic), count, { page, limit });
}

async function getById(id) {
  const order = await Order.findByPk(id, { include: INCLUDE });
  if (!order) throw new AppError(404, 'not_found', 'Order not found.');
  return toPublic(order);
}

async function findOrThrow(id) {
  const order = await Order.findByPk(id);
  if (!order) throw new AppError(404, 'not_found', 'Order not found.');
  return order;
}

async function setStatus(admin, id, toStatus, note) {
  const order = await findOrThrow(id);
  await transition(order, toStatus, { changedBy: admin.id, note: note || `Admin set status to ${toStatus}.` });
  return getById(id);
}

async function releaseEscrow(admin, id) {
  const order = await findOrThrow(id);
  await transition(order, 'released', { changedBy: admin.id, note: 'Admin released escrow to seller(s).' });
  return getById(id);
}

async function refundEscrow(admin, id, reason) {
  const order = await findOrThrow(id);
  await transition(order, 'refunded', { changedBy: admin.id, note: reason || 'Admin refunded buyer.' });
  return getById(id);
}

async function resolveDispute(admin, id, resolution, note) {
  if (!['released', 'refunded'].includes(resolution)) {
    throw new AppError(400, 'validation_error', 'resolution must be released or refunded.');
  }
  const order = await findOrThrow(id);
  await transition(order, resolution, { changedBy: admin.id, note: note || `Dispute resolved: ${resolution}.` });
  return getById(id);
}

module.exports = { list, getById, setStatus, releaseEscrow, refundEscrow, resolveDispute };
