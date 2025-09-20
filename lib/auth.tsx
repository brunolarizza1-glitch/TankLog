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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
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
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            const response = await fetch(
              `/api/profile?userId=${session.user.id}`
            );
            if (response.ok) {
              const profileData = await response.json();
              setProfile(profileData);
            }
          } catch (error) {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        setUser(null);
        setProfile(null);
      } finally {
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
