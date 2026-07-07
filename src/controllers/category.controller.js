const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const categoryService = require('../services/category.service');

const list = asyncHandler(async (req, res) => {
  const data = await categoryService.list();
  res.json({ data, meta: { total: data.length } });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await categoryService.getById(req.params.id);
  res.json({ data });
});

const create = asyncHandler(async (req, res) => {
  if (!req.body.name || !req.body.name.trim()) throw new AppError(400, 'validation_error', 'name is required.');
  const data = await categoryService.create(req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await categoryService.update(req.params.id, req.body);
  res.json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  res.status(204).send();
});

module.exports = { list, getOne, create, update, remove };
