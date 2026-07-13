import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createDummyClient();
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if we have middleware refreshing user sessions.
        }
      },
    },
  });
}
