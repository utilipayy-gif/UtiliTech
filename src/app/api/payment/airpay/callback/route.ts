import { NextResponse } from "next/server";
import { verifyAirpayResponse } from "@/lib/airpay";
import { updateOrderStatus } from "@/lib/orders-store";

async function handleAirpayResponse(request: Request) {
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
    // If body reading fails, check query params
  }

  // Also include query parameters
  url.searchParams.forEach((val, key) => {
    if (!fields[key]) fields[key] = val;
  });

  const orderId = fields.TRANSACTIONID || fields.orderid || fields.orderId || "";
  const apTxnId = fields.APTRANSACTIONID || fields.aptransactionid || fields.txnId || "";
  const amount = fields.AMOUNT || fields.amount || "";
  const message = fields.MESSAGE || fields.message || "";
  const rawStatus = fields.TRANSACTIONSTATUS || fields.STATUS || fields.status || "";

  const verification = verifyAirpayResponse(fields);

  if (orderId) {
    await updateOrderStatus(orderId, {
      status: verification.status,
      airpayTxnId: apTxnId,
      airpayStatus: rawStatus,
      airpayMessage: message || verification.message,
      rawResponse: fields,
    });
  }

  const redirectUrl = new URL("/checkout/status", baseUrl);
  redirectUrl.searchParams.set("orderId", orderId);
  redirectUrl.searchParams.set("status", verification.status.toLowerCase());
  if (apTxnId) redirectUrl.searchParams.set("txnId", apTxnId);
  if (amount) redirectUrl.searchParams.set("amount", amount);
  if (message || verification.message) {
    redirectUrl.searchParams.set("msg", message || verification.message);
  }

  return NextResponse.redirect(redirectUrl.toString(), { status: 303 });
}

export async function POST(request: Request) {
  return handleAirpayResponse(request);
}

export async function GET(request: Request) {
  return handleAirpayResponse(request);
}
