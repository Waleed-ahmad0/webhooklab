# WebhookLab

A developer tool for inspecting, storing, and replaying incoming webhooks — think **Postman meets a webhook inspector**. Point any third-party service (GitHub, Stripe, Discord, Shopify, etc.) at a WebhookLab endpoint, and see every request it sends in real time: full headers, full body, and the ability to replay it against your own server whenever you need to.

**Live app:** [https://webhooklab-lilac.vercel.app](https://webhooklab-lilac.vercel.app)
**Backend API:** hosted on Railway

---

## Why this exists

Debugging webhook integrations is painful: you can't easily see what a third-party service actually sent you, and reproducing a bug means triggering a brand-new real-world event (another commit, another test payment) every single time. WebhookLab solves both problems — it captures every request exactly as it arrived, and lets you replay any of them on demand.

## Features

- **Workspaces & Endpoints** — organize webhook inboxes by project or provider (e.g. a "GitHub" workspace, a "Stripe" workspace), each endpoint gets a unique, unguessable URL
- **Universal request capture** — accepts *any* HTTP method, not just POST, since real-world webhook providers don't always agree on one
- **Full request inspection** — view complete headers and pretty-printed JSON body for every captured request
- **Replay** — resend any stored request, with its original method/headers/body intact, to any target URL you choose
- **Authentication** — hand-rolled JWT-based auth (signup/login), with ownership checks enforced on every workspace, endpoint, and request

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL ([Neon](https://neon.tech)) |
| ORM | Prisma |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` password hashing |
| Deployment | Vercel (frontend) · Railway (backend) |

## Architecture

```
User → Workspace → Endpoint → WebhookRequest
```

A user owns workspaces, each workspace holds one or more endpoints, and every endpoint accumulates a history of `WebhookRequest` records — one per incoming call, storing the exact method, headers, and body received.

```
Third-party service (GitHub, Stripe, etc.)
          │
          │  POST /webhook/api/h/:token
          ▼
   Express API (Railway)
          │
          ├── Verifies endpoint by token
          ├── Stores request via Prisma
          ▼
     PostgreSQL (Neon)
          │
          ▼
   Next.js frontend (Vercel) — list, inspect, replay
```

## Getting Started

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:
```
DATABASE_URL=your-postgres-connection-string
JWT_SECRET=a-long-random-secret
PORT=4000
FRONTEND_URL=http://localhost:3000
```

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

```bash
npm run dev
```

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/register` | Create a new user account |
| POST | `/api/login` | Authenticate and receive a JWT |
| POST | `/webhook/api/workspace` | Create a workspace |
| GET | `/webhook/api/workspaces` | List the current user's workspaces |
| POST | `/webhook/api/endpoint` | Create an endpoint in a workspace |
| GET | `/webhook/api/workspaces/endpoints/:workspaceId` | List endpoints in a workspace |
| ALL | `/webhook/api/h/:token` | Public webhook receiver — accepts any incoming request |
| GET | `/webhook/api/endpoint/request/:endpointId` | List all requests received by an endpoint |
| GET | `/webhook/api/request/:requestId` | Get full detail of one request |
| POST | `/webhook/api/request/:requestId/replay` | Replay a stored request to a target URL |

All routes except registration, login, and the webhook receiver require a valid JWT (`Authorization: Bearer <token>`).

## Roadmap

Deliberately out of scope for this version, kept here as future direction rather than unfinished work:

- **OAuth login** (Google / GitHub / Discord) — schema already supports it
- **CLI tunneling** — forward webhooks to `localhost` during local development, ngrok-style
- **Realtime updates** — WebSockets/SSE so new requests appear without a manual refresh
- **Team workspaces** — shared access, roles, and API keys
- **Search & filtering** — across large volumes of stored requests

