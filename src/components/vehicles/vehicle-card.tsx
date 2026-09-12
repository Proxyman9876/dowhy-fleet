import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatMileage, formatHours } from '@/lib/utils/format';
import type { Vehicle } from '@/types/database';
import type { MaintenanceStatus } from '@/types/enums';

interface VehicleCardProps {
  vehicle: Vehicle;
  worstStatus?: MaintenanceStatus;
}

const statusBadge: Record<MaintenanceStatus, { variant: 'danger' | 'warning' | 'success' | 'default'; label: string }> = {
  overdue: { variant: 'danger', label: 'Overdue' },
  due_soon: { variant: 'warning', label: 'Due Soon' },
  ok: { variant: 'success', label: 'OK' },
  not_applicable: { variant: 'default', label: 'N/A' },
};

const vehicleStatusColors: Record<string, string> = {
  active: 'text-green-700',
  inactive: 'text-gray-500',
  out_of_service: 'text-red-600',
  sold: 'text-gray-400',
};

export function VehicleCard({ vehicle, worstStatus }: VehicleCardProps) {
  const badge = worstStatus ? statusBadge[worstStatus] : null;

  return (
    <Link href={`/vehicles/${vehicle.id}`}>
      <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm
                      transition-shadow hover:shadow-md active:bg-gray-50 min-h-[72px]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xl">
          🚛
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-gray-900 truncate">
              {vehicle.unit_number ?? vehicle.vin}
            </span>
            {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
            <span>{formatMileage(vehicle.current_mileage)}</span>
            {vehicle.current_hours > 0 && <span>{formatHours(vehicle.current_hours)}</span>}
            <span className={vehicleStatusColors[vehicle.status]}>
              {vehicle.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
