import { Suspense } from "react";
import CheckoutPage from "@/app/checkout/page";


export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-rose-200 border-t-rose-600 animate-spin" />
            <p className="font-mono text-xs text-stone-500 uppercase tracking-wider">
              Loading sanctuary passes...
            </p>
          </div>
        </div>
      }
    >
      <CheckoutPage />
    </Suspense>
  );
}
