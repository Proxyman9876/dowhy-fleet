'use client';

import { useUser } from '@/hooks/use-user';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { Header } from './header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useUser();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />
      </div>
    );
  }

  if (!profile) {
    return null; // Proxy will redirect to login
  }

  return (
    <div className="flex h-screen">
      <Sidebar profile={profile} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header profile={profile} />

        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          <div className="mx-auto max-w-7xl p-4 lg:p-6">
            {children}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
