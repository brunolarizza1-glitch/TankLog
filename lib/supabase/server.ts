import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Expected in some contexts
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        } catch {
          // Expected in some contexts
        }
      },
    },
  });
};

export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() {
        return undefined;
      },
      set() {
        // No-op for admin client
      },
      remove() {
        // No-op for admin client
      },
    },
  });
};
