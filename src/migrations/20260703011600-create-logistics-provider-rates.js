module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('logistics_provider_rates', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      logistics_provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'logistics_providers', key: 'id' },
        onDelete: 'CASCADE',
      },
      country_code: { type: Sequelize.CHAR(2) },
      price_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      currency: { type: Sequelize.STRING(3), allowNull: false, defaultValue: 'USD' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('logistics_provider_rates', ['logistics_provider_id', 'country_code'], {
      unique: true,
      name: 'logistics_provider_rates_provider_country_unique',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('logistics_provider_rates');
  },
};
