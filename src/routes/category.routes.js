const express = require('express');
const controller = require('../controllers/category.controller');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireAuth(), requireRole('admin'), controller.create);
router.patch('/:id', requireAuth(), requireRole('admin'), controller.update);
router.delete('/:id', requireAuth(), requireRole('admin'), controller.remove);

module.exports = router;
