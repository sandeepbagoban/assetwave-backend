module.exports = (sequelize, DataTypes) => {
  const LogisticsProvider = sequelize.define('LogisticsProvider', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    contactEmail: { type: DataTypes.STRING(255) },
    contactPhone: { type: DataTypes.STRING(50) },
    regionsServed: { type: DataTypes.STRING(255) },
    notes: { type: DataTypes.TEXT },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  }, {
    tableName: 'logistics_providers',
  });

  LogisticsProvider.associate = (models) => {
    LogisticsProvider.hasMany(models.Order, { foreignKey: 'logisticsProviderId', as: 'orders' });
    LogisticsProvider.hasMany(models.LogisticsProviderRate, { foreignKey: 'logisticsProviderId', as: 'rates' });
  };

  return LogisticsProvider;
};
