'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Direct fetch to Supabase Auth - bypass client library entirely
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error_description || data.msg || 'Login failed');
        return;
      }

      // Store the session tokens
      if (data.access_token) {
        // Set cookies for the server-side middleware
        document.cookie = `sb-access-token=${data.access_token}; path=/; max-age=${data.expires_in}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.refresh_token}; path=/; max-age=604800; SameSite=Lax`;

        // Also initialize the Supabase client with the session
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.webp" alt="Dowhy Towing" className="h-16 w-auto" />
          <p className="mt-2 text-sm text-gray-500">
            Fleet Maintenance System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-base
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 px-4 py-3 text-base font-medium text-white
                       hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50
                       disabled:opacity-50 active:bg-blue-900"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
