# EventCraft – Event Management Platform

Source-structure sample of an event platform (ticketing, agenda, attendees, check-in, livestream).
This repo shows how the codebase is organised; it is **not** a runnable deployment (env files and build output are stripped; see `.env.example` in each folder).

## Repository layout

```
backend/    Node.js + TypeScript API (GraphQL + REST)
  src/graphql      schema, resolvers, dataloaders, plugins, context
  src/rest         REST routes (webhooks, uploads, health)
  src/modules      auth, settings
  src/models       Mongoose models
  src/repositories data-access layer
  src/services     business logic (tickets, payments, emails ...)
  src/workers/jobs BullMQ queues and workers
frontend/   React + Vite web app
  src/features     agenda, analytics, attendees, auth, automation, checkin, dashboard, events, livestream, settings, tickets
  src/graphql      queries, fragments, generated types
  src/lib          apollo, auth, http clients
```

## Technologies

| Layer | Stack |
|-------|-------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Apollo Client (+ graphql-ws subscriptions), Redux Toolkit, Zustand, React Router, Recharts, Stripe Elements, Daily.co (livestream), Vitest, ESLint/Prettier, Husky |
| Backend | Node.js, TypeScript, Express 5, Apollo Server (GraphQL), Swagger (REST docs), Zod validation, Socket.IO, DataLoader |
| Data | MongoDB (Mongoose), Redis (ioredis) |
| Jobs | BullMQ workers (emails, automation, reports) |
| Integrations | Stripe, Cloudinary, Passport (Google, GitHub OAuth), JWT, QR code tickets |
| DevOps | Docker (`Dockerfile`, `Dockerfile.dev`), GitHub Actions, Vercel configs, pnpm, Jest |

## How the code flows

1. **Auth** – the frontend signs in with email/password or Google/GitHub (Passport on the backend). The API issues a JWT stored in cookies; `lib/auth` and `lib/http` attach it to requests.
2. **Data fetching** – feature modules in `frontend/src/features/*` call GraphQL operations through Apollo Client; subscriptions (graphql-ws) deliver live updates such as check-ins.
3. **GraphQL layer** – `backend/src/graphql/resolvers` validate input (Zod), call services, and use DataLoader to batch database reads.
4. **Domain layer** – `services` contain business rules; `repositories` wrap Mongoose `models` so persistence is isolated.
5. **Background work** – services enqueue BullMQ jobs (Redis); workers in `src/workers` send emails, run automations and handle Stripe webhook follow-ups.
6. **REST** – `src/rest` exposes webhooks (Stripe), file upload (Cloudinary) and health endpoints, documented through Swagger.
7. **Deploy** – Docker images / Vercel for the web app, GitHub Actions for CI.

## Running locally (reference)

`pnpm install` in each folder -> copy `.env.example` to `.env.dev` and fill values -> `pnpm dev` in `backend/` and `frontend/`.
