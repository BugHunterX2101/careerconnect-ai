# CareerConnect AI - Project Structure

## Overview
This document outlines the clean and organized structure of the CareerConnect AI project after removing unnecessary files and optimizing the codebase.

## Root Directory Structure

```
careerconnect-main/
├── src/                          # Main source code
├── scripts/                      # Build and utility scripts
├── node_modules/                 # Dependencies (gitignored)
├── package.json                  # Project configuration
├── package-lock.json             # Dependency lock file
├── .gitignore                    # Git ignore rules
├── env.example                   # Environment variables template
├── vercel.json                   # Vercel deployment config
└── README.md                     # Project documentation
```

## Source Code Structure (`src/`)

```
src/
├── client/                       # Frontend React application
│   ├── src/                      # React source files
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Vite configuration
│   ├── index.html                # HTML entry point
│   └── env.example               # Frontend environment template
├── server/                       # Backend server files
│   └── index.js                  # Main server entry point
├── database/                     # Database configuration
│   ├── connection.js             # MongoDB connection
│   └── redis.js                  # Redis connection
├── models/                       # Database models
│   ├── User.js                   # User model
│   ├── Resume.js                 # Resume model
│   ├── Job.js                    # Job model
│   ├── Conversation.js           # Chat conversation model
│   ├── Message.js                # Chat message model
│   └── Interview.js              # Interview model
├── routes/                       # API routes
│   ├── auth.js                   # Authentication routes
│   ├── resume.js                 # Resume management routes
│   ├── jobs.js                   # Job management routes
│   ├── chat.js                   # Chat system routes
│   ├── video.js                  # Video call routes
│   ├── ml.js                     # AI/ML routes
│   └── profile.js                # Profile management routes
├── middleware/                   # Express middleware
│   ├── auth.js                   # Authentication middleware
│   ├── errorHandler.js           # Error handling middleware
│   └── logger.js                 # Logging middleware
├── services/                     # Business logic services
│   ├── authService.js            # Authentication service
│   ├── resumeService.js          # Resume processing service
│   ├── jobService.js             # Job management service
│   ├── chatService.js            # Chat functionality service
│   ├── emailService.js           # Email notification service
│   └── linkedinService.js        # LinkedIn API integration
├── workers/                      # Background job workers
│   └── jobQueue.js               # Job queue processing
├── ml/                          # Machine learning modules
│   ├── resumeParser.js           # Resume parsing with BERT
│   └── jobRecommender.js         # Job recommendation engine
├── utils/                       # Utility functions
│   ├── constants.js              # Application constants
│   ├── helpers.js                # Helper functions
│   └── validators.js             # Validation utilities
└── routes/                      # API route handlers
```

## Scripts Directory (`scripts/`)

```
scripts/
├── setup.js                     # Project setup and initialization
├── build-production.js          # Production build script
└── test-integration.js          # Integration testing script
```

## Key Features by Directory

### Authentication & Security (`routes/auth.js`, `middleware/auth.js`)
- Multi-provider OAuth (Google, LinkedIn, GitHub)
- JWT-based authentication
- Role-based access control
- Rate limiting and security headers

### AI & Machine Learning (`ml/`)
- BERT-powered resume parsing
- Intelligent job recommendations
- Skill analysis and matching
- Natural language processing

### Real-time Communication (`routes/chat.js`, `services/chatService.js`)
- Socket.IO-based real-time chat
- File sharing capabilities
- Interview scheduling integration

### Job Management (`routes/jobs.js`, `services/jobService.js`)
- LinkedIn API integration
- Advanced job search and filtering
- Application management
- Candidate matching

### Background Processing (`workers/`)
- Redis-based job queues
- Asynchronous task processing
- Email notifications
- Data processing tasks

## Removed Files and Directories

The following unnecessary files and directories have been removed to clean up the project:

1. **Empty Files:**
   - `scripts/initDatabase.js` (0 bytes)

2. **Build Artifacts:**
   - `src/client/dist/` (client build output)

3. **Deployment Files:**
   - `.vercel/` (Vercel deployment cache)

4. **Empty Directories:**
   - `src/tests/` (empty test directory)
   - `src/config/` (empty configuration directory)
   - `src/controllers/` (empty controllers directory)
   - `src/types/` (empty types directory)
   - `src/validators/` (empty validators directory)

5. **Removed Scripts:**
   - Docker-related scripts (no Docker files present)
   - ML training scripts (not implemented)

## Environment Configuration

The project uses environment variables for configuration:

- **Backend**: `.env` file (created from `env.example`)
- **Frontend**: `src/client/.env` file (created from `src/client/env.example`)

## Build and Deployment

- **Development**: `npm run dev` (starts both backend and frontend)
- **Production Build**: `npm run build:production`
- **Deployment**: Configured for Vercel deployment

## Code Quality

- **Linting**: ESLint configuration for code quality
- **Formatting**: Prettier for consistent code formatting
- **Testing**: Jest for unit testing (framework ready)

This clean structure ensures maintainability, scalability, and ease of development while removing all unnecessary files and directories.
