# E-Banking Platform

A full-stack digital banking simulator built on the MERN stack. It combines retail banking, peer-to-peer transfers, a Razorpay-style merchant payment gateway, UPI-style collect requests and QR payments, an admin console, and an event-driven backend.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick start with Docker](#quick-start-with-docker)
- [Local development](#local-development)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Idempotency](#idempotency)
- [Events and background jobs](#events-and-background-jobs)
- [Webhooks](#webhooks)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Operational notes](#operational-notes)

## Features

- OTP-verified registration and password reset
- JWT authentication with `USER` and `ADMIN` roles
- Multiple bank accounts per user (`SAVINGS`, `CURRENT`)
- Atomic money transfers with balance checks inside MongoDB transactions
- Merchant developer accounts with one-time secret keys and hashed storage
- Payment gateway: create order, verify payment, refund
- Webhook subscriptions with HMAC-SHA256 signatures, delivery logs, and retries
- UPI IDs, scan-to-pay, and collect requests
- QR code generation and QR payments
- In-app notifications (welcome, transfer, payment, refund, failure)
- Admin dashboard: users, accounts, transactions, payments, merchants, webhooks, deliveries, notifications
- Redis-backed caching, rate limiting, OTP storage, event deduplication, and BullMQ queues
- Kafka (Redpanda) domain events with graceful in-process fallback
- Prometheus metrics at `/metrics` and optional Grafana
- Structured JSON logging with request IDs

## Architecture

```text
Browser (React + Vite)
        |
        | /api
        v
Nginx (web container) ---> Express API (backend container)
                                 |
        +------------------------+------------------------+
        |            |           |            |           |
      MongoDB      Redis      Redpanda     Mailpit    Prometheus
    (replica set) (cache/     (Kafka)      (SMTP)         |
                  queues)                                 v
                                                     Grafana
```

The application is a modular monolith: one Express service with controllers, routes, models, middleware, infrastructure adapters, and a Kafka consumer.

### Ports

| Service | URL / port |
| --- | --- |
| Web app (Nginx) | http://localhost:8080 |
| Backend API | http://localhost:5000 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |
| Redpanda (host listener) | localhost:19092 |
| Redpanda Console | http://localhost:8081 |
| Mailpit UI / SMTP | http://localhost:8025 / localhost:1025 |
| Prometheus (profile) | http://localhost:9090 |
| Grafana (profile) | http://localhost:3000 |

## Quick start with Docker

Prerequisites: Docker Desktop (or Docker Engine with Compose v2).

```bash
docker compose up -d --build
```

Optional observability stack:

```bash
docker compose --profile observability up -d
```

Open http://localhost:8080. Emails (including OTPs) are captured by Mailpit at http://localhost:8025.

The backend seeds an admin account on startup from `ADMIN_EMAIL` / `ADMIN_PASSWORD`:

```text
Email:    admin@ebank.local
Password: Admin@12345
```

Change these values before exposing the stack. The default `JWT_SECRET` and `OTP_PEPPER` in `docker-compose.yml` are development values only.

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v   # also deletes MongoDB, Redis, Redpanda, Prometheus, Grafana data
```

## Local development

Requirements:

- Node.js 20+
- MongoDB running as a replica set named `rs0` (transactions are required)
- Redis
- Redpanda/Kafka (optional; events fall back to an in-process bus)
- An SMTP server for OTP email (Mailpit is easiest)

Start MongoDB as a single-node replica set:

```bash
docker run -d --name ebank-mongo -p 27017:27017 mongo:7 \
  --replSet rs0 --bind_ip_all

docker exec ebank-mongo mongosh --quiet --eval \
  "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

Start supporting services only:

```bash
docker compose up -d mongo redis redpanda mailpit
```

Install dependencies and run both apps:

```bash
npm run install:all
npm run dev:backend    # http://localhost:5000
npm run dev:frontend   # http://localhost:5173
```

Create `Backend/.env` from `Backend/.env.example` and adjust values. The Vite dev server proxies `/api` to `http://localhost:5000`.

Other root scripts:

```bash
npm run build:frontend
npm run start:backend
npm test
npm run docker:up
npm run docker:down
npm run docker:reset
npm run docker:logs
npm run docker:observability
```

## Configuration

Docker Compose variables can be set in a root `.env` (see `.env.example`). Backend variables are documented in `Backend/.env.example`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `development` locally, `production` in Compose |
| `PORT` | API port | `5000` |
| `MONGO_URI` | MongoDB connection string; must include `replicaSet=rs0` for transactions | `mongodb://localhost:27017/ebank?replicaSet=rs0` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_PREFIX` | Key prefix for cache, limits, OTPs, dedupe | `ebank` |
| `KAFKA_ENABLED` | Set to `false` to disable Kafka | `true` |
| `KAFKA_BROKERS` | Comma-separated brokers | empty locally, `redpanda:29092` in Compose |
| `KAFKA_CLIENT_ID` | Kafka client id | `ebank-backend` |
| `KAFKA_GROUP_ID` | Consumer group id | `ebank-backend-consumer` |
| `JWT_SECRET` | JWT signing secret (required in production) | development placeholder |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost:8080` |
| `OTP_PEPPER` | HMAC pepper for OTP hashes | development placeholder |
| `OTP_TTL_SECONDS` | OTP and verification-token lifetime | `600` |
| `OTP_MAX_ATTEMPTS` | OTP verification attempts | `5` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | SMTP settings | empty / `1025` / `false` |
| `SMTP_USER`, `SMTP_PASS` | SMTP credentials | empty |
| `EMAIL_SERVICE` | Nodemailer service shortcut (for example Gmail) | empty |
| `EMAIL_FROM` | Sender address | `E-Banking <no-reply@ebank.local>` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Seeded admin account | `Platform Admin`, `admin@ebank.local`, `Admin@12345` |
| `WEBHOOK_ALLOW_PRIVATE` | Allow private/localhost webhook targets (dev only) | `false` locally, `true` in Compose |
| `WEBHOOK_TIMEOUT_MS` | Webhook request timeout | `8000` |
| `WEBHOOK_MAX_ATTEMPTS` | Webhook retry attempts | `5` |
| `LOG_LEVEL` | Pino log level | `info` |
| `TRUST_PROXY` | Trust proxy headers | enabled unless `false` |
| `SHUTDOWN_TIMEOUT_MS` | Graceful shutdown timeout | `10000` |

In production, `MONGO_URI` and `JWT_SECRET` are required; startup fails if they are missing.

## API overview

All routes are under `/api`. Authenticated routes expect `Authorization: Bearer <JWT>`. Merchant API routes accept the developer secret key as a Bearer token.

### Users — `/api/user`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/send-register-otp` | Email a registration OTP |
| POST | `/verify-register-otp` | Verify OTP, returns a short-lived `verificationToken` |
| POST | `/register` | Create user with the verification token |
| POST | `/login` | Login and obtain a JWT |
| POST | `/forgot-password` | Email a reset OTP |
| POST | `/reset-password` | Reset password using email + OTP |
| POST | `/reset-password-logged-in` | Change password while authenticated |
| GET | `/me` | Current user profile |

### Accounts — `/api/accounts`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/create` | Create an account (`SAVINGS` or `CURRENT`) |
| GET | `/me/accountLists` | List the current user's accounts |
| GET | `/me/:accountNumber` | Get one of the current user's accounts |
| GET | `/` | Admin: list all accounts |
| PUT | `/status` | Admin: set account status |
| PUT | `/:accountNumber` | Admin: update account info |
| DELETE | `/:accountNumber` | Admin: delete account |

### Transactions — `/api/transactions`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/credit` | Credit the current user's own account |
| POST | `/transfer` | Transfer between accounts |
| GET | `/me` | Current user's transaction history |
| GET | `/recent-accounts` | Recently used counterparty accounts |
| GET | `/between?toAccount=...` | Transactions with a specific account |
| POST | `/admin-adjust` | Admin: credit or debit any account |

### Admin — `/api/admin`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/login` | Admin login |
| GET | `/stats` | Dashboard statistics |
| GET | `/accounts` | All accounts with user details |
| PUT | `/accounts/status` | Freeze, close, or activate an account |
| GET | `/users` | List users |
| PATCH | `/users/:id/status` | Activate or deactivate a user |
| GET | `/transactions` | Recent transactions |
| GET | `/payments` | Recent payments |
| GET | `/merchants` | Developer accounts |
| GET | `/webhooks` | Webhook registrations |
| GET | `/deliveries` | Webhook delivery attempts |
| POST | `/notify` | Send an in-app notification to a user |

### Developer / merchant — `/api/developer`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/create` | Create a developer account linked to one of your accounts |
| GET | `/me` | Current developer account |
| POST | `/regenerate-secret` | Rotate the secret key |
| GET | `/:merchantId` | Public merchant info |

The secret key is returned only on creation or rotation. Only its SHA-256 hash and a preview are stored.

### Payment gateway — `/api/pg`

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/create-order` | Merchant secret | Create an order |
| POST | `/verify` | User JWT | Pay an order from an account |
| POST | `/refund` | Merchant secret | Refund a payment by `paymentId` or `orderId` |
| GET | `/order/:orderId` | Public | Order status and merchant name |

### Webhooks — `/api/webhook`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/register` | Register or update a webhook URL and signing secret |
| GET | `/` | Current webhook configuration |
| GET | `/deliveries` | Delivery log with status, attempts, and response codes |

### UPI — `/api/upi`

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/create-id` | Create a `name@ebank` UPI ID |
| POST | `/scan-pay` | Pay a UPI ID from an account |
| POST | `/collect-request` | Request money from another UPI ID |
| GET | `/pending-requests` | Incoming collect requests |
| POST | `/collect-approve` | Approve and pay a collect request |
| GET | `/resolve/:upiId` | Resolve a UPI ID to a display name |

### QR — `/api/qr`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/me` | Current user's QR code |
| POST | `/pay` | Pay an account via QR data |

### Notifications — `/api/notifications`

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/` | List notifications and unread count |
| PATCH | `/read-all` | Mark all as read |
| PATCH | `/:id/read` | Mark one as read |

### Health and metrics

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/ready` | Readiness with MongoDB and Redis checks |
| GET | `/metrics` | Prometheus metrics |

## Idempotency

Mutating money endpoints accept an `Idempotency-Key` header (or an `idempotencyKey` body field):

- `POST /api/transactions/credit`
- `POST /api/transactions/transfer`
- `POST /api/transactions/admin-adjust`
- `POST /api/pg/verify`
- `POST /api/upi/scan-pay`
- `POST /api/upi/collect-approve`
- `POST /api/qr/pay`

Responses are cached in Redis per principal and key. Replaying the same request returns the original response without moving money again. Concurrent requests with the same key receive `409` while the first is in flight.

## Events and background jobs

Domain events are published to Kafka when enabled and available; otherwise they are handled in-process. Consumers deduplicate by event ID in Redis.

Topics:

```text
auth.otp.requested
user.registered
txn.completed
txn.failed
payment.succeeded
payment.failed
payment.refunded
webhook.deliver
admin.action
notification.send
```

BullMQ queues (Redis-backed):

| Queue | Work | Retry policy |
| --- | --- | --- |
| `email` | Send transactional email | 3 attempts, exponential backoff |
| `webhook` | Deliver signed webhooks | `WEBHOOK_MAX_ATTEMPTS` (default 5), exponential backoff |

Event consumers create in-app notifications and enqueue emails. Webhook workers update each `WebhookDelivery` record (`PENDING`, `SUCCESS`, `FAILED`, attempts, response status, error).

## Webhooks

Register a URL with a signing secret of at least 16 characters. Deliveries include:

```text
x-ebank-event: payment.succeeded
x-ebank-event-id: <uuid>
x-ebank-timestamp: <unix seconds>
x-ebank-signature: sha256=<hex>
```

The signature is `HMAC-SHA256(secret, "<timestamp>.<raw-body>")`. Verify it against the raw request body.

Webhook URLs are validated to reduce SSRF risk. Private and loopback targets are rejected unless `WEBHOOK_ALLOW_PRIVATE=true`, which is intended for local development only.

## Testing

```bash
cd Backend && npm test
```

Unit tests cover OTP generation, private-address detection, webhook payload signing, and webhook URL validation.

Build the frontend:

```bash
cd Frontend && npm run build
```

An end-to-end smoke flow should cover: OTP registration through Mailpit, login, account creation, admin credit, transfer plus idempotent replay, transaction history, event-driven notifications, developer account creation, order payment, refund, admin dashboard endpoints, and the Nginx SPA/API proxy.

## Project structure

```text
.
├── Backend
│   ├── Config/            # env parsing, Mongo connection, admin bootstrap
│   ├── Consumers/         # Kafka event consumer
│   ├── Controllers/       # request handlers and business logic
│   ├── Infrastructure/    # logger, redis, kafka, events, queues, mailer, metrics, webhooks
│   ├── Middleware/        # auth, RBAC, validation, rate limiting, idempotency, errors
│   ├── Models/            # Mongoose schemas
│   ├── Routes/            # Express routers
│   ├── Utils/             # OTP, HTTP errors, transactions, notifications
│   ├── tests/             # node:test unit tests
│   ├── app.js             # Express app
│   ├── sever.js           # process entrypoint (startup and graceful shutdown)
│   ├── Dockerfile
│   └── .env.example
├── Frontend
│   ├── src/               # React app, API clients, routes, pages, components
│   ├── nginx.conf         # SPA fallback and /api proxy
│   └── Dockerfile
├── infra
│   ├── prometheus/
│   └── grafana/provisioning/
├── docker-compose.yml
└── .env.example
```

## Operational notes

- MongoDB must run as a replica set because transfers, payments, refunds, UPI, QR, and admin adjustments use multi-document transactions.
- If Kafka or Redis is unavailable, the backend logs warnings and degrades where possible. Redis is required for OTPs, queues, caching, rate limiting, and idempotency, so a Redis outage breaks those features.
- OTPs are stored as HMAC-SHA256 hashes with `OTP_PEPPER`; the plaintext code only exists in the email.
- The Compose file ships development secrets and ports. Use real secrets, TLS termination, restricted CORS, and a private network for any deployment.
- Grafana and Prometheus only start with the `observability` profile.
