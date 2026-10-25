module.exports = {
  async up(q, S) {
    // MySQL DDL is not transactional. Permit a safe retry after a partial run.
    const listings = await q.describeTable('listings');
    const users = await q.describeTable('users');
    if (!listings.price_amount.allowNull) {
      await q.changeColumn('listings', 'price_amount', { type: S.DECIMAL(12, 2), allowNull: true });
    }
    if (!listings.equipment_location) await q.addColumn('listings', 'equipment_location', { type: S.STRING(2), allowNull: true });
    if (!users.pilot_buyer) await q.addColumn('users', 'pilot_buyer', { type: S.BOOLEAN, allowNull: false, defaultValue: false });
    if (!users.terms_accepted_at) await q.addColumn('users', 'terms_accepted_at', { type: S.DATE, allowNull: true });
    if (!users.legal_version) await q.addColumn('users', 'legal_version', { type: S.STRING(30), allowNull: true });
  },
  async down(q, S) {
    // Do not silently replace price-on-request data with an invented price.
    const [rows] = await q.sequelize.query('SELECT COUNT(*) AS total FROM listings WHERE price_amount IS NULL');
    if (Number(rows[0].total)) throw new Error('Set explicit listing prices before reverting this migration.');
    await q.changeColumn('listings', 'price_amount', { type: S.DECIMAL(12, 2), allowNull: false });
    await q.removeColumn('listings', 'equipment_location');
    await q.removeColumn('users', 'pilot_buyer');
    await q.removeColumn('users', 'terms_accepted_at');
    await q.removeColumn('users', 'legal_version');
  },
};
