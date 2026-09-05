# WebhookLab

A developer tool for inspecting, storing, and replaying incoming webhooks — think **Postman meets a webhook inspector**. Point any third-party service (GitHub, Stripe, Discord, Shopify, etc.) at a WebhookLab endpoint, and watch every request it sends arrive live: full headers, full body, updating in real time — with the ability to replay any of them against your own server whenever you need to.

**Live app:** [https://webhooklab-lilac.vercel.app](https://webhooklab-lilac.vercel.app)
**Backend API:** hosted on Railway

---

## Why this exists

Debugging webhook integrations is painful: you can't easily see what a third-party service actually sent you, and reproducing a bug means triggering a brand-new real-world event (another commit, another test payment) every single time. WebhookLab solves both problems — it captures every request exactly as it arrived, streams it to your dashboard the instant it lands, and lets you replay any of them on demand.

## Features

- **Workspaces & Endpoints** — organize webhook inboxes by project or provider (e.g. a "GitHub" workspace, a "Stripe" workspace), each endpoint gets a unique, unguessable URL
- **Universal request capture** — accepts *any* HTTP method, not just POST, since real-world webhook providers don't always agree on one
- **Live updates** — new requests appear instantly via Server-Sent Events, no manual refresh needed, even across multiple open tabs
- **Full request inspection** — view complete headers and pretty-printed JSON body for every captured request
- **Replay** — resend any stored request, with its original method/headers/body intact, to any target URL you choose
- **Authentication** — email/password and OAuth (Google, GitHub, Discord) via Auth.js, with ownership checks enforced on every workspace, endpoint, and request

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL ([Neon](https://neon.tech)) |
| ORM | Prisma |
| Auth | Auth.js (`@auth/express`) — Credentials + Google/GitHub/Discord OAuth |
| Realtime | Server-Sent Events (SSE) |
| Deployment | Vercel (frontend) · Railway (backend) |

## Architecture

```
User → Workspace → Endpoint → WebhookRequest
```

A user owns workspaces, each workspace holds one or more endpoints, and every endpoint accumulates a history of `WebhookRequest` records — one per incoming call, storing the exact method, headers, and body received.

```
Third-party service (GitHub, Stripe, etc.)
          │
          │  ALL /webhook/api/h/:token
          ▼
   Express API (Railway)
          │
          ├── Verifies endpoint by token
          ├── Stores request via Prisma
          ├── Broadcasts to open SSE connections
          ▼
     PostgreSQL (Neon)
          │
          ▼
   Next.js frontend (Vercel) — live list, inspect, replay
```

Auth and normal API calls from the frontend are routed through Next.js rewrites to the backend. The SSE connection is a dedicated Next.js Route Handler that proxies the stream directly (rewrites don't reliably support long-lived streaming connections), forwarding the session cookie manually so authentication still applies.

## Getting Started

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:
```
DATABASE_URL=your-postgres-connection-string
AUTH_SECRET=a-long-random-secret
PORT=4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# OAuth providers (optional, only needed for social login)
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_DISCORD_ID=...
AUTH_DISCORD_SECRET=...
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
BACKEND_URL=http://localhost:4000
```

```bash
npm run dev
```

## API Overview

| Method | Route | Description |
|---|---|---|
| * | `/auth/*` | Auth.js — signin, callback, session, signout (Credentials + OAuth) |
| POST | `/api/register` | Create a new user account |
| POST | `/webhook/api/workspace` | Create a workspace |
| GET | `/webhook/api/workspaces` | List the current user's workspaces |
| POST | `/webhook/api/endpoint` | Create an endpoint in a workspace |
| GET | `/webhook/api/workspaces/endpoints/:workspaceId` | List endpoints in a workspace |
| ALL | `/webhook/api/h/:token` | Public webhook receiver — accepts any incoming request |
| GET | `/webhook/api/endpoint/request/:endpointId` | List all requests received by an endpoint |
| GET | `/webhook/api/endpoint/:endpointId/stream` | Live SSE stream of new requests for an endpoint |
| GET | `/webhook/api/request/:requestId` | Get full detail of one request |
| POST | `/webhook/api/request/:requestId/replay` | Replay a stored request to a target URL |

All routes except registration, `/auth/*`, and the webhook receiver require a valid session (Auth.js session cookie).

## Roadmap

Deliberately out of scope for this version, kept here as future direction rather than unfinished work:

- **CLI tunneling** — forward webhooks to `localhost` during local development, ngrok-style
- **Team workspaces** — shared access, roles, and API keys
- **Search & filtering** — across large volumes of stored requests
- **Signature verification** — validate HMAC signatures from providers like GitHub/Stripe