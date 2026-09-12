import Link from 'next/link';
import { Truck, Wrench, Package, FileUp } from 'lucide-react';

export default function DashboardPage() {
  const quickLinks = [
    { label: 'Vehicles', href: '/vehicles', icon: Truck, color: 'bg-blue-100 text-blue-700' },
    { label: 'Maintenance', href: '/maintenance', icon: Wrench, color: 'bg-green-100 text-green-700' },
    { label: 'Parts', href: '/parts', icon: Package, color: 'bg-orange-100 text-orange-700' },
    { label: 'Import', href: '/import', icon: FileUp, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md active:bg-gray-50 transition-shadow text-center">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${link.color}`}>
                <link.icon className="h-6 w-6" />
              </div>
              <p className="font-medium text-gray-900">{link.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
