# Exam Portal

Exam Portal is a production-oriented foundation for an online examination platform serving
administrators, teachers, and students. This repository currently contains **Phase 1 only**:
application scaffolding, routing boundaries, database connectivity infrastructure, developer
tooling, and documentation.

Authentication, database models, migrations, feature screens, and exam business logic are
deliberately reserved for later phases.

## Technology stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, TanStack React Query
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Neon in production), Prisma ORM
- **Planned integrations:** JWT and Bcrypt, Cloudinary with a local development fallback,
  Nodemailer
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
    ├── prisma/          Prisma schema; models and migrations come later
    └── src/
        ├── config/      Environment, CORS, and Prisma configuration
        ├── controllers/ HTTP request handlers
        ├── middlewares/ Logging, 404, and centralized error handling
        ├── routes/      Express route composition
        ├── services/    Infrastructure-facing application services
        └── utils/       Shared server utilities
```

The client has a public route shell and separate Admin, Teacher, and Student route boundaries.
Those boundaries do not enforce access yet; they provide the seams where authentication and
authorization will be added in the authentication phase.

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

Replace `DATABASE_URL` in `server/.env` with a valid PostgreSQL or Neon connection string. The
remaining values are placeholders for later phases and should stay non-secret in committed files.
Then install and start the API:

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

## Prisma

The Prisma schema intentionally contains no models or migrations in Phase 1. After setting a valid
`DATABASE_URL`, generate the client or open Prisma Studio from `server/`:

```bash
npm run prisma:generate
npx prisma studio
```

`npm install` also generates Prisma Client automatically.

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

Both application templates list the complete Phase 1 environment contract:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL/Neon connection string used by Prisma |
| `JWT_SECRET` | Signing secret reserved for the authentication phase |
| `JWT_EXPIRES_IN` | Future access-token lifetime |
| `CLOUDINARY_CLOUD_NAME` | Future Cloudinary account name |
| `CLOUDINARY_API_KEY` | Future Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Future Cloudinary API secret |
| `SMTP_HOST` | Future SMTP server host |
| `SMTP_PORT` | Future SMTP server port |
| `SMTP_USER` | Future SMTP username |
| `SMTP_PASS` | Future SMTP password |
| `CLIENT_URL` | Allowed browser origin for API CORS |
| `PORT` | Express listening port |

Never commit real credentials. All `.env` files are ignored; `.env.example` files are intentionally
tracked.
