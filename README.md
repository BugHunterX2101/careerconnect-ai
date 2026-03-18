# CareerConnect AI

CareerConnect AI is a full-stack platform for job seekers and employers.
It combines real-time workflows, AI-assisted recommendations, and analytics dashboards in one system.

## Why This Project

- One platform for both hiring and job search journeys
- Production-ready backend with authentication, authorization, and API guardrails
- AI-powered resume and recommendation services with practical fallbacks
- Fast frontend with focused dashboards and performance guardrails

## Core Capabilities

### Job Seeker Experience
- Personalized dashboard with applications, interviews, and analytics
- Resume analysis and profile insights
- Job recommendations and search workflows
- OAuth login and secure account flows

### Employer Experience
- Hiring dashboard with pipeline and analytics views
- Candidate search, review, and interview scheduling
- Job management and applicant tracking endpoints

### Platform Services
- JWT auth + OAuth providers (Google, LinkedIn, GitHub)
- Real-time communication with Socket.IO
- AI services for resume understanding and recommendation support
- Redis-ready caching support and SQLite-based local persistence

## Tech Stack

- Backend: Node.js, Express, Sequelize, SQLite, Mongoose support
- Frontend: React 18, Vite, Material UI, React Query
- AI/ML: TensorFlow.js, Universal Sentence Encoder, recommendation services
- Infra: Docker, PM2, Nginx config, GitHub Actions workflows

## Quick Start

### Windows Fast Path

```bash
quick-start-dashboards.bat
```

### Manual Setup

```bash
npm install
cd src/client && npm install
cd ../..
```

Create environment file:

```bash
copy .env.example .env
```

Start backend:

```bash
npm start
```

## Frontend Development

Run frontend in Vite dev mode:

```bash
cd src/client
npm run dev
```

Build frontend for backend-served static hosting:

```bash
npm run build:client
```

## Testing and Quality

From repository root:

```bash
npm test
npm run lint
```

From `src/client`:

```bash
npm run test
npm run build:perf
```

## API Surface (High-Level)

- Auth: `/api/auth/*`
- Employee workflows: `/api/employee/*`
- Employer workflows: `/api/employer/*`
- Jobs and recommendations: `/api/jobs/*`
- BERT services: `/api/bert/*`
- Health/status: `/health`, `/api/status`

## Production Notes

- Start server: `npm start`
- PM2 mode: `npm run start:pm2`
- Docker mode: `docker-compose up -d`
- Keep secrets in `.env` and never commit credentials

## Documentation Map

- `ENHANCED_DASHBOARD_DOCUMENTATION.md`
- `BERT_INTEGRATION.md`
- `IMPLEMENTATION_SUMMARY.md`
- `OAUTH_SETUP_GUIDE.md`
- `REDIS_SETUP.md`

## Project Goal

Deliver a focused, reliable career platform where AI improves decisions without blocking core workflows.


