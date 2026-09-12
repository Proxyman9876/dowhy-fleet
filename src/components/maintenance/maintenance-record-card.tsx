import Link from 'next/link';
import { formatDate, formatMileage } from '@/lib/utils/format';
import type { MaintenanceRecordDetail } from '@/types/domain';

export function MaintenanceRecordCard({ record }: { record: MaintenanceRecordDetail }) {
  return (
    <Link href={`/maintenance/${record.id}`}>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm
                      hover:shadow-md active:bg-gray-50 transition-shadow min-h-[64px]">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{record.description}</p>
            <p className="text-sm text-gray-500">
              {record.vehicle.unit_number ?? `${record.vehicle.year} ${record.vehicle.make} ${record.vehicle.model}`}
              {' — '}
              {formatDate(record.performed_at)}
            </p>
            <p className="text-xs text-gray-400">
              {formatMileage(record.mileage_at)} &middot; {record.performer.full_name}
            </p>
          </div>
          {record.parts_used.length > 0 && (
            <span className="ml-2 shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              {record.parts_used.length} part{record.parts_used.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
