const { DataTypes } = require('sequelize');

let Interview = null;

const initializeInterviewModel = () => {
  if (Interview) return Interview;
  let sequelize;
  try {
    const { getSequelize } = require('../database/sequelize');
    sequelize = getSequelize();
  } catch (error) {
    console.warn('Sequelize not available, Interview model cannot be initialized');
    return null;
  }

  Interview = sequelize.define('Interview', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    candidateId: { type: DataTypes.INTEGER, allowNull: false },
    interviewerId: { type: DataTypes.INTEGER, allowNull: false },
    scheduledAt: { type: DataTypes.DATE, allowNull: false },
    duration: {
      type: DataTypes.INTEGER, allowNull: false,
      validate: { min: 15, max: 180 }
    },
    type: {
      type: DataTypes.STRING(10), allowNull: false,
      validate: { isIn: [['phone', 'video', 'onsite']] }
    },
    status: {
      type: DataTypes.STRING(20), defaultValue: 'scheduled',
      validate: { isIn: [['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']] }
    },
    meetLink: { type: DataTypes.STRING(500), allowNull: true },
    meetEventId: { type: DataTypes.STRING(255), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    rating: {
      type: DataTypes.INTEGER, allowNull: true,
      validate: { min: 1, max: 5 }
    },
    interviewerNotes: { type: DataTypes.TEXT, allowNull: true },
    startedAt: { type: DataTypes.DATE, allowNull: true },
    endedAt: { type: DataTypes.DATE, allowNull: true },
    rescheduledFromId: { type: DataTypes.INTEGER, allowNull: true }
  }, { tableName: 'interviews', timestamps: true });

  return Interview;
};

const getInterviewModel = () => {
  if (!Interview) initializeInterviewModel();
  if (!Interview) throw new Error('Interview model not initialized.');
  return Interview;
};

module.exports = { Interview: getInterviewModel, initializeInterviewModel };
