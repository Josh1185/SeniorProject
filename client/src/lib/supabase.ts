import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy client/.env.example to client/.env.',
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,     // survive a page refresh (uses localStorage)
    autoRefreshToken: true,   // renew before expiry, so sessions don't drop mid-use
    detectSessionInUrl: true, // needed later for OAuth redirects
  },
});
