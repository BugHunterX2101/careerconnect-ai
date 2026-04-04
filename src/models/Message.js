const { DataTypes } = require('sequelize');

let Message = null;

const initializeMessageModel = () => {
  if (Message) return Message;
  let sequelize;
  try {
    const { getSequelize } = require('../database/sequelize');
    sequelize = getSequelize();
  } catch (error) {
    console.warn('Sequelize not available, Message model cannot be initialized');
    return null;
  }

  Message = sequelize.define('Message', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    conversationId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    content: {
      type: DataTypes.TEXT, allowNull: false,
      validate: { len: [1, 2000] }
    },
    type: {
      type: DataTypes.STRING(10), defaultValue: 'text',
      validate: { isIn: [['text', 'file', 'image', 'system']] }
    },
    // JSON-serialised attachment metadata (no binary – stored as file path)
    attachment: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('attachment'); return v ? JSON.parse(v) : null; },
      set(v) { this.setDataValue('attachment', v ? JSON.stringify(v) : null); }
    },
    replyToId: { type: DataTypes.INTEGER, allowNull: true },
    edited: { type: DataTypes.BOOLEAN, defaultValue: false },
    editedAt: { type: DataTypes.DATE, allowNull: true },
    // JSON array of { userId, readAt }
    readBy: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('readBy'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('readBy', JSON.stringify(v)); }
    },
    metadata: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('metadata'); return v ? JSON.parse(v) : {}; },
      set(v) { this.setDataValue('metadata', JSON.stringify(v)); }
    }
  }, { tableName: 'messages', timestamps: true });

  Message.prototype.markAsRead = function (userId) {
    const list = this.readBy;
    const alreadyRead = list.some(r => String(r.userId) === String(userId));
    if (!alreadyRead) {
      this.readBy = [...list, { userId, readAt: new Date().toISOString() }];
      return this.save();
    }
    return Promise.resolve(this);
  };

  return Message;
};

const getMessageModel = () => {
  if (!Message) initializeMessageModel();
  if (!Message) throw new Error('Message model not initialized.');
  return Message;
};

module.exports = { Message: getMessageModel, initializeMessageModel };
