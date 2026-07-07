module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cart_items', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      cart_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'carts', key: 'id' }, onDelete: 'CASCADE' },
      listing_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'listings', key: 'id' }, onDelete: 'CASCADE' },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('cart_items', ['cart_id', 'listing_id'], { unique: true, name: 'uq_cart_listing' });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('cart_items');
  },
};
