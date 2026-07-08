const asyncHandler = require('../utils/asyncHandler');
const importService = require('../services/sellerImportListings.service');

const preview = asyncHandler(async (req, res) => {
  const data = await importService.preview(req.user, req.file);
  res.status(201).json({ data });
});

const commit = asyncHandler(async (req, res) => {
  const data = await importService.commit(req.user, req.params.jobId);
  res.json({ data });
});

const getOne = asyncHandler(async (req, res) => {
  res.json({ data: await importService.getJob(req.user, req.params.jobId) });
});

module.exports = { preview, commit, getOne };
