const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const listingService = require('../services/listing.service');

const list = asyncHandler(async (req, res) => {
  const result = await listingService.list(req.query, { viewer: req.user });
  res.json(result);
});

const getOne = asyncHandler(async (req, res) => {
  const data = await listingService.getById(req.params.id);
  res.json({ data });
});

const create = asyncHandler(async (req, res) => {
  const data = await listingService.create(req.user, req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await listingService.update(req.user, req.params.id, req.body);
  res.json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await listingService.remove(req.user, req.params.id);
  res.status(204).send();
});

const addImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new AppError(400, 'validation_error', 'At least one image file is required.');
  // Files land on local disk (see middleware/upload.js); served back via the
  // /uploads static mount configured in app.js. A production deployment
  // would swap this for object storage/CDN URLs without changing callers.
  const urls = req.files.map(f => `/uploads/listings/${f.filename}`);
  const data = await listingService.addImages(req.user, req.params.id, urls);
  res.status(201).json({ data });
});

module.exports = { list, getOne, create, update, remove, addImages };
