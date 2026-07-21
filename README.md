# Exam Portal

Exam Portal is a production-oriented online examination platform serving administrators,
teachers, and students. The repository currently includes the Phase 1 application foundation,
the Phase 2 PostgreSQL/Prisma data model, the Phase 3 server-side authentication API, and the
Phase 4 Admin Panel APIs.

The client-side authentication experience, feature screens, and exam business logic remain
reserved for later phases.

## Technology stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, TanStack React Query
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Neon in production), Prisma ORM
- **Authentication and email:** JWT, Bcrypt, Nodemailer
- **Planned file storage:** Cloudinary with a local development fallback
- **Future deployment:** Vercel for the client, Render for the API, Neon for PostgreSQL

## Repository structure

```text
.
├── client/
│   ├── public/
│   └── src/
│       ├── components/  Reusable presentation components
│       ├── context/     Application-level providers
│       ├── hooks/       Shared React hooks
│       ├── layouts/     Public and role-route layouts
│       ├── pages/       Route-level placeholders
│       ├── routes/      Public and role-protected route groups
│       ├── services/    API/query infrastructure
│       └── utils/       Framework-independent helpers
└── server/
    ├── prisma/          Prisma schema, migrations, and development seed
    └── src/
        ├── config/      Environment, CORS, and Prisma configuration
        ├── controllers/ HTTP request handlers
        ├── middlewares/ Logging, 404, and centralized error handling
        ├── routes/      Express route composition
        ├── services/    Infrastructure-facing application services
        └── utils/       Shared server utilities
```

The client has a public route shell and separate Admin, Teacher, and Student route boundaries.
Those client boundaries remain structural until the authentication UI phase; authorization is
currently enforced by the server API.

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- A PostgreSQL database, either local or hosted on Neon, for a connected health check and Prisma
  Studio

## Run locally

Clone the repository, then use two terminals from the repository root.

### 1. Start the client

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The placeholder uses Tailwind utilities and links to each role route
group.

The client does not consume browser-visible environment variables in Phase 1. Its `.env.example`
documents the project-wide environment contract without exposing any value to Vite.

### 2. Configure and start the API

Copy the server environment template:

```bash
cd server
cp .env.example .env
```

PowerShell equivalent:

```powershell
cd server
Copy-Item .env.example .env
```

Replace `DATABASE_URL` with a valid PostgreSQL or Neon connection string, set a strong
`JWT_SECRET`, and provide working `SMTP_*` values to exercise email verification and password
reset. Keep all real credentials in `server/.env`, which Git ignores. Then install and start the
API:

```bash
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. Check it with:

```bash
curl http://localhost:5000/api/health
```

Expected response with a reachable database:

```json
{
  "status": "ok",
  "db": "connected"
}
```

If PostgreSQL is not reachable, the endpoint still returns HTTP 200 with `"db": "disconnected"`;
this keeps the process health visible while reporting dependency status accurately.

### Authentication API

All authentication routes are mounted below `/api/auth`:

| Method | Route              | Access                                      |
| ------ | ------------------ | ------------------------------------------- |
| `POST` | `/register`        | Public, rate-limited; creates Students only |
| `POST` | `/verify-email`    | Public, rate-limited                        |
| `POST` | `/resend-otp`      | Public, rate-limited                        |
| `POST` | `/login`           | Public, rate-limited                        |
| `POST` | `/forgot-password` | Public, rate-limited                        |
| `POST` | `/reset-password`  | Public, rate-limited                        |
| `GET`  | `/me`              | Bearer JWT required                         |
| `GET`  | `/admin-check`     | Admin Bearer JWT required                   |

Registration and reset codes expire after 10 minutes. Configure SMTP before using email-backed
flows; the API never returns codes in its responses.

### Admin API

Every route below `/api/admin` requires an Admin Bearer JWT:

| Method                   | Route                      | Purpose                                    |
| ------------------------ | -------------------------- | ------------------------------------------ |
| `GET`                    | `/dashboard`               | Student, Teacher, Subject, and Exam totals |
| `POST`, `GET`            | `/students`                | Create or list Students                    |
| `GET`, `PATCH`           | `/students/:id`            | Read or update one Student                 |
| `PATCH`                  | `/students/:id/activate`   | Activate a Student                         |
| `PATCH`                  | `/students/:id/deactivate` | Deactivate a Student                       |
| `POST`, `GET`            | `/teachers`                | Create or list Teachers                    |
| `GET`, `PATCH`           | `/teachers/:id`            | Read or update one Teacher                 |
| `PATCH`                  | `/teachers/:id/activate`   | Activate a Teacher                         |
| `PATCH`                  | `/teachers/:id/deactivate` | Deactivate a Teacher                       |
| `POST`, `GET`            | `/subjects`                | Create or list Subjects                    |
| `GET`, `PATCH`, `DELETE` | `/subjects/:id`            | Read, update, or safely delete a Subject   |

Student and Teacher lists support `page`, `limit`, and case-insensitive `search` query parameters.
Admin-created accounts receive the existing password-reset email so their owner can establish a
password without an Admin handling it. Deactivated accounts retain their historical data but
cannot log in.

## Prisma

After setting a valid `DATABASE_URL`, apply migrations, generate Prisma Client, seed development
data, or open Prisma Studio from `server/`:

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed
npx prisma studio
```

`npm install` also generates Prisma Client automatically.

The idempotent seed provisions active, verified development Admin, Teacher, and Student accounts.
Demo seeding is intentionally disabled when `NODE_ENV=production`.

## Code quality

Run checks independently in each application:

```bash
cd client
npm run lint
npm run format:check
npm run build
```

```bash
cd server
npm run lint
npm run format:check
```

Use `npm run format` in either folder to apply the shared Prettier conventions.

## Environment variables

Both application templates list the shared project environment contract:

| Variable                | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL/Neon connection string used by Prisma              |
| `JWT_SECRET`            | JWT signing key and OTP-digest key; use a strong random value |
| `JWT_EXPIRES_IN`        | Access-token lifetime accepted by `jsonwebtoken`              |
| `CLOUDINARY_CLOUD_NAME` | Future Cloudinary account name                                |
| `CLOUDINARY_API_KEY`    | Future Cloudinary API key                                     |
| `CLOUDINARY_API_SECRET` | Future Cloudinary API secret                                  |
| `SMTP_HOST`             | SMTP server host for verification and reset emails            |
| `SMTP_PORT`             | SMTP server port (`465` enables TLS-at-connect)               |
| `SMTP_USER`             | SMTP username and message sender address                      |
| `SMTP_PASS`             | SMTP password                                                 |
| `CLIENT_URL`            | Allowed browser origin for API CORS                           |
| `PORT`                  | Express listening port                                        |

Never commit real credentials. All `.env` files are ignored; `.env.example` files are intentionally
tracked.
