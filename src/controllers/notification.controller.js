const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const data = await notificationService.listMine(req.user, { unreadOnly: req.query.unread_only === 'true' });
  res.json({ data });
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.unreadCount(req.user);
  res.json({ data: { count } });
});

const markRead = asyncHandler(async (req, res) => {
  const data = await notificationService.markRead(req.user, req.params.id);
  res.json({ data });
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user);
  res.status(204).send();
});

module.exports = { list, unreadCount, markRead, markAllRead };
