import { neon } from "@neondatabase/serverless";
import { contentStoreIsConfigured } from "./content-store";

export type OrderRecord = {
  orderId: string;
  siteKey: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerBusiness?: string;
  notes?: string;
  items: Array<{
    key: string;
    title: string;
    packageName?: string;
    quantity: number;
    price: number;
  }>;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  airpayTxnId?: string;
  airpayStatus?: string;
  airpayMessage?: string;
  rawResponse?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

// In-memory fallback cache for environments without database
const memoryOrders = new Map<string, OrderRecord>();

let tableInitPromise: Promise<void> | null = null;

function getDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  return neon(process.env.DATABASE_URL);
}

/**
 * Automatically ensure the site_orders table exists in Neon PostgreSQL
 */
async function ensureOrdersTable(): Promise<void> {
  if (!contentStoreIsConfigured()) return;
  if (!tableInitPromise) {
    tableInitPromise = (async () => {
      try {
        const sql = getDatabase();
        await sql.query(`
          create table if not exists public.site_orders (
            id serial primary key,
            order_id text not null unique,
            site_key text not null default 'utilitech',
            customer_name text not null,
            customer_email text not null,
            customer_phone text not null,
            customer_business text,
            notes text,
            items jsonb not null default '[]'::jsonb,
            amount numeric(10, 2) not null,
            currency text not null default 'INR',
            status text not null default 'PENDING',
            airpay_txn_id text,
            airpay_status text,
            airpay_message text,
            raw_response jsonb,
            created_at timestamp with time zone not null default now(),
            updated_at timestamp with time zone not null default now()
          );

          create index if not exists idx_site_orders_order_id on public.site_orders (order_id);
          create index if not exists idx_site_orders_site_key on public.site_orders (site_key);
        `);
      } catch (err) {
        console.warn("Could not ensure site_orders table in Neon PostgreSQL:", err);
      }
    })();
  }
  return tableInitPromise;
}

export async function createOrder(order: Omit<OrderRecord, "status">): Promise<OrderRecord> {
  const fullOrder: OrderRecord = {
    ...order,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryOrders.set(order.orderId, fullOrder);

  if (contentStoreIsConfigured()) {
    try {
      await ensureOrdersTable();
      const sql = getDatabase();
      await sql.query(
        `insert into public.site_orders (
          order_id, site_key, customer_name, customer_email, customer_phone,
          customer_business, notes, items, amount, currency, status, created_at, updated_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
        on conflict (order_id) do update set
          status = excluded.status,
          updated_at = now()`,
        [
          fullOrder.orderId,
          fullOrder.siteKey,
          fullOrder.customerName,
          fullOrder.customerEmail,
          fullOrder.customerPhone,
          fullOrder.customerBusiness || null,
          fullOrder.notes || null,
          JSON.stringify(fullOrder.items),
          fullOrder.amount,
          fullOrder.currency,
          fullOrder.status,
        ]
      );
    } catch (err) {
      console.warn("Could not save order to Neon database, using memory cache.", err);
    }
  }

  return fullOrder;
}

export async function updateOrderStatus(
  orderId: string,
  update: {
    status: "SUCCESS" | "FAILED" | "PENDING";
    airpayTxnId?: string;
    airpayStatus?: string;
    airpayMessage?: string;
    rawResponse?: Record<string, unknown>;
  }
): Promise<OrderRecord | null> {
  const existing = memoryOrders.get(orderId);
  if (existing) {
    Object.assign(existing, update, { updatedAt: new Date().toISOString() });
  }

  if (contentStoreIsConfigured()) {
    try {
      await ensureOrdersTable();
      const sql = getDatabase();
      await sql.query(
        `update public.site_orders
         set status = $1,
             airpay_txn_id = $2,
             airpay_status = $3,
             airpay_message = $4,
             raw_response = $5,
             updated_at = now()
         where order_id = $6`,
        [
          update.status,
          update.airpayTxnId || null,
          update.airpayStatus || null,
          update.airpayMessage || null,
          update.rawResponse ? JSON.stringify(update.rawResponse) : null,
          orderId,
        ]
      );
    } catch (err) {
      console.warn("Could not update order in Neon database:", err);
    }
  }

  return existing || null;
}

export async function getOrder(orderId: string): Promise<OrderRecord | null> {
  if (contentStoreIsConfigured()) {
    try {
      await ensureOrdersTable();
      const sql = getDatabase();
      const rows = await sql.query(
        `select order_id as "orderId", site_key as "siteKey",
                customer_name as "customerName", customer_email as "customerEmail",
                customer_phone as "customerPhone", customer_business as "customerBusiness",
                notes, items, amount, currency, status,
                airpay_txn_id as "airpayTxnId", airpay_status as "airpayStatus",
                airpay_message as "airpayMessage", raw_response as "rawResponse",
                created_at as "createdAt", updated_at as "updatedAt"
         from public.site_orders
         where order_id = $1`,
        [orderId]
      ) as OrderRecord[];
      if (rows.length > 0) return rows[0];
    } catch (err) {
      console.warn("Could not fetch order from Neon database:", err);
    }
  }

  return memoryOrders.get(orderId) || null;
}
