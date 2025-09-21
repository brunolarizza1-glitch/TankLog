'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/server/db';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return default values during server-side rendering
    if (typeof window === 'undefined') {
      return {
        user: null,
        profile: null,
        loading: true,
        signInWithGoogle: async () => {},
        signInWithMagicLink: async () => {},
        signInWithDemo: async () => {},
        signOut: async () => {},
        isDemo: false,
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    console.log('🔍 Auth: Starting auth check...');

    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('🔍 Auth: Server side, skipping auth check');
      return;
    }

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log('🔍 Auth: Session data:', session?.user?.id || 'No user');
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('🔍 Auth: User found, fetching profile...');
          try {
            const response = await fetch(
              `/api/profile?userId=${session.user.id}`
            );
            console.log('🔍 Auth: Profile response status:', response.status);
            if (response.ok) {
              const profileData = await response.json();
              console.log('🔍 Auth: Profile data:', profileData);
              setProfile(profileData);
            } else {
              console.log('🔍 Auth: Profile fetch failed');
              setProfile(null);
            }
          } catch (error) {
            console.log('🔍 Auth: Profile fetch error:', error);
            setProfile(null);
          }
        } else {
          console.log('🔍 Auth: No user, setting profile to null');
          setProfile(null);
        }
      } catch (error) {
        console.log('🔍 Auth: Auth check error:', error);
        setUser(null);
        setProfile(null);
      } finally {
        console.log('🔍 Auth: Setting loading to false');
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const response = await fetch(
            `/api/profile?userId=${session.user.id}`
          );
          if (response.ok) {
            const profileData = await response.json();
            setProfile(profileData);
          } else {
            setProfile(null);
          }
        } catch (error) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signInWithGoogle = async () => {
    window.location.href = '/api/auth/google';
  };

  const signInWithMagicLink = async (email: string) => {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send magic link');
    }
  };

  const signInWithDemo = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo@tanklog.com',
      password: 'demo123',
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  // Check if current user is demo user
  const isDemo = user?.email === 'demo@tanklog.com';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithMagicLink,
        signInWithDemo,
        signOut,
        isDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
