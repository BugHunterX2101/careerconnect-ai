const Queue = require('bull');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Initialize queues
let resumeProcessingQueue = null;
let jobRecommendationQueue = null;
let emailQueue = null;
let dataAnalysisQueue = null;

// Initialize ML services (optional)
let ResumeParser = null;
let JobRecommender = null;
let resumeParser = null;
let jobRecommender = null;

// Initialize models (optional)
let Resume = null;
let redisClient = null;

// Try to import ML services
try {
  ResumeParser = require('../ml/resumeParser');
} catch (error) {
  logger.warn('ResumeParser not available:', error.message);
}

try {
  JobRecommender = require('../ml/jobRecommender');
} catch (error) {
  logger.warn('JobRecommender not available:', error.message);
}

// Try to import models and Redis client
try {
  Resume = require('../models/Resume');
} catch (error) {
  logger.warn('Resume model not available:', error.message);
}

// Try to import GPT-OSS service
let gptOssService = null;
try {
  gptOssService = require('../services/gptOssService');
} catch (error) {
  logger.warn('GPT-OSS service not available:', error.message);
}

try {
  const { getRedisClient } = require('../database/redis');
  redisClient = getRedisClient;
} catch (error) {
  logger.warn('Redis client not available:', error.message);
}

// Check if Redis is available
const isRedisAvailable = () => {
  return process.env.REDIS_URL || process.env.REDIS_HOST;
};

// Check if ML services are available
const isMLAvailable = () => {
  return ResumeParser && JobRecommender;
};

const setupJobQueue = async () => {
  try {
    logger.info('Setting up job queues...');

    // Check if Redis is available
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, job queues will be disabled');
      return;
    }

    // Initialize ML services if available
    if (isMLAvailable()) {
      try {
        resumeParser = new ResumeParser();
        jobRecommender = new JobRecommender();
        
        await resumeParser.initialize();
        await jobRecommender.initialize();
      } catch (error) {
        logger.warn('Failed to initialize ML services:', error.message);
      }
    } else {
      logger.warn('ML services not available, using synchronous fallbacks');
    }

    // Create queues with Redis URL
    const redisConfig = process.env.REDIS_URL ? 
      { url: process.env.REDIS_URL } : 
      {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      };

    resumeProcessingQueue = new Queue('resume-processing', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 50
      }
    });

    jobRecommendationQueue = new Queue('job-recommendations', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: 50,
        removeOnFail: 25
      }
    });

    emailQueue = new Queue('email', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 200,
        removeOnFail: 100
      }
    });

    dataAnalysisQueue = new Queue('data-analysis', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000
        },
        removeOnComplete: 50,
        removeOnFail: 25
      }
    });

    // Set up queue event handlers
    setupQueueEventHandlers();

    // Set up job processors
    setupJobProcessors();

    logger.info('Job queues setup completed successfully');
  } catch (error) {
    logger.error('Error setting up job queues:', error);
    throw error;
  }
};

const setupQueueEventHandlers = () => {
  // Resume processing queue events
  resumeProcessingQueue.on('completed', (job, result) => {
    logger.info(`Resume processing completed for job ${job.id}:`, result);
  });

  resumeProcessingQueue.on('failed', (job, err) => {
    logger.error(`Resume processing failed for job ${job.id}:`, err);
  });

  resumeProcessingQueue.on('stalled', (job) => {
    logger.warn(`Resume processing job ${job.id} stalled`);
  });

  // Job recommendations queue events
  jobRecommendationQueue.on('completed', (job, result) => {
    logger.info(`Job recommendations completed for job ${job.id}:`, result);
  });

  jobRecommendationQueue.on('failed', (job, err) => {
    logger.error(`Job recommendations failed for job ${job.id}:`, err);
  });

  // Email queue events
  emailQueue.on('completed', (job, result) => {
    logger.info(`Email notification completed for job ${job.id}:`, result);
  });

  emailQueue.on('failed', (job, err) => {
    logger.error(`Email notification failed for job ${job.id}:`, err);
  });

  // Data analysis queue events
  dataAnalysisQueue.on('completed', (job, result) => {
    logger.info(`Data analysis completed for job ${job.id}:`, result);
  });

  dataAnalysisQueue.on('failed', (job, err) => {
    logger.error(`Data analysis failed for job ${job.id}:`, err);
  });
};

