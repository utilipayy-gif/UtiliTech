import { NextResponse } from "next/server";
import { verifyAirpayResponse } from "@/lib/airpay";
import { updateOrderStatus } from "@/lib/orders-store";

export async function POST(request: Request) {
  try {
    const fields: Record<string, string> = {};
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

    const orderId = fields.TRANSACTIONID || fields.orderid || fields.orderId || "";
    const apTxnId = fields.APTRANSACTIONID || fields.aptransactionid || "";
    const message = fields.MESSAGE || fields.message || "";
    const rawStatus = fields.TRANSACTIONSTATUS || fields.STATUS || fields.status || "";

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
    }

    const verification = verifyAirpayResponse(fields);

    await updateOrderStatus(orderId, {
      status: verification.status,
      airpayTxnId: apTxnId,
      airpayStatus: rawStatus,
      airpayMessage: message || verification.message,
      rawResponse: fields,
    });

    return NextResponse.json({
      success: true,
      orderId,
      status: verification.status,
      verified: verification.isValid,
    });
  } catch (error) {
    console.error("Airpay webhook processing error:", error);
    return NextResponse.json({ success: false, error: "Webhook error" }, { status: 500 });
  }
}
