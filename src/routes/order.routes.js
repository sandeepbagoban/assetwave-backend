const express = require('express');
const controller = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth());
router.post('/checkout', controller.checkout);
router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/:id/confirm-delivery', controller.confirmDelivery);
router.post('/:id/ship', controller.markShipped);
router.post('/:id/dispute', controller.raiseDispute);

module.exports = router;
