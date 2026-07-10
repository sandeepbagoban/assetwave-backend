module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('listings', 'weight_kg', { type: Sequelize.DECIMAL(10, 2) });
    await queryInterface.addColumn('listings', 'length_cm', { type: Sequelize.DECIMAL(8, 2) });
    await queryInterface.addColumn('listings', 'width_cm', { type: Sequelize.DECIMAL(8, 2) });
    await queryInterface.addColumn('listings', 'height_cm', { type: Sequelize.DECIMAL(8, 2) });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('listings', 'weight_kg');
    await queryInterface.removeColumn('listings', 'length_cm');
    await queryInterface.removeColumn('listings', 'width_cm');
    await queryInterface.removeColumn('listings', 'height_cm');
  },
};
