let tf = null;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (error) {
  console.log('TensorFlow.js native bindings not available, using CPU fallback');
  try {
    tf = require('@tensorflow/tfjs');
  } catch (fallbackError) {
    console.log('TensorFlow.js not available');
  }
}
let natural = null;

class TensorFlowService {
  constructor() {
    this.model = null;
    this.encoder = null;
    this.isInitialized = false;
    this.vocabulary = new Map();
    this.maxSequenceLength = 100;
  }

  async initialize() {
    try {
      if (!tf) {
        console.log('TensorFlow.js not available, skipping ML initialization');
        return;
      }
      await tf.ready();
      
      // Create or load embedding model
      this.encoder = this.createTextEncoder();
      
      // Create recommendation model
      this.model = this.createRecommendationModel();
      
      // Initialize vocabulary
      await this.buildVocabulary();
      
      this.isInitialized = tf !== null;
      console.log('TensorFlow service initialized:', this.isInitialized);
    } catch (error) {
      console.error('TensorFlow initialization error:', error);
      throw error;
    }
  }

  createTextEncoder() {
    // Simple text encoding model
    const model = tf.sequential({
      layers: [
        tf.layers.embedding({
          inputDim: 10000, // vocabulary size
          outputDim: 128,  // embedding dimension
          inputLength: this.maxSequenceLength
        }),
        tf.layers.globalAveragePooling1d(),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 32, activation: 'relu' })
      ]
    });
    
    return model;
  }

  createRecommendationModel() {
    // Neural collaborative filtering model
    const userInput = tf.input({ shape: [1], name: 'user' });
    const jobInput = tf.input({ shape: [32], name: 'job_features' });
    
    // User embedding
    const userEmbedding = tf.layers.embedding({
      inputDim: 1000,
      outputDim: 16
    }).apply(userInput);
    
    const userFlat = tf.layers.flatten().apply(userEmbedding);
    
    // Concatenate user and job features
    const concat = tf.layers.concatenate().apply([userFlat, jobInput]);
    
    // Dense layers
    const dense1 = tf.layers.dense({ units: 64, activation: 'relu' }).apply(concat);
    const dropout1 = tf.layers.dropout({ rate: 0.2 }).apply(dense1);
    const dense2 = tf.layers.dense({ units: 32, activation: 'relu' }).apply(dropout1);
    const output = tf.layers.dense({ units: 1, activation: 'sigmoid' }).apply(dense2);
    
    const model = tf.model({ inputs: [userInput, jobInput], outputs: output });
    
    model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  async buildVocabulary() {
    // Build vocabulary from common job-related terms
    const commonTerms = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws',
      'machine learning', 'data science', 'frontend', 'backend', 'fullstack',
      'engineer', 'developer', 'manager', 'analyst', 'consultant'
    ];
    
    commonTerms.forEach((term, index) => {
      this.vocabulary.set(term.toLowerCase(), index + 1);
    });
  }

  tokenizeText(text) {
    if (!natural) natural = require('natural');
    const tokens = natural.WordTokenizer().tokenize(text.toLowerCase());
    return tokens.map(token => this.vocabulary.get(token) || 0);
  }

  padSequence(sequence, maxLength = this.maxSequenceLength) {
    if (sequence.length > maxLength) {
      return sequence.slice(0, maxLength);
    }
    return [...sequence, ...Array(maxLength - sequence.length).fill(0)];
  }

  async encodeText(text) {
    if (!this.isInitialized) await this.initialize();
    if (!tf || !this.isInitialized) return new Array(32).fill(0);
    
    const tokens = this.tokenizeText(text);
    const paddedTokens = this.padSequence(tokens);
    const tensor = tf.tensor2d([paddedTokens]);
    
    const encoded = this.encoder.predict(tensor);
    const result = await encoded.data();
    
    tensor.dispose();
    encoded.dispose();
    
    return Array.from(result);
  }

  async calculateJobScore(userFeatures, jobFeatures) {
    if (!this.isInitialized) await this.initialize();
    if (!tf || !this.isInitialized) return 0.5;
    
    const userTensor = tf.tensor2d([[userFeatures.userId || 0]]);
    const jobTensor = tf.tensor2d([jobFeatures]);
    
    const prediction = this.model.predict([userTensor, jobTensor]);
    const score = await prediction.data();
    
    userTensor.dispose();
    jobTensor.dispose();
    prediction.dispose();
    
    return score[0];
  }

  extractJobFeatures(job) {
    // Extract numerical features from job
    const features = new Array(32).fill(0);
    
    // Title encoding
    if (job.title) {
      const titleTokens = this.tokenizeText(job.title);
      features[0] = titleTokens.length > 0 ? titleTokens[0] / 1000 : 0;
    }
    
    // Salary features
    if (job.salary) {
      features[1] = (job.salary.min || 0) / 200000;
      features[2] = (job.salary.max || 0) / 200000;
    }
    
    // Remote work
    features[3] = job.remote ? 1 : 0;
    
    // Requirements count
    features[4] = job.requirements ? job.requirements.length / 20 : 0;
    
    // Company size (normalized value between 0-1)
    features[5] = job.companySize ? Math.min(job.companySize / 1000, 1) : 0;
    
    return features;
  }

  extractUserFeatures(user) {
    const features = {
      userId: user.id || 0,
      skillsCount: 0,
      experienceYears: 0,
      educationLevel: 0
    };
    
    // Count skills
    if (user.profile?.skills) {
      features.skillsCount = user.profile.skills.length;
    }
    
    // Calculate experience
    if (user.resumes?.length > 0) {
      const resume = user.resumes[0];
      if (resume.experience) {
        features.experienceYears = resume.experience.length * 2; // Rough estimate
      }
    }
    
    return features;
  }

  async trainModel(trainingData) {
    if (!this.isInitialized) await this.initialize();
    if (!tf || !this.isInitialized) {
      console.log('TensorFlow.js not available for training');
      return;
    }
    
    const { users, jobs, interactions } = trainingData;
    
    const userIds = interactions.map(i => [i.userId]);
    const jobFeatures = interactions.map(i => {
      const job = jobs.find(j => j.id === i.jobId);
      return this.extractJobFeatures(job);
    });
    const labels = interactions.map(i => [i.rating || (i.applied ? 1 : 0)]);
    
    const userTensor = tf.tensor2d(userIds);
    const jobTensor = tf.tensor2d(jobFeatures);
    const labelTensor = tf.tensor2d(labels);
    
    await this.model.fit([userTensor, jobTensor], labelTensor, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
        }
      }
    });
    
    userTensor.dispose();
    jobTensor.dispose();
    labelTensor.dispose();
  }

  async saveModel(path) {
    if (this.model) {
      await this.model.save(`file://${path}`);
    }
  }

  async loadModel(path) {
    try {
      this.model = await tf.loadLayersModel(`file://${path}`);
      console.log('Model loaded successfully');
    } catch (error) {
      console.log('No saved model found, using new model');
    }
  }

  dispose() {
    if (this.model) {
      this.model.dispose();
    }
    if (this.encoder) {
      this.encoder.dispose();
    }
  }
}

module.exports = TensorFlowService;