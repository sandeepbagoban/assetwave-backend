// Shared bulk-listing-import logic used by both the admin (any seller, via a
// seller_email column) and seller-scoped (always the current seller) import
// flows — see admin/importListings.service.js and sellerImportListings.service.js.
const ExcelJS = require('exceljs');
const slugify = require('slugify');
const { Listing, Category } = require('../../models');
const AppError = require('../../utils/AppError');
const { CONDITIONS } = require('../listing.service');

const COMMON_COLUMNS = [
  'title', 'category_slug', 'brand', 'model', 'year_manufactured', 'condition',
  'description', 'price_amount', 'currency', 'origin_country', 'new_price_estimate',
  'quantity', 'weight_kg', 'length_cm', 'width_cm', 'height_cm',
];

async function parseWorkbook(buffer, columns) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new AppError(400, 'invalid_file', 'The uploaded file has no worksheets.');

  const headerRow = sheet.getRow(1).values.slice(1).map(v => String(v || '').trim().toLowerCase());
  const rows = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values.slice(1);
    if (values.every(v => v === null || v === undefined || v === '')) return;

    const record = {};
    headerRow.forEach((col, i) => {
      if (columns.includes(col)) record[col] = values[i] !== undefined ? values[i] : null;
    });
    rows.push({ row_num: rowNumber, data: record });
  });

  return rows;
}

async function validateCommonFields(record) {
  const errors = [];

  if (!record.title || !String(record.title).trim()) errors.push('title is required');

  let category = null;
  if (!record.category_slug) errors.push('category_slug is required');
  else {
    category = await Category.findOne({ where: { slug: String(record.category_slug).trim() } });
    if (!category) errors.push(`category_slug '${record.category_slug}' does not exist`);
  }

  const condition = record.condition ? String(record.condition).trim().toLowerCase() : null;
  if (!condition || !CONDITIONS.includes(condition)) {
    errors.push(`condition must be one of: ${CONDITIONS.join(', ')}`);
  }

  const price = Number(record.price_amount);
  if (!record.price_amount || Number.isNaN(price) || price <= 0) errors.push('price_amount must be a positive number');

  if (record.year_manufactured && Number.isNaN(Number(record.year_manufactured))) errors.push('year_manufactured must be numeric');
  if (record.new_price_estimate && Number.isNaN(Number(record.new_price_estimate))) errors.push('new_price_estimate must be numeric');
  if (record.quantity && Number.isNaN(Number(record.quantity))) errors.push('quantity must be numeric');
  if (record.weight_kg && Number.isNaN(Number(record.weight_kg))) errors.push('weight_kg must be numeric');
  if (record.length_cm && Number.isNaN(Number(record.length_cm))) errors.push('length_cm must be numeric');
  if (record.width_cm && Number.isNaN(Number(record.width_cm))) errors.push('width_cm must be numeric');
  if (record.height_cm && Number.isNaN(Number(record.height_cm))) errors.push('height_cm must be numeric');

  return { errors, category, condition, price };
}

async function uniqueSlug(title, transaction) {
  const base = slugify(String(title), { lower: true, strict: true });
  let slug = base;
  let n = 1;
  while (await Listing.findOne({ where: { slug }, transaction })) {
    n += 1;
    slug = `${base}-${n}-${Date.now().toString(36).slice(-4)}`;
  }
  return slug;
}

module.exports = { COMMON_COLUMNS, parseWorkbook, validateCommonFields, uniqueSlug };
