function parsePagination(query, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResponse(rows, count, { page, limit }) {
  return { data: rows, meta: { total: count, page, limit } };
}

module.exports = { parsePagination, paginatedResponse };
