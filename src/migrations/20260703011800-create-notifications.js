module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      type: { type: Sequelize.STRING(50), allowNull: false },
      title: { type: Sequelize.STRING(150), allowNull: false },
      message: { type: Sequelize.TEXT },
      link: { type: Sequelize.STRING(255) },
      read_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'read_at']);
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('notifications');
  },
};
