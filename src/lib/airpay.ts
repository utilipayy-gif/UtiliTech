import crypto from "crypto";

export type AirpayConfig = {
  merchantId: string;
  clientId?: string;
  username: string;
  password?: string;
  secretKey: string;
  apiKey?: string;
  privateKey?: string;
  mode: "test" | "production";
  gatewayUrl: string;
  enableSimulation: boolean;
};

export type AirpayInitiatePayload = {
  orderId: string;
  amount: number | string;
  buyerEmail: string;
  buyerPhone: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerState?: string;
  buyerPinCode?: string;
  buyerCountry?: string;
  customvar?: string;
  chmod?: string;
};

export type AirpayCheckoutData = {
  gatewayUrl: string;
  isSimulation: boolean;
  params: Record<string, string>;
};

/**
 * Self-contained IEEE 802.3 CRC32 calculation for Airpay response hash verification
 */
export function crc32(str: string): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      if ((crc ^ code) & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ -1) >>> 0;
}

/**
 * Read Airpay configuration from environment variables
 */
export function getAirpayConfig(): AirpayConfig {
  const mode = (process.env.AIRPAY_MODE?.toLowerCase() === "production" ? "production" : "test") as "test" | "production";
  const defaultGatewayUrl = "https://payments.airpay.co.in/pay/index.php";

  return {
    merchantId: process.env.AIRPAY_MERCHANT_ID?.trim() || "371739",
    clientId: process.env.AIRPAY_CLIENT_ID?.trim() || "TRFMLE",
    username: process.env.AIRPAY_USERNAME?.trim() || "c7nErze3cv",
    password: process.env.AIRPAY_PASSWORD?.trim() || "V9DEHQ5s",
    secretKey: process.env.AIRPAY_SECRET_KEY?.trim() || "2333db003a4387f11df24ad5e348fc01",
    apiKey: process.env.AIRPAY_API_KEY?.trim() || "72j3enVcmWex6GT7",
    privateKey: process.env.AIRPAY_PRIVATE_KEY?.trim() || "",
    mode,
    gatewayUrl: process.env.AIRPAY_GATEWAY_URL?.trim() || defaultGatewayUrl,
    enableSimulation: process.env.AIRPAY_ENABLE_SIMULATION === "true",
  };
}

/**
 * Generate SHA-256 hex digest
 */
export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Format current date in YYYY-MM-DD format (IST timezone)
 */
export function getAirpayDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value || "2026";
  const m = parts.find((p) => p.type === "month")?.value || "01";
  const d = parts.find((p) => p.type === "day")?.value || "01";
  return `${y}-${m}-${d}`;
}

/**
 * Generate Airpay Private Key
 */
export function generatePrivateKey(config: AirpayConfig): string {
  if (config.privateKey) return config.privateKey;
  const keyToUse = config.apiKey || config.secretKey;
  if (!keyToUse && !config.username) return "";
  const raw = `${keyToUse}@${config.username}:|:${config.password || ""}`;
  return sha256(raw);
}

/**
 * Generate Checksum for Airpay hosted checkout
 */
export function generateAirpayChecksum(
  payload: AirpayInitiatePayload,
  config: AirpayConfig,
  currentDate = getAirpayDate()
): string {
  const privateKey = generatePrivateKey(config);
  const formattedAmount = Number(payload.amount).toFixed(2);

  const address = payload.buyerAddress || "";
  const city = payload.buyerCity || "";
  const state = payload.buyerState || "";
  const pinCode = payload.buyerPinCode || "";
  const country = payload.buyerCountry || "India";

  const allData = `${payload.buyerEmail}${payload.buyerFirstName}${payload.buyerLastName}${address}${city}${state}${pinCode}${country}${formattedAmount}${payload.orderId}${currentDate}`;

  return sha256(`${privateKey}@${allData}`);
}

/**
 * Build the full payment payload to be POSTed to Airpay
 */
