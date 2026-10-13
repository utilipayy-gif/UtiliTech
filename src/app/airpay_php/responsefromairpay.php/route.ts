import { handleAirpayResponse } from "@/app/api/payment/airpay/callback/route";

export async function POST(request: Request) {
  return handleAirpayResponse(request);
}

export async function GET(request: Request) {
  return handleAirpayResponse(request);
}
