# CareerConnect - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Features](#features)
3. [Setup Instructions](#setup-instructions)
4. [API Documentation](#api-documentation)
5. [Real-Time Features](#real-time-features)
6. [Security](#security)
7. [Testing](#testing)

---

## System Overview

CareerConnect is a comprehensive job matching platform with AI-powered recommendations, real-time chat, and video interview scheduling capabilities.

### Technology Stack
- **Backend**: Node.js v22.12.0, Express.js 4.18.2
- **Databases**: MongoDB 7.0.3, Redis 4.6.5, SQLite (Sequelize 6.35.0)
- **Authentication**: JWT, OAuth 2.0 (Google, LinkedIn, GitHub)
- **Real-Time**: Socket.IO 4.6.1
- **AI/ML**: TensorFlow.js, Natural NLP, OpenAI GPT-4
- **Frontend**: React 18.x, Material-UI
- **Video**: Google Meet API integration

---

## Features

### 🔐 Authentication & Authorization
- JWT token-based authentication
- Session management with Redis
- OAuth 2.0 integration:
  - Google OAuth
  - LinkedIn OAuth
  - GitHub OAuth
- Role-based access control (Job Seeker, Employer)
- CSRF protection
- Rate limiting

### 💼 Job Recommendations
- **Enhanced Job Recommendations** (15+ jobs guaranteed)
- AI-powered matching algorithm
- Multi-source job aggregation
- Match scoring with detailed breakdowns
- Profile improvement suggestions
- Salary intelligence by experience level

### 👥 Candidate Rating System
- Comprehensive 0-100 rating score
- 6-category evaluation:
  - Skills Match (35%)
  - Experience Match (30%)
  - Education Match (10%)
  - Soft Skills (10%)
  - Career Trajectory (10%)
  - Additional Factors (5%)
- 5-tier rating system with hiring recommendations
- Detailed strengths & concerns analysis

### 💬 Real-Time Chat
- Socket.IO powered messaging
- One-on-one conversations
- File sharing support (images, documents)
- Real-time notifications
- Message history
- Typing indicators
- Read receipts

### 📹 Interview Scheduling
- Video, phone, and onsite interview types
- Google Meet integration
- Conflict detection
- Calendar integration
- Email notifications
- Interview status tracking
- Real-time notifications via Socket.IO

### 📄 Resume Management
- Resume upload and parsing
- Multiple resume support
- AI-powered resume analysis
- Skills extraction
- Experience parsing
- ATS optimization suggestions

### 🤖 AI-Powered Services
- Job recommendations with ML
- Resume parsing with NLP
- Career improvement suggestions
- Skills gap analysis
- Keyword optimization

---

## Setup Instructions

### Prerequisites
- Node.js v22.12.0+
- MongoDB 7.0.3+
- Redis 4.6.5+
- npm or yarn

### Environment Variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database URLs
MONGODB_URI=mongodb://localhost:27017/careerconnect
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_SECRET=your-256-bit-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
SESSION_SECRET=your-session-secret-here

# OAuth Credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Google Meet API (optional)
GOOGLE_MEET_API_KEY=your-google-meet-api-key
```

### Installation

```bash
# Install dependencies
npm install

# Start Redis (Windows)
.\start-redis.bat

# Start the application
npm start

# Or start both services
.\start-system.bat
```

### Development Mode

```bash
# Start in development mode with hot reload
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

---

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "jobseeker"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response:
{
  "token": "jwt-token",
  "user": { "id": "...", "email": "...", "role": "..." }
}
```

#### OAuth Login
```http
GET /api/auth/google
GET /api/auth/linkedin
GET /api/auth/github
```

**OAuth Redirect URLs:**
- Google: `http://localhost:3000/api/auth/google/callback`
- LinkedIn: `http://localhost:3000/api/auth/linkedin/callback`
- GitHub: `http://localhost:3000/api/auth/github/callback`

### Job Endpoints

#### Enhanced Job Recommendations
```http
GET /api/jobs/enhanced-recommendations
Authorization: Bearer <token>

Query Parameters:
- minJobs: number (default: 15)
- remote: boolean
- location: string
- experienceLevel: string
- salaryMin: number
- salaryMax: number

Response:
{
  "jobs": [...],
  "profileSuggestions": {...},
  "userStats": {...}
}
```

#### Search Jobs
```http
GET /api/jobs/search?keyword=developer&location=remote
Authorization: Bearer <token>
```

#### Apply to Job
```http
POST /api/jobs/apply/:jobId
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- resume: file
- coverLetter: string
```

### Employer Endpoints

#### Rate Candidate
```http
POST /api/employer/candidates/:candidateId/rating
Authorization: Bearer <employer-token>
Content-Type: application/json

{
  "jobId": "job_id_here"
}

Response:
{
  "rating": {
    "overall": 85,
    "tier": { "level": "Strong Match", "stars": 4 },
    "categoryScores": {...},
    "recommendation": {...}
  }
}
```

#### Get Matching Candidates
```http
GET /api/employer/jobs/:jobId/matching-candidates?limit=15&minScore=70
Authorization: Bearer <employer-token>
```

### Chat Endpoints

#### Get Conversations
```http
GET /api/chat/conversations
Authorization: Bearer <token>
```

#### Send Message
```http
POST /api/chat/conversations/:conversationId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello, I'm interested in this position"
}
```

#### Start New Conversation
```http
POST /api/chat/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "participantId": "user_id_here",
  "initialMessage": "Hello!"
}
```

### Interview Endpoints

#### Schedule Interview
```http
POST /api/video/interviews
Authorization: Bearer <employer-token>
Content-Type: application/json

{
  "jobId": "job_id",
  "candidateId": "candidate_id",
  "scheduledAt": "2026-02-20T10:00:00Z",
  "duration": 60,
  "type": "video",
  "description": "Technical interview"
}

Response:
{
  "interview": {
    "id": "...",
    "meetLink": "https://meet.google.com/...",
    "status": "scheduled"
  }
}
```

#### Get Interviews
```http
GET /api/video/interviews
Authorization: Bearer <token>

Query Parameters:
- status: scheduled|confirmed|completed|cancelled
- startDate: ISO date
- endDate: ISO date
```

#### Update Interview Status
```http
PATCH /api/video/interviews/:interviewId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

---

## Real-Time Features

### Socket.IO Events

#### Client → Server

**Authenticate Connection**
```javascript
socket.emit('authenticate', token);
```

**Send Message**
```javascript
socket.emit('message:send', {
  conversationId: 'conv_id',
  content: 'Hello',
  type: 'text'
});
```

**Typing Indicator**
```javascript
socket.emit('typing:start', { conversationId: 'conv_id' });
socket.emit('typing:stop', { conversationId: 'conv_id' });
```

#### Server → Client

**Authentication Success**
```javascript
socket.on('authenticated', () => {
  console.log('Connected to real-time service');
});
```

**New Message**
```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

**Interview Scheduled**
```javascript
socket.on('interview:scheduled', (interview) => {
  console.log('Interview scheduled:', interview);
});
```

**Interview Reminder**
```javascript
socket.on('interview:reminder', (interview) => {
  console.log('Interview starting in 15 minutes');
});
```

---

## Security

### Implemented Security Features

1. **Authentication**
   - JWT tokens with 256-bit secrets
   - Secure password hashing with bcrypt
   - Token expiration and refresh
   - Session management with Redis

2. **Authorization**
   - Role-based access control
   - Route-level authorization
   - Resource ownership verification

3. **Input Validation**
   - Express-validator for all inputs
   - XSS protection
   - SQL injection prevention
   - File type validation
   - File size limits

4. **Rate Limiting**
   - API rate limiting (100 req/15min)
   - Auth rate limiting (5 req/15min)
   - Upload rate limiting (10 req/hour)
   - Message rate limiting (20 msg/min)

5. **CSRF Protection**
   - CSRF tokens on all POST/PUT/DELETE requests
   - Cookie-based CSRF strategy

6. **Headers Security**
   - Helmet.js for security headers
   - CORS configuration
   - Content Security Policy

7. **Data Sanitization**
   - Input sanitization middleware
   - HTML escaping
   - Path traversal prevention

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- validateEnv.test.js

# Run with coverage
npm run test:coverage
```

### Manual Testing

#### Test Authentication
```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","role":"jobseeker"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

#### Test Job Recommendations
```bash
curl http://localhost:3000/api/jobs/enhanced-recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Chat Health
```bash
curl http://localhost:3000/api/chat/health
```

#### Test Interview Scheduling
```bash
curl -X POST http://localhost:3000/api/video/interviews \
  -H "Authorization: Bearer EMPLOYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"...","candidateId":"...","scheduledAt":"2026-02-20T10:00:00Z","duration":60,"type":"video"}'
```

---

## API Endpoints Summary

### Public Endpoints
- `GET /health` - System health check
- `GET /api/test` - API test endpoint
- `GET /api/auth/test` - Auth system test
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Protected Endpoints (Job Seeker)
- `GET /api/jobs/recommendations` - Basic recommendations
- `GET /api/jobs/enhanced-recommendations` - Enhanced recommendations
- `GET /api/jobs/search` - Search jobs
- `POST /api/jobs/apply/:id` - Apply to job
- `GET /api/chat/conversations` - Get conversations
- `POST /api/chat/conversations/:id/messages` - Send message
- `GET /api/video/interviews` - Get interviews
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/resume/upload` - Upload resume

### Protected Endpoints (Employer)
- `POST /api/jobs` - Create job posting
- `GET /api/employer/my-jobs` - Get employer's jobs
- `GET /api/employer/jobs/:jobId/applications` - Get applications
- `GET /api/employer/jobs/:jobId/matching-candidates` - Get matches
- `POST /api/employer/candidates/:id/rating` - Rate candidate
- `POST /api/video/interviews` - Schedule interview
- `GET /api/employer/dashboard` - Get dashboard stats

---

## Troubleshooting

### Common Issues

**Redis Connection Error**
```
Error: Redis connection failed
Solution: Run `.\start-redis.bat` on Windows or `redis-server` on Linux/Mac
```

**MongoDB Connection Error**
```
Error: MongoDB connection failed
Solution: Ensure MongoDB is running and connection string is correct in .env
Note: System can run with SQLite fallback if MongoDB is unavailable
```

**Port Already in Use**
```
Error: Port 3000 is already in use
Solution: Server will automatically retry on port 3001, 3002, etc.
```

**OAuth Redirect Error**
```
Error: Redirect URI mismatch
Solution: Update OAuth provider settings with correct callback URLs:
- Google: http://localhost:3000/api/auth/google/callback
- LinkedIn: http://localhost:3000/api/auth/linkedin/callback
- GitHub: http://localhost:3000/api/auth/github/callback
```

---

## Performance Optimization

### Database Optimization
- MongoDB indexes on frequently queried fields
- Redis caching for session data
- Connection pooling
- Query optimization

### API Optimization
- Response compression (gzip)
- Rate limiting to prevent abuse
- Efficient pagination
- Lazy loading of relationships

### Real-Time Optimization
- Socket.IO room-based targeting
- Event throttling
- Connection pooling
- Automatic reconnection

---

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (256-bit minimum)
- [ ] Configure production database URLs
- [ ] Set up SSL/TLS certificates
- [ ] Configure production CORS origins
- [ ] Enable logging service (e.g., Winston, Papertrail)
- [ ] Set up monitoring (e.g., New Relic, DataDog)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Enable error tracking (e.g., Sentry)
- [ ] Configure CDN for static assets
- [ ] Set up load balancer
- [ ] Enable database replication

### Environment-Specific Configuration

**Development**
```env
NODE_ENV=development
LOG_LEVEL=debug
```

**Staging**
```env
NODE_ENV=staging
LOG_LEVEL=info
```

**Production**
```env
NODE_ENV=production
LOG_LEVEL=error
```

---

## Support & Contribution

### Reporting Issues
- Check existing documentation first
- Include error messages and logs
- Provide steps to reproduce
- Mention your environment (OS, Node version)

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## License

MIT License - See LICENSE file for details

---

## Version History

**v1.2.0** (Current - February 2026)
- ✅ Enhanced job recommendation system (15+ jobs)
- ✅ Candidate rating system (0-100 scoring)
- ✅ Real-time chat with Socket.IO
- ✅ Interview scheduling with Google Meet
- ✅ GitHub OAuth integration
- ✅ Improved UI text sizing

**v1.1.0**
- JWT authentication
- Google & LinkedIn OAuth
- Basic job recommendations
- Resume upload and parsing
- Profile management

**v1.0.0**
- Initial release
- Basic job board functionality
- User registration and login

---

## Contact

For questions or support, please refer to the documentation or check the server logs for troubleshooting.

**Server Log Location:** `./server.log`

**Key Configuration Files:**
- `.env` - Environment variables
- `package.json` - Dependencies and scripts
- `jest.config.js` - Test configuration
- `Dockerfile` - Docker configuration

---

*Last Updated: February 13, 2026*
