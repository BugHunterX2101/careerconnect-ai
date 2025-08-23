# CareerConnect AI

A comprehensive AI-powered resume parsing and job recommendation platform with advanced features including OAuth authentication, LinkedIn integration, Google Meet video conferencing, and real-time chat capabilities.

## Features

### Core AI Features
- **BERT-powered Resume Parsing**: Advanced resume analysis using Universal Sentence Encoder
- **Intelligent Job Recommendations**: ML-based job matching with skill analysis
- **Resume Improvement Suggestions**: AI-powered recommendations for better job prospects
- **Skill Analysis & Market Insights**: Real-time skill demand and salary predictions

### Authentication & Security
- **Multi-Provider OAuth**: Google, LinkedIn, and GitHub authentication
- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control**: Separate flows for job seekers and employers
- **Rate Limiting**: Comprehensive rate limiting for API protection
- **Input Validation**: Robust validation using express-validator and Zod

### Job Management
- **LinkedIn Integration**: Job posting and search via LinkedIn API
- **Advanced Job Search**: Multi-criteria filtering and search
- **Application Management**: Complete application lifecycle for employers
- **Candidate Search**: AI-powered candidate matching for employers

### Communication Features
- **Real-time Chat**: In-platform messaging with file sharing
- **Google Meet Integration**: Automated video interview scheduling
- **Interview Management**: Complete interview lifecycle management
- **Notifications**: Real-time updates via Socket.IO

### Profile Management
- **Comprehensive Profiles**: Detailed user profiles with skills, experience, education
- **Avatar Management**: Profile picture upload and management
- **Public Profiles**: Shareable public profile pages
- **Data Export**: Export profile data in multiple formats

##  Tech Stack

### Backend Framework
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication

### Database & Caching
- **MongoDB** - Primary database with Mongoose ODM
- **Redis** - Caching and session management
- **Bull Queue** - Background job processing

### AI & Machine Learning
- **TensorFlow.js** - Machine learning framework
- **Universal Sentence Encoder** - BERT-based text encoding
- **Natural** - Natural language processing
- **PDF Parse** - Document parsing

### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **Helmet** - Security headers

### External Integrations
- **LinkedIn API** - Job posting and search
- **Google Calendar API** - Video meeting scheduling
- **OAuth Providers** - Google, LinkedIn, GitHub

### File Processing
- **Multer** - File upload handling
- **Sharp** - Image processing
- **PDF Parse** - PDF document parsing

## Project Structure

```
src/
├── server/
│   └── index.js                 # Main server entry point
├── database/
│   ├── connection.js            # MongoDB connection
│   └── redis.js                 # Redis connection
├── models/
│   ├── User.js                  # User model
│   ├── Resume.js                # Resume model
│   ├── Job.js                   # Job model
│   ├── Conversation.js          # Chat conversation model
│   ├── Message.js               # Chat message model
│   └── Interview.js             # Interview model
├── routes/
│   ├── auth.js                  # Authentication routes
│   ├── resume.js                # Resume management routes
│   ├── jobs.js                  # Job management routes
│   ├── chat.js                  # Chat system routes
│   ├── video.js                 # Video call routes
│   ├── ml.js                    # AI/ML routes
│   └── profile.js               # Profile management routes
├── middleware/
│   ├── auth.js                  # Authentication middleware
│   ├── errorHandler.js          # Error handling
│   └── logger.js                # Logging middleware
├── services/
│   ├── linkedinService.js       # LinkedIn API integration
│   └── gmeetService.js          # Google Meet integration
├── ml/
│   ├── resumeParser.js          # Resume parsing logic
│   └── jobRecommender.js        # Job recommendation logic
└── workers/
    └── jobQueue.js              # Background job processing
```

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 5.0
- Redis >= 6.0
- npm >= 9.0.0

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd careerconnect-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000
   CLIENT_URL=http://localhost:5173

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/careerconnect
   REDIS_URL=redis://localhost:6379

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-refresh-secret-key

   # OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret

   # LinkedIn API Configuration
   LINKEDIN_ACCESS_TOKEN=your-linkedin-access-token
   LINKEDIN_ORGANIZATION_ID=your-linkedin-org-id

   # Google Services Configuration
   GOOGLE_SERVICE_ACCOUNT_KEY_FILE=path/to/service-account.json

   # Email Configuration (Optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # Logging Configuration
   LOG_LEVEL=info
   LOG_FILE=logs/app.log
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Start background workers** (in separate terminal)
   ```bash
   npm run queue:worker
   ```

