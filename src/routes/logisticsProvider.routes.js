const express = require('express');
const controller = require('../controllers/logisticsProvider.controller');
const rateController = require('../controllers/logisticsProviderRate.controller');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireAuth(), requireRole('admin'), controller.create);
router.patch('/:id', requireAuth(), requireRole('admin'), controller.update);
router.delete('/:id', requireAuth(), requireRole('admin'), controller.remove);

// Rates are exposed inline on the parent provider (GET above already
// includes `rates`) — these are the admin-only write endpoints.
router.post('/:providerId/rates', requireAuth(), requireRole('admin'), rateController.create);
router.patch('/:providerId/rates/:rateId', requireAuth(), requireRole('admin'), rateController.update);
router.delete('/:providerId/rates/:rateId', requireAuth(), requireRole('admin'), rateController.remove);

module.exports = router;
