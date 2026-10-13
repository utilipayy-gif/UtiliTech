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
 * Generate SHA-256 hex digest
 */
export function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Airpay AES-256-CBC Encryption Engine
 * Protocol spec:
 * Key = MD5(username + "~:~" + password) -> 32 hex chars string (32 bytes)
 * IV = 8 random bytes hex-encoded (16 chars)
 * Output = IV (16 chars) + Base64(Ciphertext)
 */
export class AirpayEncryption {
  private key: Buffer;

  constructor(username: string, password: string) {
    const hash = crypto.createHash("md5").update(`${username}~:~${password}`).digest("hex");
    this.key = Buffer.from(hash, "utf8");
  }

  encrypt(plainText: string): string {
    const ivBytes = crypto.randomBytes(8);
    const ivHex = ivBytes.toString("hex"); // 16 characters
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

/**
 * Format current date in YYYY-MM-DD format (IST timezone required by Airpay)
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
 * Read Airpay configuration with sensible defaults and environment variable overrides
 */
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
    // "http://localhost" is pre-approved on Airpay dashboard for MID 371739
    merchantDomain: process.env.AIRPAY_MERCHANT_DOMAIN?.trim() || "http://localhost",
    mode,
    gatewayUrl: process.env.AIRPAY_GATEWAY_URL?.trim() || "https://payments.airpay.co.in/pay/v4/",
    enableSimulation: process.env.AIRPAY_ENABLE_SIMULATION === "true",
  };
}

/**
 * Generate official Airpay checksum
 * Steps: sort keys alphabetically -> concatenate values -> append date (YYYY-MM-DD) -> SHA-256
 */
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

/**
 * Generate Airpay Private Key
 * Formula: SHA-256(secretKey/apiKey + "@" + username + ":|:" + password)
 */
export function generatePrivateKey(config = getAirpayConfig()): string {
  if (config.privateKey) return config.privateKey;
  const keyToUse = config.apiKey || config.secretKey;
  return sha256(`${keyToUse}@${config.username}:|:${config.password}`);
}

/**
 * Acquire or reuse an OAuth2 access token from Airpay v4 API
 */
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

/**
 * Build payment payload and gateway URL to be POSTed to Airpay
 */
export async function createAirpayPaymentRequest(
  payload: AirpayInitiatePayload
): Promise<AirpayCheckoutData> {
  const config = getAirpayConfig();
  const formattedAmount = Number(payload.amount).toFixed(2);

  // If simulation is enabled, route to internal callback mock
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
    // 1. Obtain official OAuth2 token from Airpay v4 API
    const token = await getAirpayOAuthToken(config);

    // 2. Build payload structure required by Airpay v4
    const data: Record<string, string> = {
      buyer_email: payload.buyerEmail,
      buyer_phone: payload.buyerPhone.replace(/[^0-9]/g, "").slice(-10),
      buyer_firstname: payload.buyerFirstName,
      buyer_lastname: payload.buyerLastName || "",
      amount: formattedAmount,
      orderid: payload.orderId,
      currency_code: "356",
      iso_currency: "inr",
      buyer_address: payload.buyerAddress || "",
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

    // 3. Encrypt payload and compute checksum
    const encdata = enc.encrypt(JSON.stringify(data));
    const checksum = generateAirpayChecksum(data);

    return {
      gatewayUrl: `https://payments.airpay.co.in/pay/v4/?token=${token}`,
      isSimulation: false,
      params: {
        privatekey: privateKey,
        merchant_id: config.merchantId,
        encdata,
        checksum,
      },
    };
  } catch (error) {
    console.error("Airpay v4 checkout preparation failed, attempting hosted index fallback:", error);

    // Fallback to Classic Hosted checkout if v4 token acquisition encounters network error
    const currentDate = getAirpayDate();
    const address = payload.buyerAddress || "";
    const city = payload.buyerCity || "";
    const state = payload.buyerState || "";
    const country = payload.buyerCountry || "India";
    const allData = `${payload.buyerEmail}${payload.buyerFirstName}${payload.buyerLastName || ""}${address}${city}${state}${country}${formattedAmount}${payload.orderId}`;
    const classicChecksum = sha256(`${privateKey}@${allData}`);

    return {
      gatewayUrl: "https://payments.airpay.co.in/pay/index.php",
      isSimulation: false,
      params: {
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
        checksum: classicChecksum,
      },
    };
  }
}

/**
 * Verify incoming callback / webhook response from Airpay
 */
export function verifyAirpayResponse(
  fields: Record<string, string | undefined>,
  config = getAirpayConfig()
): { isValid: boolean; status: "SUCCESS" | "FAILED" | "PENDING"; message: string } {
  const transactionId = fields.TRANSACTIONID || fields.orderid || fields.orderId || "";
  const apTransactionId = fields.APTRANSACTIONID || fields.aptransactionid || "";
  const amount = fields.AMOUNT || fields.amount || "";
  const transactionStatus = fields.TRANSACTIONSTATUS || fields.transactionstatus || fields.STATUS || "";
  const message = fields.MESSAGE || fields.message || "";
  const mid = fields.MID || fields.mercid || fields.merchant_id || config.merchantId || "";
  const username = fields.USERNAME || config.username || "";
  const receivedHash = fields.ap_SecureHash || fields.ap_securehash || fields.checksum || "";
  const customerVpa = fields.CUSTOMER_VPA || fields.customer_vpa;

  // In simulation, accept mock responses
  if (config.enableSimulation && (!receivedHash || receivedHash === "simulated_hash")) {
    const isSuccess = transactionStatus === "200" || transactionStatus === "SUCCESS" || message.toUpperCase().includes("SUCCESS");
    return {
      isValid: true,
      status: isSuccess ? "SUCCESS" : "FAILED",
      message: message || (isSuccess ? "Simulation Success" : "Simulation Failed"),
    };
  }

  // Verification base string:
  // TRANSACTIONID:APTRANSACTIONID:AMOUNT:TRANSACTIONSTATUS:MESSAGE:MID:USERNAME[:CUSTOMER_VPA]
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
