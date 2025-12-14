import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session - handle errors gracefully
    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: Session | null } }) => {
        if (mounted) {
          setSession(session);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        // If it's a network error and we don't have valid credentials, just set no session
        if (mounted) {
          setSession(null);
          setIsLoading(false);
        }
      });

    // Listen for auth changes (but don't navigate - let layouts handle it)
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
        if (mounted) {
          setSession(session);
          setIsLoading(false);
        }
      });
      subscription = sub;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      if (mounted) {
        setIsLoading(false);
      }
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Note: Supabase may require email confirmation
    // If email confirmation is enabled, user won't be signed in immediately
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
