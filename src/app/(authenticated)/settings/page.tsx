import Link from 'next/link';
import { CalendarClock, Users } from 'lucide-react';

export default function SettingsPage() {
  const items = [
    {
      title: 'Maintenance Schedules',
      description: 'Define service intervals (oil change, tire rotation, etc.)',
      href: '/settings/schedules',
      icon: CalendarClock,
    },
    {
      title: 'Users',
      description: 'Manage team members and roles',
      href: '/settings/users',
      icon: Users,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm
                            hover:shadow-md active:bg-gray-50 transition-shadow min-h-[88px]">
              <div className="flex items-center gap-3">
                <item.icon className="h-6 w-6 text-blue-700" />
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
