import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Client avec la clé secrète : contourne RLS. À n'utiliser que côté serveur. */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
