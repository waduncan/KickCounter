import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

let browserClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseConfig || !supabaseUrl || !supabaseKey) return null;

  browserClient ??= createBrowserClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      sameSite: "lax",
      secure: window.location.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    },
  });

  return browserClient;
}
