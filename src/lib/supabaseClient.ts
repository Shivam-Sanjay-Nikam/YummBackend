/**
 * Single Supabase client instance.
 * - createClient is called once and exported for reuse across the app
 * - autoRefreshToken is disabled to avoid tight refresh loops
 * - detectSessionInUrl is disabled to avoid session parsing on every load (OAuth use-cases may set differently)
 *
 * Adjust env access if you don't use Vite (e.g. process.env.REACT_APP_SUPABASE_*).
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Fail fast: do not start app with missing frontend keys
  // In production make sure these are set in your build environment and NOT exposing service role key.
  // (Service role key must never be used in browser.)
  throw new Error('Missing SUPABASE env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // disable automatic refresh to avoid infinite refresh storms (we'll manage refresh manually)
    autoRefreshToken: false,
    // don't auto-detect session for URL changes (useful if you handle OAuth explicitly)
    detectSessionInUrl: false,
    // persist session in local storage (set true unless you need custom persistence)
    persistSession: true,
  },
  realtime: {
    // Enable realtime for live updates
    params: {
      eventsPerSecond: 10,
    },
  },
});

// export type helpers if needed
export type { Session } from '@supabase/supabase-js';
