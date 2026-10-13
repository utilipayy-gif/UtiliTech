import { NextResponse } from "next/server";
import { verifyAirpayResponse } from "@/lib/airpay";
import { updateOrderStatus } from "@/lib/orders-store";

export async function handleAirpayResponse(request: Request) {
  const url = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${url.protocol}//${url.host}`;
  const fields: Record<string, string> = {};

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("form") || contentType.includes("multipart")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        if (typeof value === "string") fields[key] = value;
      });
    } else if (contentType.includes("json")) {
      const json = await request.json();
      Object.entries(json).forEach(([k, v]) => {
        if (typeof v === "string" || typeof v === "number") fields[k] = String(v);
      });
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        fields[key] = value;
      });
    }
  } catch {
    // If body reading fails, query parameters will be evaluated
  }

  // Also include query parameters
  url.searchParams.forEach((val, key) => {
    if (!fields[key]) fields[key] = val;
  });

  const verification = verifyAirpayResponse(fields);

  const orderId =
    fields.orderid ||
    fields.orderId ||
    fields.TRANSACTIONID ||
    "";

  const apTxnId =
    fields.ap_transactionid ||
    fields.APTRANSACTIONID ||
    fields.txnId ||
    "";

  const amount =
    fields.amount ||
    fields.AMOUNT ||
    fields.billed_amount ||
    "";

  const message =
    fields.message ||
    fields.MESSAGE ||
    verification.message ||
    "";

  const rawStatus =
    fields.transaction_payment_status ||
    fields.TRANSACTIONSTATUS ||
    fields.STATUS ||
    fields.status ||
    "";

  if (orderId) {
    await updateOrderStatus(orderId, {
      status: verification.status,
      airpayTxnId: apTxnId,
      airpayStatus: rawStatus,
      airpayMessage: message,
      rawResponse: fields,
    });
  }

  const redirectUrl = new URL("/checkout/status", baseUrl);
  if (orderId) redirectUrl.searchParams.set("orderId", orderId);
  redirectUrl.searchParams.set("status", verification.status.toLowerCase());
  if (apTxnId) redirectUrl.searchParams.set("txnId", apTxnId);
  if (amount) redirectUrl.searchParams.set("amount", amount);
  if (message) redirectUrl.searchParams.set("msg", message);

  return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
}

export async function POST(request: Request) {
  return handleAirpayResponse(request);
}

export async function GET(request: Request) {
  return handleAirpayResponse(request);
}