## API Documentation

### Authentication Endpoints

#### OAuth Authentication
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/linkedin` - LinkedIn OAuth login
- `GET /api/auth/linkedin/callback` - LinkedIn OAuth callback
- `GET /api/auth/github` - GitHub OAuth login
- `GET /api/auth/github/callback` - GitHub OAuth callback

#### Traditional Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Resume Management
- `POST /api/ml/parse-resume` - Parse resume using AI
- `GET /api/resume` - Get user resumes
- `PUT /api/resume/:id` - Update resume
- `DELETE /api/resume/:id` - Delete resume

### Job Management
- `GET /api/jobs/recommendations` - Get AI job recommendations
- `GET /api/jobs/search` - Search jobs
- `POST /api/jobs` - Post new job (employer)
- `POST /api/jobs/apply/:id` - Apply for job
- `GET /api/jobs/employer/my-jobs` - Get employer's jobs
- `GET /api/jobs/employer/applications/:jobId` - Get job applications

### Chat System
- `GET /api/chat/conversations` - Get user conversations
- `POST /api/chat/conversations` - Create conversation
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message

### Video Calls
- `POST /api/video/interviews` - Schedule interview
- `GET /api/video/interviews` - Get user interviews
- `POST /api/video/interviews/:id/join` - Join video call
- `GET /api/video/meet-link/:interviewId` - Get Google Meet link

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload avatar
- `PUT /api/profile/skills` - Update skills
- `GET /api/profile/public/:userId` - Get public profile

### AI/ML Features
- `POST /api/ml/analyze-text` - Analyze text content
- `POST /api/ml/skill-analysis` - Analyze skills
- `POST /api/ml/resume-improvement` - Get improvement suggestions
- `POST /api/ml/salary-prediction` - Predict salary
- `GET /api/ml/market-insights` - Get market insights

## 🔧 Configuration

### Environment Variables

#### Required Variables
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 3000)

#### Optional Variables
- `NODE_ENV` - Environment (development/production)
- `REDIS_URL` - Redis connection string
- `CLIENT_URL` - Frontend URL for CORS

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`

#### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://developer.linkedin.com/)
2. Create a new app
3. Get Client ID and Client Secret
4. Add redirect URI: `http://localhost:3000/api/auth/linkedin/callback`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Get Client ID and Client Secret
4. Add callback URL: `http://localhost:3000/api/auth/github/callback`

## Docker Deployment

### Build Docker Image
```bash
npm run docker:build
```

### Run with Docker Compose
```bash
docker-compose up -d
```

### Environment Variables for Docker
Create a `.env` file for Docker:
```env
NODE_ENV=production
MONGODB_URI=mongodb://mongo:27017/careerconnect
REDIS_URL=redis://redis:6379
JWT_SECRET=your-production-jwt-secret
```

## Monitoring & Logging

### Logging
- **Winston** for structured logging
- **File rotation** for log management
- **Error tracking** with stack traces

### Health Checks
- `GET /health` - Server health check
- Database connectivity check
- Redis connectivity check

### Metrics
- Request/response logging
- Performance monitoring
- Error rate tracking

## Security Features

### Authentication Security
- JWT token expiration
- Password hashing with bcrypt
- Rate limiting on auth endpoints
- OAuth 2.0 implementation

### API Security
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- SQL injection prevention

### File Upload Security
- File type validation
- File size limits
- Virus scanning (optional)
- Secure file storage

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### API Testing
```bash
npm run test:api
```

## Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed data
- Response caching for static content
- Database query optimization

### Background Processing
- Bull queue for heavy operations
- Async processing for file uploads
- Email queue management

### Database Optimization
- Indexed queries
- Connection pooling
- Query optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### v1.0.0
- Basic resume parsing
- Job recommendations
- User authentication
- Basic profile management 
