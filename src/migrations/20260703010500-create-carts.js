module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('carts', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      buyer_id: {
        type: Sequelize.UUID, allowNull: false, unique: true,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('carts');
  },
};
