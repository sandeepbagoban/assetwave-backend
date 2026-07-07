const express = require('express');
const controller = require('../controllers/listing.controller');
const { requireAuth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { imageUpload } = require('../middleware/upload');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', requireAuth(), requireRole('seller', 'admin'), controller.create);
router.patch('/:id', requireAuth(), requireRole('seller', 'admin'), controller.update);
router.delete('/:id', requireAuth(), requireRole('seller', 'admin'), controller.remove);
router.post('/:id/images', requireAuth(), requireRole('seller', 'admin'), imageUpload.array('images', 8), controller.addImages);

module.exports = router;