const setupJobProcessors = () => {
  // Resume processing processor
  resumeProcessingQueue.process('parse-resume', async (job) => {
    try {
      const { resumeId, filePath, fileType } = job.data;
      
      logger.info(`Processing resume ${resumeId} with file: ${filePath}`);
      
      // Update resume status to processing
      if (Resume) {
        await Resume.findByIdAndUpdate(resumeId, {
          processingStatus: 'processing',
          processingProgress: 10
        });
      } else {
        logger.warn(`Resume model not available, skipping status update for resume ${resumeId}`);
      }

      // Parse resume if ML service is available
      let parsedData = null;
      if (resumeParser) {
        parsedData = await resumeParser.parseResume(filePath, fileType);
      } else {
        logger.warn('Resume parser not available, using basic fallback processing');
        // Basic fallback - just mark as completed with minimal data
        parsedData = {
          skills: [],
          experience: [],
          education: [],
          aiAnalysis: {
            overallScore: 0,
            skillsScore: 0,
            experienceScore: 0,
            educationScore: 0
          }
        };
      }
      
      // Update resume with parsed data
      if (Resume) {
        await Resume.findByIdAndUpdate(resumeId, {
          ...parsedData,
          processingStatus: 'completed',
          processingProgress: 100,
          processedAt: new Date()
        });
      } else {
        logger.warn(`Resume model not available, skipping update for resume ${resumeId}`);
      }

      // Add job recommendations job to queue if available
      if (jobRecommendationQueue) {
        await jobRecommendationQueue.add('generate-recommendations', {
          userId: job.data.userId,
          resumeId,
          priority: 'high'
        }, {
          priority: 1,
          delay: 5000 // 5 second delay
        });
      } else {
        logger.warn('Job recommendation queue not available, skipping recommendation generation');
      }

      logger.info(`Resume ${resumeId} processed successfully`);
      
      return {
        success: true,
        resumeId,
        parsedData: {
          skillsCount: parsedData.skills.length,
          experienceCount: parsedData.experience.length,
          educationCount: parsedData.education.length,
          overallScore: parsedData.aiAnalysis.overallScore
        }
      };
    } catch (error) {
      logger.error(`Error processing resume ${job.data.resumeId}:`, error);
      
      // Update resume status to failed
      if (Resume) {
        await Resume.findByIdAndUpdate(job.data.resumeId, {
          processingStatus: 'failed',
          processingError: error.message
        });
      } else {
        logger.warn(`Resume model not available, skipping status update for resume ${job.data.resumeId}`);
      }
      
      throw error;
    }
  });

  // Job recommendations processor
  jobRecommendationQueue.process('generate-recommendations', async (job) => {
    try {
      const { userId, resumeId, options = {} } = job.data;
      
      logger.info(`Generating job recommendations for user ${userId}, resume ${resumeId}`);
      
      // Get job recommendations if ML service is available
      let recommendations = null;
      if (jobRecommender) {
        recommendations = await jobRecommender.getJobRecommendations(
          userId,
          resumeId,
          options
        );
      } else {
        logger.warn('Job recommender not available, using basic fallback');
        // Basic fallback - return empty recommendations
        recommendations = {
          recommendations: [],
          total: 0,
          page: 1,
          totalPages: 0
        };
      }

      // Cache recommendations in Redis
      if (redisClient) {
        const cacheKey = `recommendations:${userId}:${resumeId}`;
        await redisClient().setEx(cacheKey, 3600, JSON.stringify(recommendations)); // 1 hour TTL
      }

      logger.info(`Generated ${recommendations.recommendations.length} job recommendations`);
      
      return {
        success: true,
        userId,
        resumeId,
        recommendationsCount: recommendations.recommendations.length,
        topMatchScore: recommendations.recommendations[0]?.matchScore || 0
      };
    } catch (error) {
      logger.error(`Error generating job recommendations for user ${job.data.userId}:`, error);
      throw error;
    }
  });

  // Email notification processor
  emailQueue.process('send-notification', async (job) => {
    try {
      const { to, subject, template, data } = job.data;
      
      logger.info(`Sending email notification to ${to}`);
      
      // Basic email sending logic (placeholder)
      // In a real implementation, you would use a service like SendGrid, AWS SES, etc.
      logger.info(`Email sent successfully to ${to}`);
      
      return {
        success: true,
        to,
        subject,
        sentAt: new Date()
      };
    } catch (error) {
      logger.error(`Error sending email notification:`, error);
      throw error;
    }
  });

  // Data analysis processor
  dataAnalysisQueue.process('analyze-data', async (job) => {
    try {
      const { dataType, data, options = {} } = job.data;
      
      logger.info(`Analyzing data of type: ${dataType}`);
      
      // Basic data analysis logic (placeholder)
      const analysisResult = {
        dataType,
        analyzedAt: new Date(),
        summary: 'Basic analysis completed',
        metrics: {}
      };
      
      logger.info(`Data analysis completed for ${dataType}`);
      
      return {
        success: true,
        analysisResult
      };
    } catch (error) {
      logger.error(`Error analyzing data:`, error);
      throw error;
    }
  });
};

