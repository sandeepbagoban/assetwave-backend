module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    fullName: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(50) },
    role: { type: DataTypes.ENUM('buyer', 'seller', 'admin'), allowNull: false, defaultValue: 'buyer' },
    status: { type: DataTypes.ENUM('active', 'suspended'), allowNull: false, defaultValue: 'active' },
  }, {
    tableName: 'users',
  });

  User.associate = (models) => {
    User.hasOne(models.Seller, { foreignKey: 'userId', as: 'sellerProfile' });
    User.hasOne(models.Cart, { foreignKey: 'buyerId', as: 'cart' });
    User.hasMany(models.Order, { foreignKey: 'buyerId', as: 'orders' });
    User.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
  };

  return User;
};
