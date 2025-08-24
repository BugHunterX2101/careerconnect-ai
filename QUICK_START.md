# CareerConnect AI - Quick Start Guide

## 🚀 One-Command Setup

This project has been simplified for maximum reliability. No external databases or complex setup required!

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Git**

### Quick Start

1. **Clone and start** (everything is automatic):
```bash
git clone <repository-url>
cd careerconnect-main
npm start
```

That's it! The server will:
- ✅ Install dependencies automatically
- ✅ Create `.env` file from template
- ✅ Set up SQLite database (file-based, no external setup)
- ✅ Start the server on port 3000

### What's New in Version 2.0

#### ✅ **Reliability Improvements**
- **SQLite Database**: File-based, no external database setup required
- **Automatic Setup**: One command installs everything
- **Error Handling**: Comprehensive error catching and logging
- **Graceful Fallbacks**: Works even if some services are unavailable

#### ✅ **GPT-OSS-120B Integration**
- **Advanced Job Recommendations**: AI-powered job matching
- **Resume Analysis**: Intelligent resume parsing and feedback
- **Career Advice**: Personalized career guidance

#### ✅ **Simplified Architecture**
- **No External Dependencies**: No PostgreSQL, MongoDB, or Redis required
- **File-Based Storage**: SQLite database stored locally
- **Automatic Configuration**: Environment setup handled automatically

## 🔧 Manual Setup (Optional)

If you prefer manual setup:

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp env.example .env

# 3. Start development server
npm run dev
```

## 📊 Health Check

Visit: `http://localhost:3000/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "version": "2.0.0",
  "database": "SQLite",
  "features": ["GPT-OSS-120B", "Resume Parsing", "Job Recommendations"]
}
```

## 🤖 GPT-OSS-120B Configuration

The API key is pre-configured in the `.env` file:
```env
GPT_OSS_API_KEY=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
GPT_OSS_BASE_URL=https://api.openai.com/v1
GPT_OSS_MODEL=gpt-oss-120b
```

## 📁 Project Structure

```
careerconnect-main/
├── src/
│   ├── server/          # Backend server
│   ├── models/          # Database models (SQLite)
│   ├── routes/          # API routes
│   ├── services/        # GPT-OSS service
│   └── middleware/      # Error handling
├── database.sqlite      # SQLite database (auto-created)
├── scripts/
│   └── start.js         # Smart startup script
└── package.json
```

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check Node.js version
node --version  # Should be >= 18.0.0

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Database Issues
- SQLite database is created automatically
- No external database setup required
- Check file permissions if issues occur

### GPT-OSS API Issues
- API key is pre-configured
- Check internet connectivity
- Verify API key is valid

## 🚀 Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start src/server/index.js --name "careerconnect-ai"
pm2 monit
```

### Using Docker
```bash
docker build -t careerconnect-ai .
docker run -p 3000:3000 careerconnect-ai
```

## 📈 Features

### Core Features
- ✅ **Resume Upload & Parsing**: AI-powered resume analysis
- ✅ **Job Recommendations**: GPT-OSS-120B powered matching
- ✅ **User Management**: Registration, authentication, profiles
- ✅ **Real-time Chat**: Socket.IO powered messaging
- ✅ **Video Calls**: WebRTC integration
- ✅ **File Management**: Secure file uploads

### AI Features
- ✅ **GPT-OSS-120B Integration**: Advanced language model
- ✅ **Resume Analysis**: Skills extraction and scoring
- ✅ **Job Matching**: Intelligent recommendation engine
- ✅ **Career Advice**: Personalized guidance

### Technical Features
- ✅ **SQLite Database**: Reliable, file-based storage
- ✅ **Error Handling**: Comprehensive error catching
- ✅ **Rate Limiting**: API protection
- ✅ **Security**: JWT authentication, CORS, Helmet
- ✅ **Logging**: Winston logging system

## 🆘 Support

### Common Issues
1. **Port 3000 in use**: Change `PORT` in `.env`
2. **Permission errors**: Check file permissions
3. **API errors**: Verify internet connectivity

### Getting Help
1. Check the logs for error messages
2. Verify all prerequisites are installed
3. Try the automatic setup: `npm start`

## 🎯 Key Benefits

- **🚀 Zero Setup**: One command gets everything running
- **💾 Reliable**: SQLite database, no external dependencies
- **🤖 AI-Powered**: GPT-OSS-120B for advanced features
- **🔒 Secure**: Comprehensive security measures
- **📱 Real-time**: Socket.IO for live features
- **🛠️ Maintainable**: Clean, well-documented code

---

**Ready to start?** Just run `npm start` and you're good to go! 🚀
