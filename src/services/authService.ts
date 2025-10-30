import { supabase } from './supabaseClient';
import type { User, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<{ error: AuthError | null }> {
  // Use the full current URL for redirect
  const redirectUrl = window.location.href.split('?')[0].split('#')[0];

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });
  return { error };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Ensure user profile exists in the users table
 * Creates a profile record if it doesn't exist (upsert)
 */
export async function ensureUserProfile(user: User): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        username: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      }, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error ensuring user profile:', error);
      return { error: error as Error };
    }

    return { error: null };
  } catch (error) {
    console.error('Failed to ensure user profile:', error);
    return { error: error as Error };
  }
}

/**
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}
