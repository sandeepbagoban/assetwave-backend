module.exports = (sequelize, DataTypes) => {
  const Seller = sequelize.define('Seller', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, unique: true },
    orgName: { type: DataTypes.STRING(255), allowNull: false },
    nickname: { type: DataTypes.STRING(100) },
    accountType: { type: DataTypes.ENUM('organization', 'individual'), allowNull: false, defaultValue: 'organization' },
    country: { type: DataTypes.STRING(2), allowNull: false },
    registrationNo: { type: DataTypes.STRING(100) },
    kybStatus: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'), allowNull: false, defaultValue: 'pending' },
    kybNotes: { type: DataTypes.TEXT },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reviewedBy: { type: DataTypes.UUID },
    reviewedAt: { type: DataTypes.DATE },
  }, {
    tableName: 'sellers',
  });

  Seller.associate = (models) => {
    Seller.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Seller.belongsTo(models.User, { foreignKey: 'reviewedBy', as: 'reviewer' });
    Seller.hasMany(models.Listing, { foreignKey: 'sellerId', as: 'listings' });
    Seller.hasMany(models.OrderItem, { foreignKey: 'sellerId', as: 'orderItems' });
    Seller.hasMany(models.ImportJob, { foreignKey: 'sellerId', as: 'importJobs' });
  };

  return Seller;
};
