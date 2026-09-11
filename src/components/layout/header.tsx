'use client';

import { Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import type { Profile } from '@/types/database';

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // Get page title from pathname
  function getTitle() {
    if (pathname === '/') return 'Dashboard';
    const segment = pathname.split('/')[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-blue-800 lg:hidden">Dowhy</span>
        <h2 className="text-lg font-semibold text-gray-900 hidden lg:block">{getTitle()}</h2>
      </div>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-2">
                <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                <p className="text-xs capitalize text-gray-500">{profile.role}</p>
              </div>

              {profile.role !== 'mechanic' && (
                <>
                  <Link
                    href="/import"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm',
                      pathname === '/import' ? 'text-blue-700' : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    Import Data
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 text-sm',
                      pathname.startsWith('/settings') ? 'text-blue-700' : 'text-gray-700 hover:bg-gray-50',
                    )}
                  >
                    Settings
                  </Link>
                </>
              )}

              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </>
        )}

        {/* Desktop: just show user info */}
        <div className="hidden items-center gap-3 lg:flex">
          <span className="text-sm text-gray-600">{profile.full_name}</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
            {profile.role}
          </span>
        </div>
      </div>
    </header>
  );
}
