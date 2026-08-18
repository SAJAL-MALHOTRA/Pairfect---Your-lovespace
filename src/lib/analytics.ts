// Google Analytics 4 Custom Event Dispatcher

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function trackEvent(eventName: string, eventParams: Record<string, any> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, eventParams);
    } catch (e) {
      console.warn("GA tracking event error:", e);
    }
  }
}

// Pre-defined event helpers
export function trackSignUp(method: "email" | "google" = "email", isBeta: boolean = true) {
  trackEvent("sign_up", {
    method,
    is_beta_tester: isBeta,
  });
}

export function trackLogin(method: "email" | "google" = "email") {
  trackEvent("login", {
    method,
  });
}

export function trackWaitlistJoin() {
  trackEvent("join_waitlist", {
    event_category: "beta",
  });
}

export function trackPhotoboothDownload(layout: string) {
  trackEvent("photobooth_download", {
    layout,
  });
}
