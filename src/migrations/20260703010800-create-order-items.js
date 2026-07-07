module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      listing_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'listings', key: 'id' } },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'sellers', key: 'id' } },
      title_snapshot: { type: Sequelize.STRING(255), allowNull: false },
      price_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['seller_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('order_items');
  },
};
