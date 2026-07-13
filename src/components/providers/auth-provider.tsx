"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  spotify_connected: boolean;
}

interface Pair {
  id: string;
  user_a_id: string;
  user_b_id: string | null;
  invite_code: string;
  status: "pending" | "active" | "archived";
  started_dating_date: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  pair: Pair | null;
  partner: UserProfile | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  pair: null,
  partner: null,
  loading: true,
  refreshSession: async () => {},
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

  const fetchUserData = async (currentUser: User) => {
    try {
      // 1. Fetch user profile
      const { data: profileData, error: profileErr } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (profileErr) throw profileErr;
      setProfile(profileData);

      // 2. Fetch active/pending pair
      const { data: pairData, error: pairErr } = await supabase
        .from("pairs")
        .select("*")
        .or(`user_a_id.eq.${currentUser.id},user_b_id.eq.${currentUser.id}`)
        .in("status", ["pending", "active"])
        .maybeSingle();

      if (pairErr) throw pairErr;

      if (pairData) {
        setPair(pairData);

        // 3. If pair is active, fetch partner details
        const partnerId =
          pairData.user_a_id === currentUser.id
            ? pairData.user_b_id
            : pairData.user_a_id;

        if (partnerId) {
          const { data: partnerData } = await supabase
            .from("users")
            .select("*")
            .eq("id", partnerId)
            .single();

          setPartner(partnerData || null);
        } else {
          setPartner(null);
        }
      } else {
        setPair(null);
        setPartner(null);
      }
    } catch (err) {
      console.error("Error loading user profile or pair details:", err);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    if (currentUser) {
      await fetchUserData(currentUser);
    } else {
      setProfile(null);
      setPair(null);
      setPartner(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    refreshSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          await fetchUserData(currentUser);
        } else {
          setProfile(null);
          setPair(null);
          setPartner(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirect users on onboarding checks
  useEffect(() => {
    if (!loading && user) {
      const isPendingOnboarding = !pair || pair.status === "pending";
      const isOnboardingRoute = pathname.startsWith("/onboarding");
      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/checkin") ||
        pathname.startsWith("/history") ||
        pathname.startsWith("/recap") ||
        pathname.startsWith("/moments") ||
        pathname.startsWith("/settings");

      if (isPendingOnboarding && isProtectedRoute) {
        router.push("/onboarding");
      } else if (!isPendingOnboarding && isOnboardingRoute) {
        router.push("/dashboard");
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
