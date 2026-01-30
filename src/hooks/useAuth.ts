import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  license_number: string | null;
  role: string | null;
  brokerage_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Brokerage {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  brokerage: Brokerage | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    brokerage: null,
    isLoading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profile?.brokerage_id) {
      const { data: brokerage } = await supabase
        .from("brokerages")
        .select("*")
        .eq("id", profile.brokerage_id)
        .single();

      return { profile, brokerage };
    }

    return { profile, brokerage: null };
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(async () => {
            const { profile, brokerage } = await fetchProfile(session.user.id);
            setState({
              user: session.user,
              session,
              profile,
              brokerage,
              isLoading: false,
            });
          }, 0);
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            brokerage: null,
            isLoading: false,
          });
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { profile, brokerage } = await fetchProfile(session.user.id);
        setState({
          user: session.user,
          session,
          profile,
          brokerage,
          isLoading: false,
        });
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", state.user.id);

    if (!error) {
      const { profile, brokerage } = await fetchProfile(state.user.id);
      setState((prev) => ({ ...prev, profile, brokerage }));
    }

    return { error };
  };

  const updateBrokerage = async (updates: Partial<Brokerage>) => {
    if (!state.user || !state.profile?.brokerage_id) {
      return { error: new Error("No brokerage linked") };
    }

    const { error } = await supabase
      .from("brokerages")
      .update(updates)
      .eq("id", state.profile.brokerage_id);

    if (!error) {
      const { profile, brokerage } = await fetchProfile(state.user.id);
      setState((prev) => ({ ...prev, profile, brokerage }));
    }

    return { error };
  };

  const createBrokerage = async (brokerageData: { name: string; address?: string; city?: string; state?: string; zip_code?: string; phone?: string; email?: string; website?: string }) => {
    if (!state.user) return { error: new Error("Not authenticated") };

    const { data: newBrokerage, error: createError } = await supabase
      .from("brokerages")
      .insert([brokerageData])
      .select()
      .single();

    if (createError || !newBrokerage) return { error: createError };

    // Link to profile
    const { error: linkError } = await supabase
      .from("profiles")
      .update({ brokerage_id: newBrokerage.id })
      .eq("user_id", state.user.id);

    if (!linkError) {
      const { profile, brokerage } = await fetchProfile(state.user.id);
      setState((prev) => ({ ...prev, profile, brokerage }));
    }

    return { error: linkError };
  };

  const refetchProfile = useCallback(async () => {
    if (state.user) {
      const { profile, brokerage } = await fetchProfile(state.user.id);
      setState((prev) => ({ ...prev, profile, brokerage }));
    }
  }, [state.user, fetchProfile]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateBrokerage,
    createBrokerage,
    refetchProfile,
    isAuthenticated: !!state.user,
  };
}
