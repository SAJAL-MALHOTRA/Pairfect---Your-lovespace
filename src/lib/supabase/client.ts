import { createBrowserClient } from "@supabase/ssr";

// ES6 Proxy to intercept database queries and auth operations during compile-time pre-rendering
const createDummyClient = () => {
  const handler: any = () => new Proxy({}, {
    get(_, prop) {
      if (prop === "then") {
        return (resolve: any) => resolve({ data: null, error: null });
      }
      return handler;
    }
  });

  return new Proxy({}, {
    get(_, prop) {
      if (prop === "then") {
        return undefined; // Ensure the client itself is not treated as a thenable/promise
      }
      if (prop === "auth") {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signOut: async () => {},
        };
      }
      if (prop === "storage") {
        return {
          from: () => ({
            upload: async () => ({ data: null, error: null }),
            remove: async () => ({ data: null, error: null }),
            createSignedUrl: async () => ({ data: { signedUrl: "" }, error: null }),
          })
        };
      }
      return handler;
    }
  }) as any;
};

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createDummyClient();
  }

  return createBrowserClient(url, anonKey);
}
