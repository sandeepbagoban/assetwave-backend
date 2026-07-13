// In-app only (no email/SMS) — a simple polled bell in each frontend, not a
// push/webhook system. Order-lifecycle events are the only producer today
// (see orderStatus.js / order.service.js's checkout()).
const { Notification, Seller, User } = require('../models');
const AppError = require('../utils/AppError');

function toPublic(n) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    read: Boolean(n.readAt),
    created_at: n.createdAt,
  };
}

async function create({ userId, type, title, message, link }) {
  return Notification.create({ userId, type, title, message, link });
}

// sellerIds are Seller.id (the profile), not the underlying account —
// resolve each to its User before notifying. Missing sellers are skipped.
async function notifySellers(sellerIds, { type, title, message, link }) {
  const uniqueIds = [...new Set(sellerIds)];
  const sellers = await Seller.findAll({ where: { id: uniqueIds } });
  await Promise.all(sellers.map(s => create({ userId: s.userId, type, title, message, link })));
}

async function notifyAdmins({ type, title, message, link }) {
  const admins = await User.findAll({ where: { role: 'admin' } });
  await Promise.all(admins.map(a => create({ userId: a.id, type, title, message, link })));
}

async function listMine(user, { unreadOnly } = {}) {
  const where = { userId: user.id };
  if (unreadOnly) where.readAt = null;
  const rows = await Notification.findAll({ where, order: [['createdAt', 'DESC']], limit: 50 });
  return rows.map(toPublic);
}

async function unreadCount(user) {
  return Notification.count({ where: { userId: user.id, readAt: null } });
}

async function markRead(user, id) {
  const notification = await Notification.findOne({ where: { id, userId: user.id } });
  if (!notification) throw new AppError(404, 'not_found', 'Notification not found.');
  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }
  return toPublic(notification);
}

async function markAllRead(user) {
  await Notification.update({ readAt: new Date() }, { where: { userId: user.id, readAt: null } });
}

module.exports = { create, notifySellers, notifyAdmins, listMine, unreadCount, markRead, markAllRead, toPublic };
