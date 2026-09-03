# Neon + Vercel setup

Both websites can use one existing Neon project and database. Content is separated by the `site_key` values `billverstech` and `utilitech`.

## 1. Create the database tables

Open **Neon Console → SQL Editor** and run these files once, in order, for the shared database:

1. `neon/migrations/001_create_site_services.sql`
2. `neon/migrations/002_create_admin_credentials.sql`

## 2. Add Vercel environment variables

In each Vercel project, open **Settings → Environment Variables** and add:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require
ADMIN_EMAIL=client-admin@example.com
ADMIN_PASSWORD=use-a-long-unique-password
ADMIN_SESSION_SECRET=use-at-least-32-random-characters
```

Use the pooled connection string from the Neon **Connect** dialog. Set it for Production and any Preview environments that should share the content database, then redeploy.

Never prefix `DATABASE_URL` with `NEXT_PUBLIC_` and never commit its value.

## 3. Seed and manage content

Open `/admin`, sign in, edit any service, and save. The first save writes that website's complete bundled service catalogue to Neon. Later add, edit, and remove operations publish directly from the database.

The public website falls back to its bundled catalogue when `DATABASE_URL` is absent or Neon is temporarily unavailable.

## 4. Admin password

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are the initial bootstrap login. After the admin changes the password in **Admin → Security / Change password**, only a salted password hash is stored in Neon and that new password replaces the bootstrap password for future logins. The current password is required, and changing it signs out the current session.