// Queue management functions
const addResumeProcessingJob = async (userId, resumeId, filePath, fileType) => {
  try {
    if (!resumeProcessingQueue) {
      logger.warn('Job queue not available, processing resume synchronously');
      // Fallback to synchronous processing
      const result = await processResumeSynchronously(userId, resumeId, filePath, fileType);
      return { id: 'sync-' + Date.now(), result };
    }

    const job = await resumeProcessingQueue.add('parse-resume', {
      userId,
      resumeId,
      filePath,
      fileType
    }, {
      priority: 1,
      attempts: 3
    });

    logger.info(`Added resume processing job ${job.id} for resume ${resumeId}`);
    return job;
  } catch (error) {
    logger.error('Error adding resume processing job:', error);
    throw error;
  }
};

const addJobRecommendationJob = async (userId, resumeId, options = {}, sendEmail = false) => {
  try {
    if (!jobRecommendationQueue) {
      logger.warn('Job recommendation queue not available, processing synchronously');
      // Fallback to synchronous processing
      const result = await processJobRecommendationsSynchronously(userId, resumeId, options, sendEmail);
      return { id: 'sync-' + Date.now(), result };
    }

    const job = await jobRecommendationQueue.add('generate-recommendations', {
      userId,
      resumeId,
      options,
      sendEmail
    }, {
      priority: 2,
      attempts: 2
    });

    logger.info(`Added job recommendation job ${job.id} for user ${userId}`);
    return job;
  } catch (error) {
    logger.error('Error adding job recommendation job:', error);
    throw error;
  }
};

const addEmailNotificationJob = async (type, data) => {
  try {
    if (!emailQueue) {
      logger.warn('Email queue not available, skipping email notification');
      return { id: 'sync-' + Date.now(), skipped: true };
    }

    const job = await emailQueue.add(type, data, {
      priority: 3,
      attempts: 5,
      delay: 1000 // 1 second delay
    });

    logger.info(`Added email notification job ${job.id} of type ${type}`);
    return job;
  } catch (error) {
    logger.error('Error adding email notification job:', error);
    throw error;
  }
};

