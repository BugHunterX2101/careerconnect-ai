const Queue = require('bull');
const winston = require('winston');
const ResumeParser = require('../ml/resumeParser');
const JobRecommender = require('../ml/jobRecommender');
const Resume = require('../models/Resume');
const { getRedisClient } = require('../database/redis');

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

// Initialize ML services
let resumeParser = null;
let jobRecommender = null;

// Check if Redis is available
const isRedisAvailable = () => {
  return process.env.REDIS_URL || process.env.REDIS_HOST;
};

const setupJobQueue = async () => {
  try {
    logger.info('Setting up job queues...');

    // Check if Redis is available
    if (!isRedisAvailable()) {
      logger.warn('Redis not available, job queues will be disabled');
      return;
    }

    // Initialize ML services
    resumeParser = new ResumeParser();
    jobRecommender = new JobRecommender();
    
    await resumeParser.initialize();
    await jobRecommender.initialize();

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
        removeOnComplete: 200,
        removeOnFail: 100
      }
    });

    emailQueue = new Queue('email-notifications', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: 50,
        removeOnFail: 25
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

    // Setup queue event handlers
    setupQueueEventHandlers();

    // Setup job processors
    setupJobProcessors();

    logger.info('Job queues setup completed successfully');
  } catch (error) {
    logger.error('Failed to setup job queues:', error);
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
      await Resume.findByIdAndUpdate(resumeId, {
        processingStatus: 'processing',
        processingProgress: 10
      });

      // Parse resume
      const parsedData = await resumeParser.parseResume(filePath, fileType);
      
      // Update resume with parsed data
      await Resume.findByIdAndUpdate(resumeId, {
        ...parsedData,
        processingStatus: 'completed',
        processingProgress: 100,
        processedAt: new Date()
      });

      // Add job recommendations job to queue
      await jobRecommendationQueue.add('generate-recommendations', {
        userId: job.data.userId,
        resumeId,
        priority: 'high'
      }, {
        priority: 1,
        delay: 5000 // 5 second delay
      });

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
      await Resume.findByIdAndUpdate(job.data.resumeId, {
        processingStatus: 'failed',
        processingError: error.message
      });
      
      throw error;
    }
  });

  // Job recommendations processor
  jobRecommendationQueue.process('generate-recommendations', async (job) => {
    try {
      const { userId, resumeId, options = {} } = job.data;
      
      logger.info(`Generating job recommendations for user ${userId}, resume ${resumeId}`);
      
      // Get job recommendations
      const recommendations = await jobRecommender.getJobRecommendations(
        userId,
        resumeId,
        options
      );

      // Cache recommendations in Redis
      const redisClient = getRedisClient();
      const cacheKey = `recommendations:${userId}:${resumeId}`;
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(recommendations)); // 1 hour TTL

      // Send email notification if requested
      if (job.data.sendEmail) {
        await emailQueue.add('job-recommendations-ready', {
          userId,
          resumeId,
          recommendationsCount: recommendations.recommendations.length
        });
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

  // Email notifications processor
  emailQueue.process('job-recommendations-ready', async (job) => {
    try {
      const { userId, resumeId, recommendationsCount } = job.data;
      
      logger.info(`Sending job recommendations email to user ${userId}`);
      
      // Here you would integrate with your email service
      // For now, we'll just log the action
      logger.info(`Email notification sent to user ${userId} for ${recommendationsCount} job recommendations`);
      
      return {
        success: true,
        userId,
        emailSent: true,
        recommendationsCount
      };
    } catch (error) {
      logger.error(`Error sending email notification to user ${job.data.userId}:`, error);
      throw error;
    }
  });

  emailQueue.process('resume-processing-complete', async (job) => {
    try {
      const { userId, resumeId, overallScore } = job.data;
      
      logger.info(`Sending resume processing completion email to user ${userId}`);
      
      // Here you would integrate with your email service
      logger.info(`Resume processing completion email sent to user ${userId} with score ${overallScore}`);
      
      return {
        success: true,
        userId,
        emailSent: true,
        overallScore
      };
    } catch (error) {
      logger.error(`Error sending resume completion email to user ${job.data.userId}:`, error);
      throw error;
    }
  });

  // Data analysis processor
  dataAnalysisQueue.process('analyze-market-trends', async (job) => {
    try {
      const { skills, location } = job.data;
      
      logger.info(`Analyzing market trends for skills: ${skills.join(', ')}`);
      
      // Get market insights
      const insights = await jobRecommender.getMarketInsights(skills, location);
      
      // Cache insights
      const redisClient = getRedisClient();
      const cacheKey = `market-insights:${skills.join('-')}:${location || 'global'}`;
      await redisClient.setEx(cacheKey, 7200, JSON.stringify(insights)); // 2 hours TTL
      
      logger.info(`Market analysis completed for ${insights.totalJobs} jobs`);
      
      return {
        success: true,
        insights,
        skills,
        location
      };
    } catch (error) {
      logger.error('Error analyzing market trends:', error);
      throw error;
    }
  });

  dataAnalysisQueue.process('update-job-scores', async (job) => {
    try {
      const { jobId } = job.data;
      
      logger.info(`Updating AI scores for job ${jobId}`);
      
      // Here you would implement logic to update job AI scores
      // This could involve recalculating market demand, salary competitiveness, etc.
      
      logger.info(`Job ${jobId} scores updated successfully`);
      
      return {
        success: true,
        jobId,
        updatedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error updating job scores for job ${job.data.jobId}:`, error);
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
      resumeProcessing: {
        waiting: await resumeProcessingQueue.getWaiting(),
        active: await resumeProcessingQueue.getActive(),
        completed: await resumeProcessingQueue.getCompleted(),
        failed: await resumeProcessingQueue.getFailed()
      },
      jobRecommendations: {
        waiting: await jobRecommendationQueue.getWaiting(),
        active: await jobRecommendationQueue.getActive(),
        completed: await jobRecommendationQueue.getCompleted(),
        failed: await jobRecommendationQueue.getFailed()
      },
      emailNotifications: {
        waiting: await emailQueue.getWaiting(),
        active: await emailQueue.getActive(),
        completed: await emailQueue.getCompleted(),
        failed: await emailQueue.getFailed()
      },
      dataAnalysis: {
        waiting: await dataAnalysisQueue.getWaiting(),
        active: await dataAnalysisQueue.getActive(),
        completed: await dataAnalysisQueue.getCompleted(),
        failed: await dataAnalysisQueue.getFailed()
      }
    };

    return status;
  } catch (error) {
    logger.error('Error getting queue status:', error);
    throw error;
  }
};

const pauseAllQueues = async () => {
  try {
    await resumeProcessingQueue.pause();
    await jobRecommendationQueue.pause();
    await emailQueue.pause();
    await dataAnalysisQueue.pause();
    
    logger.info('All queues paused');
  } catch (error) {
    logger.error('Error pausing queues:', error);
    throw error;
  }
};

const resumeAllQueues = async () => {
  try {
    await resumeProcessingQueue.resume();
    await jobRecommendationQueue.resume();
    await emailQueue.resume();
    await dataAnalysisQueue.resume();
    
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
const processResumeSynchronously = async (userId, resumeId, filePath, fileType) => {
  try {
    logger.info(`Processing resume ${resumeId} synchronously`);
    
    // Initialize ML services if not already done
    if (!resumeParser) {
      resumeParser = new ResumeParser();
      await resumeParser.initialize();
    }
    
    // Update resume status to processing
    await Resume.findByIdAndUpdate(resumeId, {
      processingStatus: 'processing',
      processingProgress: 10
    });

    // Parse resume
    const parsedData = await resumeParser.parseResume(filePath, fileType);
    
    // Update resume with parsed data
    await Resume.findByIdAndUpdate(resumeId, {
      ...parsedData,
      processingStatus: 'completed',
      processingProgress: 100,
      processedAt: new Date()
    });

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
    await Resume.findByIdAndUpdate(resumeId, {
      processingStatus: 'failed',
      processingError: error.message
    });
    
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
