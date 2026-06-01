# Duet

A cozy mobile app for two close friends to stay connected through a shared, turn-based prompt ritual.

## What it does

Every day, both people receive the same question. Each writes or photographs their answer privately, then the answers are revealed to both at the same moment — only after both have responded. No peeking. No pressure. Just a quiet ritual that keeps two people genuinely in each other's lives.

Features:
- **Turn-based prompts** — text, photo, or link-style questions that rotate automatically
- **Simultaneous reveal** — answers only become visible once both people have responded
- **Streaks** — 48-hour windows keep you accountable without being punishing
- **Prompt suggestions** — either person can queue a custom question for the next round
- **Calendar view** — scroll back through every answered day together
- **Reactions** — leave a small emoji response on your partner's answer

---

## Project structure

```
.
├── artifacts/
│   ├── duet/              # Expo mobile app (iOS + Android + Web)
│   └── api-server/        # Express 5 REST API
├── lib/
│   ├── db/                # Drizzle ORM schema + migrations (PostgreSQL)
│   └── api-spec/          # OpenAPI spec + Orval codegen
└── scripts/               # Shared utility scripts
```

This is a **pnpm monorepo**. Each package manages its own dependencies.

---

## Stack

| Layer | Technology |
|---|---|
| Mobile | Expo (React Native), Expo Router |
| Fonts | Fraunces (serif) + Inter (sans-serif) |
| State | TanStack Query (React Query) |
| API | Express 5, Zod validation |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Device token (stored in AsyncStorage) |
| Codegen | Orval (OpenAPI → React Query hooks + Zod schemas) |
| Build | esbuild (CJS bundle for server) |

---

## Getting started

### Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL database (local or hosted)

### Environment variables

Create a `.env` file at the repo root (or set these in your environment):

```env
DATABASE_URL=postgres://user:password@host:5432/duet
SESSION_SECRET=your-secret-here
```

### Install dependencies

```bash
pnpm install
```

### Push the database schema

```bash
pnpm --filter @workspace/db run push
```

### Start the API server (development)

```bash
pnpm --filter @workspace/api-server run dev
```

### Start the Expo app (development)

```bash
pnpm --filter @workspace/duet run dev
```

---

## Key commands

| Command | What it does |
|---|---|
| `pnpm run typecheck` | Full typecheck across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas from OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes to the connected database |

---

## How it works

### Authentication

Users are identified by a **device token** — a UUID generated on first launch and stored in `AsyncStorage`. Every API request carries this token in the `X-Device-Token` header. There are no passwords, no email addresses.

```
POST /api/users           — create a user (returns deviceToken)
GET  /api/users/me        — verify + fetch current user
```

### Duet lifecycle

```
POST /api/duets           — create a duet (generates 6-char invite code)
POST /api/duets/join      — partner joins using the invite code
GET  /api/duets/:id       — poll for current state (6s interval)
POST /api/duets/:id/respond   — submit your answer
POST /api/duets/:id/next      — advance to the next prompt
POST /api/duets/:id/react     — leave an emoji reaction on a completed round
POST /api/duets/:id/suggest   — queue a custom prompt
DELETE /api/duets/:id/suggest/:suggestionId — remove your queued prompt
```

### Prompt sync guarantees

- Both players must respond before `/next` is accepted (`revealedAt` guard).
- `/next` uses an atomic `UPDATE … WHERE completedAt IS NULL` to prevent double-advance in race conditions (both players tapping "Next Prompt" within the same poll window).
- If the other player already advanced, the losing request gracefully returns the already-updated state.

### Custom prompts

Either player can suggest a custom question at any time. Suggestions are queued in order. When `/next` is called, the oldest pending suggestion is consumed and becomes the prompt text for the new round. If the queue is empty, the built-in rotating prompt list is used.

---

## Database schema

```
users              — id, displayName, avatarColor, avatarIcon, deviceToken
duets              — id, creatorId, partnerId, inviteCode, currentPromptIndex, streak, …
rounds             — id, duetId, promptIndex, customPrompt, creatorResponse, partnerResponse, revealedAt, completedAt, …
promptSuggestions  — id, duetId, suggestedById, promptText, promptType, status, …
```

---

## Design

- **Palette**: warm cream background (`#FAF7F2`), terracotta primary (`#C86B5E`), sage secondary (`#A3B19B`)
- **Typography**: Fraunces (display/headings) + Inter (body/UI)
- **Motion**: Reanimated 3 + Moti for entrance animations; `SlideInDown` bottom sheets

---

## Deployment

The app is deployed on Replit. The API server and Expo app run as separate workflow services behind a shared reverse proxy.

- API: `/api/*`
- Mobile web: `/`

To publish: use the Replit **Publish** button. The platform handles TLS, health checks, and process management.
