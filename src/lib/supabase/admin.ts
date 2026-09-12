import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './config';

/**
 * Service-role client for server-side operations that bypass RLS.
 * Only use in API routes and server actions, never in client code.
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}
