const { Op } = require('sequelize');
const slugify = require('slugify');
const { Listing, ListingImage, Seller, Category } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, paginatedResponse } = require('../utils/pagination');

const CONDITIONS = ['excellent', 'good', 'fair'];

function toPublic(listing) {
  return {
    id: listing.id,
    title: listing.title,
    slug: listing.slug,
    brand: listing.brand,
    model: listing.model,
    year_manufactured: listing.yearManufactured,
    condition: listing.condition,
    description: listing.description,
    price_amount: Number(listing.priceAmount),
    currency: listing.currency,
    origin_country: listing.originCountry,
    new_price_estimate: listing.newPriceEstimate ? Number(listing.newPriceEstimate) : null,
    quantity: listing.quantity,
    weight_kg: listing.weightKg ? Number(listing.weightKg) : null,
    length_cm: listing.lengthCm ? Number(listing.lengthCm) : null,
    width_cm: listing.widthCm ? Number(listing.widthCm) : null,
    height_cm: listing.heightCm ? Number(listing.heightCm) : null,
    status: listing.status,
    category: listing.category?.slug || null,
    category_id: listing.categoryId,
    seller_id: listing.sellerId,
    seller: listing.seller ? {
      id: listing.seller.id,
      // Deliberately not falling back to orgName — the real company name
      // stays private even if a legacy seller record has no nickname yet.
      name: listing.seller.nickname || 'Verified Seller',
      country: listing.seller.country,
      verified: listing.seller.verified,
      account_type: listing.seller.accountType,
    } : null,
    images: (listing.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.url),
    created_at: listing.createdAt,
  };
}

const INCLUDE = [
  { model: Seller, as: 'seller' },
  { model: Category, as: 'category' },
  { model: ListingImage, as: 'images' },
];

