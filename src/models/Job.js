const { DataTypes } = require('sequelize');

let Job = null;

const initializeJobModel = () => {
  if (Job) return Job;
  let sequelize;
  try {
    const { getSequelize } = require('../database/sequelize');
    sequelize = getSequelize();
  } catch (error) {
    console.warn('Sequelize not available, Job model cannot be initialized');
    return null;
  }

  Job = sequelize.define('Job', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employerId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    companyName: { type: DataTypes.STRING(200), allowNull: false },
    companyLogo: { type: DataTypes.STRING(500), allowNull: true },
    companyWebsite: { type: DataTypes.STRING(500), allowNull: true },
    companySize: { type: DataTypes.STRING(20), allowNull: true },
    companyIndustry: { type: DataTypes.STRING(100), allowNull: true },
    locationCity: { type: DataTypes.STRING(100), allowNull: true },
    locationState: { type: DataTypes.STRING(100), allowNull: true },
    locationCountry: { type: DataTypes.STRING(100), allowNull: true },
    isRemote: { type: DataTypes.BOOLEAN, defaultValue: false },
    remoteType: { type: DataTypes.STRING(20), defaultValue: 'on-site' },
    description: { type: DataTypes.TEXT, allowNull: false },
    skills: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('skills'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('skills', JSON.stringify(v)); }
    },
    experienceMin: { type: DataTypes.INTEGER, defaultValue: 0 },
    experienceMax: { type: DataTypes.INTEGER, allowNull: true },
    educationLevel: { type: DataTypes.STRING(20), allowNull: true },
    certifications: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('certifications'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('certifications', JSON.stringify(v)); }
    },
    salaryMin: { type: DataTypes.INTEGER, allowNull: true },
    salaryMax: { type: DataTypes.INTEGER, allowNull: true },
    salaryCurrency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
    salaryPeriod: { type: DataTypes.STRING(10), defaultValue: 'yearly' },
    salaryNegotiable: { type: DataTypes.BOOLEAN, defaultValue: true },
    perks: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('perks'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('perks', JSON.stringify(v)); }
    },
    type: { type: DataTypes.STRING(20), defaultValue: 'full-time' },
    status: { type: DataTypes.STRING(20), defaultValue: 'active' },
    applicationDeadline: { type: DataTypes.DATE, allowNull: true },
    viewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    applicationCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    tags: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('tags'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('tags', JSON.stringify(v)); }
    },
    source: { type: DataTypes.STRING(50), defaultValue: 'internal' },
    externalId: { type: DataTypes.STRING(255), allowNull: true },
    applications: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('applications'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('applications', JSON.stringify(v)); }
    },
    requirements: {
      type: DataTypes.TEXT, allowNull: true,
      get() { const v = this.getDataValue('requirements'); return v ? JSON.parse(v) : []; },
      set(v) { this.setDataValue('requirements', JSON.stringify(v)); }
    }
  }, { tableName: 'jobs', timestamps: true });

  return Job;
};

const getJobModel = () => {
  if (!Job) initializeJobModel();
  if (!Job) throw new Error('Job model not initialized. Database not available.');
  return Job;
};

module.exports = { Job: getJobModel, initializeJobModel };
