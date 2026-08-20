# Dr. Rashida Ahmad Consultation Platform

Production-oriented Next.js App Router application for online and clinic Ayurvedic appointments.

## Stack

- Next.js 15, React 19, TypeScript
- PostgreSQL with Prisma ORM
- HTTP-only signed JWT session cookie and bcrypt password hashing
- Server-side RBAC for Admin, Doctor, and Patient
- Transactional appointment creation with a database unique constraint for double-booking protection
- Persisted reminder jobs and a restart-safe worker command
- Provider boundaries for payments, notifications, video, and object storage

## Local setup

Required: Node.js 20+, PostgreSQL 14+, and optionally Redis for a production queue implementation.

```powershell
Copy-Item .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`.

After deployment, check `https://your-domain.example/api/health`. A `200` response means the app can reach PostgreSQL. A `503` response means the deployment's `DATABASE_URL`, network allowlist, SSL mode, or database service still needs configuration. Run the committed migrations with `npm run db:deploy` before testing login or booking.

The seed script hashes the development passwords before storing them. Seed credentials are never rendered in the frontend. Use the three development accounts only when `DEMO_MODE=true`, then remove or change them and set `DEMO_MODE=false` before launch.

## Demo login accounts

**DEVELOPMENT / DEMO ONLY. Do not use these credentials in production.**

- Admin: `admin@drrashida.com` / `Admin@12345`
- Doctor: `doctor@drrashida.com` / `Doctor@12345`
- Patient: `patient@drrashida.com` / `Patient@12345`

The seed stores only bcrypt password hashes in PostgreSQL. The passwords above are printed by `npm run db:seed` for local testing and are not displayed by the public UI.

## Commands

```powershell
npm run dev                 # local Next development server
npm run typecheck           # TypeScript validation
npm run build               # Prisma generate and production build
npm run start               # production server after build
npm run db:migrate          # development migration
npm run db:deploy           # deploy committed migrations in production
npm run db:seed             # development/demo seed
npm run db:check             # connection plus rollback-safe CRUD check
npm run db:reset            # guarded development reset; blocked in production
npm run worker:reminders    # process persisted reminder jobs once
```

Run `worker:reminders` from a persistent scheduler or worker service. For production, replace the one-shot runner with a process supervisor/cron or queue consumer that invokes the same persisted `ReminderJob` records. Do not use browser timers.

For a fresh development database, apply the committed migrations before seeding:

```powershell
npm run db:deploy
npm run db:seed
```

## Production configuration

1. Provision PostgreSQL and set `DATABASE_URL` using the exact connection string format shown in `.env.example`.
2. Generate a long random `AUTH_SECRET` and set `APP_URL` and `CLINIC_TIMEZONE`.
3. Run `npm run db:deploy` during deployment.
4. Create the initial admin through a protected seed/setup process with strong environment-provided credentials. Never expose the development passwords.
5. Configure an email/SMS/WhatsApp provider and replace `SandboxNotificationProvider` with the provider adapter in `lib/providers.ts`. Notification records and delivery logs are persisted in `Notification` and `NotificationLog`.
6. Configure object storage (S3-compatible or equivalent) and replace `ConfiguredObjectStorage` with an adapter that uploads server-side or issues short-lived signed upload URLs. Keep only storage keys in PostgreSQL; never store medical files on ephemeral app disk.
7. Configure the payment provider and implement its server-side checkout adapter. The webhook route is `/api/payments/webhook`; it requires `PAYMENT_WEBHOOK_SECRET`, verifies the provider signature, and updates payment transaction records. Never trust browser success callbacks.
8. Configure a production video provider and store meeting links only on authorized appointment records. Expose them through an authenticated endpoint, not public pages.
9. Run the application behind HTTPS and a process supervisor. Schedule the reminder worker as a durable service.

## Railway deployment

1. Push this repository to GitHub. Confirm `.env`, `.env.local`, `.env.production`, and all `.env.*` files except `.env.example` are ignored.
2. Create a Railway project.
3. Add a Railway PostgreSQL service.
4. Create an application service from the GitHub repository.
5. Set Railway variables:

