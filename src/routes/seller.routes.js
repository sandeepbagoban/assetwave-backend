const express = require('express');
const controller = require('../controllers/seller.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth());
router.post('/apply', controller.apply);
router.get('/me', controller.me);
router.get('/me/listings', controller.myListings);
router.get('/me/orders', controller.myOrders);

module.exports = router;
