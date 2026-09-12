import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getVehicles } from '@/lib/services/vehicles';
import { VehicleCard } from '@/components/vehicles/vehicle-card';
import { Button } from '@/components/ui/button';
import { VehicleSearch } from '@/components/vehicles/vehicle-search';

export default async function VehiclesPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const vehicles = await getVehicles({
    status: searchParams.status,
    search: searchParams.q,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
        <Link href="/vehicles/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" /> Add Vehicle
          </Button>
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
