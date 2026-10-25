const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/listing.service');
const { Listing, ImportJob, Seller, Category, ListingImage } = require('../models');
const ExcelJS = require('exceljs');
router.get('/export', asyncHandler(async (req, res) => {
  const listings = await Listing.findAll({ include: [{ model: Seller, as: 'seller' }, { model: Category, as: 'category' }, { model: ListingImage, as: 'images' }], order: [['createdAt', 'DESC']] });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Inventory');
  const keys = ['id','title','status','category','brand','model','condition','price_amount','currency','origin_country','equipment_location','quantity','seller_id'];
  sheet.columns = keys.map(key => ({ header: key, key, width: key === 'title' ? 45 : 22 }));
  listings.forEach(listing => sheet.addRow(service.toPublic(listing)));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="AWXchange_Inventory.xlsx"');
  res.send(Buffer.from(await workbook.xlsx.writeBuffer()));
}));
router.get('/imports', asyncHandler(async (req, res) => {
  const { parsePagination, paginatedResponse } = require('../utils/pagination');
  const { page, limit, offset } = parsePagination(req.query);
  const { rows, count } = await ImportJob.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']], attributes: ['id','filename','status','rowCount','errorCount','sellerId','createdAt','committedAt'] });
  res.json(paginatedResponse(rows, count, { page, limit }));
}));
router.get('/', asyncHandler(async (req, res) => res.json(await service.list(req.query, { viewer: req.user }))));
router.get('/:id', asyncHandler(async (req, res) => res.json({ data: await service.getById(req.params.id, { viewer: req.user }) })));
router.patch('/:id', asyncHandler(async (req, res) => res.json({ data: await service.update(req.user, req.params.id, req.body) })));
module.exports = router;
