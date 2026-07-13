module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: false },
    message: { type: DataTypes.TEXT },
    link: { type: DataTypes.STRING(255) },
    readAt: { type: DataTypes.DATE },
  }, {
    tableName: 'notifications',
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notification;
};
