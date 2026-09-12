'use client';

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qdkagpiccjgbdrcwpcpr.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2FncGljY2pnYmRyY3dwY3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTU2NTMsImV4cCI6MjEwNDczMTY1M30.ie4QNJe7knYTovKZHiUO-_-4mvIpiSbZelRZ30S8AwM';

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
