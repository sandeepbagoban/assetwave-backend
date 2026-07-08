const express = require('express');
const controller = require('../controllers/seller.controller');
const importsController = require('../controllers/sellerImports.controller');
const { requireAuth } = require('../middleware/auth');
const { excelUpload } = require('../middleware/upload');

const router = express.Router();

router.use(requireAuth());
router.post('/apply', controller.apply);
router.get('/me', controller.me);
router.get('/me/listings', controller.myListings);
router.get('/me/orders', controller.myOrders);
router.get('/me/stats', controller.stats);

router.post('/me/imports/listings/preview', excelUpload.single('file'), importsController.preview);
router.post('/me/imports/listings/:jobId/commit', importsController.commit);
router.get('/me/imports/:jobId', importsController.getOne);

module.exports = router;
