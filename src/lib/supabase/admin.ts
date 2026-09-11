import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client for server-side operations that bypass RLS.
 * Only use in API routes and server actions, never in client code.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
