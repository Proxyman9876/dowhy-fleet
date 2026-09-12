import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSchedules } from '@/lib/services/schedules';
import { Button } from '@/components/ui/button';

export default async function SchedulesPage() {
  const schedules = await getSchedules();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Schedules</h1>
        <Link href="/settings/schedules/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" /> Add Schedule
          </Button>
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {schedules.length === 0 ? (
          <p className="py-8 text-center text-gray-500">No schedules defined yet.</p>
        ) : (
          schedules.map((s) => (
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900">{s.name}</h3>
              {s.description && <p className="mt-0.5 text-sm text-gray-500">{s.description}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                {s.interval_miles && (
                  <span className="rounded bg-blue-50 px-2 py-1">
                    Every {s.interval_miles.toLocaleString()} miles
                  </span>
                )}
                {s.interval_hours && (
                  <span className="rounded bg-blue-50 px-2 py-1">
                    Every {s.interval_hours} hours
                  </span>
                )}
                {s.interval_days && (
                  <span className="rounded bg-blue-50 px-2 py-1">
                    Every {s.interval_days} days
                  </span>
                )}
                <span className="rounded bg-gray-100 px-2 py-1">
                  Alert at {s.due_soon_pct}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
