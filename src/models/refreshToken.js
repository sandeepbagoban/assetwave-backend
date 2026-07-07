module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define('RefreshToken', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    tokenHash: { type: DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE },
  }, {
    tableName: 'refresh_tokens',
    updatedAt: false,
    indexes: [{ fields: ['user_id'] }],
  });

  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return RefreshToken;
};
