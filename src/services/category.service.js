const slugify = require('slugify');
const { Category, Listing } = require('../models');
const AppError = require('../utils/AppError');

function toPublic(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent_id: category.parentId,
    sort_order: category.sortOrder,
  };
}

async function list() {
  const categories = await Category.findAll({ order: [['sortOrder', 'ASC'], ['name', 'ASC']] });
  return categories.map(toPublic);
}

async function getById(id) {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError(404, 'not_found', 'Category not found.');
  return toPublic(category);
}

async function create({ name, parent_id, sort_order }) {
  const slug = await uniqueSlug(name);
  const category = await Category.create({ name, slug, parentId: parent_id || null, sortOrder: sort_order || 0 });
  return toPublic(category);
}

async function update(id, { name, parent_id, sort_order }) {
  const category = await Category.findByPk(id);
  if (!category) throw new AppError(404, 'not_found', 'Category not found.');

  if (name && name !== category.name) {
    category.name = name;
    category.slug = await uniqueSlug(name, id);
  }
  if (parent_id !== undefined) category.parentId = parent_id || null;
  if (sort_order !== undefined) category.sortOrder = sort_order;
  await category.save();
  return toPublic(category);
}

async function remove(id) {
  const inUse = await Listing.count({ where: { categoryId: id } });
  if (inUse > 0) throw new AppError(409, 'category_in_use', 'Cannot delete a category that still has listings.');
  const deleted = await Category.destroy({ where: { id } });
  if (!deleted) throw new AppError(404, 'not_found', 'Category not found.');
}

async function uniqueSlug(name, excludeId) {
  const base = slugify(name, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  while (await Category.findOne({ where: { slug, ...(excludeId ? { id: { [require('sequelize').Op.ne]: excludeId } } : {}) } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

module.exports = { list, getById, create, update, remove, toPublic };
