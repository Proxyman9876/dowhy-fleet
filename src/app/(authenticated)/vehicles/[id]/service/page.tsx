import { notFound } from 'next/navigation';
import { getVehicle } from '@/lib/services/vehicles';

export default async function ServicePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Log Service — {vehicle.unit_number ?? vehicle.vin}
      </h1>
      <p className="mt-2 text-gray-500">Service form coming in Phase 4.</p>
    </div>
  );
}
