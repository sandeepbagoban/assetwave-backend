module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'shipped_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('orders', 'delivered_at', { type: Sequelize.DATE });
    await queryInterface.addColumn('orders', 'logistics_provider_id', {
      type: Sequelize.UUID,
      references: { model: 'logistics_providers', key: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('orders', 'tracking_number', { type: Sequelize.STRING(100) });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'shipped_at');
    await queryInterface.removeColumn('orders', 'delivered_at');
    await queryInterface.removeColumn('orders', 'logistics_provider_id');
    await queryInterface.removeColumn('orders', 'tracking_number');
  },
};
