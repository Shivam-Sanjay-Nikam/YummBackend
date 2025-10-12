/**
 * Auth helper wrapper around supabase client.
 * - safeRefreshSession() does a single refresh attempt with optional retries/exponential backoff
 * - initAuthListener() registers an auth-state listener and signs out on repeated refresh failures
 * - getSession(), signInWithEmailPassword(), signOut() are small convenience wrappers
 *
 * Paste this file and import functions where you handle auth in your app.
 */

import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

const MAX_REFRESH_RETRIES = 3;
const RETRY_BASE_MS = 500; // exponential backoff base

let refreshRetryCount = 0;
let refreshInProgress = false;

/**
 * Exponential backoff helper
 */
function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Attempt to refresh the current session token safely.
 * Returns refreshed session or null on failure.
 *
 * Important: this function avoids tight retry loops and resets retry state on success.
 */
export async function safeRefreshSession(): Promise<Session | null> {
  if (refreshInProgress) {
    // another refresh is already running - wait a bit and return the current session
    return supabase.auth.getSession().then((r) => r.data.session ?? null);
  }

  refreshInProgress = true;
  try {
    for (;;) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        // increment retry count and backoff
        refreshRetryCount += 1;
        if (refreshRetryCount > MAX_REFRESH_RETRIES) {
          console.error('safeRefreshSession: max retries exceeded', error);
          // Force sign out to break any retry storms
          try { await supabase.auth.signOut(); } catch (_) {}
          refreshInProgress = false;
          return null;
        }
        const backoffMs = RETRY_BASE_MS * Math.pow(2, refreshRetryCount - 1);
        console.warn(`safeRefreshSession: refresh failed (${refreshRetryCount}), backing off ${backoffMs}ms`, error);
        await wait(backoffMs);
        continue; // try again until max
      }

      // success - reset retry counter and return session
      refreshRetryCount = 0;
      refreshInProgress = false;
      return data.session ?? null;
    }
  } catch (e) {
    console.error('safeRefreshSession: unexpected error', e);
    refreshInProgress = false;
    return null;
  }
}

/**
 * Initialize auth state listener.
 * If refresh fails repeatedly, we proactively sign the user out to avoid refresh loop / 429 storms.
 *
 * Call this once at app startup (e.g., in index.tsx or App.tsx root).
 */
export function initAuthListener() {
  // Supabase v2 returns a subscription object with unsubscribe()
  const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
    // Debug / telemetry if needed:
    // console.info('onAuthStateChange', event, session);

    // If we detect a token refresh failure event (or no valid session), sign out and reset state
    // Event names may vary by supabase-js version, handle generically:
    if (event === 'TOKEN_REFRESH_FAILED') {
      console.warn('Auth token refresh failed, attempting safe refresh...');
      const refreshed = await safeRefreshSession();
      if (!refreshed) {
        // sign out already attempted in safeRefreshSession, but do a best effort
        try { await supabase.auth.signOut(); } catch (_) {}
        // Optional: redirect to /login or notify user here
      }
      return;
    }

    if (event === 'SIGNED_OUT') {
      // clear any local state / caches if needed
      refreshRetryCount = 0;
      refreshInProgress = false;
    }

    // If session exists, but the app doesn't have it yet, you can persist or notify UI accordingly.
    if (session) {
      // Optionally ensure the session is valid and not stale
      // e.g., call safeRefreshSession if you want to proactively refresh once at load
    }
  });

  return () => {
    // return unsubscribe function so caller can cleanup if necessary
    sub?.unsubscribe();
  };
}

/**
 * Convenience: getSession() wrapper
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * Convenience: sign in with email & password (client-side use only)
 */
export async function signInWithEmailPassword(email: string, password: string) {
  // Do not log passwords
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('signInWithEmailPassword failed', error);
    // Return normalized shape
    return { success: false, error: error.message ?? 'Sign in failed' };
  }
  return { success: true, session: data.session ?? null, user: data.user ?? null };
}

/**
 * Safely set session from backend tokens without triggering refresh storms
 */
export async function setSessionSafely(sessionData: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}) {
  try {
    // Set the session directly without triggering automatic refresh
    await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token
    });
    
    // Clear any existing refresh retry state
    refreshRetryCount = 0;
    refreshInProgress = false;
  } catch (e) {
    console.error('setSessionSafely error', e);
    throw e;
  }
}

/**
 * Convenience: sign out
 */
export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.error('signOut error', e);
  }
}
