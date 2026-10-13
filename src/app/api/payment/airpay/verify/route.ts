import { NextResponse } from "next/server";
import { verifyAirpayOrderViaApi } from "@/lib/airpay";
import { updateOrderStatus, getOrder } from "@/lib/orders-store";

export async function POST(request: Request) {
  try {
    const { orderId, apTransactionId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId is required" }, { status: 400 });
    }

    const verification = await verifyAirpayOrderViaApi(orderId, apTransactionId);

    if (verification.success && verification.data) {
      const data = verification.data;
      const status =
        data.transaction_status === 200 ||
        data.transaction_status === "200" ||
        String(data.transaction_payment_status).toLowerCase() === "success"
          ? "SUCCESS"
          : "FAILED";

      await updateOrderStatus(orderId, {
        status,
        airpayTxnId: String(data.ap_transactionid || apTransactionId || ""),
        airpayStatus: String(data.transaction_status || ""),
        airpayMessage: String(data.message || ""),
        rawResponse: data as Record<string, unknown>,
      });

      return NextResponse.json({
        success: true,
        orderId,
        status,
        airpayData: data,
      });
    }

    const existingOrder = await getOrder(orderId);
    return NextResponse.json({
      success: false,
      orderId,
      order: existingOrder,
      error: verification.error || "Order not verified by Airpay",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Verification error" },
      { status: 500 }
    );
  }
}
