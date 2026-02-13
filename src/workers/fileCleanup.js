const path = require('path');
const fs = require('fs').promises;

const cleanTempUploads = async () => {
  console.log('Starting temp file cleanup...');
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);

  try {
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      if (file === '.gitkeep') continue;
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);
      if (stats.mtimeMs < cutoffTime) {
        await fs.unlink(filePath);
        console.log(`Deleted temp file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Temp cleanup error:', error);
  }
};

const cleanOrphanedFiles = async () => {
  console.log('Starting orphaned file cleanup...');
  
  try {
    const Resume = require('../models/Resume');
    const User = require('../models/User');
    
    const resumeDir = path.join(process.cwd(), 'uploads', 'resumes');
    const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');

    const resumeFiles = await fs.readdir(resumeDir);
    const dbResumes = await Resume.find({}, 'filePath').lean();
    const validResumeFiles = new Set(dbResumes.map(r => path.basename(r.filePath)));

    for (const file of resumeFiles) {
      if (file === '.gitkeep') continue;
      if (!validResumeFiles.has(file)) {
        await fs.unlink(path.join(resumeDir, file));
        console.log(`Deleted orphaned resume: ${file}`);
      }
    }

    const avatarFiles = await fs.readdir(avatarDir);
    const dbUsers = await User.find({ avatar: { $exists: true } }, 'avatar').lean();
    const validAvatarFiles = new Set(dbUsers.filter(u => u.avatar).map(u => path.basename(u.avatar)));

    for (const file of avatarFiles) {
      if (file === '.gitkeep') continue;
      if (!validAvatarFiles.has(file)) {
        await fs.unlink(path.join(avatarDir, file));
        console.log(`Deleted orphaned avatar: ${file}`);
      }
    }
  } catch (error) {
    console.error('Orphaned file cleanup error:', error);
  }
};

const initFileCleanup = () => {
  setInterval(cleanTempUploads, 6 * 60 * 60 * 1000);
  setInterval(cleanOrphanedFiles, 24 * 60 * 60 * 1000);
  console.log('File cleanup jobs scheduled');
};

module.exports = { initFileCleanup, cleanTempUploads, cleanOrphanedFiles };
