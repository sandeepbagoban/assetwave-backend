const ExcelJS = require('exceljs');
const slugify = require('slugify');
const { sequelize, ImportJob, Category, Seller, Listing } = require('../../models');
const AppError = require('../../utils/AppError');
const { CONDITIONS } = require('../listing.service');

const COLUMNS = [
  'title', 'category_slug', 'brand', 'model', 'year_manufactured', 'condition',
  'description', 'price_amount', 'currency', 'origin_country', 'new_price_estimate',
  'quantity', 'seller_email',
];

async function parseWorkbook(buffer) {
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
      if (COLUMNS.includes(col)) record[col] = values[i] !== undefined ? values[i] : null;
    });
    rows.push({ row_num: rowNumber, data: record });
  });

  return rows;
}

async function validateRow(record) {
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

  let seller = null;
  if (!record.seller_email) errors.push('seller_email is required');
  else {
    seller = await Seller.findOne({ include: [{ association: 'user', where: { email: String(record.seller_email).trim() } }] });
    if (!seller) errors.push(`seller_email '${record.seller_email}' has no matching seller account`);
    else if (seller.kybStatus !== 'approved') errors.push(`seller '${record.seller_email}' is not an approved seller`);
  }

  if (record.year_manufactured && Number.isNaN(Number(record.year_manufactured))) errors.push('year_manufactured must be numeric');
  if (record.new_price_estimate && Number.isNaN(Number(record.new_price_estimate))) errors.push('new_price_estimate must be numeric');
  if (record.quantity && Number.isNaN(Number(record.quantity))) errors.push('quantity must be numeric');

  return { errors, category, seller, condition, price };
}

async function preview(user, file) {
  if (!file) throw new AppError(400, 'validation_error', 'An .xlsx file is required.');

  const rawRows = await parseWorkbook(file.buffer);
  if (!rawRows.length) throw new AppError(400, 'invalid_file', 'No data rows found in the uploaded file.');

  const validatedRows = [];
  for (const row of rawRows) {
    const { errors } = await validateRow(row.data);
    validatedRows.push({ row_num: row.row_num, data: row.data, errors });
  }

  const errorCount = validatedRows.filter(r => r.errors.length).length;

  const job = await ImportJob.create({
    uploadedBy: user.id,
    filename: file.originalname,
    status: 'previewed',
    rowCount: validatedRows.length,
    errorCount,
    previewData: validatedRows,
  });

  return {
    job_id: job.id,
    filename: job.filename,
    row_count: job.rowCount,
    error_count: job.errorCount,
    valid_count: job.rowCount - job.errorCount,
    rows: validatedRows,
  };
}

async function commit(user, jobId) {
  const job = await ImportJob.findByPk(jobId);
  if (!job) throw new AppError(404, 'not_found', 'Import job not found.');
  if (job.status === 'committed') throw new AppError(409, 'already_committed', 'This import job was already committed.');

  const previewRows = job.previewData;

  return sequelize.transaction(async (t) => {
    const created = [];
    const skipped = [];

    for (const row of previewRows) {
      const { errors, category, seller, condition, price } = await validateRow(row.data);
      if (errors.length) { skipped.push({ row_num: row.row_num, errors }); continue; }

      const slug = await uniqueSlug(row.data.title, t);
      const listing = await Listing.create({
        sellerId: seller.id,
        categoryId: category.id,
        title: String(row.data.title).trim(),
        slug,
        brand: row.data.brand || null,
        model: row.data.model || null,
        yearManufactured: row.data.year_manufactured ? Number(row.data.year_manufactured) : null,
        condition,
        description: row.data.description || null,
        priceAmount: price,
        currency: row.data.currency ? String(row.data.currency).toUpperCase() : 'USD',
        originCountry: row.data.origin_country || null,
        newPriceEstimate: row.data.new_price_estimate ? Number(row.data.new_price_estimate) : null,
        quantity: row.data.quantity ? Number(row.data.quantity) : 1,
        status: 'active',
      }, { transaction: t });

      created.push({ row_num: row.row_num, listing_id: listing.id });
    }

    job.status = 'committed';
    job.errorCount = skipped.length;
    job.committedAt = new Date();
    await job.save({ transaction: t });

    return { job_id: job.id, created_count: created.length, skipped_count: skipped.length, created, skipped };
  });
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

async function getJob(id) {
  const job = await ImportJob.findByPk(id);
  if (!job) throw new AppError(404, 'not_found', 'Import job not found.');
  return {
    job_id: job.id, filename: job.filename, status: job.status,
    row_count: job.rowCount, error_count: job.errorCount, rows: job.previewData,
    committed_at: job.committedAt,
  };
}

module.exports = { preview, commit, getJob, COLUMNS };
