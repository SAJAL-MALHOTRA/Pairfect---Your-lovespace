import { Cashfree, CFEnvironment } from "cashfree-pg";

function cleanEnv(val: string | undefined): string {
  if (!val) return "";
  let clean = val.trim();
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

export function getResolvedCashfreeEnv(): {
  environment: CFEnvironment;
  mode: "production" | "sandbox";
} {
  const secretKey = cleanEnv(
    process.env.CASHFREE_SECRET_KEY ||
    process.env.CASHFREE_SECRET ||
    process.env.CASHFREE_API_KEY
  );
  const explicitEnv = cleanEnv(
    process.env.CASHFREE_ENV || process.env.NEXT_PUBLIC_CASHFREE_ENV
  ).toLowerCase();

  // 1. If key is explicitly production (cfsk_ma_pr_ or contains _pr_), always use production
  if (secretKey.startsWith("cfsk_ma_pr_") || secretKey.includes("_pr_")) {
    return { environment: CFEnvironment.PRODUCTION, mode: "production" };
  }

  // 2. If key is explicitly sandbox (cfsk_ma_test_ or contains _test_), always use sandbox
  if (secretKey.startsWith("cfsk_ma_test_") || secretKey.includes("_test_")) {
    return { environment: CFEnvironment.SANDBOX, mode: "sandbox" };
  }

  // 3. Fallback to explicit env var or sandbox default
  if (explicitEnv === "production") {
    return { environment: CFEnvironment.PRODUCTION, mode: "production" };
  }

  return { environment: CFEnvironment.SANDBOX, mode: "sandbox" };
}

export function getCashfreeClient(): Cashfree {
  const appId = cleanEnv(
    process.env.CASHFREE_APP_ID ||
    process.env.NEXT_PUBLIC_CASHFREE_APP_ID ||
    process.env.CASHFREE_CLIENT_ID
  );
  const secretKey = cleanEnv(
    process.env.CASHFREE_SECRET_KEY ||
    process.env.CASHFREE_SECRET ||
    process.env.CASHFREE_API_KEY
  );
  const { environment, mode } = getResolvedCashfreeEnv();

  if (!appId || !secretKey) {
    console.warn(
      "[Cashfree Warning] CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not detected in server environment."
    );
  }

  return new Cashfree(environment, appId, secretKey);
}

export interface CreateOrderParams {
  orderId: string;
  orderAmount: number;
  orderCurrency?: string;
  customerId: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  returnUrl: string;
  notes?: Record<string, string>;
}

export async function createCashfreeOrder(params: CreateOrderParams) {
  const cf = getCashfreeClient();

  // Cashfree requires a valid customer_phone (min 10 digits). If missing, use a valid test placeholder.
  let phone = params.customerPhone?.replace(/[^0-9]/g, "");
  if (!phone || phone.length < 10) {
    phone = "9999999999";
  } else if (phone.length > 10) {
    phone = phone.slice(-10);
  }

  const request = {
    order_id: params.orderId,
    order_amount: params.orderAmount,
    order_currency: (params.orderCurrency || "INR").toUpperCase(),
    customer_details: {
      customer_id: params.customerId,
      customer_phone: phone,
      customer_email: params.customerEmail || "user@pairfect.site",
      customer_name: params.customerName || "Pairfect User",
    },
    order_meta: {
      return_url: params.returnUrl,
    },
    order_note: params.notes ? JSON.stringify(params.notes) : undefined,
  };

  const response = await cf.PGCreateOrder(request);
  return response.data;
}

export async function fetchCashfreeOrder(orderId: string) {
  const cf = getCashfreeClient();
  const response = await cf.PGFetchOrder(orderId);
  return response.data;
}

export function verifyCashfreeWebhookSignature(
  signature: string,
  rawBody: string,
  timestamp: string
) {
  const cf = getCashfreeClient();
  return cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
}
