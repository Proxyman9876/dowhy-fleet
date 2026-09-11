'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, Wrench, Package } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Vehicles', href: '/vehicles', icon: Truck },
  { label: 'Service', href: '/maintenance', icon: Wrench },
  { label: 'Parts', href: '/parts', icon: Package },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white lg:hidden">
      <ul className="flex">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                  'min-h-[56px] justify-center', // Large touch target
                  isActive ? 'text-blue-700' : 'text-gray-500',
                )}
              >
                <item.icon className={cn('h-6 w-6', isActive && 'text-blue-700')} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