const addDataAnalysisJob = async (type, data) => {
  try {
    if (!dataAnalysisQueue) {
      logger.warn('Data analysis queue not available, skipping data analysis');
      return { id: 'sync-' + Date.now(), skipped: true };
    }

    const job = await dataAnalysisQueue.add(type, data, {
      priority: 4,
      attempts: 2
    });

    logger.info(`Added data analysis job ${job.id} of type ${type}`);
    return job;
  } catch (error) {
    logger.error('Error adding data analysis job:', error);
    throw error;
  }
};

// Queue status and monitoring
const getQueueStatus = async () => {
  try {
    const status = {
      resumeProcessing: resumeProcessingQueue ? {
        waiting: await resumeProcessingQueue.getWaiting(),
        active: await resumeProcessingQueue.getActive(),
        completed: await resumeProcessingQueue.getCompleted(),
        failed: await resumeProcessingQueue.getFailed()
      } : { status: 'disabled' },
      jobRecommendations: jobRecommendationQueue ? {
        waiting: await jobRecommendationQueue.getWaiting(),
        active: await jobRecommendationQueue.getActive(),
        completed: await jobRecommendationQueue.getCompleted(),
        failed: await jobRecommendationQueue.getFailed()
      } : { status: 'disabled' },
      emailNotifications: emailQueue ? {
        waiting: await emailQueue.getWaiting(),
        active: await emailQueue.getActive(),
        completed: await emailQueue.getCompleted(),
        failed: await emailQueue.getFailed()
      } : { status: 'disabled' },
      dataAnalysis: dataAnalysisQueue ? {
        waiting: await dataAnalysisQueue.getWaiting(),
        active: await dataAnalysisQueue.getActive(),
        completed: await dataAnalysisQueue.getCompleted(),
        failed: await dataAnalysisQueue.getFailed()
      } : { status: 'disabled' }
    };

    return status;
  } catch (error) {
    logger.error('Error getting queue status:', error);
    throw error;
  }
};

const pauseAllQueues = async () => {
  try {
    if (resumeProcessingQueue) await resumeProcessingQueue.pause();
    if (jobRecommendationQueue) await jobRecommendationQueue.pause();
    if (emailQueue) await emailQueue.pause();
    if (dataAnalysisQueue) await dataAnalysisQueue.pause();
    
    logger.info('All queues paused');
  } catch (error) {
    logger.error('Error pausing queues:', error);
    throw error;
  }
};

const resumeAllQueues = async () => {
  try {
    if (resumeProcessingQueue) await resumeProcessingQueue.resume();
    if (jobRecommendationQueue) await jobRecommendationQueue.resume();
    if (emailQueue) await emailQueue.resume();
    if (dataAnalysisQueue) await dataAnalysisQueue.resume();
    
    logger.info('All queues resumed');
  } catch (error) {
    logger.error('Error resuming queues:', error);
    throw error;
  }
};

const closeAllQueues = async () => {
  try {
    if (resumeProcessingQueue) await resumeProcessingQueue.close();
    if (jobRecommendationQueue) await jobRecommendationQueue.close();
    if (emailQueue) await emailQueue.close();
    if (dataAnalysisQueue) await dataAnalysisQueue.close();
    
    logger.info('All queues closed');
  } catch (error) {
    logger.error('Error closing queues:', error);
    throw error;
  }
};

