// Supabase connection config — hardcoded values, env vars stripped of whitespace as override
const DEFAULT_URL = 'https://qdkagpiccjgbdrcwpcpr.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2FncGljY2pnYmRyY3dwY3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNTU2NTMsImV4cCI6MjEwNDczMTY1M30.ie4QNJe7knYTovKZHiUO-_-4mvIpiSbZelRZ30S8AwM';
const DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2FncGljY2pnYmRyY3dwY3ByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTE1NTY1MywiZXhwIjoyMTA0NzMxNjUzfQ.8_hA_G3j8EBgOkzdQjuPYJr-7ab43ioxiFkraTKzqQs';

function clean(val: string | undefined, fallback: string): string {
  const trimmed = val?.replace(/[\s\r\n]+/g, '').trim();
  return trimmed && trimmed.length > 10 ? trimmed : fallback;
}

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL, DEFAULT_URL);
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, DEFAULT_ANON_KEY);
export const SUPABASE_SERVICE_ROLE_KEY = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, DEFAULT_SERVICE_KEY);
