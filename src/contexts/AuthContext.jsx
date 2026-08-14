import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { buildLinkKey, createFamily, findFamily, joinFamily } from '../services/supabaseService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, link_key')
      .eq('id', user.id)
      .maybeSingle();

    // The role is written by the signup trigger, but fall back to auth
    // metadata if the profile row has not caught up yet. Either way the
    // app never has to ask the person for their role a second time.
    setProfile({
      id: user.id,
      email: user.email,
      full_name: data?.full_name ?? user.user_metadata?.full_name ?? '',
      role: data?.role ?? user.user_metadata?.role ?? null,
      link_key: data?.link_key ?? null,
    });
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session?.user);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadProfile(nextSession?.user);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  // FIX (role at signup): role is now required here and travels with
  // the account from the moment it is created. Nothing downstream asks
  // "are you a parent or a caregiver?" again — not the login screen,
  // not a first-launch gate.
  const register = useCallback(async ({ email, password, fullName, role, childName }) => {
    if (!role) throw new Error('Choose whether this account is for a parent or a caregiver.');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || '',
          role,
          child_name: role === 'parent' ? childName?.trim() || '' : '',
        },
      },
    });
    if (error) throw error;

    const user = data.user;

    // A parent who named their child at signup gets their family created
    // straight away, so they land on a working dashboard.
    if (user && role === 'parent' && childName?.trim()) {
      const link_key = await createFamily({
        parentEmail: email,
        childName,
        parentId: user.id,
      }).then((f) => f.link_key);

      await supabase.from('profiles').update({ link_key }).eq('id', user.id);
    }

    await loadProfile(user);
    return data;
  }, [loadProfile]);

  const login = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    await loadProfile(data.user);
    return data;
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  // Caregiver links to an existing family with the parent's email and
  // the child's name.
  const linkFamily = useCallback(
    async ({ parentEmail, childName }) => {
      const family = await findFamily({ parentEmail, childName });
      if (!family) {
        throw new Error(
          'No family matches that parent email and child name. Check the spelling with the parent.'
        );
      }

      const link_key = buildLinkKey(parentEmail, childName);
      await joinFamily({ link_key, userId: session.user.id, role: profile?.role ?? 'caregiver' });
      await supabase.from('profiles').update({ link_key }).eq('id', session.user.id);

      setProfile((prev) => ({ ...prev, link_key }));
      return link_key;
    },
    [session, profile]
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      linkKey: profile?.link_key ?? null,
      loading,
      register,
      login,
      logout,
      linkFamily,
      refreshProfile: () => loadProfile(session?.user),
    }),
    [session, profile, loading, register, login, logout, linkFamily, loadProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
