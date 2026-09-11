'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Package,
  Settings,
  LogOut,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types/database';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Vehicles', href: '/vehicles', icon: Truck },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench },
  { label: 'Parts', href: '/parts', icon: Package },
  { label: 'Import', href: '/import', icon: FileSpreadsheet },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  // Filter nav items by role
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.href === '/import' && profile.role === 'mechanic') return false;
    if (item.href === '/settings' && profile.role === 'mechanic') return false;
    return true;
  });

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-lg font-bold text-blue-800">Dowhy Fleet</h1>
      </div>

      <nav className="flex flex-1 flex-col p-4">
        <ul className="flex flex-1 flex-col gap-1">
          {visibleItems.map((item) => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-gray-200 pt-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
            <p className="text-xs capitalize text-gray-500">{profile.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
}
