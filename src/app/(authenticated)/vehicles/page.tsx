import Link from 'next/link';
import { getVehicles } from '@/lib/services/vehicles';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { VehicleSearch } from '@/components/vehicles/vehicle-search';

export default async function VehiclesPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  let vehicles: Awaited<ReturnType<typeof getVehicles>> = [];
  try {
    const searchParams = await props.searchParams;
    vehicles = await getVehicles({
      status: searchParams.status,
      search: searchParams.q,
    });
  } catch (e) {
    console.error('Vehicles fetch error:', e);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <Link
          href="/vehicles/new"
          className="rounded-lg bg-blue-700 px-4 py-3 text-base font-medium text-white hover:bg-blue-800 active:bg-blue-900"
        >
          + Add Vehicle
        </Link>
      </div>

      <div className="mt-4">
        <VehicleSearch />
      </div>

      <div className="mt-4 space-y-3">
        {vehicles.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No vehicles found.</p>
        ) : (
          vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} />)
        )}
      </div>
    </div>
  );
}
