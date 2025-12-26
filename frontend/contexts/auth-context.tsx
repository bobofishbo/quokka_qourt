import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  aliasMode: boolean | null;
  quokkaCitizenshipLevel: number | null;
  quokkaStamps: string[];
  quokkaBadges: string[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  hasProfile: () => boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: { username?: string; displayName?: string; avatarUrl?: string }) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // Fetch user profile from backend API
  const fetchProfile = async (session: Session | null): Promise<Profile | null> => {
    if (!session?.access_token) {
      return null;
    }

    setIsProfileLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.status === 404) {
        // Profile doesn't exist yet - this is normal for new users
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching profile:', errorData);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Network errors are expected if backend isn't running
      // Silently fail - profile will be null and user can still use the app
      console.warn('Could not fetch profile from backend:', error);
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session - handle errors gracefully
    supabase.auth.getSession()
      .then(async ({ data: { session } }: { data: { session: Session | null } }) => {
        if (mounted) {
          setSession(session);
          setIsLoading(false);
          
          // Fetch profile if user is authenticated
          if (session) {
            const profileData = await fetchProfile(session);
            if (mounted) {
              setProfile(profileData);
            }
          } else {
            setProfile(null);
          }
        }
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        // If it's a network error and we don't have valid credentials, just set no session
        if (mounted) {
          setSession(null);
          setProfile(null);
          setIsLoading(false);
        }
      });

    // Listen for auth changes (but don't navigate - let layouts handle it)
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (_event: string, session: Session | null) => {
        if (mounted) {
          setSession(session);
          setIsLoading(false);
          
          // Fetch profile if user is authenticated
          if (session) {
            const profileData = await fetchProfile(session);
            if (mounted) {
              setProfile(profileData);
            }
          } else {
            setProfile(null);
          }
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

  // Log JWT token for Postman testing (temporary - remove in production)
  useEffect(() => {
    if (session?.access_token) {
      console.log('\n\n========================================');
      console.log('=== JWT TOKEN FOR POSTMAN ===');
      console.log('========================================');
      console.log(session.access_token);
      console.log('========================================');
      console.log('=== COPY THIS TOKEN ABOVE ===');
      console.log('========================================\n\n');
    } else {
      console.log('No session token available. Please sign in.');
    }
  }, [session]);

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
    setProfile(null);
  };

  const hasProfile = () => {
    return profile !== null;
  };

  const refreshProfile = async () => {
    if (session) {
      const profileData = await fetchProfile(session);
      setProfile(profileData);
    }
  };
  const updateProfile = async (updates: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<{ error: string | null }> => {
    if (!session?.access_token) {
      return { error: "Not authenticated" };
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/profile/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: errorData.message || 'Failed to update profile' };
      }
  
      // Refresh profile after successful update
      const profileData = await fetchProfile(session);
      setProfile(profileData);
      
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        isProfileLoading,
        signIn,
        signUp,
        signOut,
        hasProfile,
        refreshProfile,
        updateProfile,
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