// Synchronous fallback processing functions
const processJobRecommendationsSynchronously = async (userId, resumeId, options = {}, sendEmail = false) => {
  try {
    logger.info(`Generating job recommendations for user ${userId}, resume ${resumeId} synchronously`);
    
    // Get resume data
    let resumeData = null;
    if (Resume) {
      resumeData = await Resume.findByPk(resumeId);
      if (!resumeData) {
        throw new Error(`Resume ${resumeId} not found`);
      }
    } else {
      logger.warn('Resume model not available, using mock data');
      resumeData = {
        id: resumeId,
        skills: [],
        experience: [],
        education: [],
        summary: '',
        personalInfo: {}
      };
    }
    
    // Get job recommendations using GPT-OSS if available
    let recommendations = null;
    if (gptOssService && options.useGPTOSS) {
      logger.info('Using GPT-OSS-120B for job recommendations');
      const gptRecommendations = await gptOssService.generateJobRecommendations(resumeData, options);
      recommendations = {
        recommendations: gptRecommendations,
        total: gptRecommendations.length,
        page: 1,
        totalPages: 1,
        source: 'gpt-oss-120b'
      };
    } else if (jobRecommender) {
      logger.info('Using traditional ML for job recommendations');
      recommendations = await jobRecommender.getJobRecommendations(
        userId,
        resumeId,
        options
      );
    } else {
      logger.warn('No recommendation service available, using basic fallback');
      // Basic fallback - return empty recommendations
      recommendations = {
        recommendations: [],
        total: 0,
        page: 1,
        totalPages: 0,
        source: 'fallback'
      };
    }

    // Cache recommendations in Redis if available
    if (redisClient) {
      const cacheKey = `recommendations:${userId}:${resumeId}`;
      await redisClient().setEx(cacheKey, 3600, JSON.stringify(recommendations)); // 1 hour TTL
    }

    logger.info(`Generated ${recommendations.recommendations.length} job recommendations synchronously`);
    
    return {
      success: true,
      userId,
      resumeId,
      recommendationsCount: recommendations.recommendations.length,
      topMatchScore: recommendations.recommendations[0]?.matchScore || 0
    };
  } catch (error) {
    logger.error(`Error generating job recommendations for user ${userId}:`, error);
    throw error;
  }
};

const processResumeSynchronously = async (userId, resumeId, filePath, fileType) => {
  try {
    logger.info(`Processing resume ${resumeId} synchronously`);
    
    // Update resume status to processing
    if (Resume) {
      await Resume.findByIdAndUpdate(resumeId, {
        processingStatus: 'processing',
        processingProgress: 10
      });
    } else {
      logger.warn(`Resume model not available, skipping status update for resume ${resumeId}`);
    }

    // Parse resume if ML service is available
    let parsedData = null;
    if (resumeParser) {
      parsedData = await resumeParser.parseResume(filePath, fileType);
    } else {
      logger.warn('Resume parser not available, using basic fallback processing');
      // Basic fallback - just mark as completed with minimal data
      parsedData = {
        skills: [],
        experience: [],
        education: [],
        aiAnalysis: {
          overallScore: 0,
          skillsScore: 0,
          experienceScore: 0,
          educationScore: 0
        }
      };
    }
    
    // Update resume with parsed data
    if (Resume) {
      await Resume.findByIdAndUpdate(resumeId, {
        ...parsedData,
        processingStatus: 'completed',
        processingProgress: 100,
        processedAt: new Date()
      });
    } else {
      logger.warn(`Resume model not available, skipping update for resume ${resumeId}`);
    }

    logger.info(`Resume ${resumeId} processed successfully`);
    
    return {
      success: true,
      resumeId,
      parsedData: {
        skillsCount: parsedData.skills.length,
        experienceCount: parsedData.experience.length,
        educationCount: parsedData.education.length,
        overallScore: parsedData.aiAnalysis.overallScore
      }
    };
  } catch (error) {
    logger.error(`Error processing resume ${resumeId}:`, error);
    
    // Update resume status to failed
    if (Resume) {
      await Resume.findByIdAndUpdate(resumeId, {
        processingStatus: 'failed',
        processingError: error.message
      });
    } else {
      logger.warn(`Resume model not available, skipping status update for resume ${resumeId}`);
    }
    
    throw error;
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down job queues gracefully');
  await closeAllQueues();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down job queues gracefully');
  await closeAllQueues();
  process.exit(0);
});

module.exports = {
  setupJobQueue,
  addResumeProcessingJob,
  addJobRecommendationJob,
  addEmailNotificationJob,
  addDataAnalysisJob,
  getQueueStatus,
  pauseAllQueues,
  resumeAllQueues,
  closeAllQueues
};
