// A NULL country_code is the provider's fallback/default rate, used when no
// exact-match row exists for the buyer's shipping country.
module.exports = (sequelize, DataTypes) => {
  const LogisticsProviderRate = sequelize.define('LogisticsProviderRate', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    logisticsProviderId: { type: DataTypes.UUID, allowNull: false },
    countryCode: { type: DataTypes.CHAR(2) },
    priceAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
  }, {
    tableName: 'logistics_provider_rates',
  });

  LogisticsProviderRate.associate = (models) => {
    LogisticsProviderRate.belongsTo(models.LogisticsProvider, { foreignKey: 'logisticsProviderId', as: 'provider' });
  };

  return LogisticsProviderRate;
};
