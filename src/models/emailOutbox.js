module.exports = (sequelize, DataTypes) => sequelize.define('EmailOutbox', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  recipient: { type: DataTypes.STRING(255), allowNull: false },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  nextAttemptAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  sentAt: { type: DataTypes.DATE },
}, { tableName: 'email_outbox', indexes: [{ fields: ['status', 'next_attempt_at'] }] });
