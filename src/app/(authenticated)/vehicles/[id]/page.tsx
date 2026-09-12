import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, Wrench } from 'lucide-react';
import { getVehicle } from '@/lib/services/vehicles';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MileageUpdateForm } from '@/components/vehicles/mileage-update-form';
import { QrCodeDisplay } from '@/components/vehicles/qr-code-display';
import { DeleteVehicleButton } from '@/components/vehicles/delete-vehicle-button';
import { formatMileage, formatHours } from '@/lib/utils/format';

export default async function VehicleDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const statusColors: Record<string, string> = {
    active: 'success',
    inactive: 'default',
    out_of_service: 'danger',
    sold: 'default',
  };

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
          <Link href={`/vehicles/${id}/edit`}>
            <Button variant="secondary" size="md">
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </Link>
          <Link href={`/vehicles/${id}/service`}>
            <Button size="md">
              <Wrench className="mr-2 h-4 w-4" /> Log Service
            </Button>
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

          {/* Mileage Update */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <MileageUpdateForm
              vehicleId={vehicle.id}
              currentMileage={vehicle.current_mileage}
              currentHours={vehicle.current_hours}
            />
          </div>

          {/* Maintenance History placeholder */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-900">Maintenance History</h2>
            <p className="mt-2 text-sm text-gray-500">Coming in Phase 4.</p>
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
