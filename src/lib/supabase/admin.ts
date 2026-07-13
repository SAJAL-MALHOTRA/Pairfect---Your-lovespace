import { createClient } from "@supabase/supabase-js";

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
      return handler;
    }
  }) as any;
};

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return createDummyClient();
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
