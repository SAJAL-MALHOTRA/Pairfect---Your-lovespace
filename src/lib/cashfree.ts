import { Cashfree, CFEnvironment } from "cashfree-pg";

let cashfreeInstance: Cashfree | null = null;

export function getCashfreeClient(): Cashfree {
  if (cashfreeInstance) {
    return cashfreeInstance;
  }

  const appId = process.env.CASHFREE_APP_ID || "";
  const secretKey = process.env.CASHFREE_SECRET_KEY || "";
  const env = (process.env.CASHFREE_ENV || "sandbox").toLowerCase();

  const cfEnvironment =
    env === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;

  if (!appId || !secretKey) {
    console.warn(
      "[Cashfree Warning] CASHFREE_APP_ID or CASHFREE_SECRET_KEY is not set. Cashfree API calls will fail."
    );
  }

  cashfreeInstance = new Cashfree(cfEnvironment, appId, secretKey);
  return cashfreeInstance;
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
