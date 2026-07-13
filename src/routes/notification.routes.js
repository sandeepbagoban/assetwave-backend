const express = require('express');
const controller = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth());
router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', controller.markRead);

module.exports = router;
