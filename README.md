# CareerConnect AI

An AI-powered hiring platform for job seekers and employers — resume intelligence, smart candidate matching, real-time communication, and a full recruitment workflow in one product.

---

## What it does

**For job seekers**
- Upload a resume → get instant skill gap analysis, quality score, and tailored job recommendations
- Track applications, schedule interviews, and chat with employers in real time

**For employers**
- Post a job → immediately see AI-matched candidates ranked by a 5-factor scoring algorithm
- Filter candidates, schedule interviews, and track the full hiring pipeline from one dashboard

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, Sequelize, SQLite |
| Frontend | React 18, Vite, Material UI, React Query |
| AI / NLP | BERT, TensorFlow.js, `natural` |
| Auth | JWT + Passport.js, OAuth (Google, LinkedIn, GitHub), RBAC |
| Real-time | Socket.IO |
| Infra | Docker, PM2, Nginx, Redis (optional) |

---

## Get started

```bash
git clone https://github.com/BugHunterX2101/careerconnect-ai.git
cd careerconnect-ai
cp .env.example .env          # fill in secrets
npm install
cd src/client && npm install && cd ../..
npm run build:client
npm start
```

| Endpoint | URL |
|---|---|
| App | http://localhost:3000 |
| Health | http://localhost:3000/health |
| API | http://localhost:3000/api |

**Dev mode** (hot reload on both backend and frontend):
```bash
npm run dev          # backend
cd src/client && npm run dev   # frontend → http://localhost:5173
```

**Test accounts** (seed with `node scripts/reset-users.js`):
- Job seeker: `test@test.com` / `test123`
- Employer: `employer@test.com` / `employer123`

---

## Environment

Copy `.env.example` to `.env`. Required variables:

```
PORT=3000
JWT_SECRET=your-secret
```

Optional (features degrade gracefully without them):

```
# OAuth
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET

# AI
GROQ_API_KEY

# Caching / queues
REDIS_URL
```

See `OAUTH_SETUP_GUIDE.md` and `REDIS_SETUP.md` for detailed setup.

---

## Key API routes

```
POST /api/ml/parse-resume       # BERT resume parsing + job recommendations
POST /api/bert/skill-gaps       # Skill gap analysis
POST /api/bert/compare-job      # Resume ↔ job match score

POST /api/auth/register|login   # Traditional auth
GET  /api/auth/google|linkedin|github  # OAuth

GET  /api/jobs/recommendations  # AI job recommendations
POST /api/employer/jobs         # Post job + get matched candidates instantly

GET  /health                    # Service status
```

---

## Project layout

```
src/
  server/       # Express entry point, Passport strategies
  routes/       # Auth, jobs, employer, employee, BERT, chat, video
  services/     # Business logic — BERT, matching, skill gaps, career improvement
  ml/           # TF.js recommender, resume parser
  models/       # Sequelize models (User, Job, Resume, Conversation, Interview)
  middleware/   # JWT auth, RBAC, validation, rate limiting, error handling
  workers/      # Bull queue workers
  client/       # React frontend (pages, components, contexts, theme)
```

---

## Deploy

```bash
# Docker
docker-compose up -d

# PM2
npm run start:pm2

# Manual
npm run build:client && npm start
```

---

## Docs

- [`BERT_INTEGRATION.md`](./BERT_INTEGRATION.md) — how the BERT resume pipeline works
- [`OAUTH_SETUP_GUIDE.md`](./OAUTH_SETUP_GUIDE.md) — configuring OAuth providers
- [`REDIS_SETUP.md`](./REDIS_SETUP.md) — Redis for caching and job queues
