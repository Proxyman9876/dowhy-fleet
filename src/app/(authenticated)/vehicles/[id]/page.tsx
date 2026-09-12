import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getVehicle } from '@/lib/services/vehicles';
import { getVehicleSchedules, getSchedules } from '@/lib/services/schedules';
import { getMaintenanceRecords } from '@/lib/services/maintenance';
import { Badge } from '@/components/ui/badge';
import { MileageUpdateForm } from '@/components/vehicles/mileage-update-form';
import { QrCodeDisplay } from '@/components/vehicles/qr-code-display';
import { DeleteVehicleButton } from '@/components/vehicles/delete-vehicle-button';
import { VehicleSchedules } from '@/components/maintenance/vehicle-schedules';
import { MaintenanceRecordCard } from '@/components/maintenance/maintenance-record-card';
import { formatMileage, formatHours } from '@/lib/utils/format';

export default async function VehicleDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const [vehicle, vehicleSchedules, allSchedules, records] = await Promise.all([
    getVehicle(id),
    getVehicleSchedules(id),
    getSchedules(),
    getMaintenanceRecords({ vehicleId: id, limit: 10 }),
  ]);

  if (!vehicle) notFound();

  const statusColors: Record<string, string> = {
    active: 'success',
    inactive: 'default',
    out_of_service: 'danger',
    sold: 'default',
  };

  // Separate filter schedules from other schedules for display
  const filterSchedules = vehicleSchedules.filter((vs) =>
    ['Oil Change', 'Oil Filter', 'Air Filter', 'Fuel Filter', 'Fuel/Water Separator', 'Coolant Filter', 'Hydraulic Filter'].includes(vs.schedule.name)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {vehicle.unit_number ?? vehicle.vin}
          </h1>
          <p className="text-gray-500">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/vehicles/${id}/edit`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <Link
            href={`/vehicles/${id}/service`}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Log Service
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicle Info */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-gray-500">VIN</dt>
                <dd className="font-mono text-gray-900">{vehicle.vin}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd>
                  <Badge variant={statusColors[vehicle.status] as 'success' | 'danger' | 'default'}>
                    {vehicle.status.replace(/_/g, ' ')}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">License Plate</dt>
                <dd className="text-gray-900">{vehicle.license_plate || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Oil Type</dt>
                <dd className="text-gray-900">{vehicle.oil_type || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Mileage</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatMileage(vehicle.current_mileage)}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Hours</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatHours(vehicle.current_hours)}
                </dd>
              </div>
            </dl>
            {vehicle.notes && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm text-gray-700">{vehicle.notes}</p>
              </div>
            )}
          </div>

          {/* Filter / Service Info Table */}
          {filterSchedules.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Filters & Service</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-2 pr-4 font-medium text-gray-500">Type</th>
                      <th className="pb-2 pr-4 font-medium text-gray-500">Last Service</th>
                      <th className="pb-2 pr-4 font-medium text-gray-500">Part #</th>
                      <th className="pb-2 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterSchedules.map((vs) => {
                      const statusColor = vs.cached_status === 'overdue'
                        ? 'danger'
                        : vs.cached_status === 'due_soon'
                          ? 'warning'
                          : 'success';
                      return (
                        <tr key={vs.id} className="border-b border-gray-50">
                          <td className="py-2 pr-4 font-medium text-gray-900">{vs.schedule.name}</td>
                          <td className="py-2 pr-4 text-gray-700">
                            {vs.last_performed_mileage
                              ? formatMileage(vs.last_performed_mileage)
                              : '—'}
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs text-gray-700">
                            {vs.assigned_part?.part_number ?? '—'}
                          </td>
                          <td className="py-2">
                            <Badge variant={statusColor as 'success' | 'danger' | 'warning' | 'default'}>
                              {vs.cached_status.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vehicle Condition */}
          {(vehicle.tire_notes || vehicle.tire_rotation_mileage || vehicle.greased_mileage || vehicle.differential_oil_mileage || vehicle.transmission_oil_mileage || vehicle.major_repairs) && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Vehicle Condition</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                {vehicle.tire_notes && (
                  <div>
                    <dt className="text-gray-500">Tires</dt>
                    <dd className="text-gray-900">{vehicle.tire_notes}</dd>
                  </div>
                )}
                {vehicle.tire_rotation_mileage != null && (
                  <div>
                    <dt className="text-gray-500">Tire Rotation/Change</dt>
                    <dd className="text-gray-900">{formatMileage(vehicle.tire_rotation_mileage)}</dd>
                  </div>
                )}
                {vehicle.greased_mileage != null && (
                  <div>
                    <dt className="text-gray-500">Last Greased</dt>
                    <dd className="text-gray-900">{formatMileage(vehicle.greased_mileage)}</dd>
                  </div>
                )}
                {vehicle.differential_oil_mileage != null && (
                  <div>
                    <dt className="text-gray-500">Differential Oil</dt>
                    <dd className="text-gray-900">{formatMileage(vehicle.differential_oil_mileage)}</dd>
                  </div>
                )}
                {vehicle.transmission_oil_mileage && (
                  <div>
                    <dt className="text-gray-500">Transmission Oil</dt>
                    <dd className="text-gray-900">{vehicle.transmission_oil_mileage}</dd>
                  </div>
                )}
              </dl>
              {vehicle.major_repairs && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-500">Major Repairs</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{vehicle.major_repairs}</p>
                </div>
              )}
            </div>
          )}

          {/* Mileage Update */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <MileageUpdateForm
              vehicleId={vehicle.id}
              currentMileage={vehicle.current_mileage}
              currentHours={vehicle.current_hours}
            />
          </div>

          {/* Maintenance Schedules */}
          <VehicleSchedules
            vehicleId={vehicle.id}
            schedules={vehicleSchedules}
            allSchedules={allSchedules}
          />

          {/* Maintenance History */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Maintenance History</h2>
            {records.length === 0 ? (
              <p className="text-sm text-gray-500">No maintenance records yet.</p>
            ) : (
              <div className="space-y-2">
                {records.map((r) => (
                  <MaintenanceRecordCard key={r.id} record={r} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: QR + Delete */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-center text-lg font-semibold text-gray-900">QR Code</h2>
            <QrCodeDisplay
              vehicleId={vehicle.id}
              qrCodeId={vehicle.qr_code_id}
              unitNumber={vehicle.unit_number}
            />
          </div>

          <div className="rounded-xl border border-red-100 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold text-red-600">Danger Zone</h2>
            <DeleteVehicleButton vehicleId={vehicle.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
