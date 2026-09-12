import Link from 'next/link';
import { AlertTriangle, Clock, Truck, Package } from 'lucide-react';
import { getDashboardStats, getOverdueItems } from '@/lib/services/dashboard';
import { getMaintenanceRecords } from '@/lib/services/maintenance';
import { getLowStockParts } from '@/lib/services/inventory';
import { DueStatusBadge } from '@/components/maintenance/due-status-badge';
import { MaintenanceRecordCard } from '@/components/maintenance/maintenance-record-card';
import { Badge } from '@/components/ui/badge';
import type { MaintenanceStatus } from '@/types/enums';

export default async function DashboardPage() {
  const [stats, overdueItems, recentRecords, lowStockParts] = await Promise.all([
    getDashboardStats(),
    getOverdueItems(),
    getMaintenanceRecords({ limit: 5 }),
    getLowStockParts(),
  ]);

  const statCards = [
    { label: 'Total Vehicles', value: stats.totalVehicles, icon: Truck, color: 'text-blue-700' },
    { label: 'Overdue', value: stats.overdueCount, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Due Soon', value: stats.dueSoonCount, icon: Clock, color: 'text-yellow-600' },
    { label: 'Low Stock', value: stats.lowStockCount, icon: Package, color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue & Due Soon */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Maintenance Alerts</h2>
          {overdueItems.length === 0 ? (
            <p className="text-sm text-gray-500">All maintenance is up to date.</p>
          ) : (
            <ul className="space-y-2">
              {overdueItems.map((item, i) => (
                <li key={i}>
                  <Link href={`/vehicles/${item.vehicleId}`}>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2
                                    hover:bg-gray-100 active:bg-gray-200 min-h-[48px]">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{item.vehicleName}</span>
                        <p className="text-xs text-gray-500">{item.scheduleName}</p>
                      </div>
                      <DueStatusBadge status={item.status as MaintenanceStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low Stock Parts */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Low Stock Parts</h2>
          {lowStockParts.length === 0 ? (
            <p className="text-sm text-gray-500">All parts are adequately stocked.</p>
          ) : (
            <ul className="space-y-2">
              {lowStockParts.map((part) => (
                <li key={part.id}>
                  <Link href={`/parts/${part.id}`}>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2
                                    hover:bg-gray-100 active:bg-gray-200 min-h-[48px]">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{part.part_number}</span>
                        <p className="text-xs text-gray-500">{part.name}</p>
                      </div>
                      <Badge variant="warning">
                        {part.inventory?.quantity_on_hand ?? 0} left
                      </Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Activity</h2>
        {recentRecords.length === 0 ? (
          <p className="text-sm text-gray-500">No maintenance records yet.</p>
        ) : (
          <div className="space-y-2">
            {recentRecords.map((r) => (
              <MaintenanceRecordCard key={r.id} record={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
