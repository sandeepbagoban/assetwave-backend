const asyncHandler = require('../../utils/asyncHandler');
const usersService = require('../../services/admin/users.service');

const list = asyncHandler(async (req, res) => res.json(await usersService.listUsers(req.query)));
const listBuyers = asyncHandler(async (req, res) => res.json(await usersService.listBuyers(req.query)));
const getOne = asyncHandler(async (req, res) => res.json({ data: await usersService.getUser(req.params.id) }));
const setStatus = asyncHandler(async (req, res) => res.json({ data: await usersService.setUserStatus(req.params.id, req.body.status) }));

module.exports = { list, listBuyers, getOne, setStatus };
