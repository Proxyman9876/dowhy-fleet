import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMaintenanceRecord } from '@/lib/services/maintenance';
import { formatDate, formatMileage, formatHours, formatCurrency } from '@/lib/utils/format';

export default async function MaintenanceRecordPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const record = await getMaintenanceRecord(id);
  if (!record) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{record.description}</h1>
      <p className="mt-1 text-gray-500">
        <Link href={`/vehicles/${record.vehicle_id}`} className="text-blue-700 hover:underline">
          {record.vehicle.unit_number ?? `${record.vehicle.year} ${record.vehicle.make} ${record.vehicle.model}`}
        </Link>
      </p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-500">Date</dt>
            <dd className="text-gray-900">{formatDate(record.performed_at)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Performed By</dt>
            <dd className="text-gray-900">{record.performer?.full_name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Mileage</dt>
            <dd className="text-gray-900">{formatMileage(record.mileage_at)}</dd>
          </div>
          {record.hours_at != null && (
            <div>
              <dt className="text-gray-500">Hours</dt>
              <dd className="text-gray-900">{formatHours(record.hours_at)}</dd>
            </div>
          )}
          {record.cost != null && (
            <div>
              <dt className="text-gray-500">Cost</dt>
              <dd className="text-gray-900">{formatCurrency(record.cost)}</dd>
            </div>
          )}
          {record.labor_minutes != null && (
            <div>
              <dt className="text-gray-500">Labor</dt>
              <dd className="text-gray-900">{record.labor_minutes} min</dd>
            </div>
          )}
        </dl>

        {record.notes && (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-sm text-gray-700">{record.notes}</p>
          </div>
        )}
      </div>

      {record.parts_used.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Parts Used</h2>
          <ul className="space-y-2">
            {record.parts_used.map((p) => (
              <li key={p.part_id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{p.part_number} — {p.name}</span>
                <span className="text-gray-500">
                  x{p.quantity_used}
                  {p.unit_cost_at_time != null && ` (${formatCurrency(p.unit_cost_at_time)} ea)`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
