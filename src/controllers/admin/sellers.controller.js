const asyncHandler = require('../../utils/asyncHandler');
const sellersService = require('../../services/admin/sellers.service');

const list = asyncHandler(async (req, res) => res.json(await sellersService.list(req.query)));
const getOne = asyncHandler(async (req, res) => res.json({ data: await sellersService.getById(req.params.id) }));

const approve = asyncHandler(async (req, res) => res.json({ data: await sellersService.decide(req.user, req.params.id, 'approve', req.body.notes) }));
const reject = asyncHandler(async (req, res) => res.json({ data: await sellersService.decide(req.user, req.params.id, 'reject', req.body.notes) }));
const suspend = asyncHandler(async (req, res) => res.json({ data: await sellersService.decide(req.user, req.params.id, 'suspend', req.body.notes) }));

module.exports = { list, getOne, approve, reject, suspend };
