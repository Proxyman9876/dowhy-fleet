import { getMaintenanceRecords } from '@/lib/services/maintenance';
import { MaintenanceRecordCard } from '@/components/maintenance/maintenance-record-card';

export default async function MaintenancePage() {
  const records = await getMaintenanceRecords({ limit: 50 });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Maintenance History</h1>
      <p className="mt-1 text-gray-500">All service records across the fleet.</p>

      <div className="mt-4 space-y-3">
        {records.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No maintenance records yet.</p>
        ) : (
          records.map((r) => <MaintenanceRecordCard key={r.id} record={r} />)
        )}
      </div>
    </div>
  );
}