export function createAirpayPaymentRequest(payload: AirpayInitiatePayload): AirpayCheckoutData {
  const config = getAirpayConfig();
  const formattedAmount = Number(payload.amount).toFixed(2);
  const currentDate = getAirpayDate();
  const privateKey = generatePrivateKey(config);
  const checksum = generateAirpayChecksum(payload, config, currentDate);

  const params: Record<string, string> = {
    mercid: config.merchantId,
    orderid: payload.orderId,
    currency: "356",
    isocurrency: "INR",
    chmod: payload.chmod || "",
    amount: formattedAmount,
    buyerEmail: payload.buyerEmail,
    buyerPhone: payload.buyerPhone,
    buyerFirstName: payload.buyerFirstName,
    buyerLastName: payload.buyerLastName || "",
    buyerAddress: payload.buyerAddress || "",
    buyerCity: payload.buyerCity || "",
    buyerState: payload.buyerState || "",
    buyerPinCode: payload.buyerPinCode || "",
    buyerCountry: payload.buyerCountry || "India",
    customvar: payload.customvar || "",
    privatekey: privateKey,
    checksum: checksum,
  };

  return {
    gatewayUrl: config.gatewayUrl,
    isSimulation: config.enableSimulation,
    params,
  };
}

/**
 * Verify incoming callback / webhook response from Airpay
 */
export function verifyAirpayResponse(
  fields: Record<string, string | undefined>,
  config = getAirpayConfig()
): { isValid: boolean; status: "SUCCESS" | "FAILED" | "PENDING"; message: string } {
  const transactionId = fields.TRANSACTIONID || fields.orderid || "";
  const apTransactionId = fields.APTRANSACTIONID || fields.aptransactionid || "";
  const amount = fields.AMOUNT || fields.amount || "";
  const transactionStatus = fields.TRANSACTIONSTATUS || fields.transactionstatus || fields.STATUS || "";
  const message = fields.MESSAGE || fields.message || "";
  const mid = fields.MID || fields.mercid || config.merchantId || "";
  const username = fields.USERNAME || config.username || "";
  const receivedHash = fields.ap_SecureHash || fields.ap_securehash || fields.checksum || "";
  const customerVpa = fields.CUSTOMER_VPA || fields.customer_vpa;

  // In test simulation, accept simulated responses
  if (config.enableSimulation && (!receivedHash || receivedHash === "simulated_hash")) {
    const isSuccess = transactionStatus === "200" || transactionStatus === "SUCCESS" || message.toUpperCase().includes("SUCCESS");
    return {
      isValid: true,
      status: isSuccess ? "SUCCESS" : "FAILED",
      message: message || (isSuccess ? "Simulation Success" : "Simulation Failed"),
    };
  }

  // Verification formula:
  // TRANSACTIONID:APTRANSACTIONID:AMOUNT:TRANSACTIONSTATUS:MESSAGE:MID:USERNAME
  const baseString = customerVpa
    ? `${transactionId}:${apTransactionId}:${amount}:${transactionStatus}:${message}:${mid}:${username}:${customerVpa}`
    : `${transactionId}:${apTransactionId}:${amount}:${transactionStatus}:${message}:${mid}:${username}`;

  const calculatedCrc = String(crc32(baseString));
  const calculatedSha = sha256(`${baseString}:${config.secretKey}`);

  const isValid = receivedHash === calculatedCrc || receivedHash.toLowerCase() === calculatedSha.toLowerCase();

  const isSuccess = transactionStatus === "200" || transactionStatus === "SUCCESS";
  const isPending = transactionStatus === "PENDING" || transactionStatus === "IN_PROCESS";

  return {
    isValid,
    status: isSuccess ? "SUCCESS" : isPending ? "PENDING" : "FAILED",
    message: message || (isSuccess ? "Transaction Successful" : "Transaction Failed"),
  };
}
