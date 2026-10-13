import { NextResponse } from "next/server";
import { createAirpayPaymentRequest } from "@/lib/airpay";
import { createOrder } from "@/lib/orders-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, business, notes, items, total } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ success: false, error: "Valid customer name is required." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email address is required." }, { status: 400 });
    }
    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ success: false, error: "Valid phone number is required." }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "At least one service must be selected." }, { status: 400 });
    }

    const calculatedTotal = items.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 1);
    }, 0);

    const orderAmount = total && total > 0 ? Number(total) : calculatedTotal;
    if (orderAmount <= 0) {
      return NextResponse.json({ success: false, error: "Order total must be greater than zero." }, { status: 400 });
    }

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] || "Customer";
    const lastName = parts.slice(1).join(" ") || "";

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `UT${timestamp}${randomSuffix}`;

    await createOrder({
      orderId,
      siteKey: "utilitech",
      customerName: name.trim(),
      customerEmail: email.trim().toLowerCase(),
      customerPhone: phone.trim(),
      customerBusiness: business?.trim(),
      notes: notes?.trim(),
      items,
      amount: orderAmount,
      currency: "INR",
    });

    const checkoutData = await createAirpayPaymentRequest({
      orderId,
      amount: orderAmount,
      buyerEmail: email.trim().toLowerCase(),
      buyerPhone: phone.replace(/[^0-9]/g, "").slice(-10),
      buyerFirstName: firstName,
      buyerLastName: lastName,
      buyerAddress: business?.trim() || "Online Order",
      buyerCity: "Mohali",
      buyerState: "Punjab",
      buyerPinCode: "140603",
      buyerCountry: "India",
      customvar: JSON.stringify({ siteKey: "utilitech", orderId }),
    });

    return NextResponse.json({
      success: true,
      orderId,
      gatewayUrl: checkoutData.gatewayUrl,
      isSimulation: checkoutData.isSimulation,
      params: checkoutData.params,
    });
  } catch (error) {
    console.error("Error initiating Airpay payment:", error);
    const msg = error instanceof Error ? error.message : "Failed to initiate payment. Please try again.";
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
