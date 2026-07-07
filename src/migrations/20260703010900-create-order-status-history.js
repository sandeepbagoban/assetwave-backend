module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('order_status_history', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      order_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE' },
      from_status: { type: Sequelize.STRING(30) },
      to_status: { type: Sequelize.STRING(30), allowNull: false },
      changed_by: { type: Sequelize.UUID, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      note: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('order_status_history', ['order_id']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('order_status_history');
  },
};
