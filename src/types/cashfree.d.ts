declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeLoadOptions {
    mode: "sandbox" | "production";
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal" | "_top";
    returnUrl?: string;
  }

  export interface CashfreeCheckoutResult {
    error?: {
      message: string;
      code?: string;
    };
    redirect?: boolean;
    paymentDetails?: any;
  }

  export interface CashfreeInstance {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }

  export function load(options: CashfreeLoadOptions): Promise<CashfreeInstance>;
}
