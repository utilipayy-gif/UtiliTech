import { NextResponse } from "next/server";
import { decodeAirpayShift, encodeAirpayShift } from "@/lib/airpay";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { xApiType?: string; encRequest?: string };

    let decoded: Record<string, unknown> = {};
    if (body.encRequest) {
      try {
        decoded = decodeAirpayShift<Record<string, unknown>>(body.encRequest);
      } catch (err) {
        console.warn("Could not decode Airpay encRequest:", err);
      }
    }

    const action = String(decoded.api_action || decoded.action || "");

    let responsePayload: Record<string, unknown> = {
      status: 200,
      response: {},
    };

    if (action === "config") {
      responsePayload = {
        status: 200,
        response: {
          common: {
            currency_code: "INR",
            sandbox: "Y",
            consumer_data_flag: "N",
            is_retry: "N",
            consent_checked: "Y",
          },
          channels: [
            {
              chmod: "upi",
              channel_name: "UPI",
              title: "Pay via UPI",
              description: "Fast and secure payments using Unified Payments Interface.",
            },
          ],
        },
      };
    } else if (action === "cancelPayment" || decoded.action === "cancelPayment") {
      responsePayload = {
        status: 200,
        response: {
          next_action: {
            action: "redirect",
            url: "/checkout",
          },
        },
      };
    } else {
      responsePayload = {
        status: 200,
        response: {
          status: "success",
        },
      };
    }

    const encResponse = encodeAirpayShift(responsePayload);

    return NextResponse.json(
      { encResponse },
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (error) {
    console.error("Error in /pay/payment_api.php:", error);
    return NextResponse.json(
      { error: "Internal processing error" },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { status: "ok", service: "Airpay Payment API Proxy" },
    { headers: CORS_HEADERS }
  );
}
