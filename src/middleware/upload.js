const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

const EXCEL_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

const IMAGE_EXT_BY_MIME = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads');
const LISTING_IMAGES_DIR = path.join(UPLOADS_ROOT, 'listings');
fs.mkdirSync(LISTING_IMAGES_DIR, { recursive: true });

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!EXCEL_MIME_TYPES.has(file.mimetype) && !/\.xlsx$/i.test(file.originalname)) {
      return cb(new AppError(400, 'invalid_file_type', 'Only .xlsx files are accepted.'));
    }
    cb(null, true);
  },
});

// Disk storage (not memory) so uploaded photos are served back as small
// static URLs instead of being inlined as base64 into the DB.
const imageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, LISTING_IMAGES_DIR),
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${IMAGE_EXT_BY_MIME[file.mimetype]}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!IMAGE_EXT_BY_MIME[file.mimetype]) {
      return cb(new AppError(400, 'invalid_file_type', 'Only PNG, JPEG, or WEBP images are accepted.'));
    }
    cb(null, true);
  },
});

module.exports = { excelUpload, imageUpload, UPLOADS_ROOT };
