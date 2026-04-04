const { DataTypes } = require('sequelize');

let Conversation = null;

const initializeConversationModel = () => {
  if (Conversation) return Conversation;
  let sequelize;
  try {
    const { getSequelize } = require('../database/sequelize');
    sequelize = getSequelize();
  } catch (error) {
    console.warn('Sequelize not available, Conversation model cannot be initialized');
    return null;
  }

  Conversation = sequelize.define('Conversation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    type: {
      type: DataTypes.STRING(10), defaultValue: 'direct',
      validate: { isIn: [['direct', 'group']] }
    },
    // Stored as JSON array of user IDs
    participants: {
      type: DataTypes.TEXT, allowNull: false,
      get() { const v = this.getDataValue('participants'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('participants', JSON.stringify(v)); }
    },
    createdById: { type: DataTypes.INTEGER, allowNull: false },
    lastMessageId: { type: DataTypes.INTEGER, allowNull: true },
    // JSON array of user IDs that haven't read the latest message
    unreadBy: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('unreadBy'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('unreadBy', JSON.stringify(v)); }
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    metadata: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('metadata'); return v ? JSON.parse(v) : {}; },
      set(v) { this.setDataValue('metadata', JSON.stringify(v)); }
    }
  }, { tableName: 'conversations', timestamps: true });

  Conversation.prototype.hasParticipant = function (userId) {
    return this.participants.map(String).includes(String(userId));
  };

  Conversation.prototype.markAsUnread = function (userId) {
    const list = this.unreadBy;
    if (!list.map(String).includes(String(userId))) {
      this.unreadBy = [...list, userId];
    }
    return this.save();
  };

  Conversation.prototype.markAsRead = function (userId) {
    this.unreadBy = this.unreadBy.filter(id => String(id) !== String(userId));
    return this.save();
  };

  return Conversation;
};

const getConversationModel = () => {
  if (!Conversation) initializeConversationModel();
  if (!Conversation) throw new Error('Conversation model not initialized.');
  return Conversation;
};

module.exports = { Conversation: getConversationModel, initializeConversationModel };
