import { notFound } from 'next/navigation';
import { getVehicle } from '@/lib/services/vehicles';
import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { updateVehicle } from '../../actions';

export default async function EditVehiclePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const action = updateVehicle.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Edit {vehicle.unit_number ?? vehicle.vin}
      </h1>
      <div className="max-w-2xl">
        <VehicleForm vehicle={vehicle} action={action} />
      </div>
    </div>
  );
}
