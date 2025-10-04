import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({
  session: null,
  user: null,
  loading: true,
  signUp: async (_email, _password, _profile) => {},
  signIn: async (_email, _password) => {},
  signOut: async () => {},
  resetPassword: async (_email) => {},
  updatePassword: async (_newPassword) => {},
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = session?.user || null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (mounted) setSession(currentSession);
      if (mounted) setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email, password, profile = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: profile }
    });
    if (error) throw error;
    const user = data.user;
    // Also persist profile in a dedicated table if available
    if (user && profile && (profile.display_name || profile.displayName)) {
      try {
        const display_name = profile.display_name || profile.displayName;
        await supabase.from('profiles').upsert({ id: user.id, display_name });
      } catch (e) {
        console.warn('Profile upsert failed:', e.message);
      }
    }
    return user;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    return data.user;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Sends a password recovery email. Ensure the Site URL in Supabase Auth settings points back to an app deep link / redirect handler.
  const resetPassword = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'https://example.com/auth/callback', // TODO: replace with your actual deep link / universal link
    });
    if (error) throw error;
    return true;
  }, []);

  // Call after user returns from recovery link (in a web context) or if you implement an in-app password change form.
  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return true;
  }, []);

  const value = { session, user, loading, signUp, signIn, signOut, resetPassword, updatePassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
