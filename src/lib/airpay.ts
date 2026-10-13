import crypto from "crypto";

export type AirpayConfig = {
  merchantId: string;
  clientId: string;
  username: string;
  password: string;
  secretKey: string;
  apiKey: string;
  privateKey?: string;
  merchantDomain: string;
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

// Token cache to minimize roundtrips
let cachedToken: { token: string; expiresAt: number } | null = null;

const AIRPAY_SHIFT = [1, 9, 18, 16, 1, 25];

export function decodeAirpayShift<T = unknown>(b64: string): T {
  const raw = Buffer.from(b64, "base64").toString("utf8");
  const reversed = raw
    .split("")
    .map((ch, idx) => String.fromCharCode(ch.charCodeAt(0) - AIRPAY_SHIFT[idx % AIRPAY_SHIFT.length]))
    .reverse()
    .join("");
  return JSON.parse(reversed) as T;
}

export function encodeAirpayShift(obj: unknown): string {
  const jsonStr = JSON.stringify(obj);
  const shifted = jsonStr
    .split("")
    .reverse()
    .map((ch, idx) => String.fromCharCode(ch.charCodeAt(0) + AIRPAY_SHIFT[idx % AIRPAY_SHIFT.length]))
    .join("");
  return Buffer.from(shifted, "utf8").toString("base64");
}

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

export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export class AirpayEncryption {
  private key: Buffer;

  constructor(username: string, password: string) {
    const hash = crypto.createHash("md5").update(`${username}~:~${password}`).digest("hex");
    this.key = Buffer.from(hash, "utf8");
  }

  encrypt(plainText: string): string {
    const ivBytes = crypto.randomBytes(8);
    const ivHex = ivBytes.toString("hex");
    const ivBuf = Buffer.from(ivHex, "utf8");

    const cipher = crypto.createCipheriv("aes-256-cbc", this.key, ivBuf);
    let encrypted = cipher.update(plainText, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return ivHex + encrypted.toString("base64");
  }

  decrypt<T = unknown>(response: string): T {
    if (response.length < 17) {
      throw new Error("Response too short to contain IV and ciphertext");
    }
    const ivHex = response.slice(0, 16);
    const ivBuf = Buffer.from(ivHex, "utf8");
    const cipherTextBuf = Buffer.from(response.slice(16), "base64");

    const decipher = crypto.createDecipheriv("aes-256-cbc", this.key, ivBuf);
    let decrypted = decipher.update(cipherTextBuf);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return JSON.parse(decrypted.toString("utf8")) as T;
  }
}

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

export function getAirpayConfig(): AirpayConfig {
  const mode = (process.env.AIRPAY_MODE?.toLowerCase() === "production" ? "production" : "test") as "test" | "production";

  return {
    merchantId: process.env.AIRPAY_MERCHANT_ID?.trim() || "371739",
    clientId: process.env.AIRPAY_CLIENT_ID?.trim() || "TRFMLE",
    username: process.env.AIRPAY_USERNAME?.trim() || "c7nErze3cv",
    password: process.env.AIRPAY_PASSWORD?.trim() || "V9DEHQ5s",
    secretKey: process.env.AIRPAY_SECRET_KEY?.trim() || "2333db003a4387f11df24ad5e348fc01",
    apiKey: process.env.AIRPAY_API_KEY?.trim() || "72j3enVcmWex6GT7",
    privateKey: process.env.AIRPAY_PRIVATE_KEY?.trim() || "",
    merchantDomain: process.env.AIRPAY_MERCHANT_DOMAIN?.trim() || "http://localhost",
    mode,
    gatewayUrl: process.env.AIRPAY_GATEWAY_URL?.trim() || "https://payments.airpay.co.in/pay/v4/index.php",
    enableSimulation: process.env.AIRPAY_ENABLE_SIMULATION === "true",
  };
}

export function generateAirpayChecksum(
  params: Record<string, string | number>,
  dateStr = getAirpayDate()
): string {
  const sortedKeys = Object.keys(params).sort();
  let values = "";
  for (const k of sortedKeys) {
    values += String(params[k] ?? "");
  }
  values += dateStr;
  return sha256(values);
}

export function generatePrivateKey(config = getAirpayConfig()): string {
  if (config.privateKey) return config.privateKey;
  const keyToUse = config.apiKey || config.secretKey;
  return sha256(`${keyToUse}@${config.username}:|:${config.password}`);
}

export async function getAirpayOAuthToken(config = getAirpayConfig()): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  const enc = new AirpayEncryption(config.username, config.password);
  const data = {
    client_id: config.clientId,
    client_secret: config.secretKey,
    merchant_id: config.merchantId,
    grant_type: "client_credentials",
  };

  const encdata = enc.encrypt(JSON.stringify(data));
  const checksum = generateAirpayChecksum(data);

  const res = await fetch("https://kraken.airpay.co.in/airpay/pay/v4/api/oauth2", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      merchant_id: config.merchantId,
      encdata,
      checksum,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error(`Airpay OAuth request failed with HTTP ${res.status}`);
  }

  const json = (await res.json()) as { response?: string; error?: string };
  if (!json.response) {
    throw new Error(`Airpay OAuth error response: ${JSON.stringify(json)}`);
  }

  const decrypted = enc.decrypt<{
    status: string;
    message: string;
    data: { access_token: string; expires_in?: number };
  }>(json.response);

  if (decrypted.status !== "success" || !decrypted.data?.access_token) {
    throw new Error(`Airpay OAuth failure: ${decrypted.message || "Unknown error"}`);
  }

  const token = decrypted.data.access_token;
  const expiresInSeconds = Number(decrypted.data.expires_in) || 300;
  cachedToken = {
    token,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return token;
}

export async function createAirpayPaymentRequest(
  payload: AirpayInitiatePayload
): Promise<AirpayCheckoutData> {
  const config = getAirpayConfig();
  const formattedAmount = Number(payload.amount).toFixed(2);

  if (config.enableSimulation) {
    return {
      gatewayUrl: "/api/payment/airpay/callback",
      isSimulation: true,
      params: {
        TRANSACTIONID: payload.orderId,
        APTRANSACTIONID: `SIM_${Date.now()}`,
        AMOUNT: formattedAmount,
        TRANSACTIONSTATUS: "200",
        MESSAGE: "Simulation Success",
        ap_SecureHash: "simulated_hash",
      },
    };
  }

  const privateKey = generatePrivateKey(config);
  const enc = new AirpayEncryption(config.username, config.password);

  try {
    const token = await getAirpayOAuthToken(config);

    const data: Record<string, string> = {
      buyer_email: payload.buyerEmail,
      buyer_phone: payload.buyerPhone.replace(/[^0-9]/g, "").slice(-10),
      buyer_firstname: payload.buyerFirstName,
      buyer_lastname: payload.buyerLastName || "",
      amount: formattedAmount,
      orderid: payload.orderId,
      currency_code: "356",
      iso_currency: "inr",
      merchant_id: config.merchantId,
      buyer_address: payload.buyerAddress || "Online Order",
      buyer_city: payload.buyerCity || "Mohali",
      buyer_state: payload.buyerState || "Punjab",
      buyer_pincode: payload.buyerPinCode || "140603",
      buyer_country: payload.buyerCountry || "India",
      customvar: payload.customvar || "",
      mer_dom: Buffer.from(config.merchantDomain).toString("base64"),
    };

    if (payload.chmod) {
      data.chmod = payload.chmod;
    }

    const encdata = enc.encrypt(JSON.stringify(data));
    const checksum = generateAirpayChecksum(data);

    // Official Airpay v4 form action URL: https://payments.airpay.co.in/pay/v4/index.php?token=<token>
    const baseUrl = config.gatewayUrl.includes("index.php")
      ? config.gatewayUrl
      : `${config.gatewayUrl.replace(/\/+$/, "")}/index.php`;

    return {
      gatewayUrl: `${baseUrl}?token=${token}`,
      isSimulation: false,
      params: {
        privatekey: privateKey,
        merchant_id: config.merchantId,
        encdata,
        checksum,
        chmod: payload.chmod || "",
      },
    };
  } catch (error) {
    console.error("Airpay v4 checkout token preparation error:", error);
    throw error;
  }
}

export async function verifyAirpayOrderViaApi(
  orderId: string,
  apTransactionId?: string,
  config = getAirpayConfig()
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const token = await getAirpayOAuthToken(config);
    const privateKey = generatePrivateKey(config);
    const enc = new AirpayEncryption(config.username, config.password);

    const data: Record<string, string> = { orderid: orderId };
    if (apTransactionId) data.ap_transactionid = apTransactionId;

    const encdata = enc.encrypt(JSON.stringify(data));
    const checksum = generateAirpayChecksum(data);

    const res = await fetch(`https://kraken.airpay.co.in/airpay/pay/v4/api/verify/?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        merchant_id: config.merchantId,
        encdata,
        checksum,
        privatekey: privateKey,
      }).toString(),
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    const json = (await res.json()) as { response?: string };
    if (!json.response) {
      return { success: false, error: "Empty response from Airpay verify API" };
    }

    const decrypted = enc.decrypt<{
      status: string;
      data: Record<string, unknown>;
    }>(json.response);

    const isSuccess =
      decrypted.status?.toLowerCase() === "success" &&
      (decrypted.data?.transaction_status === 200 ||
        decrypted.data?.transaction_status === "200" ||
        String(decrypted.data?.transaction_payment_status).toLowerCase() === "success");

    return {
      success: isSuccess,
      data: decrypted.data,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Verification exception",
    };
  }
}

export function verifyAirpayResponse(
  fields: Record<string, string | undefined>,
  config = getAirpayConfig()
): { isValid: boolean; status: "SUCCESS" | "FAILED" | "PENDING"; message: string; data?: Record<string, unknown> } {
  // If encrypted response payload is present, decrypt it first
  if (fields.response) {
    try {
      const enc = new AirpayEncryption(config.username, config.password);
      const decrypted = enc.decrypt<{
        status_code?: string;
        status?: string;
        data?: Record<string, unknown>;
      }>(fields.response);

      if (decrypted && decrypted.data) {
        Object.entries(decrypted.data).forEach(([k, v]) => {
          if (!fields[k] && v !== undefined && v !== null) {
            fields[k] = String(v);
          }
        });
      }
    } catch (e) {
      console.warn("Could not decrypt response field in callback:", e);
    }
  }

  const transactionId = fields.TRANSACTIONID || fields.orderid || fields.orderId || "";
  const apTransactionId = fields.APTRANSACTIONID || fields.aptransactionid || "";
  const amount = fields.AMOUNT || fields.amount || "";
  const transactionStatus = fields.TRANSACTIONSTATUS || fields.transactionstatus || fields.STATUS || "";
  const message = fields.MESSAGE || fields.message || "";
  const mid = fields.MID || fields.mercid || fields.merchant_id || config.merchantId || "";
  const username = fields.USERNAME || config.username || "";
  const receivedHash = fields.ap_SecureHash || fields.ap_securehash || fields.checksum || "";
  const customerVpa = fields.CUSTOMER_VPA || fields.customer_vpa;

  if (config.enableSimulation && (!receivedHash || receivedHash === "simulated_hash")) {
    const isSuccess = transactionStatus === "200" || transactionStatus === "SUCCESS" || message.toUpperCase().includes("SUCCESS");
    return {
      isValid: true,
      status: isSuccess ? "SUCCESS" : "FAILED",
      message: message || (isSuccess ? "Simulation Success" : "Simulation Failed"),
    };
  }

  // Base string calculation
  const baseString = customerVpa
    ? `${transactionId}:${apTransactionId}:${amount}:${transactionStatus}:${message}:${mid}:${username}:${customerVpa}`
    : `${transactionId}:${apTransactionId}:${amount}:${transactionStatus}:${message}:${mid}:${username}`;

  const calculatedCrc = String(crc32(baseString));
  const calculatedSha = sha256(`${baseString}:${config.secretKey}`);

  const isValid =
    !receivedHash ||
    receivedHash === calculatedCrc ||
    receivedHash.toLowerCase() === calculatedSha.toLowerCase();

  const isSuccess =
    transactionStatus === "200" ||
    transactionStatus === "SUCCESS" ||
    String(fields.transaction_payment_status).toLowerCase() === "success";

  const isPending = transactionStatus === "PENDING" || transactionStatus === "IN_PROCESS";

  return {
    isValid,
    status: isSuccess ? "SUCCESS" : isPending ? "PENDING" : "FAILED",
    message: message || (isSuccess ? "Transaction Successful" : "Transaction Failed"),
    data: fields,
  };
}
