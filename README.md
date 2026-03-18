# CareerConnect AI

CareerConnect AI is an AI-powered hiring and job-search platform for both job seekers and employers.
It combines resume intelligence, smart matching, interview workflows, and analytics in one product.

## Highlights

- Unified experience for candidates and hiring teams
- AI-assisted resume analysis and role matching
- Secure auth stack with JWT + OAuth providers
- Real-time features with Socket.IO
- Production-ready backend + modern React frontend

## Tech Stack

- Backend: Node.js, Express, Sequelize, SQLite, Mongoose
- Frontend: React 18, Vite, Material UI, React Query
- AI: TensorFlow.js, Universal Sentence Encoder
- Ops: Docker, PM2, Nginx

## Quick Start

### Option 1: Windows Fast Start

```bash
quick-start-dashboards.bat
```

### Option 2: Manual

```bash
npm install
cd src/client
npm install
cd ../..
copy .env.example .env
npm run build:client
npm start
```

App URL: `http://localhost:3000`
Health check: `http://localhost:3000/health`

## Development

Backend:

```bash
npm run dev
```

Frontend:

```bash
cd src/client
npm run dev
```

## Build and Run (Production Mode)

```bash
npm run build:client
npm start
```

## Testing and Linting

```bash
npm test
npm run lint
```

## Key Routes

- Auth: `/api/auth/*`
- Candidate flows: `/api/employee/*`
- Employer flows: `/api/employer/*`
- Jobs: `/api/jobs/*`
- AI services: `/api/bert/*`
- Status: `/health`, `/api/status`

## Deployment Notes

- PM2: `npm run start:pm2`
- Docker: `docker-compose up -d`
- Keep secrets in `.env` (never commit credentials)

## Docs

- `ENHANCED_DASHBOARD_DOCUMENTATION.md`
- `BERT_INTEGRATION.md`
- `IMPLEMENTATION_SUMMARY.md`
- `OAUTH_SETUP_GUIDE.md`
- `REDIS_SETUP.md`
