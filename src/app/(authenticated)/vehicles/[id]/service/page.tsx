import { notFound } from 'next/navigation';
import { getVehicle } from '@/lib/services/vehicles';
import { getSchedules } from '@/lib/services/schedules';
import { getPartsWithInventory } from '@/lib/services/parts';
import { ServiceForm } from '@/components/maintenance/service-form';
import { createMaintenanceRecord } from '@/app/(authenticated)/maintenance/actions';

export default async function ServicePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const [vehicle, schedules, parts] = await Promise.all([
    getVehicle(id),
    getSchedules(),
    getPartsWithInventory(),
  ]);

  if (!vehicle) notFound();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        Log Service
      </h1>
      <p className="mb-6 text-gray-500">
        {vehicle.unit_number ?? vehicle.vin} — {vehicle.year} {vehicle.make} {vehicle.model}
      </p>
      <div className="max-w-2xl">
        <ServiceForm
          vehicle={vehicle}
          schedules={schedules}
          parts={parts}
          action={createMaintenanceRecord}
        />
      </div>
    </div>
  );
}
