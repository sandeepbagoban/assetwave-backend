module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('listings', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      seller_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'sellers', key: 'id' }, onDelete: 'CASCADE' },
      category_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'categories', key: 'id' } },
      title: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(280), allowNull: false, unique: true },
      brand: { type: Sequelize.STRING(120) },
      model: { type: Sequelize.STRING(120) },
      year_manufactured: { type: Sequelize.SMALLINT },
      condition: { type: Sequelize.ENUM('excellent', 'good', 'fair'), allowNull: false },
      description: { type: Sequelize.TEXT },
      price_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      origin_country: { type: Sequelize.STRING(2) },
      new_price_estimate: { type: Sequelize.DECIMAL(12, 2) },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      status: { type: Sequelize.ENUM('draft', 'active', 'sold', 'archived'), allowNull: false, defaultValue: 'draft' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('listings', ['category_id']);
    await queryInterface.addIndex('listings', ['seller_id']);
    await queryInterface.addIndex('listings', ['status']);
    await queryInterface.sequelize.query(
      'ALTER TABLE listings ADD FULLTEXT ft_listings_search (title, brand, model, description)'
    );
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('listings');
  },
};
