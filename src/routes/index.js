const express = require('express');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const listingRoutes = require('./listing.routes');
const sellerRoutes = require('./seller.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const adminRoutes = require('./admin.routes');
const logisticsProviderRoutes = require('./logisticsProvider.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/listings', listingRoutes);
router.use('/sellers', sellerRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/logistics-providers', logisticsProviderRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
