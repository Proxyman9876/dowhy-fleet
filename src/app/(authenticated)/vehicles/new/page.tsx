import { VehicleForm } from '@/components/vehicles/vehicle-form';
import { createVehicle } from '../actions';

export default function NewVehiclePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Vehicle</h1>
      <div className="max-w-2xl">
        <VehicleForm action={createVehicle} />
      </div>
    </div>
  );
}
