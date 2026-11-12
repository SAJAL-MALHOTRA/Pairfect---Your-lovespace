"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import { autoRecoverVaultKeyIfMissing } from "@/lib/crypto/e2ee";

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_config?: any;
  spotify_connected: boolean;
  city?: {
    name: string;
    country: string;
    timezone: string;
  } | null;
  notification_settings?: {
    partner_check_in?: boolean;
    new_gratitude?: boolean;
  } | null;
}

interface Pair {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
  invite_code: string;
  status: "pending" | "active" | "archived" | "unlinked";
  started_dating_date: string | null;
  created_at: string;
  current_streak?: number;
  longest_streak?: number;
  last_active_date?: string | null;
  paused_streak_value?: number;
  is_paused?: boolean;
  last_ping_at?: string | null;
  subscription_tier?: "free" | "plus" | "forever" | string;
  subscription_status?: "inactive" | "active" | "expired" | "cancelled" | string;
  subscription_expires_at?: string | null;
  subscription_order_id?: string | null;
  subscription_updated_at?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  pair: Pair | null;
  partner: UserProfile | null;
  loading: boolean;
  refreshSession: (showLoadingSpinner?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  pair: null,
  partner: null,
  loading: true,
  refreshSession: async (showLoadingSpinner?: boolean) => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  const inFlightPromiseRef = useRef<Promise<void> | null>(null);
  const loadedUserRef = useRef<string | null>(null);

  const fetchUserData = async (currentUser: User) => {
    // Await any in-flight fetch for this user session
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    const fetchPromise = (async () => {
      try {
      // 1. Fetch user profile
      let { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!profileData) {
        const fallbackName =
          currentUser.user_metadata?.display_name ||
          currentUser.email?.split("@")[0] ||
          "Partner";
        const { data: createdProfile } = await supabase
          .from("users")
          .upsert({
            id: currentUser.id,
            display_name: fallbackName,
          })
          .select("*")
          .single();
        profileData = createdProfile;
      }

      // 2. Fetch active pair first; if none, check for pending pair
      const { data: activePairs } = await supabase
        .from("pairs")
        .select("*")
        .or(`user_a_id.eq.${currentUser.id},user_b_id.eq.${currentUser.id}`)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1);

      let pairData = activePairs && activePairs.length > 0 ? activePairs[0] : null;

      if (!pairData) {
        const { data: pendingPairs } = await supabase
          .from("pairs")
          .select("*")
          .or(`user_a_id.eq.${currentUser.id},user_b_id.eq.${currentUser.id}`)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);

        pairData = pendingPairs && pendingPairs.length > 0 ? pendingPairs[0] : null;
      }

      let partnerData = null;
      if (pairData) {
        const partnerId =
          pairData.user_a_id === currentUser.id
            ? pairData.user_b_id
            : pairData.user_a_id;

        if (partnerId) {
          const { data: pData } = await supabase
            .from("users")
            .select("*")
            .eq("id", partnerId)
            .maybeSingle();
          partnerData = pData || null;
        }
      }

      // Batch all updates together
      setProfile(profileData || null);
      setPair(pairData);
      setPartner(partnerData);
      loadedUserRef.current = currentUser.id;

      // Silently restore zero-knowledge vault key if missing on this device
      if (pairData?.id && pairData.status === "active" && pairData.invite_code) {
        autoRecoverVaultKeyIfMissing(pairData.id, pairData.invite_code).catch(() => {});
      }
      } catch (err) {
        console.error("Error loading user profile or pair details:", err);
        setPair(null);
        setPartner(null);
      } finally {
        inFlightPromiseRef.current = null;
      }
    })();

    inFlightPromiseRef.current = fetchPromise;
    return fetchPromise;
  };

  const refreshSession = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner || !user) {
      setLoading(true);
    }
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setProfile(null);
        setPair(null);
        setPartner(null);
        loadedUserRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshSession(true);

    // Subscribe to auth changes (prevent duplicate fetch on initial mount)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          if (loadedUserRef.current !== currentUser.id) {
            await fetchUserData(currentUser);
          }
        } else {
          setProfile(null);
          setPair(null);
          setPartner(null);
          loadedUserRef.current = null;
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Listen for real-time changes ONLY to this specific user's pair row
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`auth-user-pairs-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pairs",
          filter: `user_a_id=eq.${user.id}`,
        },
        () => {
          refreshSession(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pairs",
          filter: `user_b_id=eq.${user.id}`,
        },
        () => {
          refreshSession(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Redirect users on authentication & onboarding state checks
  useEffect(() => {
    if (!loading && user) {
      const isPendingOnboarding = !pair || pair.status !== "active";
      const isOnboardingRoute = pathname.startsWith("/onboarding");
      const isRootOrAuthRoute =
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup");
      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/checkin") ||
        pathname.startsWith("/history") ||
        pathname.startsWith("/recap") ||
        pathname.startsWith("/moments") ||
        pathname.startsWith("/love-letter") ||
        pathname.startsWith("/gratitude-jar") ||
        pathname.startsWith("/stories") ||
        pathname.startsWith("/play") ||
        pathname.startsWith("/profile");
      const isSettingsRoute = pathname.startsWith("/settings");

      // 1. If authenticated user is on landing page or auth routes, route them into app
      if (isRootOrAuthRoute) {
        let safeRedirect = isPendingOnboarding ? "/onboarding" : "/dashboard";
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const redirectParam = params.get("redirect");
          if (
            redirectParam &&
            redirectParam.startsWith("/") &&
            !redirectParam.startsWith("//") &&
            !redirectParam.includes("://") &&
            !redirectParam.includes("\\")
          ) {
            safeRedirect = redirectParam;
          }
        }
        router.push(safeRedirect);
      }
      // 2. If user hasn't finished pairing, prevent accessing protected dashboard routes
      else if (isPendingOnboarding && isProtectedRoute) {
        router.push("/onboarding");
      }
      // 3. If user has active pair, prevent staying on onboarding unless in restore mode
      else if (!isPendingOnboarding && isOnboardingRoute) {
        const isRestoreMode =
          typeof window !== "undefined" &&
          (window.location.search.includes("restore") ||
            window.location.search.includes("mode=restore"));
        if (!isRestoreMode) {
          router.push("/dashboard");
        }
      }
    }
  }, [user, pair, loading, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPair(null);
    setPartner(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        pair,
        partner,
        loading,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
