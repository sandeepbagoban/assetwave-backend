const { sequelize, ImportJob, Seller, Listing } = require('../../models');
const AppError = require('../../utils/AppError');
const { COMMON_COLUMNS, parseWorkbook, validateCommonFields, uniqueSlug } = require('../shared/listingImportCore');

const COLUMNS = [...COMMON_COLUMNS, 'seller_email'];

async function validateRow(record) {
  const { errors, category, condition, price } = await validateCommonFields(record);

  let seller = null;
  if (!record.seller_email) errors.push('seller_email is required');
  else {
    seller = await Seller.findOne({ include: [{ association: 'user', where: { email: String(record.seller_email).trim() } }] });
    if (!seller) errors.push(`seller_email '${record.seller_email}' has no matching seller account`);
    else if (seller.kybStatus !== 'approved') errors.push(`seller '${record.seller_email}' is not an approved seller`);
  }

  return { errors, category, seller, condition, price };
}

async function preview(user, file) {
  if (!file) throw new AppError(400, 'validation_error', 'An .xlsx file is required.');

  const rawRows = await parseWorkbook(file.buffer, COLUMNS);
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
        weightKg: row.data.weight_kg ? Number(row.data.weight_kg) : null,
        lengthCm: row.data.length_cm ? Number(row.data.length_cm) : null,
        widthCm: row.data.width_cm ? Number(row.data.width_cm) : null,
        heightCm: row.data.height_cm ? Number(row.data.height_cm) : null,
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
