const express = require('express');
const controller = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth(), requireRole('buyer', 'seller', 'admin'));
router.get('/', controller.getCart);
router.post('/items', controller.addItem);
router.patch('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.removeItem);

module.exports = router;
