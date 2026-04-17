# Waitery — Backend

REST API + WebSocket server for a restaurant order management system. Waiters and customers can browse the menu and place orders; cooks and admins manage the operation in real time.

## Tech Stack

- **Runtime**: Node.js + NestJS 11
- **Database**: PostgreSQL via Prisma 7 (with `@prisma/adapter-pg`)
- **Auth**: JWT (HS256) with `user-agent` + IP binding
- **Real-time**: Socket.io (WebSocket gateway, server → client broadcasts)
- **Storage**: AWS S3 (presigned URL flow via Lambda)
- **Observability**: Sentry
- **Validation**: class-validator + Zod (Prisma middleware layer)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local databases)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL containers
#    App DB on :5432, Test DB on :5433
docker-compose up -d

# 3. Set environment variables (see Environment section below)
cp .env.example .env

# 4. Apply database migrations and generate Prisma client
npx prisma migrate dev
npx prisma generate

# 5. Start in development mode
npm run start:dev
```

Swagger docs are available at `http://localhost:3000/docs` in `DEV` mode.

## Commands

```bash
npm run start:dev          # Run with file watching
npm run typecheck          # TypeScript type checking
npm run lint               # ESLint with auto-fix
npm run format             # Prettier

npm test                                      # Run all tests
npm test -- path/to/file.spec.ts              # Run a single test file
npm run test:watch                            # Watch mode
npm run test:cov                              # With coverage

npm run build                                 # Build + upload Sentry source maps
npx prisma migrate dev                        # Apply migrations (dev)
npx prisma generate                           # Regenerate Prisma client
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (app DB, port 5432) |
| `DATABASE_URL_TEST` | PostgreSQL connection string (test DB, port 5433) |
| `NODE_ENV` | `DEV`, `PROD`, or `test` |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `AWS_ACCESS_KEY_ID` | AWS credentials for S3 uploads |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for S3 uploads |
| `AWS_BUCKET_NAME` | S3 bucket name |
| `LAMBDA_URL` | Lambda endpoint that returns presigned upload URLs |
| `GOOGLE_MAPS_API_KEY` | Google Maps Geocoding API key |
| `SENTRY_DSN` | Sentry DSN for error tracking |

> **Note**: `src/shared/config/env.ts` validates all env vars on startup and **crashes the process** if any are missing or invalid.

## Project Structure

```
src/
├── core/
│   ├── application/contracts/   # Service interfaces + companion namespaces
│   └── domain/entities/         # Immutable domain entities + factory functions
├── modules/                     # Feature modules (auth, user, order, product, …)
│   └── <module>/
│       ├── usecases/            # One @Injectable class per business operation
│       ├── repo/                # Repository interface implementation
│       ├── dto/                 # Request/response DTOs with class-validator
│       └── tests/               # Unit and integration tests
├── infra/
│   ├── database/                # Prisma service + Zod validation middleware
│   ├── storage/                 # S3 upload/delete/get via undici
│   └── observability/           # Sentry wrapper
└── shared/
    ├── config/env.ts            # Env validation (throws on invalid config)
    └── constants.ts             # DI token strings
```

## Roles

| Role | Description |
|---|---|
| `OWNER` | Full access |
| `ADMIN` | Manages menu and staff |
| `WAITER` | Creates and manages table orders |
| `CLIENT` | Views menu and places orders |
