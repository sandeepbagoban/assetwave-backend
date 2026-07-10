const express = require('express');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { excelUpload } = require('../middleware/upload');

const usersController = require('../controllers/admin/users.controller');
const sellersController = require('../controllers/admin/sellers.controller');
const ordersController = require('../controllers/admin/orders.controller');
const dashboardController = require('../controllers/admin/dashboard.controller');
const importsController = require('../controllers/admin/imports.controller');

const router = express.Router();

router.use(requireAuth(), requireRole('admin'));

router.get('/dashboard/stats', dashboardController.stats);

router.get('/users', usersController.list);
router.get('/buyers', usersController.listBuyers);
router.get('/users/:id', usersController.getOne);
router.patch('/users/:id', usersController.setStatus);

router.get('/sellers', sellersController.list);
router.get('/sellers/:id', sellersController.getOne);
router.patch('/sellers/:id/approve', sellersController.approve);
router.patch('/sellers/:id/reject', sellersController.reject);
router.patch('/sellers/:id/suspend', sellersController.suspend);

router.get('/orders', ordersController.list);
router.get('/orders/:id', ordersController.getOne);
router.patch('/orders/:id/status', ordersController.setStatus);
router.patch('/orders/:id/escrow/release', ordersController.release);
router.patch('/orders/:id/escrow/refund', ordersController.refund);
router.patch('/orders/:id/dispute/resolve', ordersController.resolveDispute);
router.post('/orders/run-timeouts', ordersController.runTimeouts);

router.post('/imports/listings/preview', excelUpload.single('file'), importsController.preview);
router.post('/imports/listings/:jobId/commit', importsController.commit);
router.get('/imports/:jobId', importsController.getOne);

module.exports = router;
