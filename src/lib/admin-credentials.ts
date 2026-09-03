import { neon } from "@neondatabase/serverless";

export type StoredAdminCredential = {
  email: string;
  password_hash: string;
  password_salt: string;
};

export function adminDatabaseIsConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
  return neon(process.env.DATABASE_URL);
}

export async function getStoredAdmin(siteKey: string) {
  if (!adminDatabaseIsConfigured()) return undefined;
  const rows = await database().query(
    `select email, password_hash, password_salt
     from public.site_admin_credentials
     where site_key = $1
     limit 1`,
    [siteKey],
  ) as StoredAdminCredential[];
  return rows[0];
}

export async function saveStoredAdmin(siteKey: string, email: string, passwordHash: string, passwordSalt: string) {
  await database().query(
    `insert into public.site_admin_credentials
       (site_key, email, password_hash, password_salt, updated_at)
     values ($1, $2, $3, $4, now())
     on conflict (site_key) do update set
       email = excluded.email,
       password_hash = excluded.password_hash,
       password_salt = excluded.password_salt,
       updated_at = now()`,
    [siteKey, email.toLowerCase(), passwordHash, passwordSalt],
  );
}

