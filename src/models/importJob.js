const { jsonColumnOptions } = require('../utils/jsonColumn');

module.exports = (sequelize, DataTypes) => {
  const ImportJob = sequelize.define('ImportJob', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sellerId: { type: DataTypes.UUID },
    uploadedBy: { type: DataTypes.UUID, allowNull: false },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    status: { type: DataTypes.ENUM('previewed', 'committed', 'failed'), allowNull: false, defaultValue: 'previewed' },
    rowCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    errorCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    previewData: jsonColumnOptions(DataTypes, 'previewData'),
    committedAt: { type: DataTypes.DATE },
  }, {
    tableName: 'import_jobs',
    updatedAt: false,
  });

  ImportJob.associate = (models) => {
    ImportJob.belongsTo(models.Seller, { foreignKey: 'sellerId', as: 'seller' });
    ImportJob.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
  };

  return ImportJob;
};
