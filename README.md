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

The seed script hashes passwords before storing them. Set `SEED_*` values in `.env`; seed credentials are never rendered in the frontend. Use the three development accounts only when `DEMO_MODE=true`, then replace them and set `DEMO_MODE=false` before launch.

## Commands

```powershell
npm run dev                 # local Next development server
npm run typecheck           # TypeScript validation
npm run build               # Prisma generate and production build
npm run start               # production server after build
npm run db:migrate          # development migration
npm run db:deploy           # deploy committed migrations in production
npm run db:seed             # development/demo seed
npm run db:reset            # guarded development reset; blocked in production
npm run worker:reminders    # process persisted reminder jobs once
```

Run `worker:reminders` from a persistent scheduler or worker service. For production, replace the one-shot runner with a process supervisor/cron or queue consumer that invokes the same persisted `ReminderJob` records. Do not use browser timers.

## Production configuration

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Generate a long random `AUTH_SECRET` and set `APP_URL` and `CLINIC_TIMEZONE`.
3. Run `npm run db:deploy` during deployment.
4. Create the initial admin through a protected seed/setup process with strong environment-provided credentials. Never expose the development passwords.
5. Configure an email/SMS/WhatsApp provider and replace `SandboxNotificationProvider` with the provider adapter in `lib/providers.ts`. Notification records and delivery logs are persisted in `Notification` and `NotificationLog`.
6. Configure object storage (S3-compatible or equivalent) and replace `ConfiguredObjectStorage` with an adapter that uploads server-side or issues short-lived signed upload URLs. Keep only storage keys in PostgreSQL; never store medical files on ephemeral app disk.
7. Configure the payment provider and implement its server-side checkout adapter. The webhook route is `/api/payments/webhook`; it requires `PAYMENT_WEBHOOK_SECRET`, verifies the provider signature, and updates payment transaction records. Never trust browser success callbacks.
8. Configure a production video provider and store meeting links only on authorized appointment records. Expose them through an authenticated endpoint, not public pages.
9. Run the application behind HTTPS and a process supervisor. Schedule the reminder worker as a durable service.

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
