import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient<any>> | null = null;

export function getSupabaseConfigError() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return "Falta NEXT_PUBLIC_SUPABASE_URL.";
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY.";
  }

  return null;
}

export function getSupabaseBrowserClient() {
  const configError = getSupabaseConfigError();

  if (configError) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    );
  }

  return supabaseClient;
}