```text
NODE_ENV=production
DEMO_MODE=false
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_URL=https://your-railway-domain.up.railway.app
AUTH_SECRET=<generate at least 32 random bytes locally>
CLINIC_TIMEZONE=Asia/Kolkata
PAYMENT_REQUIRED=false
PAYMENT_PROVIDER=test
EMAIL_PROVIDER=sandbox
EMAIL_FROM=
SMS_PROVIDER=sandbox
WHATSAPP_PROVIDER=sandbox
QUEUE_REDIS_URL=
VIDEO_PROVIDER=disabled
SEED_DEMO_ACCOUNTS=false
```

Set `DATABASE_URL` to the actual Railway PostgreSQL reference or connection string exposed by your Railway database service. Do not commit it. Generate `AUTH_SECRET` locally with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` and paste the output only into Railway variables.

6. Use `npm run build` or `npm run railway-build` as the Railway build command.
7. Use `npm start` as the Railway start command.
8. Deploy the application.
9. Run the production migration from a Railway shell or one-time deployment command:

```powershell
npx prisma migrate deploy
```

Never run `prisma migrate reset` or `prisma db push` against the Railway database.

10. Verify `https://your-railway-domain.up.railway.app/api/health`. A healthy response has HTTP `200` and `{"status":"ok","database":"connected"}`.
11. Test patient registration/login, doctor login/dashboard, admin login/dashboard, availability, booking, cancellation, and appointment management.

### Railway demo seed

Demo accounts are not created during a Railway production deploy. For a controlled development/staging database only, set `DEMO_MODE=true` and run:

```powershell
npx prisma db seed
```

The seed is idempotent and hashes the development passwords with bcrypt. Do not run it against a real patient database. To explicitly override the production guard for a controlled operation, set `SEED_DEMO_ACCOUNTS=true`, then remove that variable afterward.

### Railway optional services

- Payments remain disabled with `PAYMENT_REQUIRED=false` and `PAYMENT_PROVIDER=test` until a real provider adapter and webhook secret are configured.
- Email, SMS, and WhatsApp remain sandbox/no-op provider boundaries until credentials and adapters are configured.
- Redis is optional for this deployment. The persisted reminder and notification worker commands can be run as a separate Railway worker service when operationally configured; no localhost Redis URL is used in production.
- Permanent medical document storage requires a private S3-compatible object-storage adapter. Do not rely on Railway ephemeral local disk for patient files.

For a non-destructive pre-release check, run `npm run db:check`. It performs a connection query and creates, updates, and deletes a temporary setting inside a transaction that is deliberately rolled back. It does not reset or delete production data.

## Existing data and migrations

The old browser/local JSON fixture is no longer a runtime data source and has been removed because it contained plaintext demo credentials. Persistent records are now represented by the Prisma schema and committed migration in `prisma/migrations/20260820120000_init`. Existing production data must be migrated into the corresponding PostgreSQL tables using a reviewed import script; do not run `db:reset` against a production database.

## Security checklist

- `DEMO_MODE=false`
- Development seed accounts removed or passwords forcibly changed
- Strong `AUTH_SECRET`, database credentials, provider keys, and webhook secret
- HTTPS enabled and secure cookie behavior verified
- Object storage bucket private; signed access only
- Payment webhook signature verification tested
- Notification channels configured with sensitive health details excluded by default
- Upload endpoint restricted to approved MIME types and 10 MB metadata limit; validate the actual object in the storage adapter
- Database backups, retention, access logging, and provider agreements configured
- Legal pages reviewed and approved by the clinic's legal advisor

## Important implementation boundary

The application has real server-side persistence, authentication, authorization, transactions, and provider contracts. Provider credentials and cloud integrations are intentionally configured through environment variables and adapters; no fake production provider or secret is embedded in the repository. Before accepting real patients, connect and test the selected payment, notification, object-storage, video, and job infrastructure in a staging environment.
