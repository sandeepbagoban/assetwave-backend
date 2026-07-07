module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      buyer_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' } },
      status: {
        type: Sequelize.ENUM('pending_payment', 'paid', 'shipped', 'delivered', 'released', 'refunded', 'disputed', 'cancelled'),
        allowNull: false, defaultValue: 'pending_payment',
      },
      subtotal_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      shipping_address: { type: Sequelize.JSON, allowNull: false },
      payment_method: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'simulated' },
      escrow_held_at: { type: Sequelize.DATE },
      escrow_released_at: { type: Sequelize.DATE },
      escrow_refunded_at: { type: Sequelize.DATE },
      dispute_reason: { type: Sequelize.TEXT },
      dispute_resolved_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      placed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('orders', ['buyer_id']);
    await queryInterface.addIndex('orders', ['status']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('orders');
  },
};