async function list(query, { viewer } = {}) {
  const { page, limit, offset } = parsePagination(query);
  const where = {};

  // Public callers only ever see active listings; a seller/admin viewing
  // their own dashboard sees all statuses via sellers.service instead.
  where.status = 'active';

  if (query.category) {
    const category = await Category.findOne({ where: { slug: query.category } });
    where.categoryId = category ? category.id : '00000000-0000-0000-0000-000000000000';
  }
  if (query.brand) where.brand = { [Op.like]: `%${query.brand}%` };
  if (query.condition && CONDITIONS.includes(query.condition)) where.condition = query.condition;
  if (query.country) where.originCountry = query.country.toUpperCase();
  if (query.min_price || query.max_price) {
    where.priceAmount = {};
    if (query.min_price) where.priceAmount[Op.gte] = Number(query.min_price);
    if (query.max_price) where.priceAmount[Op.lte] = Number(query.max_price);
  }
  if (query.q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${query.q}%` } },
      { brand: { [Op.like]: `%${query.q}%` } },
      { model: { [Op.like]: `%${query.q}%` } },
    ];
  }

  const { rows, count } = await Listing.findAndCountAll({
    where, include: INCLUDE, limit, offset, order: [['createdAt', 'DESC']], distinct: true,
  });

  return paginatedResponse(rows.map(toPublic), count, { page, limit });
}

async function getById(id) {
  const listing = await Listing.findByPk(id, { include: INCLUDE });
  if (!listing) throw new AppError(404, 'not_found', 'Listing not found.');
  return toPublic(listing);
}

async function assertSellerForUser(user) {
  const seller = await Seller.findOne({ where: { userId: user.id } });
  if (!seller) throw new AppError(403, 'forbidden', 'You must have a seller profile to manage listings.');
  if (seller.kybStatus !== 'approved') throw new AppError(403, 'seller_not_approved', 'Your seller account is not approved yet.');
  return seller;
}

async function create(user, payload) {
  const seller = await assertSellerForUser(user);
  validatePayload(payload, { partial: false });

  const category = await Category.findByPk(payload.category_id);
  if (!category) throw new AppError(400, 'validation_error', 'category_id does not reference a valid category.');

  const slug = await uniqueSlug(payload.title);
  const listing = await Listing.create({
    sellerId: seller.id,
    categoryId: payload.category_id,
    title: payload.title,
    slug,
    brand: payload.brand,
    model: payload.model,
    yearManufactured: payload.year_manufactured,
    condition: payload.condition,
    description: payload.description,
    priceAmount: payload.price_amount,
    currency: payload.currency || 'USD',
    originCountry: payload.origin_country,
    newPriceEstimate: payload.new_price_estimate,
    quantity: payload.quantity ?? 1,
    weightKg: payload.weight_kg,
    lengthCm: payload.length_cm,
    widthCm: payload.width_cm,
    heightCm: payload.height_cm,
    status: payload.status === 'active' ? 'active' : 'draft',
  });

  return getById(listing.id);
}

async function update(user, id, payload) {
  const listing = await Listing.findByPk(id);
  if (!listing) throw new AppError(404, 'not_found', 'Listing not found.');
  await assertOwnershipOrAdmin(user, listing);
  validatePayload(payload, { partial: true });

  const fieldMap = {
    title: 'title', brand: 'brand', model: 'model', description: 'description',
    year_manufactured: 'yearManufactured', condition: 'condition', price_amount: 'priceAmount',
    currency: 'currency', origin_country: 'originCountry', new_price_estimate: 'newPriceEstimate',
    quantity: 'quantity', status: 'status', category_id: 'categoryId',
    weight_kg: 'weightKg', length_cm: 'lengthCm', width_cm: 'widthCm', height_cm: 'heightCm',
  };
  for (const [key, field] of Object.entries(fieldMap)) {
    if (payload[key] !== undefined) listing[field] = payload[key];
  }
  if (payload.title) listing.slug = await uniqueSlug(payload.title, listing.id);

  await listing.save();
  return getById(listing.id);
}

async function remove(user, id) {
  const listing = await Listing.findByPk(id);
  if (!listing) throw new AppError(404, 'not_found', 'Listing not found.');
  await assertOwnershipOrAdmin(user, listing);
  await listing.destroy();
}

async function addImages(user, id, urls) {
  const listing = await Listing.findByPk(id);
  if (!listing) throw new AppError(404, 'not_found', 'Listing not found.');
  await assertOwnershipOrAdmin(user, listing);

  const existingCount = await ListingImage.count({ where: { listingId: id } });
  await ListingImage.bulkCreate(urls.map((url, i) => ({ listingId: id, url, sortOrder: existingCount + i })));
  return getById(id);
}

async function assertOwnershipOrAdmin(user, listing) {
  if (user.role === 'admin') return;
  const seller = await Seller.findOne({ where: { userId: user.id } });
  if (!seller || seller.id !== listing.sellerId) {
    throw new AppError(403, 'forbidden', 'You do not own this listing.');
  }
}

function validatePayload(payload, { partial }) {
  const required = ['title', 'category_id', 'condition', 'price_amount'];
  if (!partial) {
    for (const field of required) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
        throw new AppError(400, 'validation_error', `${field} is required.`);
      }
    }
  }
  if (payload.condition && !CONDITIONS.includes(payload.condition)) {
    throw new AppError(400, 'validation_error', `condition must be one of: ${CONDITIONS.join(', ')}`);
  }
  if (payload.price_amount !== undefined && Number(payload.price_amount) <= 0) {
    throw new AppError(400, 'validation_error', 'price_amount must be greater than 0.');
  }
}

async function uniqueSlug(title, excludeId) {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let n = 1;
  while (await Listing.findOne({ where: { slug, ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}) } })) {
    n += 1;
    slug = `${base}-${n}-${Date.now().toString(36).slice(-4)}`;
  }
  return slug;
}

module.exports = { list, getById, create, update, remove, addImages, toPublic, assertSellerForUser, CONDITIONS };
