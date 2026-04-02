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
    const resumeDir = path.join(process.cwd(), 'uploads', 'resumes');
    const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');

    // Resume cleanup
    try {
      const { Resume: getResumeModel } = require('../models/Resume');
      const Resume = getResumeModel();
      const resumeFiles = await fs.readdir(resumeDir);

      let validResumeFiles = new Set();
      if (typeof Resume.findAll === 'function') {
        const dbResumes = await Resume.findAll({ attributes: ['file_path'] });
        validResumeFiles = new Set(dbResumes.map(r => path.basename(r.file_path || r.filePath || '')));
      } else if (typeof Resume.find === 'function') {
        const dbResumes = await Resume.find({}, 'filePath').lean();
        validResumeFiles = new Set(dbResumes.map(r => path.basename(r.filePath || '')));
      }

      for (const file of resumeFiles) {
        if (file === '.gitkeep') continue;
        if (!validResumeFiles.has(file)) {
          await fs.unlink(path.join(resumeDir, file));
          console.log(`Deleted orphaned resume: ${file}`);
        }
      }
    } catch (resumeError) {
      console.error('Resume cleanup error:', resumeError.message);
    }

    // Avatar cleanup
    try {
      const { User: getUserModel } = require('../models/User');
      const User = getUserModel();
      const avatarFiles = await fs.readdir(avatarDir);

      let validAvatarFiles = new Set();
      if (typeof User.findAll === 'function') {
        const dbUsers = await User.findAll({ attributes: ['profilePicture'] });
        validAvatarFiles = new Set(
          dbUsers.filter(u => u.profilePicture).map(u => path.basename(u.profilePicture))
        );
      } else if (typeof User.find === 'function') {
        const dbUsers = await User.find({ avatar: { $exists: true } }, 'avatar').lean();
        validAvatarFiles = new Set(dbUsers.filter(u => u.avatar).map(u => path.basename(u.avatar)));
      }

      for (const file of avatarFiles) {
        if (file === '.gitkeep') continue;
        if (!validAvatarFiles.has(file)) {
          await fs.unlink(path.join(avatarDir, file));
          console.log(`Deleted orphaned avatar: ${file}`);
        }
      }
    } catch (avatarError) {
      console.error('Avatar cleanup error:', avatarError.message);
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
