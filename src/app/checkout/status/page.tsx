import type { Metadata } from "next";
import Link from "next/link";
import { getServices } from "@/lib/content-store";
import { getOrder } from "@/lib/orders-store";
import { UtiliFooter, UtiliHeader } from "../../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order Status | UTILIPAY HUB (OPC) PRIVATE LIMITED",
  description: "Check your order payment status with UTILIPAY HUB.",
};

type StatusPageProps = {
  searchParams: Promise<{
    orderId?: string;
    status?: string;
    txnId?: string;
    amount?: string;
    msg?: string;
  }>;
};

export default async function OrderStatusPage({ searchParams }: StatusPageProps) {
  const [services, query] = await Promise.all([
    getServices(),
    searchParams,
  ]);

  const orderId = query.orderId || "";
  const rawStatus = (query.status || "").toLowerCase();
  const txnId = query.txnId || "";
  const queryAmount = query.amount ? Number(query.amount) : null;
  const message = query.msg || "";

  const order = orderId ? await getOrder(orderId) : null;
  const finalStatus = (order?.status ? order.status.toLowerCase() : rawStatus) || "unknown";
  const isSuccess = finalStatus === "success";
  const isPending = finalStatus === "pending";
  const isFailed = !isSuccess && !isPending;

  const displayAmount = order?.amount ?? queryAmount ?? 0;
  const money = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <main className="nsx-site">
      <UtiliHeader services={services} />

      <section className="nsx-page-hero nsx-page-hero-short">
        <span className="nsx-label">PAYMENT CONFIRMATION</span>
        <h1>
          {isSuccess && <>Payment <em>Successful</em></>}
          {isPending && <>Payment <em>Pending</em></>}
          {isFailed && <>Payment <em>Unsuccessful</em></>}
        </h1>
        <p>
          {isSuccess && "Your transaction has been processed securely via Airpay. Our team will review your project requirements and connect with you shortly."}
          {isPending && "Your transaction is currently being processed by your bank. We will update the status once confirmation is received."}
          {isFailed && (message || "The payment transaction could not be completed or was cancelled. No charges were captured.")}
        </p>
      </section>

      <section className="nsx-section" style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 60px" }}>
        <div
          style={{
            background: "rgba(14, 21, 43, 0.75)",
            border: isSuccess
              ? "1px solid rgba(201, 255, 74, 0.4)"
              : isPending
              ? "1px solid rgba(255, 193, 7, 0.4)"
              : "1px solid rgba(255, 111, 121, 0.4)",
            borderRadius: 20,
            padding: "36px 32px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: isSuccess
                  ? "rgba(201, 255, 74, 0.15)"
                  : isPending
                  ? "rgba(255, 193, 7, 0.15)"
                  : "rgba(255, 111, 121, 0.15)",
                color: isSuccess ? "#c9ff4a" : isPending ? "#ffc107" : "#ff6f79",
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              {isSuccess ? "✓" : isPending ? "⏳" : "✕"}
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#fff" }}>
                {isSuccess ? "Transaction Confirmed" : isPending ? "Verification in Progress" : "Payment Not Completed"}
              </h2>
              <small style={{ color: "#8d99ae", fontSize: "0.85rem" }}>
                Gateway: Airpay Payment Gateway
              </small>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 20,
              padding: "20px 0",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: 28,
            }}
          >
            {orderId && (
              <div>
                <small style={{ color: "#8d99ae", display: "block", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  Order ID
                </small>
                <strong style={{ color: "#fff", fontSize: "1rem" }}>{orderId}</strong>
              </div>
            )}
            {(txnId || order?.airpayTxnId) && (
              <div>
                <small style={{ color: "#8d99ae", display: "block", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  Airpay Reference
                </small>
                <strong style={{ color: "#fff", fontSize: "1rem" }}>{txnId || order?.airpayTxnId}</strong>
              </div>
            )}
            {displayAmount > 0 && (
              <div>
                <small style={{ color: "#8d99ae", display: "block", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                  Total Amount
                </small>
                <strong style={{ color: "#c9ff4a", fontSize: "1.2rem" }}>{money(displayAmount)}</strong>
              </div>
            )}
            <div>
              <small style={{ color: "#8d99ae", display: "block", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em" }}>
                Status
              </small>
              <strong
                style={{
                  color: isSuccess ? "#c9ff4a" : isPending ? "#ffc107" : "#ff6f79",
                  textTransform: "uppercase",
                  fontSize: "0.95rem",
                }}
              >
                {finalStatus}
              </strong>
            </div>
          </div>

          {order && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ color: "#fff", fontSize: "1rem", marginBottom: 12 }}>Customer Details</h3>
              <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "0.9rem" }}>
                <strong>Name:</strong> {order.customerName}
              </p>
              <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "0.9rem" }}>
                <strong>Email:</strong> {order.customerEmail}
              </p>
              <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "0.9rem" }}>
                <strong>Phone:</strong> {order.customerPhone}
              </p>
              {order.customerBusiness && (
                <p style={{ margin: "4px 0", color: "#cbd5e1", fontSize: "0.9rem" }}>
                  <strong>Business:</strong> {order.customerBusiness}
                </p>
              )}
            </div>
          )}

          {order?.items && order.items.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ color: "#fff", fontSize: "1rem", marginBottom: 12 }}>Ordered Services</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {order.items.map((item, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: "1px dashed rgba(255,255,255,0.06)",
                      color: "#cbd5e1",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span>
                      {item.title} {item.packageName ? `(${item.packageName})` : ""} × {item.quantity}
                    </span>
                    <strong style={{ color: "#fff" }}>{money(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 20 }}>
            {isFailed ? (
              <Link href="/checkout" className="button button-primary">
                Try again →
              </Link>
            ) : (
              <Link href="/" className="button button-primary">
                Back to home
              </Link>
            )}
            <Link href="/services" className="button button-ghost">
              Explore services
            </Link>
            <Link href="/contact" className="button button-ghost">
              Support / Help
            </Link>
          </div>
        </div>
      </section>

      <UtiliFooter />
    </main>
  );
}
